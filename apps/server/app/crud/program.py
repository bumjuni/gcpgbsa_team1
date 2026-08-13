from datetime import datetime, date
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

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
                select(Program).where(
                    Program.class_id == class_id,
                    Program.date == date,
                    Program.deleted_at.is_(None),
                )
            )
            return result.scalar_one_or_none()


    async def update_program(self, program_id: int, update_data: dict) -> Program:
        """기존 Program row의 필드를 갱신한다 (DRAFT 상태 재생성 시 사용)."""
        program = await self.db.get(Program, program_id)
        for key, value in update_data.items():
            setattr(program, key, value)
        program.updated_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(program)
        return program
