from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import require_role
from app.models.models import User, Ticket, UserRole
from app.schemas.schemas import UserResponse

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    users = db.query(User).all()
    return users

@router.get("/pending-counselors", response_model=List[UserResponse])
def get_pending_counselors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    counselors = db.query(User).filter(
        User.role == UserRole.COUNSELOR,
        User.is_active == False
    ).all()
    return counselors

@router.patch("/approve-user/{user_id}", response_model=UserResponse)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    user.is_verified = True
    
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    
    db.delete(user)
    db.commit()
    
    return None

@router.get("/stats")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    total_students = db.query(User).filter(User.role == UserRole.STUDENT).count()
    total_counselors = db.query(User).filter(User.role == UserRole.COUNSELOR).count()
    total_tickets = db.query(Ticket).count()
    active_tickets = db.query(Ticket).filter(Ticket.status == 'active').count()
    
    return {
        "total_students": total_students,
        "total_counselors": total_counselors,
        "total_tickets": total_tickets,
        "active_tickets": active_tickets
    }
