from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import Ticket, User, UserRole, TicketStatus
from app.schemas.schemas import TicketResponse

router = APIRouter(prefix="/api/tickets", tags=["ticket_status"])

VALID_TRANSITIONS = {
    TicketStatus.NEW: [TicketStatus.ASSIGNED],
    TicketStatus.ASSIGNED: [TicketStatus.ACTIVE, TicketStatus.NEW],
    TicketStatus.ACTIVE: [TicketStatus.FOLLOW_UP, TicketStatus.RESOLVED, TicketStatus.ASSIGNED],
    TicketStatus.FOLLOW_UP: [TicketStatus.ACTIVE, TicketStatus.RESOLVED],
    TicketStatus.RESOLVED: [TicketStatus.CLOSED, TicketStatus.ACTIVE],
    TicketStatus.CLOSED: [TicketStatus.ACTIVE]
}

def get_utc_now():
    return datetime.now(timezone.utc)

def validate_transition(current_status: TicketStatus, new_status: TicketStatus, user_role: UserRole) -> bool:
    if new_status not in VALID_TRANSITIONS.get(current_status, []):
        return False
    
    if user_role == UserRole.STUDENT:
        return new_status in [TicketStatus.CLOSED]
    
    return True

@router.post("/{ticket_id}/update-status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    new_status: TicketStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if current_user.role == UserRole.STUDENT and ticket.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this ticket")
    
    if current_user.role == UserRole.COUNSELOR and ticket.counselor_id != current_user.id:
        if ticket.status != TicketStatus.NEW:
            raise HTTPException(status_code=403, detail="Not authorized to update this ticket")
    
    if not validate_transition(ticket.status, new_status, current_user.role):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {ticket.status} to {new_status}"
        )
    
    ticket.status = new_status
    ticket.updated_at = get_utc_now()
    
    if new_status == TicketStatus.RESOLVED:
        ticket.resolved_at = get_utc_now()
    elif new_status == TicketStatus.CLOSED:
        ticket.closed_at = get_utc_now()
    
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/{ticket_id}/assign", response_model=TicketResponse)
def assign_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR]))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.status != TicketStatus.NEW:
        raise HTTPException(status_code=400, detail="Only new tickets can be assigned")
    
    ticket.counselor_id = current_user.id
    ticket.status = TicketStatus.ASSIGNED
    ticket.updated_at = get_utc_now()
    
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/{ticket_id}/activate", response_model=TicketResponse)
def activate_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR]))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.counselor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if ticket.status not in [TicketStatus.ASSIGNED, TicketStatus.FOLLOW_UP]:
        raise HTTPException(status_code=400, detail="Cannot activate ticket from current status")
    
    ticket.status = TicketStatus.ACTIVE
    ticket.updated_at = get_utc_now()
    
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/{ticket_id}/mark-follow-up", response_model=TicketResponse)
def mark_follow_up(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR]))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.counselor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if ticket.status != TicketStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Only active tickets can be marked for follow-up")
    
    ticket.status = TicketStatus.FOLLOW_UP
    ticket.updated_at = get_utc_now()
    
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/{ticket_id}/resolve", response_model=TicketResponse)
def resolve_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR]))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.counselor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if ticket.status not in [TicketStatus.ACTIVE, TicketStatus.FOLLOW_UP]:
        raise HTTPException(status_code=400, detail="Can only resolve active or follow-up tickets")
    
    ticket.status = TicketStatus.RESOLVED
    ticket.resolved_at = get_utc_now()
    ticket.updated_at = get_utc_now()
    
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/{ticket_id}/close", response_model=TicketResponse)
def close_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if current_user.role == UserRole.STUDENT and ticket.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.role == UserRole.COUNSELOR and ticket.counselor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if ticket.status != TicketStatus.RESOLVED:
        raise HTTPException(status_code=400, detail="Only resolved tickets can be closed")
    
    ticket.status = TicketStatus.CLOSED
    ticket.closed_at = get_utc_now()
    ticket.updated_at = get_utc_now()
    
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/{ticket_id}/reopen", response_model=TicketResponse)
def reopen_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if current_user.role == UserRole.STUDENT and ticket.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.role == UserRole.COUNSELOR and ticket.counselor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if ticket.status != TicketStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Only closed tickets can be reopened")
    
    if ticket.closed_at:
        closed_at_aware = ticket.closed_at if ticket.closed_at.tzinfo else ticket.closed_at.replace(tzinfo=timezone.utc)
        days_closed = (get_utc_now() - closed_at_aware).days
        
        if days_closed > 30:
            raise HTTPException(
                status_code=400,
                detail="Cannot reopen tickets closed for more than 30 days"
            )
    
    ticket.status = TicketStatus.ACTIVE
    ticket.closed_at = None
    ticket.updated_at = get_utc_now()
    
    db.commit()
    db.refresh(ticket)
    return ticket