from datetime import datetime
from typing import Optional

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


    async def delete_program_item(self, program_item_id: int) -> Optional[ProgramItem]:
        """프로그램 아이템 소프트 삭제"""
        program_item = await self.db.get(ProgramItem, program_item_id)
        if program_item is None:
            return None

        program_item.deleted_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(program_item)

        return program_item
