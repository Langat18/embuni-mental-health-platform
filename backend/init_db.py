from app.core.database import engine, Base, SessionLocal
from app.models.models import User, UserRole
from app.core.security import get_password_hash

def init_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")
    
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not existing_admin:
            print("\nCreating admin user...")
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
            print("✓ Admin user created")
            print("\n" + "="*50)
            print("Admin Credentials:")
            print("Email: langat.clement@embuni.ac.ke")
            print("Password: embuni2025")
            print("="*50)
        else:
            print("✓ Admin user already exists")
        
        print("\n✓ Database initialization complete!")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
