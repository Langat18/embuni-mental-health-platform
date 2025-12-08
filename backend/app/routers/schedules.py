from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
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
    scheduled_time = schedule_data.scheduled_at
    
    existing_schedule = db.query(Schedule).filter(
        Schedule.counselor_id == schedule_data.counselor_id,
        Schedule.scheduled_at == scheduled_time,
        Schedule.status.in_(['scheduled', 'confirmed'])
    ).first()
    
    if existing_schedule:
        raise HTTPException(
            status_code=400,
            detail="This time slot is already booked. Please choose another time."
        )
    
    new_schedule = Schedule(
        student_id=current_user.id,
        counselor_id=schedule_data.counselor_id,
        ticket_id=schedule_data.ticket_id,
        scheduled_at=scheduled_time,
        duration_minutes=schedule_data.duration_minutes,
        meeting_type=schedule_data.meeting_type,
        meeting_link=schedule_data.meeting_link,
        notes=schedule_data.notes,
        status='scheduled'
    )
    
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    
    print(f"✓ Schedule created: ID={new_schedule.id}, Student={current_user.full_name}, Time={scheduled_time}")
    
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
            Schedule.scheduled_at > now,
            Schedule.status.in_(['scheduled', 'confirmed'])
        ).order_by(Schedule.scheduled_at).all()
    elif current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]:
        schedules = db.query(Schedule).filter(
            Schedule.counselor_id == current_user.id,
            Schedule.scheduled_at > now,
            Schedule.status.in_(['scheduled', 'confirmed'])
        ).order_by(Schedule.scheduled_at).all()
    else:
        schedules = db.query(Schedule).filter(
            Schedule.scheduled_at > now,
            Schedule.status.in_(['scheduled', 'confirmed'])
        ).order_by(Schedule.scheduled_at).all()
    
    print(f"Found {len(schedules)} upcoming schedules for {current_user.full_name} (role: {current_user.role})")
    return schedules

@router.get("/booked-slots")
def get_booked_slots(
    counselor_id: int = Query(...),
    date: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        target_date = datetime.strptime(date, '%Y-%m-%d').date()
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        booked_schedules = db.query(Schedule).filter(
            Schedule.counselor_id == counselor_id,
            Schedule.scheduled_at >= start_datetime,
            Schedule.scheduled_at <= end_datetime,
            Schedule.status.in_(['scheduled', 'confirmed'])
        ).all()
        
        return [
            {
                "id": schedule.id,
                "scheduled_at": schedule.scheduled_at.isoformat(),
                "duration_minutes": schedule.duration_minutes
            }
            for schedule in booked_schedules
        ]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

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

@router.patch("/{schedule_id}/cancel")
def cancel_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if current_user.role == UserRole.STUDENT and schedule.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.role in [UserRole.COUNSELOR, UserRole.PEER_COUNSELOR] and schedule.counselor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    schedule.status = 'cancelled'
    db.commit()
    
    return {"message": "Schedule cancelled successfully"}

@router.patch("/{schedule_id}/complete")
def complete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COUNSELOR, UserRole.PEER_COUNSELOR]))
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule.counselor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    schedule.status = 'completed'
    db.commit()
    
    return {"message": "Schedule marked as completed"}
