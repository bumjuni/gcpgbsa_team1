import enum
from datetime import date, datetime, time
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


# ----------------------------------------------------------------------
# Enums
# ----------------------------------------------------------------------
class LevelEnum(str, enum.Enum):
    BEGINNER = "BEGINNER"           # 신규
    ELEMENTARY = "ELEMENTARY"       # 초급
    INTERMEDIATE = "INTERMEDIATE"   # 중급
    ADVANCED = "ADVANCED"           # 상급
    MASTER = "MASTER"               # 마스터


class AgeGroupEnum(str, enum.Enum):
    PRESCHOOL = "PRESCHOOL"         # 유아
    ELEMENTARY = "ELEMENTARY"       # 초등
    TEEN = "TEEN"                   # 청소년
    ADULT = "ADULT"                 # 성인
    SENIOR = "SENIOR"               # 시니어


class ProgramStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"                 # 미확정
    SCHEDULED = "SCHEDULED"         # 확정
    COMPLETED = "COMPLETED"         # 완료


class ProgramPhaseEnum(str, enum.Enum):
    WARM_UP = "WARM_UP"             # 웜업
    MAIN = "MAIN"                   # 메인
    COOL_DOWN = "COOL_DOWN"         # 쿨다운


# ----------------------------------------------------------------------
# ORM Models
# ----------------------------------------------------------------------
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


class Student(Base):
    __tablename__ = "student"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    birth_year: Mapped[Optional[int]] = mapped_column(Date, nullable=True)  # Date 타입 생년월일로 변경
    # health_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    enrollments: Mapped[List["Enrollment"]] = relationship(
        "Enrollment", back_populates="student"
    )


class Program(Base):
    __tablename__ = "program"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    class_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("swim_class.id"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[ProgramStatusEnum] = mapped_column(
        Enum(ProgramStatusEnum, name="program_status_enum"), nullable=False
    )
    duration_min: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    equipment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    swim_class: Mapped["SwimClass"] = relationship("SwimClass", back_populates="programs")
    program_items: Mapped[List["ProgramItem"]] = relationship(
        "ProgramItem", back_populates="program"
    )


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
    is_checked: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    program: Mapped["Program"] = relationship("Program", back_populates="program_items")


class Enrollment(Base):
    __tablename__ = "enrollment"
    __table_args__ = (
        UniqueConstraint("student_id", "class_id", name="uq_enrollment_student_class"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student.id"), nullable=False
    )
    class_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("swim_class.id"), nullable=False
    )
    memo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    student: Mapped["Student"] = relationship("Student", back_populates="enrollments")
    swim_class: Mapped["SwimClass"] = relationship(
        "SwimClass", back_populates="enrollments"
    )
