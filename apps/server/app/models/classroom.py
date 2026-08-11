from datetime import datetime, time
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Integer,
    SmallInteger,
    String,
    Text,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base
from .enrollment import Enrollment
from .program import Program
from .enums import LevelEnum, AgeGroupEnum


class SwimClass(Base):
    __tablename__ = "swim_class"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    level: Mapped[LevelEnum] = mapped_column(
        Enum(LevelEnum, name="level_enum"), nullable=False
    )
    age_groups: Mapped[AgeGroupEnum] = mapped_column(
        Enum(AgeGroupEnum, name="age_group_enum"), nullable=False
    )
    goals: Mapped[str] = mapped_column(String(200), nullable=False)
    goal_etc: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_min: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)  # Time 타입으로 변경
    days_of_week: Mapped[str] = mapped_column(SmallInteger, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    programs: Mapped[List["Program"]] = relationship(
        "Program", back_populates="swim_class"
    )
    enrollments: Mapped[List["Enrollment"]] = relationship(
        "Enrollment", back_populates="swim_class"
    )
