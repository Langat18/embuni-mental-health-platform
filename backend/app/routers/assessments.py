from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, Assessment, UserRole
from app.schemas.schemas import AssessmentCreate, AssessmentResponse

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])

@router.post("/", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    assessment_data: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    new_assessment = Assessment(
        student_id=current_user.id,
        **assessment_data.model_dump()
    )
    
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    
    return new_assessment

@router.get("/", response_model=List[AssessmentResponse])
def get_my_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.STUDENT:
        assessments = db.query(Assessment).filter(
            Assessment.student_id == current_user.id
        ).order_by(Assessment.created_at.desc()).all()
    else:
        assessments = db.query(Assessment).order_by(Assessment.created_at.desc()).all()
    
    return assessments

@router.get("/recent", response_model=Optional[AssessmentResponse])
def get_recent_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    assessment = db.query(Assessment).filter(
        Assessment.student_id == current_user.id
    ).order_by(Assessment.created_at.desc()).first()
    
    return assessment
