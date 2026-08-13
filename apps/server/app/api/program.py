from fastapi import APIRouter, Depends, status

from api.dependencies import get_program_service
from schemas.program import (
    ProgramCreate,
    ProgramResponse,
    ProgramItemCreate,
    ProgramItemResponse
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


@router.post(
    "/items",
    response_model=ProgramItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="프로그램 세부 아이템 생성",
)
async def create_program_item(
    schema: ProgramItemCreate,
    service: ProgramService = Depends(get_program_service),
) -> ProgramItemResponse:
    return await service.create_program_item(schema)


@router.delete(
    "/items/{program_item_id}",
    response_model=ProgramItemResponse,
    status_code=status.HTTP_200_OK,
    summary="프로그램 세부 아이템 삭제(소프트)",
)
async def delete_program_item(
    program_item_id: int,
    service: ProgramService = Depends(get_program_service),
) -> ProgramItemResponse:
    return await service.delete_program_item(program_item_id)
