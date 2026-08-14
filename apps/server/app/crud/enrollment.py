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


    async def get_by_student_and_class(
        self, student_id: int, class_id: int
    ) -> Optional[Enrollment]:
        """특정 학생의 특정 반 소속 조회 (활성인 것만)"""
        result = await self.db.execute(
            select(Enrollment).where(
                Enrollment.student_id == student_id,
                Enrollment.class_id == class_id,
                Enrollment.is_active == True,
            )
        )
        return result.scalars().first()

    async def update(self, enrollment_id: int, update_data: dict) -> Optional[Enrollment]:
        """소속 정보 수정 (예: memo)"""
        enrollment = await self.db.get(Enrollment, enrollment_id)
        if enrollment is None:
            return None
        for key, value in update_data.items():
            setattr(enrollment, key, value)
        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment

    async def deactivate(self, enrollment_id: int) -> Optional[Enrollment]:
        """반 소속 비활성화 (소프트 삭제 - enrollment 테이블엔 deleted_at이 없어 is_active를 False로 전환)"""
        enrollment = await self.db.get(Enrollment, enrollment_id)
        if enrollment is None:
            return None

        enrollment.is_active = False
        await self.db.commit()
        await self.db.refresh(enrollment)

        return enrollment
