from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import async_session_factory
from services.classroom import ClassroomService
from services.enrollment import EnrollmentService
from services.program import ProgramService
from services.student import StudentService


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


def get_classroom_service(
    db: AsyncSession = Depends(get_db),
) -> ClassroomService:
    return ClassroomService(db=db)

def get_enrollment_service(
    db: AsyncSession = Depends(get_db),
) -> EnrollmentService:
    return EnrollmentService(db=db)

def get_program_service(
    db: AsyncSession = Depends(get_db),
) -> ProgramService:
    return ProgramService(db=db)

def get_student_service(
    db: AsyncSession = Depends(get_db),
) -> StudentService:
    return StudentService(db=db)
