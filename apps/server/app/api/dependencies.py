from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import async_session_factory
from services.classroom import ClassroomService


from services.classroom import ClassroomService

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
