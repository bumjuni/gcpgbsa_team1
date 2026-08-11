from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.classroom import SwimClass


class ClassroomCrud:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db


    async def get_classes(self) -> Optional[list[SwimClass]]:
            """
            클래스 목록 조회 (Soft Delete 된 데이터는 제외)
            """
            query = select(SwimClass).where(
                SwimClass.deleted_at.is_(None)
            )
            result = await self.db.execute(query)
            return result.scalars().all()


    async def get_class_detail(self, swim_class_id: int) -> Optional[SwimClass]:
            """
            단건 클래스 조회 (Soft Delete 된 데이터는 제외)
            """
            query = select(SwimClass).where(
                SwimClass.id == swim_class_id,
                SwimClass.deleted_at.is_(None)
            )
            result = await self.db.execute(query)
            return result.scalar_one_or_none()


    async def create(self, class_data: dict) -> SwimClass:
        """새로운 강습 생성"""
        swim_class = SwimClass(
            **class_data,
            created_at=datetime.now(),
        )
        self.db.add(swim_class)
        await self.db.commit()
        await self.db.refresh(swim_class)

        return swim_class


    async def delete(self, swim_class_id: int) -> Optional[SwimClass]:
        """강습 소프트 삭제"""
        swim_class = await self.db.get(SwimClass, swim_class_id)
        if swim_class is None:
            return None

        swim_class.deleted_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(swim_class)

        return swim_class
