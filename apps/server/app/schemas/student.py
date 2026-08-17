from datetime import datetime
from typing import Optional

from models.enums import GenderEnum
from pydantic import BaseModel, Field


class Student(BaseModel):
    name: str = Field(..., max_length=50)
    phone: Optional[str] = Field(..., max_length=20)
    gender: Optional[GenderEnum]
    birth_year: Optional[int]

    class Config:
        from_attributes = True


class StudentResponse(Student):
    student_id: int
    memo: Optional[int]
    created_at: datetime
