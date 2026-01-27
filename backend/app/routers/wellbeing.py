from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/wellbeing", tags=["wellbeing"])

WELLBEING_TIPS = [
    "Take a few deep breaths when feeling overwhelmed.",
    "Remember that it's okay to ask for help.",
    "Practice gratitude by noting three positive things today.",
    "Take short breaks between study sessions.",
    "Connect with a friend or loved one today.",
    "Engage in physical activity, even a short walk helps.",
    "Maintain a regular sleep schedule for better mental health.",
    "Limit social media use if it affects your mood.",
    "Try a mindfulness or meditation exercise.",
    "Set small, achievable goals for the day.",
    "Remember that mistakes are part of learning.",
    "Stay hydrated and eat nutritious meals.",
    "Spend time doing something you enjoy.",
    "Create a comfortable study environment.",
    "Reach out to campus counseling services when needed.",
    "Practice self-compassion and be kind to yourself.",
    "Establish healthy boundaries with work and social life.",
    "Take time to reflect on your achievements.",
    "Engage in a creative activity or hobby.",
    "Remember that mental health is just as important as physical health.",
    "Break large tasks into smaller, manageable steps.",
    "Celebrate your progress, no matter how small.",
    "Listen to music that lifts your mood.",
    "Spend time in nature when possible.",
    "Practice saying 'no' to maintain balance.",
    "Keep a journal to express your thoughts and feelings.",
    "Reach out to your support network when struggling.",
    "Remember that seeking help is a sign of strength.",
    "Take time to relax and do nothing sometimes.",
    "Focus on what you can control and let go of what you can't."
]

@router.get("/daily-tip")
def get_daily_tip(user_id: Optional[int] = Query(None)):
    day_of_year = datetime.now().timetuple().tm_yday
    hour = datetime.now().hour
    
    if user_id:
        seed = (day_of_year * 10000) + (user_id * 100) + hour
    else:
        seed = day_of_year
    
    tip_index = seed % len(WELLBEING_TIPS)
    
    return {
        "tip": WELLBEING_TIPS[tip_index],
        "date": datetime.now().date().isoformat()
    }

@router.get("/random-tip")
def get_random_tip(user_id: Optional[int] = Query(None)):
    return get_daily_tip(user_id)