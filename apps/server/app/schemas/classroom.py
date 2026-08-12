from enum import Enum
from datetime import datetime, time
from typing import Optional

from models.enums import AgeGroupEnum, LevelEnum, ProgramStatusEnum
from pydantic import BaseModel, Field
from .base import ORMBaseModel


class SwimClassCreate(BaseModel):
    name: str = Field(..., max_length=100)
    capacity: int = Field(..., ge=1)
    # student_count: int
    level: LevelEnum
    age_groups: AgeGroupEnum
    goals: str = Field(..., max_length=200)
    goal_etc: Optional[str] = None
    start_time: time
    end_time: time
    days_of_week: str
    is_active: bool = True

# schemas/classroom.py
class SwimClassResponse(ORMBaseModel):
    id: int
    name: str
    student_count: Optional[int] = None
    capacity: int
    level: LevelEnum
    age_groups: AgeGroupEnum
    start_time: time
    end_time: time
    days_of_week: str
    today_program_status: Optional[ProgramStatusEnum] = None
    next_program_status: Optional[ProgramStatusEnum] = None

class SwimClassDetailResponse(SwimClassCreate, ORMBaseModel):
    id: int
    created_at: datetime
