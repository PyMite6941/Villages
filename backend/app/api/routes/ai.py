from fastapi import APIRouter, HTTPException, Depends
from app.database import get_supabase
from app.auth import get_current_user
from app.services.ai_service import generate_discussion_prompt, generate_study_challenge, generate_course_study_tips
import uuid
from datetime import datetime

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/village-elder/{village_id}/prompt")
async def village_elder_prompt(village_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    village = sb.table("villages").select("*").eq("id", village_id).execute()
    if not village.data:
        raise HTTPException(status_code=404, detail="Village not found")
    v = village.data[0]
    prompt = await generate_discussion_prompt(
        village_name=v["name"],
        focus_area=v["focus_area"],
        resources=v.get("resources", []),
    )
    post_id = str(uuid.uuid4())
    sb.table("posts").insert({
        "id": post_id,
        "content": prompt,
        "author_id": "village-elder-ai",
        "author_name": "Village Elder",
        "village_id": village_id,
        "is_ai_generated": True,
        "upvotes": 0,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    return {"prompt": prompt, "post_id": post_id}


@router.post("/village-elder/{village_id}/challenge")
async def generate_challenge(
    village_id: str,
    subject: str,
    difficulty: str = "medium",
    _user_id: str = Depends(get_current_user),
):
    sb = get_supabase()
    village = sb.table("villages").select("*").eq("id", village_id).execute()
    if not village.data:
        raise HTTPException(status_code=404, detail="Village not found")
    v = village.data[0]
    challenge_data = await generate_study_challenge(
        village_name=v["name"],
        subject=subject,
        difficulty=difficulty,
        member_count=v["member_count"],
    )
    challenge_id = str(uuid.uuid4())
    sb.table("challenges").insert({
        "id": challenge_id,
        "village_id": village_id,
        "title": challenge_data.get("title", "Study Challenge"),
        "description": challenge_data.get("description", ""),
        "subject": subject,
        "difficulty": difficulty,
        "is_collaborative": True,
        "generated_by_ai": True,
        "completed_by": [],
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    return {**challenge_data, "challenge_id": challenge_id}


@router.post("/courses/{course_id}/study-tips")
async def course_study_tips(course_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    course_res = sb.table("courses").select("*").eq("id", course_id).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    c = course_res.data[0]
    lessons_res = sb.table("lessons").select("id").eq("course_id", course_id).execute()
    tips = await generate_course_study_tips(
        course_title=c["title"],
        subject=c["subject"],
        category=c["category"],
        difficulty=c["difficulty"],
        lesson_count=len(lessons_res.data),
    )
    return {"tips": tips}
