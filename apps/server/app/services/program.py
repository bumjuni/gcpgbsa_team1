from fastapi import HTTPException, status

from crud.program import ProgramCrud
from models.program import Program, ProgramItem
from schemas.program import (
    ProgramCreate,
    ProgramItemCreate,
)


class ProgramService:
    def __init__(self, crud: ProgramCrud):
         self.crud = crud

    async def create_program(self, schema: ProgramCreate) -> Program:
        return await self.crud.create_program(
            program_data=schema.model_dump()
        )

    async def delete_program(self, program_id: int) -> Program:
        deleted_program = await self.crud.delete_program(
            program_id=program_id
        )
        if not deleted_program:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Program with ID {program_id} not found.",
            )
        return deleted_program

    async def create_program_item(self, schema: ProgramItemCreate) -> ProgramItem:
        return await self.crud.create_program_item(
            program_item_data=schema.model_dump()
        )

    async def delete_program_item(self, program_item_id: int) -> ProgramItem:
        deleted_item = await self.crud.delete_program_item(
            program_item_id=program_item_id
        )
        if not deleted_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ProgramItem with ID {program_item_id} not found.",
            )
        return deleted_item
