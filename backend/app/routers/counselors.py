from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, UserRole, CounselorProfile
from pydantic import BaseModel

router = APIRouter(prefix="/api/counselors", tags=["Counselors"])

class CounselorListResponse(BaseModel):
    id: int
    full_name: str
    email: str
    department: str
    specializations: List[str]
    years_of_experience: int
    bio: str
    is_available: bool
    
    class Config:
        from_attributes = True

@router.get("/available", response_model=List[CounselorListResponse])
def get_available_counselors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("Fetching available counselors...")
    
    counselors = db.query(User).filter(
        User.role == UserRole.COUNSELOR,
        User.is_active == True
    ).all()
    
    print(f"Found {len(counselors)} counselors")
    
    result = []
    for counselor in counselors:
        profile = db.query(CounselorProfile).filter(
            CounselorProfile.user_id == counselor.id
        ).first()
        
        if profile:
            print(f"✓ Counselor: {counselor.full_name} - {profile.department}")
            result.append({
                "id": counselor.id,
                "full_name": counselor.full_name,
                "email": counselor.email,
                "department": profile.department or "Counseling",
                "specializations": profile.specializations or ["General Counseling"],
                "years_of_experience": profile.years_of_experience or 0,
                "bio": profile.bio or "Experienced counselor ready to help.",
                "is_available": profile.is_available
            })
        else:
            print(f"✗ No profile for counselor: {counselor.full_name}")
    
    print(f"Returning {len(result)} counselors with profiles")
    return result
