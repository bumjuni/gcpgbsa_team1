from datetime import date, datetime_CAPI

from fastapi import APIRouter, Depends, status
from typing import Optional

from api.dependencies import get_program_service
from schemas.program import (
    ProgramConfirm,
    ProgramCreate,
    ProgramHistoryItem,
    ProgramResponse,
)
from services.program import ProgramService

router = APIRouter(prefix="/program", tags=["Program"])


@router.post(
    "/",
    response_model=ProgramResponse,
    status_code=status.HTTP_201_CREATED,
    summary="루틴 프로그램 생성",
)
async def create_program(
    schema: ProgramCreate,
    service: ProgramService = Depends(get_program_service),
) -> ProgramResponse:
    return await service.create_program(schema)


@router.delete(
    "/{program_id}",
    response_model=ProgramResponse,
    status_code=status.HTTP_200_OK,
    summary="루틴 프로그램 삭제(소프트)",
)
async def delete_program(
    program_id: int,
    service: ProgramService = Depends(get_program_service),
) -> ProgramResponse:
    return await service.delete_program(program_id)

@router.patch(
    "/{program_id}/confirm",
    response_model=ProgramResponse,
    status_code=status.HTTP_200_OK,
    summary="루틴 프로그램 확정",
)
async def confirm_program(
    program_id: int,
    schema: ProgramConfirm,
    service: ProgramService = Depends(get_program_service),
) -> ProgramResponse:
    return await service.confirm_program(program_id, schema)

@router.get(
    "/{swim_class_id}/programs/history",
    response_model=list[ProgramHistoryItem],
    status_code=status.HTTP_200_OK,
    summary="종료/확정된 수업(프로그램) 목록 조회",
)
async def get_program_history(
    swim_class_id: int,
    service: ProgramService = Depends(get_program_service),
) -> list[ProgramHistoryItem]:
    return await service.get_program_history(swim_class_id)

@router.get(
    "/{swim_class_id}/date/{date}",
    response_model=Optional[ProgramResponse],
    status_code=status.HTTP_200_OK,
    summary="특정 날짜 수업안 조회"
)
async def get_program_by_date(
    swim_class_id: int,
    date: date,
    service: ProgramService = Depends(get_program_service),
) -> ProgramResponse:
    return await service.get_program_by_date(swim_class_id, date)


# # @router.post(
# #     "/items",
# #     response_model=ProgramItemResponse,
# #     status_code=status.HTTP_201_CREATED,
# #     summary="프로그램 세부 아이템 생성",
# # )
# # async def create_program_item(
# #     schema: ProgramItemCreate,
# #     service: ProgramService = Depends(get_program_service),
# # ) -> ProgramItemResponse:
# #     return await service.create_program_item(schema)


# @router.delete(
#     "/items/{program_item_id}",
#     response_model=ProgramItemResponse,
#     status_code=status.HTTP_200_OK,
#     summary="프로그램 세부 아이템 삭제(소프트)",
# )
# async def delete_program_item(
#     program_item_id: int,
#     service: ProgramService = Depends(get_program_service),
# ) -> ProgramItemResponse:
#     return await service.delete_program_item(program_item_id)
