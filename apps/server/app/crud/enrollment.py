from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.classroom import Enrollment


class EnrollmentCrud:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db


    async def get_by_class_id(self, class_id: int) -> list[Enrollment]:
        """반별 활성 소속 목록 조회 (student 정보 함께 로드)"""
        result = await self.db.execute(
            select(Enrollment)
            .where(Enrollment.class_id == class_id, Enrollment.is_active == True)
            .options(selectinload(Enrollment.student))
            .order_by(Enrollment.created_at.asc())
        )
        return list(result.scalars().all())


    async def create(self, enrollment_data: dict) -> Enrollment:
        """새로운 수강 신청 생성"""
        enrollment = Enrollment(
            **enrollment_data,
            created_at=datetime.now(),
        )
        self.db.add(enrollment)
        await self.db.commit()
        await self.db.refresh(enrollment)

        return enrollment


    async def delete(self, enrollment_id: int) -> Optional[Enrollment]:
        """수강 정보 삭제 (soft delete)"""
        enrollment = await self.db.get(Enrollment, enrollment_id)
        if enrollment is None:
            return None

        enrollment.deleted_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(enrollment)

        return enrollment
