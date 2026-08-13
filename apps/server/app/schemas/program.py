from datetime import date, datetime
from typing import List, Optional

from models.enums import ProgramStatusEnum
from pydantic import BaseModel, Field


class ProgramCreate(BaseModel):
    class_id: int
    date: date  # 세션 날짜: 프론트엔드가 계산해서 보낸다 (B 확정)
    equipment: Optional[str] = Field(None, max_length=50)
    # 04-1 요구사항: 요청사항 최대 200자. 기존 100은 스펙과 불일치하여 200으로 수정.
    request: Optional[str] = Field(None, max_length=200)


class SessionSummary(BaseModel):
    total_min: int = Field(..., ge=1)  # LLM 실제 응답 키가 total_time_m이 아니라 total_min
    total_distance_m: int = Field(..., ge=1)
    # focus_point: Optional[str] = Field(..., max_length=100)


class ProgramItem(BaseModel):
    id: Optional[int] = None
    title: str = Field(..., max_length=200)
    set: int = Field(..., ge=1)
    distance_m: int = Field(..., ge=1)
    duration_min: int = Field(..., ge=1)  # LLM의 duration_time -> duration_min으로 매핑
    detail: str = Field(..., max_length=100)

    class Config:
        from_attributes = True



class Program(BaseModel):
    pre_set: List[ProgramItem] = Field(default_factory=list)
    main_set: List[ProgramItem] = Field(default_factory=list)
    post_set: List[ProgramItem] = Field(default_factory=list)

class ProgramConfirm(BaseModel):
    status: ProgramStatusEnum
    program: Program

class ProgramResponse(ProgramCreate):
    id: int
    session_summary: SessionSummary
    program: Program
    created_at: datetime

    class Config:
        from_attributes = True


class ProgramHistoryItem(BaseModel):
    program_id: int
    status: ProgramStatusEnum
    date: date

    class Config:
        from_attributes = True
