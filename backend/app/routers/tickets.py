from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import random
import string
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, Ticket, TicketStatus, UserRole
from app.schemas.schemas import TicketCreate, TicketUpdate, TicketResponse

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

def generate_ticket_number():
    timestamp = datetime.now().strftime("%Y%m%d")
    random_part = ''.join(random.choices(string.digits, k=6))
    return f"TKT-{timestamp}-{random_part}"

@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    ticket_number = generate_ticket_number()
    while db.query(Ticket).filter(Ticket.ticket_number == ticket_number).first():
        ticket_number = generate_ticket_number()
    
    new_ticket = Ticket(
        ticket_number=ticket_number,
        student_id=current_user.id,
        category=ticket_data.category,
        initial_message=ticket_data.initial_message,
        crisis_level=ticket_data.crisis_level,
        status=TicketStatus.NEW
    )
    
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    return new_ticket

@router.get("/my-tickets", response_model=List[TicketResponse])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.STUDENT:
        tickets = db.query(Ticket).filter(Ticket.student_id == current_user.id).all()
    elif current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        tickets = db.query(Ticket).filter(Ticket.counselor_id == current_user.id).all()
    else:
        tickets = db.query(Ticket).all()
    
    return tickets

@router.get("/available", response_model=List[TicketResponse])
def get_available_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.PEER_COUNSELOR, UserRole.ADMIN]))
):
    tickets = db.query(Ticket).filter(
        Ticket.status.in_([TicketStatus.NEW, TicketStatus.ASSIGNED])
    ).all()
    
    return tickets

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
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        if ticket.counselor_id and ticket.counselor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Ticket assigned to another counselor")
    
    return ticket

@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_update: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.PEER_COUNSELOR, UserRole.ADMIN]))
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket_update.status:
        ticket.status = ticket_update.status
        if ticket_update.status == TicketStatus.CLOSED:
            ticket.closed_at = datetime.utcnow()
    
    if ticket_update.counselor_id:
        ticket.counselor_id = ticket_update.counselor_id
        ticket.assigned_at = datetime.utcnow()
        if ticket.status == TicketStatus.NEW:
            ticket.status = TicketStatus.ASSIGNED
    
    if ticket_update.crisis_level:
        ticket.crisis_level = ticket_update.crisis_level
    
    db.commit()
    db.refresh(ticket)
    
    return ticket

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
    ticket.status = TicketStatus.ACTIVE
    
    db.commit()
    db.refresh(ticket)
    
    return ticket
