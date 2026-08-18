from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from models.enums import GenderEnum
from sqlalchemy import (
    Date,
    DateTime,
    Integer,
    String,
    Enum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

if TYPE_CHECKING:
    from .enrollment import Enrollment

class Student(Base):
    __tablename__ = "student"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    gender: Mapped[Optional[GenderEnum]] = mapped_column(
        Enum(GenderEnum, name="gender_enum"),
        nullable=True,
        server_default=None,
    )
    birth_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    enrollments: Mapped[List["Enrollment"]] = relationship(
        "Enrollment", back_populates="student"
    )
