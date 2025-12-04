from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)

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
    from app.routers import auth
    app.include_router(auth.router)
    print("✓ Auth router loaded")
except Exception as e:
    print(f"✗ Auth router failed: {e}")

try:
    from app.routers import counselors
    app.include_router(counselors.router)
    print("✓ Counselors router loaded")
except Exception as e:
    print(f"✗ Counselors router failed: {e}")

try:
    from app.routers import tickets
    app.include_router(tickets.router)
    print("✓ Tickets router loaded")
except Exception as e:
    print(f"✗ Tickets router failed: {e}")

try:
    from app.routers import emergency_contacts
    app.include_router(emergency_contacts.router)
    print("✓ Emergency contacts router loaded")
except Exception as e:
    print(f"✗ Emergency contacts router failed: {e}")

try:
    from app.routers import assessments
    app.include_router(assessments.router)
    print("✓ Assessments router loaded")
except Exception as e:
    print(f"✗ Assessments router failed: {e}")

try:
    from app.routers import schedules
    app.include_router(schedules.router)
    print("✓ Schedules router loaded")
except Exception as e:
    print(f"✗ Schedules router failed: {e}")

try:
    from app.routers import admin
    app.include_router(admin.router)
    print("✓ Admin router loaded")
except Exception as e:
    print(f"✗ Admin router failed: {e}")

try:
    from app.routers import websocket
    app.include_router(websocket.router)
    print("✓ WebSocket router loaded")
except Exception as e:
    print(f"✗ WebSocket router failed: {e}")

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

@app.get("/api/routes")
def list_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": route.name
            })
    return {"routes": routes}
