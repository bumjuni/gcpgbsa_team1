from datetime import date, datetime_CAPI

from fastapi import APIRouter, Depends, status
from typing import Optional

from api.dependencies import get_program_service, get_current_instructor
from models.instructor import Instructor
from schemas.program import (
    ProgramConfirm,
    ProgramCreate,
    ProgramHistoryItem,
    ProgramResponse,
    ProgramFeedbackCreate
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
    instructor: Instructor = Depends(get_current_instructor),
) -> ProgramResponse:
    return await service.create_program(schema, instructor.id)


# @router.delete(
#     "/{program_id}",
#     response_model=ProgramResponse,
#     status_code=status.HTTP_200_OK,
#     summary="루틴 프로그램 삭제(소프트)",
# )
# async def delete_program(
#     program_id: int,
#     service: ProgramService = Depends(get_program_service),
# ) -> ProgramResponse:
#     return await service.delete_program(program_id)

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
    instructor: Instructor = Depends(get_current_instructor),
) -> ProgramResponse:
    return await service.confirm_program(program_id, schema, instructor.id)


@router.patch(
    "/{program_id}/complete",
    response_model=ProgramResponse,
    status_code=status.HTTP_200_OK,
    summary="루틴 프로그램 확정",
)
async def complete_program(
    program_id: int,
    schema: ProgramConfirm,
    service: ProgramService = Depends(get_program_service),
    instructor: Instructor = Depends(get_current_instructor),
) -> ProgramResponse:
    return await service.complete_program(program_id, schema, instructor.id)


@router.get(
    "/{swim_class_id}/history",
    response_model=list[ProgramHistoryItem],
    status_code=status.HTTP_200_OK,
    summary="종료/확정된 수업(프로그램) 목록 조회",
)
async def get_program_history(
    swim_class_id: int,
    service: ProgramService = Depends(get_program_service),
    instructor: Instructor = Depends(get_current_instructor),
) -> list[ProgramHistoryItem]:
    return await service.get_program_history(swim_class_id, instructor.id)

@router.get(
    "/{swim_class_id}/{date}",
    response_model=Optional[ProgramResponse],
    status_code=status.HTTP_200_OK,
    summary="특정 날짜 수업안 조회"
)
async def get_program_by_date(
    swim_class_id: int,
    date: date,
    service: ProgramService = Depends(get_program_service),
    instructor: Instructor = Depends(get_current_instructor),
) -> ProgramResponse:
    return await service.get_program_by_date(swim_class_id, date, instructor.id)


@router.patch(
    "/{program_item_id}/check",
    response_model=Optional[int],
    status_code=status.HTTP_200_OK,
    summary="특정 프로그램 아이템 체크",
)
async def check_program_item(
    program_item_id: int,
    service: ProgramService = Depends(get_program_service),
    instructor: Instructor = Depends(get_current_instructor),
) -> int:
    return await service.check_program_item(program_item_id, instructor.id)

@router.post(
    "/{program_id}/feedback",
    status_code=status.HTTP_201_CREATED,
    summary="수업안 피드백(별점/메모) 등록",
)
async def submit_program_feedback(
    program_id: int,
    schema: ProgramFeedbackCreate,
    service: ProgramService = Depends(get_program_service),
    instructor: Instructor = Depends(get_current_instructor),
):
    await service.submit_feedback(program_id, schema, instructor.id)
    return {"program_id": program_id}
