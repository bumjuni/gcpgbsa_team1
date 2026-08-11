from datetime import datetime

from pydantic import BaseModel, Field
from .base import ORMBaseModel


class StudentCreate(BaseModel):
    student_id: int
    name: str = Field(..., max_length=50)
    phone: str = Field(..., max_length=20)
    birth_year: int
    memo: str
    created_at: datetime
