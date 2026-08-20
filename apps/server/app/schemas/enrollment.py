from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field
from schemas.student import Student


class Enrollment(BaseModel):
    id: int
    student_id: int
    class_id: int
    memo: Optional[str] = Field(None, max_length=200)
    created_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EnrollmentCreate(Student):
    class_id: int
    memo: Optional[str] = None


class EnrollmentUpdate(BaseModel):
    """수강 신청 수정(memo 등) 요청 DTO"""
    memo: Optional[str] = Field(None, max_length=200)


class EnrollmentResponse(BaseModel):
    """enrollment 작업 시 student + enrollment 정보를 함께 반환"""
    student: Student
    enrollment: Enrollment
