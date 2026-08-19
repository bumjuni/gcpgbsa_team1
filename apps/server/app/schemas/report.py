from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class SessionFocusItem(BaseModel):
    date: date
    note: str


class WeeklyReportResponse(BaseModel):
    week_start: date
    week_end: date
    week_distance_m: int
    week_duration_min: int
    week_calorie_kcal: int
    calorie_caption: str = "또래 평균 체중 기준 추정치예요"
    cumulative_distance_m: int
    session_focus_list: List[SessionFocusItem] = Field(default_factory=list)
    apply_tip: Optional[str] = None
    key_points: Optional[List[str]] = None
    rating: Optional[int] = None

    class Config:
        from_attributes = True


class RatingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)


class RatingResponse(BaseModel):
    rating: int
