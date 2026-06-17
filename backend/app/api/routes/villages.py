import uuid
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.config import settings
from app.database import get_supabase
from app.models.village import Village, VillageBan, VillageCreate, VillageSettingsUpdate
from app.services.ai_service import generate_village_match_reasoning

router = APIRouter(prefix="/villages", tags=["villages"])

DAILY_API = "https://api.daily.co/v1"


@router.get("", response_model=list[Village])
async def list_villages(focus_area: Optional[str] = None, search: Optional[str] = None, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    query = sb.table("villages").select("*").eq("is_active", True)
    if focus_area:
        query = query.eq("focus_area", focus_area)
    result = query.execute().data

    villages = []
    for v in result:
        if not v.get("is_private"):
            villages.append(Village(**v))
        else:
            # Check if user is a member of this private village
            member_check = sb.table("village_members").select("user_id").eq("user_id", user_id).eq("village_id", v["id"]).execute()
            if member_check.data:
                villages.append(Village(**v))

    # Filter by search term if provided
    if search:
        s = search.lower()
        villages = [v for v in villages if s in v.name.lower() or s in v.focus_area.lower()]

    return villages


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


@router.post("", response_model=Village)
async def create_village(data: VillageCreate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    village_id = str(uuid.uuid4())

    invite_code = None
    if data.is_private:
        invite_code = str(uuid.uuid4())[:8].upper()

    village = {
        "id": village_id,
        "name": data.name,
        "description": data.description,
        "focus_area": data.focus_area,
        "resources": data.resources,
        "max_members": data.max_members,
        "member_count": 1,
        "is_active": True,
        "is_private": data.is_private,
        "invite_code": invite_code,
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
async def get_village(village_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("villages").select("*").eq("id", village_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Village not found")
    village = result.data[0]

    # Check access for private villages
    if village.get("is_private"):
        member_check = sb.table("village_members").select("user_id").eq("user_id", user_id).eq("village_id", village_id).execute()
        if not member_check.data and village.get("created_by") != user_id:
            raise HTTPException(status_code=403, detail="This is a private village")

    return Village(**village)


_MAX_VILLAGES_PER_USER = 10


@router.post("/{village_id}/join")
async def join_village(village_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    village_result = sb.table("villages").select("*").eq("id", village_id).execute()
    if not village_result.data:
        raise HTTPException(status_code=404, detail="Village not found")
    village = village_result.data[0]

    if village.get("is_private"):
        raise HTTPException(status_code=400, detail="This village requires an invite code to join")

    user_memberships = sb.table("village_members").select("village_id", count="exact").eq("user_id", user_id).execute()
    if user_memberships.count and user_memberships.count >= _MAX_VILLAGES_PER_USER:
        raise HTTPException(status_code=400, detail=f"You can join at most {_MAX_VILLAGES_PER_USER} villages")

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
    new_count = village["member_count"] + 1
    updates = {"member_count": new_count}
    if new_count >= 100 and village.get("is_private"):
        updates["is_private"] = False
        updates["invite_code"] = None
    sb.table("villages").update(updates).eq("id", village_id).execute()
    sb.table("profiles").update({"village_id": village_id}).eq("id", user_id).execute()
    return {"message": f"Successfully joined village '{village['name']}'"}


@router.post("/join-by-code")
async def join_village_by_code(data: dict, user_id: str = Depends(get_current_user)):
    code = data.get("code", "")
    sb = get_supabase()
    village_res = sb.table("villages").select("*").eq("invite_code", code.upper()).execute()
    if not village_res.data:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    village = village_res.data[0]

    user_memberships = sb.table("village_members").select("village_id", count="exact").eq("user_id", user_id).execute()
    if user_memberships.count and user_memberships.count >= _MAX_VILLAGES_PER_USER:
        raise HTTPException(status_code=400, detail=f"You can join at most {_MAX_VILLAGES_PER_USER} villages")

    if village["member_count"] >= village["max_members"]:
        raise HTTPException(status_code=400, detail="Village is full")
    existing = sb.table("village_members").select("user_id").eq("user_id", user_id).eq("village_id", village["id"]).execute()
    if existing.data:
        return {"message": f"Already a member of '{village['name']}'", "village_id": village["id"]}
    sb.table("village_members").insert({
        "user_id": user_id,
        "village_id": village["id"],
        "role": "member",
        "joined_at": datetime.utcnow().isoformat(),
    }).execute()
    new_count = village["member_count"] + 1
    updates = {"member_count": new_count}
    if new_count >= 100 and village.get("is_private"):
        updates["is_private"] = False
        updates["invite_code"] = None
    sb.table("villages").update(updates).eq("id", village["id"]).execute()
    sb.table("profiles").update({"village_id": village["id"]}).eq("id", user_id).execute()
    return {"message": f"Joined '{village['name']}'!", "village_id": village["id"]}


@router.get("/{village_id}/members")
async def get_village_members(village_id: str):
    sb = get_supabase()
    members = sb.table("village_members").select("*").eq("village_id", village_id).execute().data
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


@router.get("/{village_id}/challenges")
async def list_challenges(village_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = (
        sb.table("challenges")
        .select("*")
        .eq("village_id", village_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("/{village_id}/challenges/{challenge_id}/complete")
async def complete_challenge(
    village_id: str, challenge_id: str, user_id: str = Depends(get_current_user)
):
    sb = get_supabase()
    res = sb.table("challenges").select("completed_by").eq("id", challenge_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Challenge not found")
    completed = res.data[0].get("completed_by") or []
    if user_id not in completed:
        completed = completed + [user_id]
        sb.table("challenges").update({"completed_by": completed}).eq("id", challenge_id).execute()
    return {"completed_by": completed, "completed": True}


# ── Moderation helpers ────────────────────────────────────────────────────────

async def _require_chief(village_id: str, user_id: str, sb):
    """Raise 403 if the user is not a chief of this village."""
    member = sb.table("village_members").select("role").eq("village_id", village_id).eq("user_id", user_id).maybe_single().execute()
    if not member.data or member.data.get("role") != "chief":
        raise HTTPException(status_code=403, detail="Only the village chief can perform this action")


# ── Village settings (chief only) ─────────────────────────────────────────────

@router.patch("/{village_id}/settings", response_model=Village)
async def update_village_settings(village_id: str, data: VillageSettingsUpdate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    await _require_chief(village_id, user_id, sb)
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No settings to update")
    result = sb.table("villages").update(updates).eq("id", village_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Village not found")
    return Village(**result.data[0])


# ── Mute a member (chief only) ────────────────────────────────────────────────

@router.post("/{village_id}/members/{target_id}/mute")
async def mute_member(village_id: str, target_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    await _require_chief(village_id, user_id, sb)
    if target_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot mute yourself")
    member = sb.table("village_members").select("user_id").eq("village_id", village_id).eq("user_id", target_id).maybe_single().execute()
    if not member.data:
        raise HTTPException(status_code=404, detail="Member not found in this village")
    from datetime import timedelta
    expires = (datetime.utcnow() + timedelta(hours=24)).isoformat(timespec="seconds") + "+00:00"
    sb.table("village_members").update({"muted_until": expires}).eq("village_id", village_id).eq("user_id", target_id).execute()
    return {"muted_until": expires}


@router.post("/{village_id}/members/{target_id}/unmute")
async def unmute_member(village_id: str, target_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    await _require_chief(village_id, user_id, sb)
    sb.table("village_members").update({"muted_until": None}).eq("village_id", village_id).eq("user_id", target_id).execute()
    return {"muted": False}


# ── Kick a member (chief only) ────────────────────────────────────────────────

@router.post("/{village_id}/members/{target_id}/kick")
async def kick_member(village_id: str, target_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    await _require_chief(village_id, user_id, sb)
    if target_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot kick yourself")
    member = sb.table("village_members").select("user_id, role").eq("village_id", village_id).eq("user_id", target_id).maybe_single().execute()
    if not member.data:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.data.get("role") == "chief":
        raise HTTPException(status_code=400, detail="Cannot kick another chief")
    # Remove membership
    sb.table("village_members").delete().eq("village_id", village_id).eq("user_id", target_id).execute()
    # Decrement member count
    v = sb.table("villages").select("member_count").eq("id", village_id).maybe_single().execute()
    if v.data and v.data["member_count"] > 0:
        sb.table("villages").update({"member_count": v.data["member_count"] - 1}).eq("id", village_id).execute()
    # Clear village_id on profile if it matches
    sb.table("profiles").update({"village_id": None}).eq("id", target_id).eq("village_id", village_id).execute()
    return {"kicked": True}


# ── Ban a user (chief only) ───────────────────────────────────────────────────

@router.post("/{village_id}/bans")
async def ban_user(village_id: str, data: dict, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    await _require_chief(village_id, user_id, sb)
    target_id = data.get("user_id")
    reason = data.get("reason", "")
    if not target_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    if target_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot ban yourself")
    # Remove from members if present
    sb.table("village_members").delete().eq("village_id", village_id).eq("user_id", target_id).execute()
    v = sb.table("villages").select("member_count").eq("id", village_id).maybe_single().execute()
    if v.data and v.data["member_count"] > 0:
        sb.table("villages").update({"member_count": v.data["member_count"] - 1}).eq("id", village_id).execute()
    sb.table("profiles").update({"village_id": None}).eq("id", target_id).eq("village_id", village_id).execute()
    # Insert ban
    sb.table("village_bans").insert({
        "village_id": village_id,
        "user_id": target_id,
        "banned_by": user_id,
        "reason": reason,
    }).execute()
    return {"banned": True}


@router.get("/{village_id}/bans", response_model=list[VillageBan])
async def list_bans(village_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    await _require_chief(village_id, user_id, sb)
    result = sb.table("village_bans").select("*").eq("village_id", village_id).order("created_at", desc=True).execute()
    return result.data


@router.post("/{village_id}/bans/{ban_id}/lift")
async def lift_ban(village_id: str, ban_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    await _require_chief(village_id, user_id, sb)
    sb.table("village_bans").delete().eq("id", ban_id).eq("village_id", village_id).execute()
    return {"lifted": True}


# ── Voice channel ─────────────────────────────────────────────────────────────

@router.post("/{village_id}/voice")
async def village_voice_room(village_id: str, user_id: str = Depends(get_current_user)):
    """Get-or-create a Daily.co voice room for this village. Members only."""
    sb = get_supabase()
    v = sb.table("villages").select("id").eq("id", village_id).execute()
    if not v.data:
        raise HTTPException(status_code=404, detail="Village not found")
    member = (
        sb.table("village_members").select("user_id")
        .eq("village_id", village_id).eq("user_id", user_id).execute()
    )
    if not member.data:
        raise HTTPException(status_code=403, detail="Join the village to use its voice channel")
    if not settings.daily_api_key:
        raise HTTPException(status_code=503, detail="Voice channels are not configured")

    room_name = f"village-{village_id}"
    headers = {"Authorization": f"Bearer {settings.daily_api_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=20) as client:
        existing = await client.get(f"{DAILY_API}/rooms/{room_name}", headers=headers)
        if existing.status_code == 200:
            return {"url": existing.json()["url"]}
        created = await client.post(
            f"{DAILY_API}/rooms", headers=headers,
            json={"name": room_name, "properties": {
                "start_video_off": True, "enable_screenshare": False, "enable_chat": False,
            }},
        )
        if created.status_code in (200, 201):
            return {"url": created.json()["url"]}
        raise HTTPException(status_code=502, detail="Could not create voice room")
