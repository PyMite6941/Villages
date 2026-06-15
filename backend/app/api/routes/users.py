from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.database import get_supabase
from app.models.user import UserProfile, UserProfileCreate, UserProfileUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/profile", response_model=UserProfile)
async def create_profile(data: UserProfileCreate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    profile = data.model_dump()
    profile["id"] = user_id
    profile["email"] = ""
    profile["created_at"] = datetime.utcnow().isoformat()
    try:
        result = sb.table("profiles").upsert(profile).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create profile")
        return UserProfile(**result.data[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database error — have you run the SQL migrations? {e}")


@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_profile(user_id: str):
    sb = get_supabase()
    result = sb.table("profiles").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return UserProfile(**result.data[0])


@router.patch("/profile", response_model=UserProfile)
async def update_profile(data: UserProfileUpdate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = sb.table("profiles").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return UserProfile(**result.data[0])
