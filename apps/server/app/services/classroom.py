from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from crud import classroom as crud_classroom
from models.classroom import SwimClass
from schemas.classroom import (
    SwimClassCreate,
    SwimClassDetailResponse,
    SwimClassResponse,
)

class ClassroomService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_swim_class(self) -> list[SwimClassResponse]:
        swim_classes_orm = await crud_classroom.get_swim_classes(
            db=self.db
        )
        if not swim_classes_orm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SwimClasses not found.",
            )
        return [SwimClassResponse.model_validate(item) for item in swim_classes_orm]

    async def get_swim_class_detail(self, swim_class_id: int) -> SwimClassDetailResponse:
        swim_class_orm = await crud_classroom.get_swim_class_detail(
            db=self.db, swim_class_id=swim_class_id,
        )
        if not swim_class_orm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SwimClass with ID {swim_class_id} not found.",
            )
        return SwimClassResponse.model_validate(swim_class_orm)


    async def create_swim_class(self, schema: SwimClassCreate) -> SwimClass:
        return await crud_classroom.create_swim_class(
            db=self.db, class_data=schema.model_dump()
        )

    async def delete_swim_class(self, swim_class_id: int) -> SwimClass:
        deleted_class = await crud_classroom.delete_swim_class(
            db=self.db, swim_class_id=swim_class_id
        )
        if not deleted_class:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SwimClass with ID {swim_class_id} not found.",
            )
        return deleted_class
