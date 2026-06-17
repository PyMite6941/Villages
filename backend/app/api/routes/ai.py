import time as _time
import uuid
from collections import deque
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.auth import get_current_user
from app.database import get_supabase
from app.services.ai_service import (
    explain_topic,
    generate_college_advisor_response,
    generate_course_study_tips,
    generate_discussion_prompt,
    generate_essay_feedback,
    generate_gpa_plan,
    generate_learning_path,
    generate_lesson_quiz,
    generate_socratic_response,
    generate_study_challenge,
    generate_study_plan,
    generate_study_planner,
    moderate_topic_content,
)

# ── Per-user rate limit for AI endpoints (cost-abuse protection) ───────────────
# In-memory sliding window. Note: serverless instances are ephemeral, so this is a
# best-effort first layer; a Supabase/Redis-backed limit would be stricter.
_AI_CALLS: dict[str, deque] = {}
_AI_WINDOW = 60.0  # seconds
_AI_MAX = 30       # max AI calls per user per window


async def ai_rate_limit(user_id: str = Depends(get_current_user)) -> str:
    now = _time.time()
    dq = _AI_CALLS.setdefault(user_id, deque())
    while dq and now - dq[0] > _AI_WINDOW:
        dq.popleft()
    if len(dq) >= _AI_MAX:
        raise HTTPException(status_code=429, detail="Too many AI requests — please wait a minute.")
    dq.append(now)
    return user_id


# Router-level dependency: every /ai route is authenticated AND rate-limited.
router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(ai_rate_limit)])


# ── Village Elder ──────────────────────────────────────────────────────────────

