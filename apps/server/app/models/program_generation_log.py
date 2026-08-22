from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class ProgramGenerationLog(Base):
    """수업안(program) AI 생성 시도 1건당 1행. 성공/실패 여부와 관계없이 기록한다."""

    __tablename__ = "program_generation_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    instructor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("instructor.id"), nullable=False
    )
    class_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("swim_class.id"), nullable=True
    )
    program_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("program.id"), nullable=True
    )
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    prompt_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
