import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import get_current_user
from app.database import get_supabase
from app.services.ai_service import (
    explain_topic,
    generate_discussion_prompt,
    generate_learning_path,
    generate_study_challenge,
    moderate_topic_content,
)

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


@router.post("/topic/explain")
async def topic_explain(
    topic: str = Query(..., description="The topic to explain"),
    village_id: Optional[str] = Query(None, description="Optional village context"),
    _user_id: str = Depends(get_current_user),
):
    sb = get_supabase()
    village_name = ""
    focus_area = ""
    audience_levels = ["students", "adult learners"]

    if village_id:
        village = sb.table("villages").select("*").eq("id", village_id).execute()
        if village.data:
            v = village.data[0]
            village_name = v["name"]
            focus_area = v["focus_area"]
            members = sb.table("village_members").select("user_id").eq("village_id", village_id).execute()
            member_ids = [m["user_id"] for m in members.data]
            if member_ids:
                profiles = sb.table("profiles").select("academic_level").in_("id", member_ids).execute()
                levels = set(p.get("academic_level", "") for p in profiles.data if p.get("academic_level"))
                if levels:
                    audience_levels = list(levels)

    explanation = await explain_topic(
        topic=topic,
        village_name=village_name,
        focus_area=focus_area,
        audience_levels=audience_levels,
    )

    guardrail = await moderate_topic_content(topic, explanation.get("plain_language", ""))

    if not guardrail.get("safe", True):
        explanation["_guardrail_warnings"] = guardrail.get("concerns", [])
        explanation["_ethical_notes"] = guardrail.get("ethical_notes", [])

    explanation["_audience"] = audience_levels
    explanation["_guardrail"] = guardrail

    if village_id:
        explanation_id = str(uuid.uuid4())
        sb.table("topic_explanations").insert({
            "id": explanation_id,
            "village_id": village_id,
            "topic": topic,
            "plain_language": explanation.get("plain_language", ""),
            "checklist": explanation.get("checklist", []),
            "next_steps": explanation.get("next_steps", []),
            "generated_by_ai": True,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()
        explanation["explanation_id"] = explanation_id

    return explanation


@router.post("/village/{village_id}/learning-path")
async def village_learning_path(
    village_id: str,
    _user_id: str = Depends(get_current_user),
):
    sb = get_supabase()
    village = sb.table("villages").select("*").eq("id", village_id).execute()
    if not village.data:
        raise HTTPException(status_code=404, detail="Village not found")
    v = village.data[0]

    members = sb.table("village_members").select("user_id").eq("village_id", village_id).execute()
    member_ids = [m["user_id"] for m in members.data]
    interests = []
    if member_ids:
        profiles = sb.table("profiles").select("interests").in_("id", member_ids).execute()
        for p in profiles.data:
            interests.extend(p.get("interests", []))

    path_data = await generate_learning_path(
        village_name=v["name"],
        focus_area=v["focus_area"],
        resources=v.get("resources", []),
        member_count=v["member_count"],
        interests=list(set(interests)),
    )

    path_id = str(uuid.uuid4())
    sb.table("learning_paths").insert({
        "id": path_id,
        "village_id": village_id,
        "title": path_data.get("title", f"Learning path for {v['name']}"),
        "description": path_data.get("description", ""),
        "steps": path_data.get("steps", []),
        "generated_by_ai": True,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()

    return {**path_data, "learning_path_id": path_id}


@router.get("/topic/explanations/{village_id}")
async def list_topic_explanations(village_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("topic_explanations").select("*").eq("village_id", village_id).order("created_at", desc=True).execute()
    return result.data


@router.get("/village/{village_id}/learning-paths")
async def list_learning_paths(village_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("learning_paths").select("*").eq("village_id", village_id).order("created_at", desc=True).execute()
    return result.data
