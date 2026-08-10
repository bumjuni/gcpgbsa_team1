from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from crud import classroom as crud_classroom
from models.classroom import Program, ProgramItem
from schemas.classroom import (
    ProgramCreate,
    ProgramItemCreate,
)


class ProgramService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_program(self, schema: ProgramCreate) -> Program:
        return await crud_classroom.create_program(
            db=self.db, program_data=schema.model_dump()
        )

    async def delete_program(self, program_id: int) -> Program:
        deleted_program = await crud_classroom.delete_program(
            db=self.db, program_id=program_id
        )
        if not deleted_program:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Program with ID {program_id} not found.",
            )
        return deleted_program

    async def create_program_item(self, schema: ProgramItemCreate) -> ProgramItem:
        return await crud_classroom.create_program_item(
            db=self.db, program_item_data=schema.model_dump()
        )

    async def delete_program_item(self, program_item_id: int) -> ProgramItem:
        deleted_item = await crud_classroom.delete_program_item(
            db=self.db, program_item_id=program_item_id
        )
        if not deleted_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ProgramItem with ID {program_item_id} not found.",
            )
        return deleted_item
