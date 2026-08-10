from datetime import date, datetime, time
from typing import List, Optional

from models.classroom import Base
from models.classroom import AgeGroupEnum, LevelEnum, ProgramPhaseEnum, ProgramStatusEnum
from pydantic import BaseModel, ConfigDict, Field


class ORMBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------------------------
# SwimClass Schemas
# ----------------------------------------------------------------------
class SwimClassCreate(BaseModel):
    name: str = Field(..., max_length=100)
    capacity: int = Field(..., ge=1)
    level: LevelEnum
    age_groups: AgeGroupEnum
    goals: str = Field(..., max_length=200)
    goal_etc: Optional[str] = None
    duration_min: int = Field(..., ge=1)
    start_time: time  # time 타입 변경
    days_of_week: str
    status: bool = True

class SwimClassResponse(ORMBaseModel):
    name: str
    student_count: int
    capacity: int
    level: LevelEnum
    age_groups: AgeGroupEnum
    start_time: time  # time 타입 변경
    days_of_week: str
    status: bool = True # 추후 수업안 여부에 따라 수정

class SwimClassDetailResponse(SwimClassCreate, ORMBaseModel):
    id: int
    created_at: datetime


# ----------------------------------------------------------------------
# Student Schemas
# ----------------------------------------------------------------------
class StudentCreate(BaseModel):
    student_id: int
    name: str = Field(..., max_length=50)
    phone: str = Field(..., max_length=20)
    birth_year: int
    memo: str
    created_at: datetime


# ----------------------------------------------------------------------
# Enrollment Schemas
# ----------------------------------------------------------------------
class EnrollmentCreate(BaseModel):
    student_id: int
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

# ----------------------------------------------------------------------
# Program & ProgramItem Schemas
# ----------------------------------------------------------------------
class ProgramCreate(BaseModel):
    class_id: int
    date: date
    equipment: Optional[str] = Field(None, max_length=50)
    request: Optional[str] = Field(None, max_length=100)


class SessionSummary(BaseModel):
    total_time: int = Field(..., ge=1)
    total_distance_m: int = Field(..., ge=1)
    focus_point: str = Field(..., max_length=100)


class ProgramItem(BaseModel):
    title: str = Field(..., max_length=200)
    set: int = Field(..., ge=1)
    distance_m: int = Field(..., ge=1)
    duration_min: int = Field(..., ge=1)
    detail: str = Field(..., max_length=100)


class Program(BaseModel):
    warmup: List[ProgramItem] = Field(default_factory=list)
    main: List[ProgramItem] = Field(default_factory=list)
    cooldown: List[ProgramItem] = Field(default_factory=list)


class ProgramResponse(ProgramCreate, ORMBaseModel):
    id: int
    session_summary: SessionSummary
    program: Program
    created_at: datetime


class ProgramItemCreate(BaseModel):
    class_id: int
    phase: ProgramPhaseEnum
    title: str = Field(..., max_length=200)
    note: Optional[str] = Field(None, max_length=200)
    set_count: int = Field(..., ge=1)
    distance_m: int = Field(..., ge=0)
    is_checked: bool = False


class ProgramItemResponse(ProgramItemCreate, ORMBaseModel):
    id: int
    program_id: int
    created_at: datetime


# ----------------------------------------------------------------------
# Program Check Schemas
# ----------------------------------------------------------------------
class ProgramItemCheckUpdate(BaseModel):
    id: int = Field(..., description="ProgramItem ID")
    is_checked: bool = Field(..., description="체크 여부 (True: 완료, False: 미완료)")


class ProgramBatchCheckRequest(BaseModel):
    items: List[ProgramItemCheckUpdate] = Field(
        ...,
        min_length=1,
        description="업데이트할 프로그램 항목 체크리스트 목록",
    )


class ProgramBatchCheckResponse(BaseModel):
    """일괄 업데이트 결과 응답 DTO"""
    program_id: int
    updated_count: int
