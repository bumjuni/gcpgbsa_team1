from datetime import datetime
from typing import Optional

from models.enums import GenderEnum
from pydantic import BaseModel, Field


class Student(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    gender: Optional[GenderEnum] = None
    birth_year: Optional[int] = None

    class Config:
        from_attributes = True


class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    gender: Optional[GenderEnum] = None
    birth_year: Optional[int] = None


class StudentResponse(Student):
    student_id: int
    memo: Optional[int]
    created_at: datetime
