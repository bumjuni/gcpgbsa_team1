from datetime import datetime, date
from typing import Optional

from models.enums import ProgramStatusEnum
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.program import Program, ProgramItem


class ProgramCrud:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db


    async def create_program(self, program_data: dict) -> Program:
        """새로운 프로그램 생성"""
        program = Program(
            **program_data,
            created_at=datetime.now(),
        )
        self.db.add(program)
        await self.db.commit()
        await self.db.refresh(program)

        return program


    async def delete_program(self, program_id: int) -> Optional[Program]:
        """프로그램 소프트 삭제"""
        program = await self.db.get(Program, program_id)
        if program is None:
            return None

        program.deleted_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(program)

        return program


    async def create_program_item(self, program_item_data: dict) -> ProgramItem:
        """새로운 프로그램 아이템 생성"""
        program_item = ProgramItem(
            **program_item_data,
            created_at=datetime.now(),
        )
        self.db.add(program_item)
        await self.db.commit()
        await self.db.refresh(program_item)

        return program_item


    async def delete_program_items(self, program_id: int) -> None:
        """재생성 전 기존 ProgramItem을 전부 삭제한다 (하드 삭제 - 재생성 직전 시점 데이터라 이력 보존 불필요하다는 전제)."""
        await self.db.execute(
            delete(ProgramItem).where(ProgramItem.program_id == program_id)
        )
        await self.db.commit()


    async def get_by_class_and_date(
            self, class_id: int, date: date
        ) -> Optional[Program]:
            """class_id + date로 기존 Program row를 조회한다 (uq_program_class_date 유니크 제약과 짝)."""
            result = await self.db.execute(
                select(Program)
                .options(
                    selectinload(Program.program_items)
                )  # program_items를 함께 가져옴
                .where(
                    Program.class_id == class_id,
                    Program.date == date,
                    Program.deleted_at.is_(None),
                )
            )
            return result.scalar_one_or_none()


    async def update_program_item(self, item_id: int, update_data: dict) -> ProgramItem:
        item = await self.db.get(ProgramItem, item_id)
        for key, value in update_data.items():
            setattr(item, key, value)
        item.updated_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def get_program_items(self, program_id: int) -> list[ProgramItem]:
        result = await self.db.execute(
            select(ProgramItem).where(
                ProgramItem.program_id == program_id,
                ProgramItem.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def delete_program_items_by_ids(self, item_ids: list[int]) -> None:
        await self.db.execute(
            delete(ProgramItem).where(ProgramItem.id.in_(item_ids))
        )
        await self.db.commit()

    async def confirm_program(self, program_id, status) -> Program:
        item = await self.db.get(Program, program_id)
        item.status = status
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def get_non_draft_programs_by_class(
        self, class_id: int
    ) -> list[Program]:
        stmt = (
            select(Program)
            .where(
                Program.class_id == class_id,
                Program.status != ProgramStatusEnum.DRAFT,
                Program.deleted_at.is_(None),
            )
            .order_by(Program.date.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()


    async def check_program_item(self, program_item_id: int) -> Optional[ProgramItem]:
        """프로그램 아이템 체크 상태 토글"""
        item = await self.db.get(ProgramItem, program_item_id)
        if not item:
            return None
        item.is_checked = not item.is_checked
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def add_feedback(
        self, program_id: int, rating: int, memo: Optional[str]
    ) -> Optional[Program]:
        """수업안 피드백(별점/메모) 저장"""
        program = await self.db.get(Program, program_id)
        if program is None:
            return None

        program.feedback_rating = rating
        program.feedback_memo = memo
        await self.db.commit()
        await self.db.refresh(program)
        return program

    async def update_program(
        self, program_id: int, update_data: dict
    ) -> Optional[Program]:
        """프로그램 정보를 업데이트하고 갱신된 객체를 반환합니다."""
        # 1. Update 수행
        stmt = (
            update(Program)
            .where(Program.id == program_id)
            .values(**update_data)
            .execution_options(synchronize_session="fetch")
        )
        await self.db.execute(stmt)
        await self.db.commit()

        # 2. 갱신된 객체 조회 후 반환
        result = await self.db.execute(
            select(Program).where(Program.id == program_id)
        )
        return result.scalar_one_or_none()
