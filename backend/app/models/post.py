from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Post(BaseModel):
    id: str
    content: str
    author_id: str
    author_name: str
    village_id: Optional[str] = None  # None = global forum
    is_ai_generated: bool = False      # True for Village Elder posts
    upvotes: int = 0
    created_at: Optional[datetime] = None

class PostCreate(BaseModel):
    content: str
    village_id: Optional[str] = None

class Comment(BaseModel):
    id: str
    post_id: str
    content: str
    author_id: str
    author_name: str
    is_ai_generated: bool = False
    created_at: Optional[datetime] = None

class CommentCreate(BaseModel):
    post_id: str
    content: str
