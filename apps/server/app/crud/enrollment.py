from datetime import datetime, timezone
from typing import Optional, List, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.enrollment import Enrollment  # 실제 models 위치에 맞게 수정
from schemas.enrollment import EnrollmentUpdate


class EnrollmentCrud:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, enrollment_id: int) -> Optional[Enrollment]:
        """ID로 삭제되지 않은 수강 정보 단건 조회 (student 관계 포함)"""
        stmt = (
            select(Enrollment)
            .options(selectinload(Enrollment.student))
            .where(
                Enrollment.id == enrollment_id,
                Enrollment.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_class_id(self, class_id: int) -> Sequence[Enrollment]:
        """클래스 ID 기준 삭제되지 않은 수강 목록 조회 (student 관계 포함)"""
        stmt = (
            select(Enrollment)
            .options(selectinload(Enrollment.student))
            .where(
                Enrollment.class_id == class_id,
                Enrollment.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create(self, enrollment_data: dict) -> Enrollment:
        """새로운 수강 신청 생성"""
        enrollment = Enrollment(
            **enrollment_data,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(enrollment)
        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment

    async def update(
        self, enrollment: Enrollment, schema: EnrollmentUpdate
    ) -> Enrollment:
        """수강 정보 수정 (memo 등)"""
        update_data = schema.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(enrollment, key, value)

        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment

    async def delete(self, enrollment_id: int) -> Optional[Enrollment]:
        """수강 정보 삭제 (Soft Delete)"""
        enrollment = await self.get_by_id(enrollment_id)
        if enrollment is None:
            return None

        enrollment.deleted_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment
