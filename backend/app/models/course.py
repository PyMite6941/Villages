from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TeacherVerificationCreate(BaseModel):
    degree_title: str
    institution: str
    subject_area: str


class TeacherVerification(BaseModel):
    id: str
    user_id: str
    degree_title: str
    institution: str
    subject_area: str
    status: str
    created_at: Optional[datetime] = None


class CourseCreate(BaseModel):
    title: str
    description: str
    category: str  # 'school' | 'hobby'
    subject: str
    difficulty: str = "beginner"
    estimated_hours: int = 1
    thumbnail_emoji: str = "📚"


class Course(BaseModel):
    id: str
    title: str
    description: str
    category: str
    subject: str
    teacher_id: Optional[str] = None
    teacher_name: str
    teacher_is_verified: bool
    difficulty: str
    estimated_hours: int
    thumbnail_emoji: str
    enrollment_count: int
    is_published: bool
    created_at: Optional[datetime] = None


class LessonCreate(BaseModel):
    title: str
    content: str
    order_index: int = 0
    duration_minutes: int = 15


class Lesson(BaseModel):
    id: str
    course_id: str
    title: str
    content: str
    order_index: int
    duration_minutes: int
    created_at: Optional[datetime] = None


class CourseEnrollment(BaseModel):
    user_id: str
    course_id: str
    completed_lesson_ids: List[str]
    enrolled_at: Optional[datetime] = None


class CourseWithLessons(BaseModel):
    id: str
    title: str
    description: str
    category: str
    subject: str
    teacher_id: Optional[str] = None
    teacher_name: str
    teacher_is_verified: bool
    difficulty: str
    estimated_hours: int
    thumbnail_emoji: str
    enrollment_count: int
    is_published: bool
    created_at: Optional[datetime] = None
    lessons: List[Lesson] = []
