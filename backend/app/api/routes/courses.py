import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.database import get_supabase
from app.models.course import (
    Course,
    CourseCreate,
    CourseWithLessons,
    JoinByCode,
    Lesson,
    LessonCreate,
    OfficeHour,
    OfficeHourCreate,
    TeacherVerification,
    TeacherVerificationCreate,
)

router = APIRouter(prefix="/courses", tags=["courses"])
teacher_router = APIRouter(prefix="/teacher", tags=["teacher"])


@router.get("", response_model=list[Course])
async def list_courses(category: str | None = None, subject: str | None = None, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    # Show public courses + private courses the user is enrolled in or teaches
    q = sb.table("courses").select("*").eq("is_published", True)
    if category:
        q = q.eq("category", category)
    if subject:
        q = q.eq("subject", subject)
    result = q.order("created_at", desc=True).execute()

    courses = []
    for r in result.data:
        if not r.get("is_private"):
            courses.append(Course(**r))
        else:
            # Check if user is enrolled or is the teacher
            is_teacher = r.get("teacher_id") == user_id
            is_enrolled = False
            if not is_teacher:
                enroll_check = sb.table("course_enrollments").select("user_id").eq("user_id", user_id).eq("course_id", r["id"]).execute()
                is_enrolled = bool(enroll_check.data)
            if is_teacher or is_enrolled:
                courses.append(Course(**r))
    return courses


@router.post("", response_model=Course)
async def create_course(data: CourseCreate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    profile_res = sb.table("profiles").select("display_name, is_verified_teacher").eq("id", user_id).execute()
    if not profile_res.data:
        raise HTTPException(status_code=404, detail="Profile not found — complete onboarding first")
    profile = profile_res.data[0]

    invite_code = None
    if data.is_private:
        invite_code = str(uuid.uuid4())[:8].upper()

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
        "source": data.source,
        "is_private": data.is_private,
        "invite_code": invite_code,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("courses").insert(course).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create course")
    return Course(**result.data[0])


@router.get("/{course_id}", response_model=CourseWithLessons)
async def get_course(course_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    course_res = sb.table("courses").select("*").eq("id", course_id).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    course_data = course_res.data[0]

    # Check access for private courses
    if course_data.get("is_private"):
        is_teacher = course_data.get("teacher_id") == user_id
        is_enrolled = False
        if not is_teacher:
            enroll_check = sb.table("course_enrollments").select("user_id").eq("user_id", user_id).eq("course_id", course_id).execute()
            is_enrolled = bool(enroll_check.data)
        if not is_teacher and not is_enrolled:
            raise HTTPException(status_code=403, detail="This is a private course")

    lessons_res = sb.table("lessons").select("*").eq("course_id", course_id).order("order_index").execute()
    office_hours_res = sb.table("course_office_hours").select("*").eq("course_id", course_id).order("day_of_week").execute()
    course = CourseWithLessons(**course_data)
    course.lessons = [Lesson(**lesson_data) for lesson_data in lessons_res.data]
    course.office_hours = [OfficeHour(**oh) for oh in office_hours_res.data]
    return course


@router.post("/{course_id}/enroll")
async def enroll_course(course_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()

    # Check if private course requires invite code
    course_res_check = sb.table("courses").select("is_private, invite_code").eq("id", course_id).execute()
    if course_res_check.data and course_res_check.data[0].get("is_private"):
        raise HTTPException(status_code=400, detail="Private courses require an invite code to join")

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


@router.post("/join-by-code")
async def join_course_by_code(data: JoinByCode, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    course_res = sb.table("courses").select("*").eq("invite_code", data.code.upper()).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    course = course_res.data[0]

    existing = sb.table("course_enrollments").select("*").eq("user_id", user_id).eq("course_id", course["id"]).execute()
    if existing.data:
        return {"enrolled": True, "course_id": course["id"], "message": f"Already enrolled in '{course['title']}'"}

    enrollment = {
        "user_id": user_id,
        "course_id": course["id"],
        "completed_lesson_ids": [],
        "enrolled_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("course_enrollments").insert(enrollment).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to enroll")

    new_count = course["enrollment_count"] + 1
    sb.table("courses").update({"enrollment_count": new_count}).eq("id", course["id"]).execute()

    return {"enrolled": True, "course_id": course["id"], "message": f"Joined '{course['title']}'!"}


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
        "video_url": data.video_url,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("lessons").insert(lesson).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add lesson")
    return Lesson(**result.data[0])


# --- Office Hours ---

@router.get("/{course_id}/office-hours", response_model=list[OfficeHour])
async def list_office_hours(course_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    course_res = sb.table("courses").select("teacher_id").eq("id", course_id).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    result = sb.table("course_office_hours").select("*").eq("course_id", course_id).order("day_of_week").execute()
    return [OfficeHour(**oh) for oh in result.data]


@router.post("/{course_id}/office-hours", response_model=OfficeHour)
async def add_office_hours(course_id: str, data: OfficeHourCreate, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    course_res = sb.table("courses").select("teacher_id").eq("id", course_id).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    if course_res.data[0]["teacher_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the course teacher can set office hours")

    oh = {
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "day_of_week": data.day_of_week,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "location": data.location,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("course_office_hours").insert(oh).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add office hours")
    return OfficeHour(**result.data[0])


@router.delete("/{course_id}/office-hours/{oh_id}")
async def delete_office_hours(course_id: str, oh_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    course_res = sb.table("courses").select("teacher_id").eq("id", course_id).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    if course_res.data[0]["teacher_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the course teacher can delete office hours")
    sb.table("course_office_hours").delete().eq("id", oh_id).execute()
    return {"deleted": True}


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
