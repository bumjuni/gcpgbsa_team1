from datetime import datetime, date
from typing import Optional, List

from models.enums import ProgramPhaseEnum
from pydantic import BaseModel, Field
from .base import ORMBaseModel


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
