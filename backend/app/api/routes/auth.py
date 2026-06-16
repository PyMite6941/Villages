import time as time_module
from typing import Optional
from urllib.parse import parse_qs, urlparse

import httpx
from fastapi import APIRouter, Header, HTTPException, Query

from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

# Per-email rate limit: track last send timestamp
_last_send: dict[str, float] = {}
SEND_COOLDOWN = 55


@router.post("/send-magic-link")
async def send_magic_link(
    email: str = Query(...),
    redirect_to: Optional[str] = None,
    x_admin_secret: Optional[str] = Header(default=None),
):
    # SECURITY: this endpoint mints a usable session for an ARBITRARY email, so it
    # is admin-only. Normal user login does NOT use it — login goes through the
    # standard client-side Supabase OTP, which emails the user a one-time link.
    # Disabled unless a server secret is configured, and the secret is required on
    # every call. (The /auth/check-email enumeration endpoint was removed.)
    if not settings.magic_link_admin_secret:
        raise HTTPException(status_code=404, detail="Not found")
    if x_admin_secret != settings.magic_link_admin_secret:
        raise HTTPException(status_code=403, detail="Forbidden")

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

    redirect = redirect_to or f"{settings.frontend_url}/auth/callback"

    async with httpx.AsyncClient() as client:
        # Step 1: Generate a magic link (creates user + one-time token)
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
            magic_url = data.get("action_link", "") or data.get("url", "")
            if magic_url:
                parsed = urlparse(magic_url)
                qs = parse_qs(parsed.query)
                token = qs.get("token", [""])[0]
                vtype = qs.get("type", ["signup"])[0]

                # Step 2: Verify the token ourselves by calling GET /verify
                # (which returns a 303 with the auth tokens in the Location hash)
                verify_url = f"{sb_url}/auth/v1/verify?token={token}&type={vtype}&redirect_to={redirect}"
                vresp = await client.get(verify_url, follow_redirects=False)
                location = vresp.headers.get("location", "")
                if location and "#" in location:
                    # Extract the hash fragment (access_token, refresh_token, etc.)
                    fragment = location.split("#", 1)[1]
                    # Build a callback URL for our frontend with the real tokens
                    callback_url = f"{settings.frontend_url}/auth/callback#{fragment}"
                    return {"sent": False, "link": callback_url}
                # Fallback: return the generated token directly
                return {"sent": False, "link": magic_url}
            return {"sent": False, "link": magic_url}

        # Step 3: Fallback to sending an email via the /otp endpoint
        otp_payload = {
            "email": target,
            "create_user": True,
            "data": {"email_redirect_to": redirect},
        }
        otp_resp = await client.post(f"{sb_url}/auth/v1/otp", json=otp_payload, headers=headers)
        if otp_resp.is_success:
            return {"sent": True, "link": None}

        # Both methods failed
        if otp_resp.status_code == 429 or "rate" in otp_resp.text.lower():
            raise HTTPException(
                status_code=429,
                detail="Email rate limit reached. Try again later.",
            )

        raise HTTPException(status_code=502, detail="Email service unavailable. Try again later.")
