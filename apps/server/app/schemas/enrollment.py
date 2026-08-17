from datetime import datetime
from typing import Optional

from schemas.student import Student
from pydantic import BaseModel, Field


class Enrollment(BaseModel):
    id: int
    student_id: int
    class_id: int
    memo: Optional[str] = Field(..., max_length=200)
    created_at: datetime
    deleted_at: Optional[datetime]

    class Config:
        from_attributes = True


class EnrollmentCreate(Student):
    class_id: int
    memo: Optional[str] = None


class EnrollmentResponse(BaseModel):
    """enrollment 생성 시 student + enrollment 정보를 함께 반환"""
    student: Student
    enrollment: Enrollment
