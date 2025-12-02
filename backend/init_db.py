from app.core.database import engine, Base, SessionLocal
from app.models.models import User, UserRole
from app.core.security import get_password_hash

def init_database():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not existing_admin:
            admin_user = User(
                username="admin",
                email="langat.clement@embuni.ac.ke",
                hashed_password=get_password_hash("embuni2025"),
                full_name="System Administrator",
                phone_number="+254700000000",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
        
    except Exception as e:
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
