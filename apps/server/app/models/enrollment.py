from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base
from .student import Student


if TYPE_CHECKING:
    from .classroom import SwimClass

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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    deleted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    student: Mapped["Student"] = relationship("Student", back_populates="enrollments")
    swim_class: Mapped["SwimClass"] = relationship(
        "SwimClass", back_populates="enrollments"
    )
