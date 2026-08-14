from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator
from .base import ORMBaseModel


class StudentCreate(BaseModel):
    name: str = Field(..., max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    birth_year: Optional[int] = None


class StudentResponse(ORMBaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    birth_year: Optional[int] = None
    created_at: datetime

    @field_validator("birth_year", mode="before")
    @classmethod
    def _extract_year(cls, v):
        # birth_year 컬럼이 실제로는 Date 타입이라 DB에서 읽으면 date 객체로 온다 - int(연도)로 변환
        return v.year if hasattr(v, "year") else v


class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    birth_year: Optional[int] = None
