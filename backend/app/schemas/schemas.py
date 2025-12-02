from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, TicketStatus, CrisisLevel

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None

class StudentRegister(UserBase):
    password: str
    student_id: str
    role: UserRole = UserRole.STUDENT

class CounselorRegister(UserBase):
    password: str
    staff_id: str
    department: str
    qualifications: str
    specializations: List[str]
    years_of_experience: int = 0
    bio: Optional[str] = None
    role: UserRole = UserRole.COUNSELOR

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TicketCreate(BaseModel):
    category: str
    initial_message: str
    crisis_level: CrisisLevel = CrisisLevel.NONE

class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    counselor_id: Optional[int] = None
    crisis_level: Optional[CrisisLevel] = None

class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    student_id: int
    counselor_id: Optional[int]
    category: str
    status: TicketStatus
    crisis_level: CrisisLevel
    priority: int
    created_at: datetime
    student: UserResponse
    counselor: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    message: str

class MessageResponse(BaseModel):
    id: int
    ticket_id: int
    sender_id: int
    message: str
    is_read: bool
    created_at: datetime
    sender: UserResponse
    
    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    counselor_note: str
    tags: Optional[List[str]] = []
    is_private: bool = True

class NoteResponse(BaseModel):
    id: int
    ticket_id: int
    counselor_note: str
    tags: Optional[List[str]]
    is_private: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class EmergencyContactCreate(BaseModel):
    contact_name: str
    relationship: str
    phone_number: str
    email: Optional[EmailStr] = None
    is_primary: bool = False

class EmergencyContactResponse(BaseModel):
    id: int
    student_id: int
    contact_name: str
    relationship: str
    phone_number: str
    email: Optional[str]
    is_primary: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class AssessmentCreate(BaseModel):
    assessment_type: str
    score: int
    severity_level: str
    responses: str

class AssessmentResponse(BaseModel):
    id: int
    student_id: int
    assessment_type: str
    score: int
    severity_level: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ScheduleCreate(BaseModel):
    counselor_id: int
    ticket_id: Optional[int] = None
    scheduled_at: datetime
    duration_minutes: int = 60
    meeting_type: str = "in-person"
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

class ScheduleResponse(BaseModel):
    id: int
    student_id: int
    counselor_id: int
    ticket_id: Optional[int]
    scheduled_at: datetime
    duration_minutes: int
    meeting_type: str
    meeting_link: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class CounselorProfileResponse(BaseModel):
    id: int
    user_id: int
    staff_id: str
    department: str
    qualifications: Optional[str]
    specializations: Optional[List[str]]
    years_of_experience: int
    bio: Optional[str]
    is_available: bool
    max_active_tickets: int
    
    class Config:
        from_attributes = True
