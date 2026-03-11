from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, UserRole, CounselorProfile, Ticket, TicketStatus, Schedule
from app.schemas.schemas import CounselorListResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/counselors", tags=["Counselors"])


class SuggestedCounselor(BaseModel):
    id: int
    full_name: str
    email: str
    department: str
    specializations: List[str]
    years_of_experience: int
    bio: str
    is_available: bool
    score: float
    match_reasons: List[str]

    class Config:
        from_attributes = True


def score_counselor(
    counselor: User,
    profile: CounselorProfile,
    student: User,
    category: Optional[str],
    db: Session
) -> tuple[float, list[str]]:
    score = 0.0
    reasons = []

    # Specialization match
    if category and profile.specializations:
        category_lower = category.lower()
        specializations_lower = [s.lower() for s in profile.specializations]

        if category_lower in specializations_lower:
            score += 40
            reasons.append(f"Specializes in {category}")
        else:
            keywords = category_lower.split()
            matched = any(
                any(kw in spec for kw in keywords)
                for spec in specializations_lower
            )
            if matched:
                score += 20
                reasons.append(f"Experience related to {category}")

    # Workload check
    active_ticket_count = db.query(Ticket).filter(
        Ticket.counselor_id == counselor.id,
        Ticket.status.in_([TicketStatus.ASSIGNED, TicketStatus.ACTIVE, TicketStatus.FOLLOW_UP])
    ).count()

    max_tickets = profile.max_active_tickets or 10
    load_ratio = active_ticket_count / max_tickets

    if load_ratio == 0:
        score += 30
        reasons.append("Fully available")
    elif load_ratio < 0.4:
        score += 25
        reasons.append("Lightly loaded")
    elif load_ratio < 0.7:
        score += 15
        reasons.append("Moderately available")
    elif load_ratio < 1.0:
        score += 5
        reasons.append("Limited availability")

    # Continuity of care
    past_tickets = db.query(Ticket).filter(
        Ticket.student_id == student.id,
        Ticket.counselor_id == counselor.id
    ).count()

    if past_tickets > 0:
        score += 20
        reasons.append(f"Previously worked with you ({past_tickets} session{'s' if past_tickets > 1 else ''})")

    # Residence preference
    if student.residence_status:
        if student.residence_status == "on_campus":
            in_person_sessions = db.query(Schedule).filter(
                Schedule.counselor_id == counselor.id,
                Schedule.meeting_type == "in-person"
            ).count()
            if in_person_sessions > 0:
                score += 10
                reasons.append("Offers in-person sessions")
        elif student.residence_status == "off_campus":
            online_sessions = db.query(Schedule).filter(
                Schedule.counselor_id == counselor.id,
                Schedule.meeting_type == "online"
            ).count()
            if online_sessions > 0:
                score += 10
                reasons.append("Offers online sessions")

    # Years of experience
    yoe = profile.years_of_experience or 0
    if yoe >= 10:
        score += 10
        reasons.append(f"{yoe} years of experience")
    elif yoe >= 5:
        score += 7
        reasons.append(f"{yoe} years of experience")
    elif yoe >= 2:
        score += 4
        reasons.append(f"{yoe} years of experience")

    # Session ratings
    avg_rating = db.query(func.avg(Schedule.rating)).filter(
        Schedule.counselor_id == counselor.id,
        Schedule.rating.isnot(None)
    ).scalar()

    if avg_rating:
        if avg_rating >= 4.5:
            score += 10
            reasons.append(f"Highly rated ({avg_rating:.1f}★)")
        elif avg_rating >= 3.5:
            score += 6
            reasons.append(f"Well rated ({avg_rating:.1f}★)")
        elif avg_rating >= 2.5:
            score += 3

    return round(score, 2), reasons


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


@router.get("/suggest", response_model=List[SuggestedCounselor])
def suggest_counselors(
    category: Optional[str] = Query(None),
    limit: int = Query(3),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    counselors = db.query(User).filter(
        User.role == UserRole.COUNSELOR,
        User.is_active == True
    ).all()

    scored = []
    for counselor in counselors:
        profile = db.query(CounselorProfile).filter(
            CounselorProfile.user_id == counselor.id
        ).first()
        if not profile or not profile.is_available:
            continue

        score, reasons = score_counselor(
            counselor=counselor,
            profile=profile,
            student=current_user,
            category=category,
            db=db
        )

        if score > 0:
            scored.append(SuggestedCounselor(
                id=counselor.id,
                full_name=counselor.full_name,
                email=counselor.email,
                department=profile.department or "Counseling",
                specializations=profile.specializations or [],
                years_of_experience=profile.years_of_experience or 0,
                bio=profile.bio or "",
                is_available=profile.is_available,
                score=score,
                match_reasons=reasons
            ))

    scored.sort(key=lambda x: x.score, reverse=True)
    return scored[:limit]