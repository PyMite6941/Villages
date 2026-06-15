from fastapi import APIRouter, Query

from app.database import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/check-email")
async def check_email(email: str = Query(...)):
    sb = get_supabase()
    result = sb.table("auth.users").select("id").eq("email", email).execute()
    return {"exists": len(result.data) > 0}
