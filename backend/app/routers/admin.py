from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import require_role
from app.models.models import User, Ticket, CounselorProfile, UserRole, TicketStatus, CrisisLevel
from app.schemas.schemas import UserResponse

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    return db.query(User).all()


@router.get("/pending-counselors", response_model=List[UserResponse])
def get_pending_counselors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    return db.query(User).filter(
        User.role == UserRole.COUNSELOR,
        User.is_active == False
    ).all()


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


@router.post("/counselors/{counselor_id}/approve")
def approve_counselor(
    counselor_id: int,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    approve = body.get("approve", True)
    user = db.query(User).filter(User.id == counselor_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if approve:
        user.is_active = True
        user.is_verified = True
        db.commit()
        return {"message": "Counselor approved successfully", "success": True}
    else:
        db.delete(user)
        db.commit()
        return {"message": "Counselor rejected", "success": True}


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
    return {
        "total_students": db.query(User).filter(User.role == UserRole.STUDENT).count(),
        "total_counselors": db.query(User).filter(User.role == UserRole.COUNSELOR).count(),
        "total_tickets": db.query(Ticket).count(),
        "active_tickets": db.query(Ticket).filter(Ticket.status == TicketStatus.ACTIVE).count(),
    }


@router.get("/dashboard")
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    total_users = db.query(User).count()
    active_counselors = db.query(User).filter(
        User.role == UserRole.COUNSELOR,
        User.is_active == True
    ).count()
    active_tickets = db.query(Ticket).filter(Ticket.status == TicketStatus.ACTIVE).count()

    pending_counselor_users = db.query(User).filter(
        User.role == UserRole.COUNSELOR,
        User.is_active == False
    ).all()

    pending_counselors = []
    for c in pending_counselor_users:
        profile = db.query(CounselorProfile).filter(CounselorProfile.user_id == c.id).first()
        pending_counselors.append({
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "phone": c.phone_number,
            "department": profile.department if profile else "Unknown",
            "bio": profile.bio if profile else "",
            "created_at": c.created_at.isoformat(),
            "certifications": []
        })

    crisis_tickets = db.query(Ticket).filter(
        Ticket.crisis_level.in_([CrisisLevel.HIGH, CrisisLevel.CRITICAL])
    ).order_by(Ticket.created_at.desc()).limit(50).all()

    crisis_events = []
    for t in crisis_tickets:
        student = db.query(User).filter(User.id == t.student_id).first()
        counselor = db.query(User).filter(User.id == t.counselor_id).first() if t.counselor_id else None
        crisis_events.append({
            "id": t.id,
            "ticket_number": t.ticket_number,
            "crisis_level": t.crisis_level.value,
            "category": t.category,
            "status": t.status.value,
            "created_at": t.created_at.isoformat(),
            "initial_message": t.initial_message,
            "student": {"id": student.id, "full_name": student.full_name, "email": student.email} if student else None,
            "counselor": {"id": counselor.id, "full_name": counselor.full_name} if counselor else None,
        })

    crisis_events_count = db.query(Ticket).filter(
        Ticket.crisis_level.in_([CrisisLevel.HIGH, CrisisLevel.CRITICAL])
    ).count()

    return {
        "analytics": {
            "total_users": total_users,
            "active_counselors": active_counselors,
            "active_tickets": active_tickets,
            "crisis_events_count": crisis_events_count,
            "new_users_this_week": 0,
            "tickets_this_week": 0,
            "resolved_this_week": 0,
            "avg_response_time": 0,
            "avg_resolution_time": 0,
            "sessions_this_week": 0,
            "active_students": 0,
        },
        "pending_counselors": pending_counselors,
        "crisis_events": crisis_events
    }


@router.get("/reports/{report_type}")
def export_report(
    report_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    from fastapi.responses import JSONResponse

    if report_type == "comprehensive":
        report_data = {
            "report_type": "Comprehensive System Report",
            "generated_at": datetime.utcnow().isoformat(),
            "statistics": {
                "total_users": db.query(User).count(),
                "total_tickets": db.query(Ticket).count(),
                "active_tickets": db.query(Ticket).filter(Ticket.status == TicketStatus.ACTIVE).count(),
                "crisis_events": db.query(Ticket).filter(
                    Ticket.crisis_level.in_([CrisisLevel.HIGH, CrisisLevel.CRITICAL])
                ).count(),
            }
        }
        return JSONResponse(content=report_data)

    raise HTTPException(status_code=400, detail="Invalid report type")