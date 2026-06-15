from fastapi import APIRouter, HTTPException, Header
from app.models.user import UserProfile, UserProfileCreate, UserProfileUpdate
from app.database import get_supabase
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/profile", response_model=UserProfile)
async def create_profile(data: UserProfileCreate, x_user_id: str = Header(...)):
    sb = get_supabase()
    profile = {
        "id": x_user_id,
        "display_name": data.display_name,
        "academic_level": data.academic_level,
        "goals": data.goals,
        "strengths": data.strengths,
        "weaknesses": data.weaknesses,
        "email": "",
        "created_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("profiles").upsert(profile).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create profile")
    return UserProfile(**result.data[0])

@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_profile(user_id: str):
    sb = get_supabase()
    result = sb.table("profiles").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return UserProfile(**result.data[0])

@router.patch("/profile", response_model=UserProfile)
async def update_profile(data: UserProfileUpdate, x_user_id: str = Header(...)):
    sb = get_supabase()
    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = sb.table("profiles").update(updates).eq("id", x_user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return UserProfile(**result.data[0])