@router.post("/village-elder/{village_id}/prompt")
async def village_elder_prompt(village_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    village = sb.table("villages").select("*").eq("id", village_id).execute()
    if not village.data:
        raise HTTPException(status_code=404, detail="Village not found")
    v = village.data[0]
    prompt = await generate_discussion_prompt(
        village_name=v["name"],
        focus_area=v["focus_area"],
        resources=v.get("resources", []),
    )
    post_id = str(uuid.uuid4())
    sb.table("posts").insert({
        "id": post_id,
        "content": prompt,
        "author_id": "village-elder-ai",
        "author_name": "Village Elder",
        "village_id": village_id,
        "is_ai_generated": True,
        "upvotes": 0,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    return {"prompt": prompt, "post_id": post_id}


@router.post("/village-elder/{village_id}/challenge")
async def generate_challenge(
    village_id: str,
    subject: str,
    difficulty: str = "medium",
    _user_id: str = Depends(get_current_user),
):
    sb = get_supabase()
    village = sb.table("villages").select("*").eq("id", village_id).execute()
    if not village.data:
        raise HTTPException(status_code=404, detail="Village not found")
    v = village.data[0]
    challenge_data = await generate_study_challenge(
        village_name=v["name"],
        subject=subject,
        difficulty=difficulty,
        member_count=v["member_count"],
    )
    challenge_id = str(uuid.uuid4())
    sb.table("challenges").insert({
        "id": challenge_id,
        "village_id": village_id,
        "title": challenge_data.get("title", "Study Challenge"),
        "description": challenge_data.get("description", ""),
        "subject": subject,
        "difficulty": difficulty,
        "is_collaborative": True,
        "generated_by_ai": True,
        "completed_by": [],
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    return {**challenge_data, "challenge_id": challenge_id}


@router.post("/topic/explain")
async def topic_explain(
    topic: str = Query(..., description="The topic to explain"),
    village_id: Optional[str] = Query(None, description="Optional village context"),
    _user_id: str = Depends(get_current_user),
):
    sb = get_supabase()
    village_name = ""
    focus_area = ""
    audience_levels = ["students", "adult learners"]

    if village_id:
        village = sb.table("villages").select("*").eq("id", village_id).execute()
        if village.data:
            v = village.data[0]
            village_name = v["name"]
            focus_area = v["focus_area"]
            members = sb.table("village_members").select("user_id").eq("village_id", village_id).execute()
            member_ids = [m["user_id"] for m in members.data]
            if member_ids:
                profiles = sb.table("profiles").select("academic_level").in_("id", member_ids).execute()
                levels = set(p.get("academic_level", "") for p in profiles.data if p.get("academic_level"))
                if levels:
                    audience_levels = list(levels)

    explanation = await explain_topic(
        topic=topic,
        village_name=village_name,
        focus_area=focus_area,
        audience_levels=audience_levels,
    )

    guardrail = await moderate_topic_content(topic, explanation.get("plain_language", ""))

    if not guardrail.get("safe", True):
        explanation["_guardrail_warnings"] = guardrail.get("concerns", [])
        explanation["_ethical_notes"] = guardrail.get("ethical_notes", [])

    explanation["_audience"] = audience_levels
    explanation["_guardrail"] = guardrail

    if village_id:
        explanation_id = str(uuid.uuid4())
        sb.table("topic_explanations").insert({
            "id": explanation_id,
            "village_id": village_id,
            "topic": topic,
            "plain_language": explanation.get("plain_language", ""),
            "checklist": explanation.get("checklist", []),
            "next_steps": explanation.get("next_steps", []),
            "generated_by_ai": True,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()
        explanation["explanation_id"] = explanation_id

    return explanation


@router.post("/village/{village_id}/learning-path")
async def village_learning_path(
    village_id: str,
    _user_id: str = Depends(get_current_user),
):
    sb = get_supabase()
    village = sb.table("villages").select("*").eq("id", village_id).execute()
    if not village.data:
        raise HTTPException(status_code=404, detail="Village not found")
    v = village.data[0]

    members = sb.table("village_members").select("user_id").eq("village_id", village_id).execute()
    member_ids = [m["user_id"] for m in members.data]
    interests = []
    if member_ids:
        profiles = sb.table("profiles").select("interests").in_("id", member_ids).execute()
        for p in profiles.data:
            interests.extend(p.get("interests", []))

    path_data = await generate_learning_path(
        village_name=v["name"],
        focus_area=v["focus_area"],
        resources=v.get("resources", []),
        member_count=v["member_count"],
        interests=list(set(interests)),
    )

    path_id = str(uuid.uuid4())
    sb.table("learning_paths").insert({
        "id": path_id,
        "village_id": village_id,
        "title": path_data.get("title", f"Learning path for {v['name']}"),
        "description": path_data.get("description", ""),
        "steps": path_data.get("steps", []),
        "generated_by_ai": True,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()

    return {**path_data, "learning_path_id": path_id}


@router.get("/topic/explanations/{village_id}")
async def list_topic_explanations(village_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("topic_explanations").select("*").eq("village_id", village_id).order("created_at", desc=True).execute()
    return result.data


@router.get("/village/{village_id}/learning-paths")
async def list_learning_paths(village_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("learning_paths").select("*").eq("village_id", village_id).order("created_at", desc=True).execute()
    return result.data


@router.post("/courses/{course_id}/study-tips")
async def course_study_tips(course_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    course_res = sb.table("courses").select("*").eq("id", course_id).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    c = course_res.data[0]
    lessons_res = sb.table("lessons").select("id").eq("course_id", course_id).execute()
    tips = await generate_course_study_tips(
        course_title=c["title"],
        subject=c["subject"],
        category=c["category"],
        difficulty=c["difficulty"],
        lesson_count=len(lessons_res.data),
    )
    return {"tips": tips}


@router.post("/courses/{course_id}/lessons/{lesson_id}/quiz")
async def lesson_quiz(course_id: str, lesson_id: str, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    course_res = sb.table("courses").select("title, difficulty").eq("id", course_id).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    lesson_res = sb.table("lessons").select("title, content").eq("id", lesson_id).eq("course_id", course_id).execute()
    if not lesson_res.data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    c = course_res.data[0]
    lesson = lesson_res.data[0]
    quiz = await generate_lesson_quiz(
        course_title=c["title"],
        lesson_title=lesson["title"],
        lesson_content=lesson["content"],
        difficulty=c.get("difficulty", "beginner"),
    )
    return quiz


# ── Access gating for Study Hub features ───────────────────────────────────────
_SCHOOL_LEVELS = frozenset({
    "6th Grade", "7th Grade", "8th Grade",
    "9th Grade", "10th Grade", "11th Grade", "12th Grade",
    "College Freshman", "College Sophomore", "College Junior", "College Senior",
    "Graduate Student", "Doctoral Student",
    "Law School", "Medical School", "Trade School", "Vocational Program",
})

_COLLEGE_PREP_LEVELS = frozenset({"11th Grade", "12th Grade"})


async def _require_school_level(user_id: str, sb):
    """Raise 403 if the user's academic_level is not a recognised school level."""
    prof = sb.table("profiles").select("academic_level").eq("id", user_id).maybe_single().execute()
    level = (prof.data or {}).get("academic_level", "")
    if level not in _SCHOOL_LEVELS:
        raise HTTPException(
            status_code=403,
            detail="This feature is available for students (Grade 6–University). Update your academic level in your profile.",
        )


async def _require_college_prep(user_id: str, sb):
    """Raise 403 unless user is 11th/12th grade or has college-prep study_tags."""
    prof = sb.table("profiles").select("academic_level, study_tags").eq("id", user_id).maybe_single().execute()
    data = prof.data or {}
    level = data.get("academic_level", "")
    tags = data.get("study_tags") or []
    if level not in _COLLEGE_PREP_LEVELS and not any(
        t.lower() in ("college", "university", "high_schooler") for t in tags
    ):
        raise HTTPException(
            status_code=403,
            detail='Enable "High Schooler" in your profile or set grade to 11/12 to access College Prep.',
        )


# ── Study Hub ──────────────────────────────────────────────────────────────────

class StudyBuddyRequest(BaseModel):
    subject: str
    message: str
    history: list[dict] = []


class EssayCoachRequest(BaseModel):
    essay: str
    essay_prompt: str = ""
    student_context: str = ""


class StudyPlanRequest(BaseModel):
    goals: list[str]
    strengths: list[str]
    weaknesses: list[str]
    academic_level: str
    weekly_hours: int = 10


@router.post("/study-buddy")
async def study_buddy(data: StudyBuddyRequest, _user_id: str = Depends(get_current_user)):
    response = await generate_socratic_response(data.subject, data.message, data.history)
    return {"response": response}


@router.post("/essay-coach")
async def essay_coach(data: EssayCoachRequest, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    await _require_school_level(_user_id, sb)
    if len(data.essay.strip()) < 50:
        raise HTTPException(status_code=400, detail="Essay must be at least 50 characters")
    feedback = await generate_essay_feedback(data.essay, data.essay_prompt, data.student_context)
    return feedback


@router.post("/study-plan")
async def study_plan(data: StudyPlanRequest, _user_id: str = Depends(get_current_user)):
    plan = await generate_study_plan(
        goals=data.goals,
        strengths=data.strengths,
        weaknesses=data.weaknesses,
        academic_level=data.academic_level,
        weekly_hours=data.weekly_hours,
    )
    return {"plan": plan}


class StudyPlannerRequest(BaseModel):
    goals: list[str] = []
    strengths: list[str] = []
    weaknesses: list[str] = []
    academic_level: str = ""
    subject: str = ""
    target: str = ""
    target_date: str = ""
    weekly_hours: int = 10


@router.post("/study-planner")
async def study_planner(data: StudyPlannerRequest, _user_id: str = Depends(get_current_user)):
    plan = await generate_study_planner(
        goals=data.goals,
        strengths=data.strengths,
        weaknesses=data.weaknesses,
        academic_level=data.academic_level,
        subject=data.subject,
        target=data.target,
        target_date=data.target_date,
        weekly_hours=data.weekly_hours,
    )
    return plan


class GpaCourse(BaseModel):
    name: str
    current_grade: str = ""
    credits: float = 1.0
    is_favorite: bool = False


class GpaPlannerRequest(BaseModel):
    courses: list[GpaCourse] = []
    target_gpa: float = 3.0
    current_gpa: float | None = None
    academic_level: str = ""
    weekly_hours: int = 10


@router.post("/gpa-planner")
async def gpa_planner(data: GpaPlannerRequest, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    await _require_school_level(_user_id, sb)
    plan = await generate_gpa_plan(
        courses=[c.model_dump() for c in data.courses],
        target_gpa=data.target_gpa,
        current_gpa=data.current_gpa,
        academic_level=data.academic_level,
        weekly_hours=data.weekly_hours,
    )
    return plan


class CollegeAdvisorRequest(BaseModel):
    message: str
    gpa: str = ""
    test_scores: str = ""
    interests: list[str] = []
    preferences: str = ""
    history: list[dict] = []


@router.post("/college-advisor")
async def college_advisor(data: CollegeAdvisorRequest, _user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    await _require_college_prep(_user_id, sb)
    response = await generate_college_advisor_response(
        message=data.message,
        gpa=data.gpa,
        test_scores=data.test_scores,
        interests=data.interests,
        preferences=data.preferences,
        history=data.history,
    )
    return {"response": response}
