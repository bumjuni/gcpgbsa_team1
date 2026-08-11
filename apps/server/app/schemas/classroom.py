from datetime import datetime, time
from typing import Optional

from models.enums import AgeGroupEnum, LevelEnum
from pydantic import BaseModel, Field
from .base import ORMBaseModel


class SwimClassCreate(BaseModel):
    name: str = Field(..., max_length=100)
    capacity: int = Field(..., ge=1)
    student_count: int
    level: LevelEnum
    age_groups: list[AgeGroupEnum]
    goals: str = Field(..., max_length=200)
    goal_etc: Optional[str] = None
    start_time: time
    end_time: time
    days_of_week: str
    is_active: bool = True

class SwimClassResponse(ORMBaseModel):
    name: str
    student_count: int
    capacity: int
    level: LevelEnum
    age_groups: list[AgeGroupEnum]
    start_time: time  # time 타입 변경
    end_time: time
    days_of_week: str
    # is_active: bool = True # 추후 수업안 여부에 따라 수정

class SwimClassDetailResponse(SwimClassCreate, ORMBaseModel):
    id: int
    created_at: datetime
