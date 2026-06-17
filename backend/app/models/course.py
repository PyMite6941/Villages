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
    category: str  # domain key: 'math' | 'science' | 'tech' | ...
    subject: str
    difficulty: str = "beginner"
    estimated_hours: int = 1
    thumbnail_emoji: str = "📚"
    source: Optional[str] = None  # content attribution, e.g. "College Board AP"
    is_private: bool = False
    tags: list[str] = []  # granular filter tags, e.g. ["Math","AP","Calculus"]


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
    source: Optional[str] = None
    is_private: bool = False
    invite_code: Optional[str] = None
    tags: list[str] = []
    created_at: Optional[datetime] = None


class LessonCreate(BaseModel):
    title: str
    content: str
    order_index: int = 0
    duration_minutes: int = 15
    video_url: Optional[str] = None  # embeddable video (YouTube / Khan Academy)


class Lesson(BaseModel):
    id: str
    course_id: str
    title: str
    content: str
    order_index: int
    duration_minutes: int
    video_url: Optional[str] = None
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
    source: Optional[str] = None
    is_private: bool = False
    invite_code: Optional[str] = None
    tags: list[str] = []
    created_at: Optional[datetime] = None
    lessons: List[Lesson] = []
    office_hours: List["OfficeHour"] = []


class OfficeHour(BaseModel):
    id: str
    course_id: str
    day_of_week: int
    start_time: str
    end_time: str
    location: str = ""
    created_at: Optional[datetime] = None


class OfficeHourCreate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    location: str = ""


class JoinByCode(BaseModel):
    code: str
