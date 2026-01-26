from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/resources", tags=["Resources"])

class ResourceCategory(BaseModel):
    id: str
    name: str
    icon: str

class Resource(BaseModel):
    id: int
    category: str
    type: str
    title: str
    description: str
    duration: str
    url: Optional[str] = None
    content: Optional[str] = None

class ResourceResponse(BaseModel):
    success: bool
    resources: List[Resource]
    total: int

RESOURCE_CATEGORIES = [
    {"id": "anxiety", "name": "Anxiety & Stress", "icon": "brain"},
    {"id": "depression", "name": "Depression", "icon": "heart"},
    {"id": "sleep", "name": "Sleep & Rest", "icon": "moon"},
    {"id": "wellness", "name": "General Wellness", "icon": "activity"},
    {"id": "relationships", "name": "Relationships", "icon": "smile"}
]

RESOURCES = [
    {
        "id": 1,
        "category": "anxiety",
        "type": "article",
        "title": "Understanding and Managing Anxiety",
        "description": "Learn practical techniques to manage anxiety and stress in your daily life.",
        "duration": "10 min read",
        "url": "/resources/anxiety-management",
        "content": "Comprehensive guide on anxiety management techniques..."
    },
    {
        "id": 2,
        "category": "anxiety",
        "type": "exercise",
        "title": "Breathing Exercises for Calm",
        "description": "Step-by-step breathing techniques to reduce stress and promote relaxation.",
        "duration": "5 min practice",
        "url": "/resources/breathing-exercises",
        "content": "Box breathing, 4-7-8 technique, diaphragmatic breathing..."
    },
    {
        "id": 3,
        "category": "depression",
        "type": "video",
        "title": "Recognizing Signs of Depression",
        "description": "Understanding depression symptoms and when to seek help.",
        "duration": "8 min watch",
        "url": "/resources/depression-signs",
        "content": "Video content about recognizing depression..."
    },
    {
        "id": 4,
        "category": "depression",
        "type": "article",
        "title": "Self-Care Strategies for Mental Health",
        "description": "Daily practices to support your mental wellbeing and build resilience.",
        "duration": "12 min read",
        "url": "/resources/self-care-strategies",
        "content": "Self-care routines, mindfulness practices, healthy habits..."
    },
    {
        "id": 5,
        "category": "sleep",
        "type": "guide",
        "title": "Better Sleep Hygiene Guide",
        "description": "Comprehensive guide to improving your sleep quality and establishing healthy sleep habits.",
        "duration": "15 min read",
        "url": "/resources/sleep-hygiene",
        "content": "Sleep schedule, bedroom environment, pre-sleep routine..."
    },
    {
        "id": 6,
        "category": "sleep",
        "type": "audio",
        "title": "Guided Sleep Meditation",
        "description": "Relaxing meditation to help you fall asleep naturally.",
        "duration": "20 min listen",
        "url": "/resources/sleep-meditation",
        "content": "Audio meditation for sleep..."
    },
    {
        "id": 7,
        "category": "wellness",
        "type": "article",
        "title": "Building Healthy Habits",
        "description": "Evidence-based strategies for creating and maintaining positive habits.",
        "duration": "8 min read",
        "url": "/resources/healthy-habits",
        "content": "Habit formation, consistency, tracking progress..."
    },
    {
        "id": 8,
        "category": "wellness",
        "type": "exercise",
        "title": "Mindfulness for Beginners",
        "description": "Introduction to mindfulness practice and its benefits for mental health.",
        "duration": "10 min practice",
        "url": "/resources/mindfulness-basics",
        "content": "Mindfulness exercises, meditation basics..."
    },
    {
        "id": 9,
        "category": "relationships",
        "type": "article",
        "title": "Healthy Communication Skills",
        "description": "Learn effective communication techniques for better relationships.",
        "duration": "12 min read",
        "url": "/resources/communication-skills",
        "content": "Active listening, expressing needs, conflict resolution..."
    },
    {
        "id": 10,
        "category": "relationships",
        "type": "guide",
        "title": "Setting Boundaries",
        "description": "Understanding and establishing healthy boundaries in relationships.",
        "duration": "10 min read",
        "url": "/resources/setting-boundaries",
        "content": "Types of boundaries, how to communicate them..."
    }
]

@router.get("/categories", response_model=List[ResourceCategory])
def get_resource_categories(
    current_user: User = Depends(get_current_user)
):
    return RESOURCE_CATEGORIES

@router.get("/", response_model=ResourceResponse)
def get_resources(
    category: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    filtered_resources = RESOURCES.copy()
    
    if category and category != "all":
        filtered_resources = [r for r in filtered_resources if r["category"] == category]
    
    if type:
        filtered_resources = [r for r in filtered_resources if r["type"] == type]
    
    if search:
        search_lower = search.lower()
        filtered_resources = [
            r for r in filtered_resources 
            if search_lower in r["title"].lower() or search_lower in r["description"].lower()
        ]
    
    return {
        "success": True,
        "resources": filtered_resources,
        "total": len(filtered_resources)
    }

@router.get("/{resource_id}", response_model=Resource)
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resource = next((r for r in RESOURCES if r["id"] == resource_id), None)
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return resource

@router.post("/{resource_id}/track-access")
def track_resource_access(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resource = next((r for r in RESOURCES if r["id"] == resource_id), None)
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return {
        "success": True,
        "message": "Resource access tracked",
        "resource_id": resource_id,
        "user_id": current_user.id
    }