from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, UserRole, CounselorProfile
from app.schemas.schemas import CounselorListResponse

router = APIRouter(prefix="/api/counselors", tags=["Counselors"])


@router.get("/available", response_model=List[CounselorListResponse])
def get_available_counselors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    counselors = db.query(User).filter(
        User.role == UserRole.COUNSELOR,
        User.is_active == True
    ).all()

    result = []
    for counselor in counselors:
        profile = db.query(CounselorProfile).filter(
            CounselorProfile.user_id == counselor.id
        ).first()
        if profile:
            result.append(CounselorListResponse(
                id=counselor.id,
                full_name=counselor.full_name,
                email=counselor.email,
                department=profile.department or "Counseling",
                specializations=profile.specializations or ["General Counseling"],
                years_of_experience=profile.years_of_experience or 0,
                bio=profile.bio or "Experienced counselor ready to help.",
                is_available=profile.is_available
            ))
    return result