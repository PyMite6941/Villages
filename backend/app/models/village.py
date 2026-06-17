from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Village(BaseModel):
    id: str
    name: str
    description: str
    focus_area: str       # e.g. "SAT Math", "AP Biology", "College Apps"
    resources: list[str]  # study topics / materials
    max_members: int = 10
    member_count: int = 0
    is_active: bool = True
    is_private: bool = False
    invite_code: Optional[str] = None
    ai_moderation: bool = True
    created_by: str
    created_at: Optional[datetime] = None

class VillageSettingsUpdate(BaseModel):
    max_members: Optional[int] = None
    is_private: Optional[bool] = None
    ai_moderation: Optional[bool] = None

class VillageCreate(BaseModel):
    name: str
    description: str
    focus_area: str
    resources: list[str]
    max_members: int = 10
    is_private: bool = False

class VillageMember(BaseModel):
    user_id: str
    village_id: str
    role: str = "member"  # "member" | "elder" (AI facilitator proxy) | "chief"
    muted_until: Optional[datetime] = None
    joined_at: Optional[datetime] = None
