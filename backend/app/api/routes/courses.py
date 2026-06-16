import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.database import get_supabase
from app.models.course import (
    Course,
    CourseCreate,
    CourseWithLessons,
    Lesson,
    LessonCreate,
    TeacherVerification,
    TeacherVerificationCreate,
)

router = APIRouter(prefix="/courses", tags=["courses"])
teacher_router = APIRouter(prefix="/teacher", tags=["teacher"])


@router.get("", response_model=list[Course])
async def list_courses(category: str | None = None, subject: str | None = None):
    sb = get_supabase()
    q = sb.table("courses").select("*").eq("is_published", True)
    if category:
        q = q.eq("category", category)
    if subject:
        q = q.eq("subject", subject)
    result = q.order("created_at", desc=True).execute()
    return [Course(**r) for r in result.data]


@router.post("", response_model=Course)
async def create_course(data: CourseCreate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    profile_res = sb.table("profiles").select("display_name, is_verified_teacher").eq("id", user_id).execute()
    if not profile_res.data:
        raise HTTPException(status_code=404, detail="Profile not found — complete onboarding first")
    profile = profile_res.data[0]

    course = {
        "id": str(uuid.uuid4()),
        "title": data.title,
        "description": data.description,
        "category": data.category,
        "subject": data.subject,
        "teacher_id": user_id,
        "teacher_name": profile["display_name"],
        "teacher_is_verified": profile.get("is_verified_teacher", False),
        "difficulty": data.difficulty,
        "estimated_hours": data.estimated_hours,
        "thumbnail_emoji": data.thumbnail_emoji,
        "enrollment_count": 0,
        "is_published": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("courses").insert(course).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create course")
    return Course(**result.data[0])


@router.get("/{course_id}", response_model=CourseWithLessons)
async def get_course(course_id: str):
    sb = get_supabase()
    course_res = sb.table("courses").select("*").eq("id", course_id).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    lessons_res = sb.table("lessons").select("*").eq("course_id", course_id).order("order_index").execute()
    course = CourseWithLessons(**course_res.data[0])
    course.lessons = [Lesson(**lesson_data) for lesson_data in lessons_res.data]
    return course


@router.post("/{course_id}/enroll")
async def enroll_course(course_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    existing = (
        sb.table("course_enrollments")
        .select("*")
        .eq("user_id", user_id)
        .eq("course_id", course_id)
        .execute()
    )
    if existing.data:
        return {"enrolled": True, **existing.data[0]}

    enrollment = {
        "user_id": user_id,
        "course_id": course_id,
        "completed_lesson_ids": [],
        "enrolled_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("course_enrollments").insert(enrollment).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to enroll")

    course_res = sb.table("courses").select("enrollment_count").eq("id", course_id).execute()
    if course_res.data:
        new_count = course_res.data[0]["enrollment_count"] + 1
        sb.table("courses").update({"enrollment_count": new_count}).eq("id", course_id).execute()

    return {"enrolled": True, **result.data[0]}


@router.get("/{course_id}/enrollment")
async def get_enrollment(course_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = (
        sb.table("course_enrollments")
        .select("*")
        .eq("user_id", user_id)
        .eq("course_id", course_id)
        .execute()
    )
    if not result.data:
        return {"enrolled": False}
    return {"enrolled": True, **result.data[0]}


@router.post("/{course_id}/lessons/{lesson_id}/complete")
async def complete_lesson(course_id: str, lesson_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = (
        sb.table("course_enrollments")
        .select("*")
        .eq("user_id", user_id)
        .eq("course_id", course_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Not enrolled in this course")

    completed = result.data[0].get("completed_lesson_ids", [])
    if lesson_id not in completed:
        completed = completed + [lesson_id]
        sb.table("course_enrollments").update({"completed_lesson_ids": completed}).eq(
            "user_id", user_id
        ).eq("course_id", course_id).execute()

    return {"completed_lesson_ids": completed}


@router.post("/{course_id}/lessons", response_model=Lesson)
async def add_lesson(course_id: str, data: LessonCreate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    course_res = sb.table("courses").select("teacher_id").eq("id", course_id).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    if course_res.data[0]["teacher_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the course teacher can add lessons")

    lesson = {
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "title": data.title,
        "content": data.content,
        "order_index": data.order_index,
        "duration_minutes": data.duration_minutes,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("lessons").insert(lesson).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add lesson")
    return Lesson(**result.data[0])


# --- Village Scholar (verified teacher) endpoints ---

@teacher_router.post("/apply", response_model=TeacherVerification)
async def apply_teacher_verification(
    data: TeacherVerificationCreate,
    user_id: str = Depends(get_current_user),
):
    sb = get_supabase()
    existing = sb.table("teacher_verifications").select("*").eq("user_id", user_id).execute()
    if existing.data:
        return TeacherVerification(**existing.data[0])

    verification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "degree_title": data.degree_title,
        "institution": data.institution,
        "subject_area": data.subject_area,
        "status": "verified",
        "created_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("teacher_verifications").insert(verification).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit verification")

    profile_res = sb.table("profiles").select("teacher_subjects").eq("id", user_id).execute()
    current_subjects = profile_res.data[0].get("teacher_subjects", []) if profile_res.data else []
    if data.subject_area not in current_subjects:
        current_subjects = current_subjects + [data.subject_area]

    sb.table("profiles").update({
        "is_verified_teacher": True,
        "teacher_subjects": current_subjects,
    }).eq("id", user_id).execute()

    return TeacherVerification(**result.data[0])


@teacher_router.get("/verification")
async def get_teacher_verification(user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("teacher_verifications").select("*").eq("user_id", user_id).execute()
    if not result.data:
        return None
    return result.data[0]
