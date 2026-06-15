import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.database import get_supabase
from app.models.village import Village, VillageCreate
from app.services.ai_service import generate_village_match_reasoning

router = APIRouter(prefix="/villages", tags=["villages"])


@router.get("/", response_model=list[Village])
async def list_villages(focus_area: Optional[str] = None):
    sb = get_supabase()
    query = sb.table("villages").select("*").eq("is_active", True)
    if focus_area:
        query = query.eq("focus_area", focus_area)
    return [Village(**v) for v in query.execute().data]


@router.post("/match")
async def ai_match_village(user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    profile_result = sb.table("profiles").select("*").eq("id", user_id).execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found — create one first")
    profile = profile_result.data[0]
    villages_result = sb.table("villages").select("*").eq("is_active", True).execute()
    if not villages_result.data:
        raise HTTPException(status_code=404, detail="No villages available yet")
    match = await generate_village_match_reasoning(
        user_goals=profile.get("goals", []),
        user_strengths=profile.get("strengths", []),
        user_weaknesses=profile.get("weaknesses", []),
        academic_level=profile.get("academic_level", ""),
        interests=profile.get("interests", []),
        learning_style=profile.get("learning_style", "visual"),
        available_villages=villages_result.data,
    )
    return {"recommended_village_id": match.get("village_id"), "reasoning": match.get("reasoning")}


@router.post("/", response_model=Village)
async def create_village(data: VillageCreate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    village_id = str(uuid.uuid4())
    village = {
        "id": village_id,
        "name": data.name,
        "description": data.description,
        "focus_area": data.focus_area,
        "resources": data.resources,
        "max_members": data.max_members,
        "member_count": 1,
        "is_active": True,
        "created_by": user_id,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("villages").insert(village).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create village")
    sb.table("village_members").insert({
        "user_id": user_id,
        "village_id": village_id,
        "role": "chief",
        "joined_at": datetime.utcnow().isoformat(),
    }).execute()
    sb.table("profiles").update({"village_id": village_id}).eq("id", user_id).execute()
    return Village(**result.data[0])


@router.get("/{village_id}", response_model=Village)
async def get_village(village_id: str):
    sb = get_supabase()
    result = sb.table("villages").select("*").eq("id", village_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Village not found")
    return Village(**result.data[0])


@router.post("/{village_id}/join")
async def join_village(village_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    village_result = sb.table("villages").select("*").eq("id", village_id).execute()
    if not village_result.data:
        raise HTTPException(status_code=404, detail="Village not found")
    village = village_result.data[0]
    if village["member_count"] >= village["max_members"]:
        raise HTTPException(status_code=400, detail="Village is full")
    existing = sb.table("village_members").select("user_id").eq("user_id", user_id).eq("village_id", village_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Already a member")
    sb.table("village_members").insert({
        "user_id": user_id,
        "village_id": village_id,
        "role": "member",
        "joined_at": datetime.utcnow().isoformat(),
    }).execute()
    sb.table("villages").update({"member_count": village["member_count"] + 1}).eq("id", village_id).execute()
    sb.table("profiles").update({"village_id": village_id}).eq("id", user_id).execute()
    return {"message": f"Successfully joined village '{village['name']}'"}


@router.get("/{village_id}/members")
async def get_village_members(village_id: str):
    sb = get_supabase()
    members = sb.table("village_members").select("*").eq("village_id", village_id).execute().data
    # village_members.user_id and profiles.id both reference auth.users but have
    # no direct FK between them, so PostgREST can't embed profiles. Fetch + merge.
    user_ids = [m["user_id"] for m in members]
    profiles_by_id: dict = {}
    if user_ids:
        profiles = (
            sb.table("profiles")
            .select("id, display_name, academic_level, goals")
            .in_("id", user_ids)
            .execute()
            .data
        )
        profiles_by_id = {p["id"]: p for p in profiles}
    for m in members:
        m["profiles"] = profiles_by_id.get(m["user_id"])
    return members
