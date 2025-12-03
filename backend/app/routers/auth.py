from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.models import User, CounselorProfile, UserRole
from app.schemas.schemas import StudentRegister, CounselorRegister, UserLogin, Token, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register/student", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_student(user_data: StudentRegister, db: Session = Depends(get_db)):
    try:
        username = user_data.email.split('@')[0]
        
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        existing_username = db.query(User).filter(User.username == username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Student ID already registered")
        
        new_user = User(
            username=username,
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            phone_number=user_data.phone_number,
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"Student registered: {new_user.email}, username: {new_user.username}")
        
        access_token = create_access_token(data={"sub": new_user.email})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_user
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@router.post("/register/counselor", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_counselor(counselor_data: CounselorRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == counselor_data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if db.query(User).filter(User.email == counselor_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        username=counselor_data.username,
        email=counselor_data.email,
        hashed_password=get_password_hash(counselor_data.password),
        full_name=counselor_data.full_name,
        phone_number=counselor_data.phone_number,
        role=UserRole.COUNSELOR,
        is_active=False,
        is_verified=False
    )
    
    db.add(new_user)
    db.flush()
    
    counselor_profile = CounselorProfile(
        user_id=new_user.id,
        staff_id=counselor_data.staff_id,
        department=counselor_data.department,
        qualifications=counselor_data.qualifications,
        specializations=counselor_data.specializations,
        years_of_experience=counselor_data.years_of_experience,
        bio=counselor_data.bio
    )
    
    db.add(counselor_profile)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    print(f"Login attempt with email: {credentials.email}")
    
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        print(f"User not found: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    print(f"User found: {user.email}, checking password...")
    
    if not verify_password(credentials.password, user.hashed_password):
        print("Password verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        print(f"User not active: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is pending approval"
        )
    
    print(f"Login successful: {user.email}")
    
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
