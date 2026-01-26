from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, EmergencyContact, UserRole
from app.schemas.schemas import EmergencyContactCreate, EmergencyContactResponse

router = APIRouter(prefix="/api/emergency-contacts", tags=["Emergency Contacts"])

@router.post("/", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
def create_emergency_contact(
    contact_data: EmergencyContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    if contact_data.is_primary:
        existing_primary = db.query(EmergencyContact).filter(
            EmergencyContact.student_id == current_user.id,
            EmergencyContact.is_primary == True
        ).first()
        
        if existing_primary:
            existing_primary.is_primary = False
            db.commit()
    
    new_contact = EmergencyContact(
        student_id=current_user.id,
        contact_name=contact_data.contact_name,
        contact_relationship=contact_data.contact_relationship,
        phone_number=contact_data.phone_number,
        email=contact_data.email,
        is_primary=contact_data.is_primary
    )
    
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    
    return new_contact

@router.get("/", response_model=List[EmergencyContactResponse])
def get_emergency_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contacts = db.query(EmergencyContact).filter(
        EmergencyContact.student_id == current_user.id
    ).order_by(EmergencyContact.is_primary.desc()).all()
    
    return contacts

@router.get("/{contact_id}", response_model=EmergencyContactResponse)
def get_emergency_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.student_id == current_user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )
    
    return contact

@router.put("/{contact_id}", response_model=EmergencyContactResponse)
def update_emergency_contact(
    contact_id: int,
    contact_data: EmergencyContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.student_id == current_user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )
    
    if contact_data.is_primary and not contact.is_primary:
        existing_primary = db.query(EmergencyContact).filter(
            EmergencyContact.student_id == current_user.id,
            EmergencyContact.is_primary == True,
            EmergencyContact.id != contact_id
        ).first()
        
        if existing_primary:
            existing_primary.is_primary = False
    
    contact.contact_name = contact_data.contact_name
    contact.contact_relationship = contact_data.contact_relationship
    contact.phone_number = contact_data.phone_number
    contact.email = contact_data.email
    contact.is_primary = contact_data.is_primary
    
    db.commit()
    db.refresh(contact)
    
    return contact

@router.delete("/{contact_id}")
def delete_emergency_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT]))
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.student_id == current_user.id
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )
    
    db.delete(contact)
    db.commit()
    
    return {"message": "Emergency contact deleted successfully"}