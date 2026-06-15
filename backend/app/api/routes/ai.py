from fastapi import APIRouter, HTTPException, Header
from app.database import get_supabase
from app.services.ai_service import generate_discussion_prompt, generate_study_challenge, moderate_content
from app.models.post import Post
import uuid
from datetime import datetime

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/village-elder/{village_id}/prompt")
async def village_elder_prompt(village_id: str, x_user_id: str = Header(...)):
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
    
    # Post as an AI-generated message from the Village Elder
    post = {
        "id": str(uuid.uuid4()),
        "content": f"**Village Elder:** {prompt}",
        "author_id": "village-elder-ai",
        "author_name": "Village Elder",
        "village_id": village_id,
        "is_ai_generated": True,
        "upvotes": 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    sb.table("posts").insert(post).execute()
    
    return {"prompt": prompt, "post_id": post["id"]}

@router.post("/village-elder/{village_id}/challenge")
async def generate_challenge(village_id: str, subject: str, difficulty: str = "medium", x_user_id: str = Header(...)):
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
    
    challenge = {
        "id": str(uuid.uuid4()),
        "village_id": village_id,
        "title": challenge_data.get("title", "Study Challenge"),
        "description": challenge_data.get("description", ""),
        "subject": subject,
        "difficulty": difficulty,
        "is_collaborative": True,
        "generated_by_ai": True,
        "completed_by": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    sb.table("challenges").insert(challenge).execute()
    
    return {**challenge_data, "challenge_id": challenge["id"]}
