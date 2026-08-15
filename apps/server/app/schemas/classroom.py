from enum import Enum
from datetime import datetime, time
from typing import Optional

from models.enums import AgeGroupEnum, LevelEnum, ProgramStatusEnum
from pydantic import BaseModel, Field
from .base import ORMBaseModel


class SwimClassCreate(BaseModel):
    name: str = Field(..., max_length=100)
    level: LevelEnum
    age_group: AgeGroupEnum      # AgeGroupEnum
    goals: str = Field(..., min=1)
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
    level: LevelEnum
    age_group: AgeGroupEnum
    start_time: time
    end_time: time
    goals: str
    goal_etc: Optional[str] = None
    days_of_week: str
    today_program_status: Optional[ProgramStatusEnum] = None
    next_program_status: Optional[ProgramStatusEnum] = None

class SwimClassDetailResponse(SwimClassCreate, ORMBaseModel):
    id: int
    created_at: datetime

class SwimClassUpdate(BaseModel):
    name: Optional[str] = None
    days_of_week: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    age_group: Optional[AgeGroupEnum] = None
    level: Optional[LevelEnum] = None
    goals: Optional[str] = None
    goal_etc: Optional[str] = None
