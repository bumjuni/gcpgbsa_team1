from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.instructor import Instructor


class InstructorCrud:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_kakao_id(self, kakao_id: int) -> Optional[Instructor]:
        query = select(Instructor).where(
            Instructor.kakao_id == kakao_id,
            Instructor.deleted_at.is_(None),
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_id(self, instructor_id: int) -> Optional[Instructor]:
        query = select(Instructor).where(
            Instructor.id == instructor_id,
            Instructor.deleted_at.is_(None),
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create(
        self,
        kakao_id: int,
        email: Optional[str],
        nickname: str,
        profile_image_url: Optional[str],
    ) -> Instructor:
        instructor = Instructor(
            kakao_id=kakao_id,
            email=email,
            nickname=nickname,
            profile_image_url=profile_image_url,
            created_at=datetime.now(),
        )
        self.db.add(instructor)
        await self.db.commit()
        await self.db.refresh(instructor)
        return instructor

    async def update_profile(
        self,
        instructor: Instructor,
        email: Optional[str],
        nickname: str,
        profile_image_url: Optional[str],
    ) -> Instructor:
        instructor.email = email
        instructor.nickname = nickname
        instructor.profile_image_url = profile_image_url
        await self.db.commit()
        await self.db.refresh(instructor)
        return instructor
