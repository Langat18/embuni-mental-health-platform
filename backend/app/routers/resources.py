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
    {"id": "relationships", "name": "Relationships", "icon": "users"}
]

RESOURCES = [
    {
        "id": 1,
        "category": "anxiety",
        "type": "article",
        "title": "Understanding and Managing Anxiety",
        "description": "Learn practical techniques to manage anxiety and stress in your daily life.",
        "duration": "10 min read",
        "url": "https://www.nimh.nih.gov/health/topics/anxiety-disorders",
        "content": "Comprehensive guide on anxiety management techniques..."
    },
    {
        "id": 2,
        "category": "anxiety",
        "type": "exercise",
        "title": "Breathing Exercises for Calm",
        "description": "Step-by-step breathing techniques to reduce stress and promote relaxation.",
        "duration": "5 min practice",
        "url": "https://www.healthline.com/health/breathing-exercises-for-anxiety",
        "content": "Box breathing, 4-7-8 technique, diaphragmatic breathing..."
    },
    {
        "id": 3,
        "category": "depression",
        "type": "video",
        "title": "Recognizing Signs of Depression",
        "description": "Understanding depression symptoms and when to seek help.",
        "duration": "8 min watch",
        "url": "https://www.youtube.com/watch?v=z-IR48Mb3W0",
        "content": "Video content about recognizing depression..."
    },
    {
        "id": 4,
        "category": "depression",
        "type": "article",
        "title": "Self-Care Strategies for Mental Health",
        "description": "Daily practices to support your mental wellbeing and build resilience.",
        "duration": "12 min read",
        "url": "https://www.mentalhealth.gov/basics/what-is-mental-health",
        "content": "Self-care routines, mindfulness practices, healthy habits..."
    },
    {
        "id": 5,
        "category": "sleep",
        "type": "guide",
        "title": "Better Sleep Hygiene Guide",
        "description": "Comprehensive guide to improving your sleep quality and establishing healthy sleep habits.",
        "duration": "15 min read",
        "url": "https://www.sleepfoundation.org/sleep-hygiene",
        "content": "Sleep schedule, bedroom environment, pre-sleep routine..."
    },
    {
        "id": 6,
        "category": "sleep",
        "type": "audio",
        "title": "Guided Sleep Meditation",
        "description": "Relaxing meditation to help you fall asleep naturally.",
        "duration": "20 min listen",
        "url": "https://www.calm.com/sleep",
        "content": "Audio meditation for sleep..."
    },
    {
        "id": 7,
        "category": "wellness",
        "type": "article",
        "title": "Building Healthy Habits",
        "description": "Evidence-based strategies for creating and maintaining positive habits.",
        "duration": "8 min read",
        "url": "https://www.psychologytoday.com/us/basics/habit-formation",
        "content": "Habit formation, consistency, tracking progress..."
    },
    {
        "id": 8,
        "category": "wellness",
        "type": "exercise",
        "title": "Mindfulness for Beginners",
        "description": "Introduction to mindfulness practice and its benefits for mental health.",
        "duration": "10 min practice",
        "url": "https://www.mindful.org/meditation/mindfulness-getting-started/",
        "content": "Mindfulness exercises, meditation basics..."
    },
    {
        "id": 9,
        "category": "relationships",
        "type": "article",
        "title": "Healthy Communication Skills",
        "description": "Learn effective communication techniques for better relationships.",
        "duration": "12 min read",
        "url": "https://www.helpguide.org/articles/relationships-communication/effective-communication.htm",
        "content": "Active listening, expressing needs, conflict resolution..."
    },
    {
        "id": 10,
        "category": "relationships",
        "type": "guide",
        "title": "Setting Boundaries",
        "description": "Understanding and establishing healthy boundaries in relationships.",
        "duration": "10 min read",
        "url": "https://www.psychologytoday.com/us/basics/boundaries",
        "content": "Types of boundaries, how to communicate them..."
    },
    {
        "id": 11,
        "category": "anxiety",
        "type": "video",
        "title": "Stress Management Techniques",
        "description": "Practical strategies to manage daily stress and prevent burnout.",
        "duration": "12 min watch",
        "url": "https://www.youtube.com/watch?v=0fL-pn80s-c",
        "content": "Stress management video content..."
    },
    {
        "id": 12,
        "category": "wellness",
        "type": "guide",
        "title": "Student Mental Health Resources",
        "description": "Comprehensive guide for university students on maintaining mental health.",
        "duration": "20 min read",
        "url": "https://www.activeminds.org/studentresources/",
        "content": "University-specific mental health resources..."
    },
    {
        "id": 13,
        "category": "depression",
        "type": "exercise",
        "title": "Mood Tracking Journal",
        "description": "Learn how to track your mood and identify patterns in your mental health.",
        "duration": "Ongoing",
        "url": "https://www.moodtracker.com",
        "content": "Mood tracking techniques and journal prompts..."
    },
    {
        "id": 14,
        "category": "sleep",
        "type": "article",
        "title": "Managing Sleep During Exams",
        "description": "Tips for maintaining healthy sleep habits during stressful academic periods.",
        "duration": "8 min read",
        "url": "https://www.sleepfoundation.org/sleep-hygiene/students-and-sleep",
        "content": "Sleep management for students..."
    },
    {
        "id": 15,
        "category": "relationships",
        "type": "video",
        "title": "Building Support Networks",
        "description": "How to develop and maintain meaningful connections for better mental health.",
        "duration": "10 min watch",
        "url": "https://www.youtube.com/watch?v=QWUlZLZDJe4",
        "content": "Social support and connection strategies..."
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