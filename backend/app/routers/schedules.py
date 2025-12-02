from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, Schedule, UserRole
from app.schemas.schemas import ScheduleCreate, ScheduleResponse

router = APIRouter(prefix="/api/schedules", tags=["Schedules"])

@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    new_schedule = Schedule(
        student_id=current_user.id,
        **schedule_data.model_dump()
    )
    
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    
    return new_schedule

@router.get("/upcoming", response_model=List[ScheduleResponse])
def get_upcoming_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    
    if current_user.role == UserRole.STUDENT:
        schedules = db.query(Schedule).filter(
            Schedule.student_id == current_user.id,
            Schedule.scheduled_at > now
        ).order_by(Schedule.scheduled_at).all()
    elif current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        schedules = db.query(Schedule).filter(
            Schedule.counselor_id == current_user.id,
            Schedule.scheduled_at > now
        ).order_by(Schedule.scheduled_at).all()
    else:
        schedules = db.query(Schedule).filter(
            Schedule.scheduled_at > now
        ).order_by(Schedule.scheduled_at).all()
    
    return schedules

@router.get("/", response_model=List[ScheduleResponse])
def get_all_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.STUDENT:
        schedules = db.query(Schedule).filter(
            Schedule.student_id == current_user.id
        ).order_by(Schedule.scheduled_at.desc()).all()
    elif current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        schedules = db.query(Schedule).filter(
            Schedule.counselor_id == current_user.id
        ).order_by(Schedule.scheduled_at.desc()).all()
    else:
        schedules = db.query(Schedule).order_by(Schedule.scheduled_at.desc()).all()
    
    return schedules
