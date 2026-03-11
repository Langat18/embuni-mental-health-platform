from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, TicketStatus, CrisisLevel


class StudentRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    residence_status: Optional[str] = None


class CounselorRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    staff_id: str
    department: str
    qualifications: Optional[str] = None
    specializations: Optional[List[str]] = []
    years_of_experience: Optional[int] = 0
    bio: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
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
    crisis_level: Optional[str] = "none"
    counselor_id: Optional[int] = None


class TicketUpdate(BaseModel):
    crisis_level: Optional[str] = None


class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    category: str
    status: TicketStatus
    crisis_level: CrisisLevel
    initial_message: Optional[str]
    created_at: datetime
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

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

    class Config:
        from_attributes = True


class NoteCreate(BaseModel):
    counselor_note: str
    tags: Optional[List[str]] = []
    is_private: Optional[bool] = True


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
    contact_relationship: str
    phone_number: str
    email: Optional[str] = None
    is_primary: Optional[bool] = False


class EmergencyContactResponse(BaseModel):
    id: int
    student_id: int
    contact_name: str
    contact_relationship: str
    phone_number: str
    email: Optional[str]
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ScheduleCreate(BaseModel):
    counselor_id: int
    scheduled_at: datetime
    duration_minutes: Optional[int] = 60
    meeting_type: Optional[str] = "in-person"
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    ticket_id: Optional[int] = None


class ScheduleResponse(BaseModel):
    id: int
    student_id: int
    counselor_id: int
    scheduled_at: datetime
    duration_minutes: int
    meeting_type: str
    meeting_link: Optional[str]
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


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