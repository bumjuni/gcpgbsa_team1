from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class WeeklyReportResponse(BaseModel):
    week_start: date
    week_end: date
    week_distance_m: int
    week_duration_min: int
    week_calorie_kcal: int
    calorie_caption: str = "또래 평균 체중 기준 추정치예요"
    session_focus_list: List[str] = Field(default_factory=list)
    apply_tip: Optional[str] = None
    key_points: Optional[List[str]] = None
    rating: Optional[int] = None

    class Config:
        from_attributes = True
