from datetime import datetime, date
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from models.classroom import SwimClass, Program
from models.enums import ProgramStatusEnum


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

    async def get_next_program_status_map(
        self, class_ids: list[int]
    ) -> dict[int, ProgramStatusEnum]:
        """반별로 완료되지 않은 program row 중 date가 가장 이른 것 1개의 status.
        lazy 생성 원칙상 반당 미완료 row는 보통 1개뿐이지만,
        혹시 여러 개 있어도 가장 이른 날짜 것을 '다음 것'으로 취급."""
        if not class_ids:
            return {}

        subq = (
            select(
                Program.class_id,
                Program.status,
                func.row_number()
                .over(partition_by=Program.class_id, order_by=Program.date.asc())
                .label("rn"),
            )
            .where(
                Program.class_id.in_(class_ids),
                Program.status != ProgramStatusEnum.COMPLETED,
                Program.deleted_at.is_(None),
            )
            .subquery()
        )
        stmt = select(subq.c.class_id, subq.c.status).where(subq.c.rn == 1)
        result = await self.db.execute(stmt)
        return {row.class_id: row.status for row in result.all()}


    async def get_today_program_status_map(
        self, class_ids: list[int], today: date
    ) -> dict[int, ProgramStatusEnum]:
        if not class_ids:
            return {}
        now_time = datetime.now().time()

        stmt = select(Program.class_id, Program.status).where(
            Program.class_id.in_(class_ids),
            Program.date == today,
            Program.start_time >= now_time,
            Program.deleted_at.is_(None),
        )
        # stmt = select(Program.class_id, Program.status).where(
        #     Program.class_id.in_(class_ids),
        #     Program.date == today,
        #     Program.deleted_at.is_(None),
        # )
        result = await self.db.execute(stmt)
        return {row.class_id: row.status for row in result.all()}


    async def update_swim_class(
        self, swim_class_id: int, update_data: dict
    ) -> Optional[SwimClass]:
        stmt = select(SwimClass).where(
            SwimClass.id == swim_class_id,
            SwimClass.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        swim_class = result.scalar_one_or_none()
        if swim_class is None:
            return None

        for field, value in update_data.items():
            setattr(swim_class, field, value)

        await self.db.commit()
        await self.db.refresh(swim_class)
        return swim_class

    async def increment_student_count(self, class_id: int) -> SwimClass | None:
        stmt = (
            update(SwimClass)
            .where(SwimClass.id == class_id)
            .values(student_count=SwimClass.student_count + 1)
        )
        result = await self.db.execute(stmt)

        if result.rowcount == 0:
            return None

        # 같은 트랜잭션 내에서 갱신된 row를 다시 조회
        select_stmt = select(SwimClass).where(SwimClass.id == class_id)
        select_result = await self.db.execute(select_stmt)
        return select_result.scalar_one_or_none()
