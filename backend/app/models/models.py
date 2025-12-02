from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    COUNSELOR = "counselor"
    PEER_COUNSELOR = "peer_counselor"
    ADMIN = "admin"

class TicketStatus(str, enum.Enum):
    NEW = "new"
    ASSIGNED = "assigned"
    ACTIVE = "active"
    FOLLOW_UP = "follow_up"
    RESOLVED = "resolved"
    CLOSED = "closed"

class CrisisLevel(str, enum.Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    student_tickets = relationship("Ticket", back_populates="student", foreign_keys="Ticket.student_id")
    counselor_tickets = relationship("Ticket", back_populates="counselor", foreign_keys="Ticket.counselor_id")
    messages = relationship("Message", back_populates="sender")
    emergency_contacts = relationship("EmergencyContact", back_populates="student")
    assessments = relationship("Assessment", back_populates="student")
    student_schedules = relationship("Schedule", back_populates="student", foreign_keys="Schedule.student_id")
    counselor_schedules = relationship("Schedule", back_populates="counselor", foreign_keys="Schedule.counselor_id")

class CounselorProfile(Base):
    __tablename__ = "counselor_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    staff_id = Column(String, unique=True, nullable=False)
    department = Column(String, nullable=False)
    qualifications = Column(Text)
    specializations = Column(ARRAY(String))
    years_of_experience = Column(Integer, default=0)
    bio = Column(Text)
    is_available = Column(Boolean, default=True)
    max_active_tickets = Column(Integer, default=10)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="counselor_profile")

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String, unique=True, index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    counselor_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.NEW)
    crisis_level = Column(Enum(CrisisLevel), default=CrisisLevel.NONE)
    priority = Column(Integer, default=0)
    initial_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_at = Column(DateTime(timezone=True))
    closed_at = Column(DateTime(timezone=True))
    
    student = relationship("User", back_populates="student_tickets", foreign_keys=[student_id])
    counselor = relationship("User", back_populates="counselor_tickets", foreign_keys=[counselor_id])
    messages = relationship("Message", back_populates="ticket", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="ticket", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", back_populates="messages")
    sender = relationship("User", back_populates="messages")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    counselor_note = Column(Text, nullable=False)
    tags = Column(ARRAY(String))
    is_private = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", back_populates="notes")

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contact_name = Column(String, nullable=False)
    contact_relationship = Column(String, nullable=False)  # CHANGED: was 'relationship'
    phone_number = Column(String, nullable=False)
    email = Column(String)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    student = relationship("User", back_populates="emergency_contacts")

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_type = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    severity_level = Column(String)
    responses = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    student = relationship("User", back_populates="assessments")

class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    counselor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=60)
    meeting_type = Column(String, default="in-person")
    meeting_link = Column(String)
    status = Column(String, default="scheduled")
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    student = relationship("User", back_populates="student_schedules", foreign_keys=[student_id])
    counselor = relationship("User", back_populates="counselor_schedules", foreign_keys=[counselor_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    details = Column(Text)
    ip_address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
