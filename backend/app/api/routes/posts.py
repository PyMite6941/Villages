import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.database import get_supabase
from app.models.post import Comment, CommentCreate, Post, PostCreate
from app.services.ai_service import moderate_content

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("")
async def list_posts(village_id: Optional[str] = None, limit: int = 20, offset: int = 0):
    sb = get_supabase()
    # NOTE: posts.author_id is a free-text column (allows the synthetic
    # "village-elder-ai" author), so there is no FK to profiles and PostgREST
    # cannot embed it. author_name is denormalized onto the row instead.
    query = (
        sb.table("posts")
        .select("*")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    if village_id:
        query = query.eq("village_id", village_id)
    else:
        query = query.is_("village_id", "null")
    return query.execute().data


@router.post("", response_model=Post)
async def create_post(data: PostCreate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    mod = await moderate_content(data.content)
    if not mod.get("safe", True):
        raise HTTPException(status_code=400, detail=f"Content flagged: {mod.get('reason')}")
    profile = sb.table("profiles").select("display_name").eq("id", user_id).execute()
    author_name = profile.data[0]["display_name"] if profile.data else "Unknown"
    post = {
        "id": str(uuid.uuid4()),
        "content": data.content,
        "author_id": user_id,
        "author_name": author_name,
        "village_id": data.village_id,
        "is_ai_generated": False,
        "upvotes": 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("posts").insert(post).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create post")
    return Post(**result.data[0])


@router.post("/{post_id}/upvote")
async def upvote_post(post_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    post = sb.table("posts").select("upvotes").eq("id", post_id).execute()
    if not post.data:
        raise HTTPException(status_code=404, detail="Post not found")
    new_count = post.data[0]["upvotes"] + 1
    sb.table("posts").update({"upvotes": new_count}).eq("id", post_id).execute()
    return {"upvotes": new_count}


@router.get("/{post_id}/comments")
async def get_comments(post_id: str):
    sb = get_supabase()
    return sb.table("comments").select("*").eq("post_id", post_id).order("created_at").execute().data


@router.post("/{post_id}/comments", response_model=Comment)
async def add_comment(post_id: str, data: CommentCreate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    mod = await moderate_content(data.content)
    if not mod.get("safe", True):
        raise HTTPException(status_code=400, detail=f"Content flagged: {mod.get('reason')}")
    profile = sb.table("profiles").select("display_name").eq("id", user_id).execute()
    author_name = profile.data[0]["display_name"] if profile.data else "Unknown"
    comment = {
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "content": data.content,
        "author_id": user_id,
        "author_name": author_name,
        "is_ai_generated": False,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("comments").insert(comment).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add comment")
    return Comment(**result.data[0])
