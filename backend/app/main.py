from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base

app = FastAPI(
    title="Embuni Mental Health Platform API",
    description="Backend API for University of Embu Mental Health Counselling System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from app.routers import auth, tickets, websocket, emergency_contacts, assessments, schedules, admin
    app.include_router(auth.router)
    app.include_router(tickets.router)
    app.include_router(emergency_contacts.router)
    app.include_router(assessments.router)
    app.include_router(schedules.router)
    app.include_router(admin.router)
    app.include_router(websocket.router)
except Exception as e:
    print(f"Warning: Some routers could not be loaded: {e}")

@app.get("/")
def root():
    return {
        "message": "Embuni Mental Health Platform API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
