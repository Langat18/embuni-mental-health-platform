from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, Ticket, Message, Note, UserRole, TicketStatus, CrisisLevel
from app.schemas.schemas import TicketCreate, TicketResponse, TicketUpdate
from app.utils.email_utils import send_new_ticket_notification
from pydantic import BaseModel

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


class SessionNoteCreate(BaseModel):
    note: str

class SessionNoteResponse(BaseModel):
    ticket_id: int
    note: Optional[str] = None
    updated_at: Optional[datetime] = None



@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    ticket_number = f"TKT-{datetime.utcnow().strftime('%Y%m%d')}-{current_user.id}-{datetime.utcnow().microsecond}"

    new_ticket = Ticket(
        ticket_number=ticket_number,
        student_id=current_user.id,
        category=ticket_data.category,
        initial_message=ticket_data.initial_message,
        crisis_level=ticket_data.crisis_level,
        status=TicketStatus.NEW,
        priority=1 if ticket_data.crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL] else 0
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket


@router.get("/my-tickets", response_model=List[TicketResponse])
def get_my_tickets(
    status_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Ticket)

    if current_user.role == UserRole.STUDENT:
        query = query.filter(Ticket.student_id == current_user.id)
    elif current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        query = query.filter(Ticket.counselor_id == current_user.id)

    if status_filter:
        query = query.filter(Ticket.status == status_filter)

    if search:
        query = query.filter(
            or_(
                Ticket.ticket_number.ilike(f"%{search}%"),
                Ticket.category.ilike(f"%{search}%")
            )
        )

    return query.order_by(Ticket.created_at.desc()).all()


@router.get("/available", response_model=List[TicketResponse])
def get_available_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.PEER_COUNSELOR, UserRole.ADMIN]))
):
    return db.query(Ticket).filter(
        Ticket.status.in_([TicketStatus.NEW, TicketStatus.ASSIGNED])
    ).order_by(Ticket.priority.desc(), Ticket.created_at).all()


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.STUDENT and ticket.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")

    if current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        if ticket.counselor_id and ticket.counselor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this ticket")

    return ticket


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket_basic(
    ticket_id: int,
    ticket_data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.PEER_COUNSELOR, UserRole.ADMIN]))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket_data.crisis_level:
        ticket.crisis_level = ticket_data.crisis_level
        ticket.priority = 1 if ticket_data.crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL] else 0

    db.commit()
    db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_200_OK)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db.delete(ticket)
    db.commit()
    return {"success": True, "message": "Ticket deleted successfully"}


@router.post("/{ticket_id}/assign-to-me", response_model=TicketResponse)
def assign_ticket_to_me(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.counselor_id:
        raise HTTPException(status_code=400, detail="Ticket already assigned")

    ticket.counselor_id = current_user.id
    ticket.assigned_at = datetime.utcnow()
    ticket.status = TicketStatus.ASSIGNED

    db.commit()
    db.refresh(ticket)

    student = db.query(User).filter(User.id == ticket.student_id).first()
    send_new_ticket_notification(
        counselor_email=current_user.email,
        counselor_name=current_user.full_name,
        student_name=student.full_name if student else "A student",
        ticket_number=ticket.ticket_number,
        category=ticket.category,
        initial_message=ticket.initial_message or ""
    )

    return ticket



@router.delete("/{ticket_id}/messages", status_code=status.HTTP_200_OK)
def delete_chat_messages(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Student clears their own chat history.
    Only the student who owns the ticket can do this.
    The initial_message on the Ticket record is preserved.
    Counselor session notes (Note table) are NOT touched.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.STUDENT and ticket.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        raise HTTPException(status_code=403, detail="Counselors cannot delete chat messages")

    deleted_count = db.query(Message).filter(Message.ticket_id == ticket_id).delete()
    db.commit()

    return {
        "success": True,
        "message": f"Chat history cleared. {deleted_count} messages deleted.",
        "note": "Session notes written by your counselor are retained separately."
    }



@router.get("/{ticket_id}/session-note", response_model=SessionNoteResponse)
def get_session_note(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the counselor's session note for a ticket.
    Accessible by the counselor assigned to the ticket and admins.
    Students cannot read session notes (clinical privacy).
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Session notes are confidential")

    if current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        if ticket.counselor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    note = db.query(Note).filter(
        Note.ticket_id == ticket_id,
        Note.is_private == True
    ).order_by(Note.created_at.desc()).first()

    return SessionNoteResponse(
        ticket_id=ticket_id,
        note=note.counselor_note if note else None,
        updated_at=note.created_at if note else None
    )


@router.post("/{ticket_id}/session-note", status_code=status.HTTP_200_OK)
def save_session_note(
    ticket_id: int,
    note_data: SessionNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]))
):
    """
    Counselor saves a clinical session note for a ticket.
    This is the permanent record — raw chat messages are session-only.
    If a note already exists, it is updated (upsert behaviour).
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.counselor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add notes to this ticket")

    if not note_data.note.strip():
        raise HTTPException(status_code=400, detail="Note cannot be empty")

    existing_note = db.query(Note).filter(
        Note.ticket_id == ticket_id,
        Note.is_private == True
    ).order_by(Note.created_at.desc()).first()

    if existing_note:
        existing_note.counselor_note = note_data.note.strip()
        db.commit()
        db.refresh(existing_note)
    else:
        new_note = Note(
            ticket_id=ticket_id,
            counselor_note=note_data.note.strip(),
            is_private=True,
            tags=[]
        )
        db.add(new_note)
        db.commit()

    return {
        "success": True,
        "message": "Session note saved successfully.",
        "ticket_id": ticket_id
    }