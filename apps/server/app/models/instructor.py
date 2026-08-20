from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class Instructor(Base):
    __tablename__ = "instructor"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kakao_id: Mapped[int] = mapped_column(
        BigInteger, unique=True, index=True, nullable=False
    )
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)
    profile_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
