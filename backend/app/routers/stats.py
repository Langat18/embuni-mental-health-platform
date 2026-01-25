from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Schedule, User
from app.schemas.schemas import RatingCreate, RatingResponse

router = APIRouter(prefix="/api/stats", tags=["Statistics"])

@router.get("/")
def get_platform_statistics(db: Session = Depends(get_db)):
    try:
        total_sessions = db.query(func.count(Schedule.id)).filter(
            Schedule.status.in_(['completed', 'confirmed'])
        ).scalar() or 0

        total_students = db.query(
            func.count(func.distinct(Schedule.student_id))
        ).scalar() or 0

        rating_stats = db.query(
            func.count(Schedule.id).label('total_rated'),
            func.sum(case((Schedule.rating >= 4, 1), else_=0)).label('satisfied')
        ).filter(
            Schedule.status == 'completed',
            Schedule.rating.isnot(None)
        ).first()

        total_rated = rating_stats.total_rated or 0
        satisfied_count = rating_stats.satisfied or 0
        
        satisfaction_rate = (
            round((satisfied_count / total_rated) * 100) 
            if total_rated > 0 
            else 0
        )

        return {
            "success": True,
            "stats": {
                "totalSessions": total_sessions,
                "totalStudents": total_students,
                "satisfactionRate": satisfaction_rate
            }
        }

    except Exception as e:
        return {
            "success": False,
            "message": "Failed to fetch statistics",
            "stats": {
                "totalSessions": 0,
                "totalStudents": 0,
                "satisfactionRate": 0
            }
        }

@router.post("/{schedule_id}/rate", response_model=RatingResponse)
def rate_schedule(
    schedule_id: int,
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    if schedule.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to rate this session"
        )
    
    if schedule.status != 'completed':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only rate completed sessions"
        )
    
    schedule.rating = rating_data.rating
    schedule.feedback = rating_data.feedback
    
    db.commit()
    db.refresh(schedule)
    
    return RatingResponse(
        success=True,
        message="Rating submitted successfully",
        schedule_id=schedule_id,
        rating=rating_data.rating
    )