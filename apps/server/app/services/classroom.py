from fastapi import HTTPException, status
from datetime import datetime
from zoneinfo import ZoneInfo

from crud.classroom import ClassroomCrud
from models.classroom import SwimClass
from schemas.classroom import (
    SwimClassCreate,
    SwimClassDetailResponse,
    SwimClassResponse,
    SwimClassUpdate,
)

KST = ZoneInfo("Asia/Seoul")

class ClassroomService:
    def __init__(self, crud: ClassroomCrud):
         self.crud = crud

    # async def get_swim_class(self) -> list[SwimClassResponse]:
    #     swim_classes_orm = await self.crud.get_classes()

    #     if not swim_classes_orm:
    #         raise HTTPException(
    #             status_code=status.HTTP_404_NOT_FOUND,
    #             detail="SwimClasses not found.",
    #         )
    #     return [SwimClassResponse.model_validate(item) for item in swim_classes_orm]

    async def get_swim_class(self) -> list[SwimClassResponse]:
        swim_classes_orm = await self.crud.get_classes()
        if not swim_classes_orm:
            raise HTTPException(status_code=404, detail="SwimClasses not found.")

        today = datetime.now(KST).date()
        class_ids = [sc.id for sc in swim_classes_orm]

        today_map = await self.crud.get_today_program_status_map(class_ids, today)
        next_map = await self.crud.get_next_program_status_map(class_ids)

        return [
            SwimClassResponse.model_validate(sc).model_copy(
                update={
                    "today_program_status": today_map.get(sc.id),
                    "next_program_status": next_map.get(sc.id),
                }
            )
            for sc in swim_classes_orm
        ]


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


    async def update_swim_class(
        self, swim_class_id: int, schema: SwimClassUpdate
    ) -> SwimClassResponse:
        update_data = schema.model_dump(exclude_unset=True)  # 온 필드만 반영
        updated_class = await self.crud.update_swim_class(swim_class_id, update_data)

        if not updated_class:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SwimClass with ID {swim_class_id} not found.",
            )

        return SwimClassResponse.model_validate(updated_class)

    async def increment_student_count(self, swim_class_id: int) -> None:
        updated_class = await self.crud.increment_student_count(swim_class_id)

        if not updated_class:
            raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"SwimClass with ID {swim_class_id} not found.",
                )

        return SwimClassResponse.model_validate(updated_class)

    async def decrement_student_count(self, swim_class_id: int) -> SwimClassResponse:
            updated_class = await self.crud.decrement_student_count(swim_class_id)

            if not updated_class:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"SwimClass with ID {swim_class_id} not found.",
                )

            return SwimClassResponse.model_validate(updated_class)
