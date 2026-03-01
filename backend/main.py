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

routers_config = [
    ("auth", "Auth"),
    ("counselors", "Counselors"),
    ("tickets", "Tickets"),
    ("ticket_status", "Ticket Status"),
    ("resources", "Resources"),
    ("emergency_contacts", "Emergency contacts"),
    ("assessments", "Assessments"),
    ("schedules", "Schedules"),
    ("stats", "Stats"),
    ("wellbeing", "Wellbeing"),
    ("admin", "Admin"),
    ("websocket", "WebSocket"),
    ("notifications", "Notifications"),
]

for module_name, display_name in routers_config:
    try:
        module = __import__(f"app.routers.{module_name}", fromlist=["router"])
        app.include_router(module.router)
        print(f"✓ {display_name} router loaded")
    except Exception as e:
        print(f"✗ {display_name} router failed: {e}")

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