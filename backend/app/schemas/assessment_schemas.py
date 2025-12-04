from pydantic import BaseModel
from typing import List, Dict

class AssessmentQuestion(BaseModel):
    id: int
    category: str
    question: str
    score: int

class AssessmentSubmission(BaseModel):
    responses: List[AssessmentQuestion]
    notes: str = ""

class AssessmentResult(BaseModel):
    id: int
    student_id: int
    total_score: int
    mental_health_score: int
    emotional_health_score: int
    social_health_score: int
    needs_awareness_score: int
    severity_level: str
    responses: Dict
    created_at: str
    student_name: str
    
    class Config:
        from_attributes = True
