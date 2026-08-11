from fastapi import HTTPException, status

from crud.classroom import ClassroomCrud
from models.classroom import SwimClass
from schemas.classroom import (
    SwimClassCreate,
    SwimClassDetailResponse,
    SwimClassResponse,
)

class ClassroomService:
    def __init__(self, crud: ClassroomCrud):
         self.crud = crud

    async def get_swim_class(self) -> list[SwimClassResponse]:
        swim_classes_orm = await self.crud.get_classes()

        if not swim_classes_orm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SwimClasses not found.",
            )
        return [SwimClassResponse.model_validate(item) for item in swim_classes_orm]

    async def get_swim_class_detail(self, swim_class_id: int) -> SwimClassDetailResponse:
        swim_class_orm = await self.crud.get_class_detail(
           swim_class_id=swim_class_id,
        )
        if not swim_class_orm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SwimClass with ID {swim_class_id} not found.",
            )
        return SwimClassResponse.model_validate(swim_class_orm)


    async def create_swim_class(self, schema: SwimClassCreate) -> SwimClass:
        return await self.crud.create(class_data=schema.model_dump())

    async def delete_swim_class(self, swim_class_id: int) -> SwimClass:
        deleted_class = await self.crud.delete(swim_class_id=swim_class_id)

        if not deleted_class:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SwimClass with ID {swim_class_id} not found.",
            )
        return deleted_class
