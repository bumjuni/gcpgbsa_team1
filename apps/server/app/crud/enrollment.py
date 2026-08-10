from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from models.classroom import Enrollment


class EnrollmentCrud:
    async def create_enrollment(db: AsyncSession, enrollment_data: dict) -> Enrollment:
        """새로운 수강 신청 생성"""
        enrollment = Enrollment(
            **enrollment_data,
            created_at=datetime.now(),
        )
        db.add(enrollment)
        await db.commit()
        await db.refresh(enrollment)

        return enrollment


    async def delete_enrollment(db: AsyncSession, enrollment_id: int) -> Optional[Enrollment]:
        """수강 정보 삭제 (soft delete)"""
        enrollment = await db.get(Enrollment, enrollment_id)
        if enrollment is None:
            return None

        enrollment.deleted_at = datetime.now()
        await db.commit()
        await db.refresh(enrollment)

        return enrollment
