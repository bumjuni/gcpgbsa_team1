from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from models.classroom import Program, ProgramItem


class ProgramCrud:
    async def create_program(db: AsyncSession, program_data: dict) -> Program:
        """새로운 프로그램 생성"""
        program = Program(
            **program_data,
            created_at=datetime.now(),
        )
        db.add(program)
        await db.commit()
        await db.refresh(program)

        return program


    async def delete_program(db: AsyncSession, program_id: int) -> Optional[Program]:
        """프로그램 소프트 삭제"""
        program = await db.get(Program, program_id)
        if program is None:
            return None

        program.deleted_at = datetime.now()
        await db.commit()
        await db.refresh(program)

        return program

    async def create_program_item(db: AsyncSession, program_item_data: dict) -> ProgramItem:
        """새로운 프로그램 아이템 생성"""
        program_item = ProgramItem(
            **program_item_data,
            created_at=datetime.now(),
        )
        db.add(program_item)
        await db.commit()
        await db.refresh(program_item)

        return program_item


    async def delete_program_item(db: AsyncSession, program_item_id: int) -> Optional[ProgramItem]:
        """프로그램 아이템 소프트 삭제"""
        program_item = await db.get(ProgramItem, program_item_id)
        if program_item is None:
            return None

        program_item.deleted_at = datetime.now()
        await db.commit()
        await db.refresh(program_item)

        return program_item
