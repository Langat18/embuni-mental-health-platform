from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, Assessment, UserRole
import json

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])

def calculate_severity(total_score: int, max_score: int) -> str:
    percentage = (total_score / max_score) * 100
    
    if percentage >= 80:
        return "Excellent - No concerns"
    elif percentage >= 60:
        return "Good - Minor areas to work on"
    elif percentage >= 40:
        return "Moderate - Some challenges present"
    elif percentage >= 20:
        return "Concerning - Multiple challenges"
    else:
        return "Critical - Immediate support recommended"

@router.post("/submit")
def submit_assessment(
    responses: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    try:
        questions = responses.get('responses', [])
        
        # Calculate scores by category
        mental_health = sum(q['score'] for q in questions if 1 <= q['id'] <= 6)
        emotional_health = sum(q['score'] for q in questions if 7 <= q['id'] <= 12)
        social_health = sum(q['score'] for q in questions if 13 <= q['id'] <= 18)
        needs_awareness = sum(q['score'] for q in questions if 19 <= q['id'] <= 20)
        
        total_score = mental_health + emotional_health + social_health + needs_awareness
        max_score = 100  # 20 questions * 5 max score
        
        severity = calculate_severity(total_score, max_score)
        
        # Store assessment
        new_assessment = Assessment(
            student_id=current_user.id,
            assessment_type="Mental Health Self-Assessment",
            score=total_score,
            severity_level=severity,
            responses=json.dumps({
                'questions': questions,
                'mental_health_score': mental_health,
                'emotional_health_score': emotional_health,
                'social_health_score': social_health,
                'needs_awareness_score': needs_awareness,
                'notes': responses.get('notes', '')
            })
        )
        
        db.add(new_assessment)
        db.commit()
        db.refresh(new_assessment)
        
        return {
            "success": True,
            "assessment_id": new_assessment.id,
            "total_score": total_score,
            "max_score": max_score,
            "percentage": round((total_score / max_score) * 100, 1),
            "severity_level": severity,
            "breakdown": {
                "mental_health": f"{mental_health}/30",
                "emotional_health": f"{emotional_health}/30",
                "social_health": f"{social_health}/30",
                "needs_awareness": f"{needs_awareness}/10"
            },
            "message": "Assessment submitted successfully"
        }
        
    except Exception as e:
        print(f"Error submitting assessment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-assessments")
def get_my_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessments = db.query(Assessment).filter(
        Assessment.student_id == current_user.id
    ).order_by(Assessment.created_at.desc()).all()
    
    results = []
    for assessment in assessments:
        response_data = json.loads(assessment.responses) if assessment.responses else {}
        results.append({
            "id": assessment.id,
            "assessment_type": assessment.assessment_type,
            "total_score": assessment.score,
            "severity_level": assessment.severity_level,
            "breakdown": {
                "mental_health": response_data.get('mental_health_score', 0),
                "emotional_health": response_data.get('emotional_health_score', 0),
                "social_health": response_data.get('social_health_score', 0),
                "needs_awareness": response_data.get('needs_awareness_score', 0)
            },
            "created_at": assessment.created_at.isoformat()
        })
    
    return results

@router.get("/recent")
def get_recent_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    assessment = db.query(Assessment).filter(
        Assessment.student_id == current_user.id
    ).order_by(Assessment.created_at.desc()).first()
    
    if not assessment:
        return None
    
    response_data = json.loads(assessment.responses) if assessment.responses else {}
    
    return {
        "id": assessment.id,
        "assessment_type": assessment.assessment_type,
        "total_score": assessment.score,
        "severity_level": assessment.severity_level,
        "breakdown": {
            "mental_health": response_data.get('mental_health_score', 0),
            "emotional_health": response_data.get('emotional_health_score', 0),
            "social_health": response_data.get('social_health_score', 0),
            "needs_awareness": response_data.get('needs_awareness_score', 0)
        },
        "created_at": assessment.created_at.isoformat()
    }

@router.get("/all", dependencies=[Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))])
def get_all_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessments = db.query(Assessment).order_by(Assessment.created_at.desc()).limit(50).all()
    
    results = []
    for assessment in assessments:
        student = db.query(User).filter(User.id == assessment.student_id).first()
        response_data = json.loads(assessment.responses) if assessment.responses else {}
        
        results.append({
            "id": assessment.id,
            "student_id": assessment.student_id,
            "student_name": student.full_name if student else "Unknown",
            "student_email": student.email if student else "Unknown",
            "assessment_type": assessment.assessment_type,
            "total_score": assessment.score,
            "severity_level": assessment.severity_level,
            "breakdown": {
                "mental_health": response_data.get('mental_health_score', 0),
                "emotional_health": response_data.get('emotional_health_score', 0),
                "social_health": response_data.get('social_health_score', 0),
                "needs_awareness": response_data.get('needs_awareness_score', 0)
            },
            "created_at": assessment.created_at.isoformat(),
            "needs_followup": assessment.severity_level in ["Critical - Immediate support recommended", "Concerning - Multiple challenges"]
        })
    
    return results

@router.get("/student/{student_id}", dependencies=[Depends(require_role([UserRole.COUNSELOR, UserRole.ADMIN]))])
def get_student_assessments(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessments = db.query(Assessment).filter(
        Assessment.student_id == student_id
    ).order_by(Assessment.created_at.desc()).all()
    
    results = []
    for assessment in assessments:
        response_data = json.loads(assessment.responses) if assessment.responses else {}
        results.append({
            "id": assessment.id,
            "assessment_type": assessment.assessment_type,
            "total_score": assessment.score,
            "severity_level": assessment.severity_level,
            "breakdown": {
                "mental_health": response_data.get('mental_health_score', 0),
                "emotional_health": response_data.get('emotional_health_score', 0),
                "social_health": response_data.get('social_health_score', 0),
                "needs_awareness": response_data.get('needs_awareness_score', 0)
            },
            "questions": response_data.get('questions', []),
            "notes": response_data.get('notes', ''),
            "created_at": assessment.created_at.isoformat()
        })
    
    return results
