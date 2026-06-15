from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database import get_supabase

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> str:
    sb = get_supabase()
    try:
        user = sb.auth.get_user(credentials.credentials)
        user_id: str | None = user.user.id
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user")
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")
