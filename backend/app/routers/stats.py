from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Schedule, Ticket, TicketStatus

router = APIRouter(prefix="/api/stats", tags=["Statistics"])


@router.get("")
def get_platform_stats(db: Session = Depends(get_db)):
    total_sessions = db.query(Schedule).filter(
        Schedule.status.in_(['completed', 'confirmed'])
    ).count()

    unique_students = db.query(func.count(func.distinct(Schedule.student_id))).filter(
        Schedule.status.in_(['completed', 'confirmed'])
    ).scalar() or 0

    rated_schedules = db.query(Schedule).filter(
        Schedule.rating.isnot(None),
        Schedule.rating >= 4
    ).count()

    total_rated = db.query(Schedule).filter(Schedule.rating.isnot(None)).count()
    satisfaction_rate = round((rated_schedules / total_rated * 100), 1) if total_rated > 0 else 0

    return {
        "total_sessions": total_sessions,
        "students_served": unique_students,
        "satisfaction_rate": satisfaction_rate
    }


@router.get("/counselor/{counselor_id}")
def get_counselor_stats(
    counselor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_sessions = db.query(Schedule).filter(
        Schedule.counselor_id == counselor_id,
        Schedule.status == 'completed'
    ).count()

    total_tickets = db.query(Ticket).filter(Ticket.counselor_id == counselor_id).count()

    resolved_tickets = db.query(Ticket).filter(
        Ticket.counselor_id == counselor_id,
        Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED])
    ).count()

    avg_rating = db.query(func.avg(Schedule.rating)).filter(
        Schedule.counselor_id == counselor_id,
        Schedule.rating.isnot(None)
    ).scalar() or 0

    return {
        "total_sessions": total_sessions,
        "total_tickets": total_tickets,
        "resolved_tickets": resolved_tickets,
        "average_rating": round(float(avg_rating), 2) if avg_rating else 0
    }


@router.get("/student/{student_id}")
def get_student_stats(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != student_id and current_user.role.value != 'counselor':
        raise HTTPException(status_code=403, detail="Not authorized to view these statistics")

    total_sessions = db.query(Schedule).filter(Schedule.student_id == student_id).count()
    completed_sessions = db.query(Schedule).filter(
        Schedule.student_id == student_id, Schedule.status == 'completed'
    ).count()
    total_tickets = db.query(Ticket).filter(Ticket.student_id == student_id).count()
    active_tickets = db.query(Ticket).filter(
        Ticket.student_id == student_id,
        Ticket.status.in_([TicketStatus.NEW, TicketStatus.ASSIGNED, TicketStatus.ACTIVE])
    ).count()

    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "total_tickets": total_tickets,
        "active_tickets": active_tickets
    }


@router.get("/dashboard")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)

    new_tickets_today = db.query(Ticket).filter(
        func.date(Ticket.created_at) == today
    ).count()

    new_tickets_week = db.query(Ticket).filter(
        func.date(Ticket.created_at) >= week_ago
    ).count()

    active_sessions = db.query(Schedule).filter(
        Schedule.status.in_(['confirmed', 'pending']),
        Schedule.scheduled_at >= datetime.now()
    ).count()

    pending_tickets = db.query(Ticket).filter(Ticket.status == TicketStatus.NEW).count()

    return {
        "new_tickets_today": new_tickets_today,
        "new_tickets_week": new_tickets_week,
        "active_sessions": active_sessions,
        "pending_tickets": pending_tickets
    }