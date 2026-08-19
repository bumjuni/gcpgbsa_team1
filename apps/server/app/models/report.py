from datetime import date, datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base
from .enums import WeeklyReportStatusEnum

if TYPE_CHECKING:
    from .classroom import SwimClass
    from .student import Student


class WeeklyReport(Base):
    __tablename__ = "weekly_report"
    __table_args__ = (
        UniqueConstraint("class_id", "week_start", name="uq_weekly_report_class_week"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    class_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("swim_class.id"), nullable=False
    )
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    week_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[WeeklyReportStatusEnum] = mapped_column(
        Enum(WeeklyReportStatusEnum, name="weekly_report_status_enum"),
        nullable=False,
        server_default=WeeklyReportStatusEnum.PENDING.value,  # 기본값: PENDING
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    swim_class: Mapped["SwimClass"] = relationship(
        "SwimClass", back_populates="weekly_reports"
    )
    items: Mapped[List["WeeklyReportItem"]] = relationship(
        "WeeklyReportItem", back_populates="weekly_report"
    )


class WeeklyReportItem(Base):
    __tablename__ = "weekly_report_item"
    __table_args__ = (
        UniqueConstraint(
            "weekly_report_id", "student_id", name="uq_weekly_report_item_report_student"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    weekly_report_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("weekly_report.id"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student.id"), nullable=False
    )
    week_distance_m: Mapped[int] = mapped_column(Integer, nullable=False)
    week_duration_min: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    week_calorie_kcal: Mapped[int] = mapped_column(Integer, nullable=False)
    cumulative_distance_m: Mapped[int] = mapped_column(Integer, nullable=False)
    focus_text: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    apply_tip: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_points: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    coach_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    badge_text: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    next_goal: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_included: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="1"
    )
    share_token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    weekly_report: Mapped["WeeklyReport"] = relationship(
        "WeeklyReport", back_populates="items"
    )
    student: Mapped["Student"] = relationship(
        "Student", back_populates="weekly_report_items"
    )
    feedback: Mapped[Optional["ReportFeedback"]] = relationship(
        "ReportFeedback", back_populates="weekly_report_item", uselist=False
    )


class ReportFeedback(Base):
    __tablename__ = "report_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    weekly_report_item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("weekly_report_item.id"), nullable=False, unique=True
    )
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    weekly_report_item: Mapped["WeeklyReportItem"] = relationship(
        "WeeklyReportItem", back_populates="feedback"
    )
