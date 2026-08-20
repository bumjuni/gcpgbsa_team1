from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.instructor import Instructor


class InstructorCrud:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_email(self, email: str) -> Optional[Instructor]:
        query = select(Instructor).where(
            Instructor.email == email,
            Instructor.deleted_at.is_(None),
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> Optional[Instructor]:
        query = select(Instructor).where(
            Instructor.phone == phone,
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
        email: str,
        password_hash: str,
        name: str,
        phone: str,
        terms_agreed: bool,
        privacy_agreed: bool,
        age_over_14: bool,
        marketing_agreed: bool,
    ) -> Instructor:
        instructor = Instructor(
            email=email,
            password_hash=password_hash,
            name=name,
            phone=phone,
            terms_agreed=terms_agreed,
            privacy_agreed=privacy_agreed,
            age_over_14=age_over_14,
            marketing_agreed=marketing_agreed,
            created_at=datetime.now(),
        )
        self.db.add(instructor)
        await self.db.commit()
        await self.db.refresh(instructor)
        return instructor
