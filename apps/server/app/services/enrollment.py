from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from crud import classroom as crud_classroom
from models.classroom import Enrollment
from schemas.classroom import (
    EnrollmentCreate,
)

class EnrollmentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_enrollment(self, schema: EnrollmentCreate) -> Enrollment:
        return await crud_classroom.create_enrollment(
            db=self.db, enrollment_data=schema.model_dump()
        )
