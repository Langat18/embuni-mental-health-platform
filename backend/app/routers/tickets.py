from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, Ticket, UserRole, TicketStatus, CrisisLevel
from app.schemas.schemas import TicketCreate, TicketResponse, TicketUpdate

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

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
    
    tickets = query.order_by(Ticket.created_at.desc()).all()
    return tickets

@router.get("/available", response_model=List[TicketResponse])
def get_available_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.PEER_COUNSELOR, UserRole.ADMIN]))
):
    tickets = db.query(Ticket).filter(
        Ticket.status.in_([TicketStatus.NEW, TicketStatus.ASSIGNED])
    ).order_by(Ticket.priority.desc(), Ticket.created_at).all()
    
    return tickets

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    if current_user.role == UserRole.STUDENT and ticket.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ticket"
        )
    
    if current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        if ticket.counselor_id and ticket.counselor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this ticket"
            )
    
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    if ticket.counselor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket already assigned"
        )
    
    ticket.counselor_id = current_user.id
    ticket.assigned_at = datetime.utcnow()
    ticket.status = TicketStatus.ASSIGNED
    
    db.commit()
    db.refresh(ticket)
    
    return ticket