from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import async_session_factory
from services.classroom import ClassroomService


# async def get_db() -> AsyncGenerator[AsyncSession, None]:
    # async with async_session_factory() as session:
    #     yield session


# def get_classroom_service(
#     db: AsyncSession = Depends(get_db),
# ) -> ClassroomService:
#     return ClassroomService(db=db)

from core.database import FakeAsyncSession
from services.classroom import ClassroomService

# 메모리 저장소 사용
async def get_db() -> AsyncGenerator[FakeAsyncSession, None]:
    session = FakeAsyncSession()
    try:
        yield session
    finally:
        await session.close()


def get_classroom_service(
    db: FakeAsyncSession = Depends(get_db),
) -> ClassroomService:
    return ClassroomService(db=db)
