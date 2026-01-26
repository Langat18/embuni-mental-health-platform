from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, Ticket, UserRole, TicketStatus
from pydantic import BaseModel

router = APIRouter(prefix="/api/tickets", tags=["Ticket Status Management"])

class StatusUpdateRequest(BaseModel):
    status: str
    reason: Optional[str] = None

class StatusUpdateResponse(BaseModel):
    success: bool
    message: str
    ticket_id: int
    old_status: str
    new_status: str
    updated_by: str

STUDENT_ALLOWED_TRANSITIONS = {
    TicketStatus.RESOLVED: [TicketStatus.CLOSED],
    TicketStatus.CLOSED: [TicketStatus.FOLLOW_UP]
}

COUNSELOR_ALLOWED_TRANSITIONS = {
    TicketStatus.NEW: [TicketStatus.ASSIGNED],
    TicketStatus.ASSIGNED: [TicketStatus.ACTIVE],
    TicketStatus.ACTIVE: [TicketStatus.FOLLOW_UP, TicketStatus.RESOLVED],
    TicketStatus.FOLLOW_UP: [TicketStatus.ACTIVE, TicketStatus.RESOLVED],
    TicketStatus.RESOLVED: [TicketStatus.ACTIVE, TicketStatus.FOLLOW_UP, TicketStatus.CLOSED]
}

def validate_status_transition(
    current_status: TicketStatus,
    new_status: TicketStatus,
    user_role: UserRole
) -> tuple[bool, str]:
    if user_role == UserRole.STUDENT:
        allowed = STUDENT_ALLOWED_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            return False, f"Students can only transition from {current_status} to {allowed}"
    
    elif user_role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        allowed = COUNSELOR_ALLOWED_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            return False, f"Cannot transition from {current_status} to {new_status}"
    
    return True, "Valid transition"

@router.patch("/{ticket_id}/status", response_model=StatusUpdateResponse)
def update_ticket_status(
    ticket_id: int,
    status_update: StatusUpdateRequest,
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
            detail="Not authorized to update this ticket"
        )
    
    if current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        if ticket.counselor_id and ticket.counselor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this ticket"
            )
    
    try:
        new_status = TicketStatus(status_update.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {status_update.status}"
        )
    
    old_status = ticket.status
    
    is_valid, message = validate_status_transition(
        ticket.status,
        new_status,
        current_user.role
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    ticket.status = new_status
    
    if new_status == TicketStatus.CLOSED:
        ticket.closed_at = datetime.utcnow()
    
    if new_status == TicketStatus.FOLLOW_UP and old_status == TicketStatus.CLOSED:
        ticket.closed_at = None
    
    db.commit()
    db.refresh(ticket)
    
    return StatusUpdateResponse(
        success=True,
        message=f"Ticket status updated from {old_status} to {new_status}",
        ticket_id=ticket.id,
        old_status=old_status,
        new_status=new_status,
        updated_by=current_user.full_name
    )

@router.post("/{ticket_id}/mark-resolved", response_model=StatusUpdateResponse)
def mark_ticket_resolved(
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
    
    if ticket.counselor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to resolve this ticket"
        )
    
    if ticket.status not in [TicketStatus.ACTIVE, TicketStatus.FOLLOW_UP]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot mark ticket as resolved from status: {ticket.status}"
        )
    
    old_status = ticket.status
    ticket.status = TicketStatus.RESOLVED
    
    db.commit()
    db.refresh(ticket)
    
    return StatusUpdateResponse(
        success=True,
        message="Ticket marked as resolved. Student can now close it.",
        ticket_id=ticket.id,
        old_status=old_status,
        new_status=TicketStatus.RESOLVED,
        updated_by=current_user.full_name
    )

@router.post("/{ticket_id}/close", response_model=StatusUpdateResponse)
def close_ticket(
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
    
    if current_user.role == UserRole.STUDENT:
        if ticket.student_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        if ticket.status != TicketStatus.RESOLVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only close resolved tickets"
            )
    
    elif current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        if ticket.counselor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
    
    old_status = ticket.status
    ticket.status = TicketStatus.CLOSED
    ticket.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(ticket)
    
    return StatusUpdateResponse(
        success=True,
        message="Ticket closed successfully",
        ticket_id=ticket.id,
        old_status=old_status,
        new_status=TicketStatus.CLOSED,
        updated_by=current_user.full_name
    )

@router.post("/{ticket_id}/reopen", response_model=StatusUpdateResponse)
def reopen_ticket(
    ticket_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    if ticket.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if ticket.status != TicketStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only reopen closed tickets"
        )
    
    if ticket.closed_at:
        days_closed = (datetime.utcnow() - ticket.closed_at).days
        if days_closed > 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot reopen tickets closed for more than 30 days"
            )
    
    old_status = ticket.status
    ticket.status = TicketStatus.FOLLOW_UP
    ticket.closed_at = None
    
    db.commit()
    db.refresh(ticket)
    
    return StatusUpdateResponse(
        success=True,
        message="Ticket reopened for follow-up",
        ticket_id=ticket.id,
        old_status=old_status,
        new_status=TicketStatus.FOLLOW_UP,
        updated_by=current_user.full_name
    )