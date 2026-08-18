from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field
from .base import ORMBaseModel


class EnrollmentCreate(BaseModel):
    class_id: int
    name: str = Field(..., max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    birth_year: Optional[int] = None
    memo: Optional[str] = None


class EnrollmentResponse(ORMBaseModel):
    id: int
    student_id: int
    class_id: int
    name: str
    birth_year: Optional[int] = None
    created_at: datetime
