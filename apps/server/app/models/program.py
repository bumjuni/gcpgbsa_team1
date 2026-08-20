from datetime import date, datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    UniqueConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base
from .enums import ProgramPhaseEnum, ProgramStatusEnum

if TYPE_CHECKING:
    from .classroom import SwimClass


class Program(Base):
    __tablename__ = "program"
    __table_args__ = (
        UniqueConstraint("class_id", "date", name="uq_program_class_date"),
        Index("ix_program_class_id_date", "class_id", "date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    class_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("swim_class.id"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[ProgramStatusEnum] = mapped_column(
        Enum(ProgramStatusEnum, name="program_status_enum"),
        nullable=False,
        server_default=ProgramStatusEnum.DRAFT.value,  # 기본값: DRAFT
    )
    duration_min: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    total_distance_m: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    equipment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    feedback_rating: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    feedback_memo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    swim_class: Mapped["SwimClass"] = relationship("SwimClass", back_populates="programs")
    program_items: Mapped[List["ProgramItem"]] = relationship(
        "ProgramItem", back_populates="program"
    )

    @property
    def pre_set(self):
        return [
            item
            for item in self.program_items
            if item.phase == ProgramPhaseEnum.PRE_SET and item.deleted_at is None
        ]

    @property
    def main_set(self):
        return [
            item
            for item in self.program_items
            if item.phase == ProgramPhaseEnum.MAIN_SET and item.deleted_at is None
        ]

    @property
    def post_set(self):
        return [
            item
            for item in self.program_items
            if item.phase == ProgramPhaseEnum.POST_SET and item.deleted_at is None
        ]


class ProgramItem(Base):
    __tablename__ = "program_item"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    program_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("program.id"), nullable=False
    )
    phase: Mapped[ProgramPhaseEnum] = mapped_column(
        Enum(ProgramPhaseEnum, name="program_phase_enum"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    detail: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    set: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    distance_m: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_min: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_checked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    program: Mapped["Program"] = relationship("Program", back_populates="program_items")
