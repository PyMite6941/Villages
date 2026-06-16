import time as time_module
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.database import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])

# Per-email rate limit: track last send timestamp
_last_send: dict[str, float] = {}
SEND_COOLDOWN = 55


@router.get("/check-email")
async def check_email(email: str = Query(...)):
    sb = get_supabase()
    target = email.strip().lower()
    per_page = 1000
    for page in range(1, 51):
        users = sb.auth.admin.list_users(page=page, per_page=per_page)
        if not users:
            break
        if any((u.email or "").lower() == target for u in users):
            return {"exists": True}
        if len(users) < per_page:
            break
    return {"exists": False}


@router.post("/send-magic-link")
async def send_magic_link(email: str = Query(...), redirect_to: Optional[str] = None):
    target = email.strip().lower()

    # Server-side cooldown to prevent hitting Supabase email rate limits
    now = time_module.time()
    last = _last_send.get(target, 0)
    remaining = SEND_COOLDOWN - (now - last)
    if remaining > 0:
        raise HTTPException(status_code=429, detail=f"Please wait {int(remaining)}s before requesting another email")

    _last_send[target] = now

    sb_url = settings.supabase_url.rstrip("/")

    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
    }

    redirect = redirect_to or f"{settings.cors_origins[0]}/auth/callback"

    async with httpx.AsyncClient() as client:
        # Try sending the email first via the /otp endpoint
        otp_payload = {
            "email": target,
            "create_user": True,
            "data": {"email_redirect_to": redirect},
        }
        otp_resp = await client.post(f"{sb_url}/auth/v1/otp", json=otp_payload, headers=headers)

        if otp_resp.is_success:
            return {"sent": True, "link": None}

        # If rate limited, fall back to generating a direct link (no email)
        if otp_resp.status_code == 429 or "rate" in otp_resp.text.lower():
            link_payload = {
                "type": "magiclink",
                "email": target,
                "redirect_to": redirect,
            }
            link_resp = await client.post(
                f"{sb_url}/auth/v1/admin/generate_link", json=link_payload, headers=headers
            )
            if link_resp.is_success:
                data = link_resp.json()
                magic_url = data.get("url", "")
                return {"sent": False, "link": magic_url}

            raise HTTPException(
                status_code=502,
                detail="Could not generate login link. Try again later.",
            )

        raise HTTPException(status_code=502, detail="Email service unavailable. Try again later.")
