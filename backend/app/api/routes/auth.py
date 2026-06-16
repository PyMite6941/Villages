from fastapi import APIRouter, Query

from app.database import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/check-email")
async def check_email(email: str = Query(...)):
    # The `auth` schema isn't exposed via PostgREST, so we can't query
    # auth.users directly. Use the GoTrue admin API (service-role key) and
    # page through users, matching the email case-insensitively.
    sb = get_supabase()
    target = email.strip().lower()
    per_page = 1000
    for page in range(1, 51):  # hard cap: 50k users
        users = sb.auth.admin.list_users(page=page, per_page=per_page)
        if not users:
            break
        if any((u.email or "").lower() == target for u in users):
            return {"exists": True}
        if len(users) < per_page:
            break
    return {"exists": False}
