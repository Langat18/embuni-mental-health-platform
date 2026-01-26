from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from datetime import datetime
import random

router = APIRouter(prefix="/api/wellbeing", tags=["Wellbeing"])

WELLBEING_TIPS = [
    "Take 5 minutes today for deep breathing. Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times.",
    "Remember: It's okay to not be okay. Reach out to someone you trust when you need support.",
    "Practice gratitude: Write down three things you're thankful for today.",
    "Take a break from screens. Go for a short walk and observe nature around you.",
    "Stay hydrated. Drink a glass of water right now and notice how it makes you feel.",
    "Connect with a friend today. A simple message can brighten both your days.",
    "Try progressive muscle relaxation: Tense and release each muscle group from your toes to your head.",
    "Set one small, achievable goal for today. Celebrate when you accomplish it.",
    "Practice self-compassion. Treat yourself with the same kindness you'd show a good friend.",
    "Take a 10-minute break to do something you enjoy, guilt-free.",
    "Notice your thoughts without judgment. You are not your thoughts.",
    "Spend time in nature, even if it's just sitting under a tree for a few minutes.",
    "Listen to your favorite calming music or sounds for 5 minutes.",
    "Journal your feelings. Writing can help process emotions and reduce stress.",
    "Do a body scan meditation. Notice sensations from head to toe without changing anything.",
    "Practice saying 'no' to protect your energy and mental space.",
    "Reach out to your counselor if you're struggling. Seeking help is a sign of strength.",
    "Create a bedtime routine. Quality sleep is essential for mental health.",
    "Limit caffeine and sugar intake. Notice how your body and mind respond.",
    "Practice mindful eating. Pay attention to the taste, texture, and smell of your food.",
    "Challenge negative self-talk. Ask yourself: Would I say this to a friend?",
    "Move your body in a way that feels good. Dance, stretch, or take a gentle walk.",
    "Create a calming space in your room where you can retreat when overwhelmed.",
    "Practice the 5-4-3-2-1 grounding technique: 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.",
    "Remember: Recovery is not linear. Be patient with yourself.",
    "Celebrate small wins. Progress is progress, no matter how small.",
    "Connect with your support system. You don't have to face challenges alone.",
    "Take regular study breaks. Your brain needs rest to function optimally.",
    "Practice positive affirmations. Start with: 'I am doing my best, and that is enough.'",
    "Engage in a creative activity. Art, music, or writing can be therapeutic.",
]

@router.get("/daily-tip")
def get_daily_tip(user_id: int, db: Session = Depends(get_db)):
    today = datetime.now().date()
    day_of_year = today.timetuple().tm_yday
    
    seed_value = day_of_year * 1000 + user_id
    random.seed(seed_value)
    
    shuffled_tips = WELLBEING_TIPS.copy()
    random.shuffle(shuffled_tips)
    tip = shuffled_tips[0]
    
    return {
        "success": True,
        "tip": tip,
        "date": today.isoformat()
    }

@router.get("/random-tip")
def get_random_tip(user_id: int, db: Session = Depends(get_db)):
    current_hour = datetime.now().hour
    today = datetime.now().date()
    day_of_year = today.timetuple().tm_yday
    
    seed_value = (day_of_year * 10000) + (user_id * 100) + current_hour
    random.seed(seed_value)
    
    shuffled_tips = WELLBEING_TIPS.copy()
    random.shuffle(shuffled_tips)
    tip = shuffled_tips[0]
    
    return {
        "success": True,
        "tip": tip
    }