from fastapi import APIRouter, Depends, status

from api.dependencies import get_classroom_service
from schemas.classroom import (
    SwimClassCreate,
    SwimClassDetailResponse,
    SwimClassResponse,
    SwimClassUpdate,
)
from services.classroom import ClassroomService

router = APIRouter(prefix="/classroom", tags=["Classroom"])

@router.get(
    "/",
    response_model=list[SwimClassResponse],
    status_code=status.HTTP_200_OK,
    summary="강습 클래스 목록 조회",
)
async def get_swim_classes(
    service: ClassroomService = Depends(get_classroom_service),
) -> list[SwimClassResponse]:
    return await service.get_swim_class()


@router.get(
    "/{swim_class_id}",
    response_model=list[SwimClassResponse],
    status_code=status.HTTP_200_OK,
    summary="단일 강습 클래스 상세정보 조회",
)
async def get_swim_class_detail(
    swim_class_id: int,
    service: ClassroomService = Depends(get_classroom_service),
) -> SwimClassDetailResponse:
    return await service.get_swim_class_detail(swim_class_id)


@router.post(
    "/",
    response_model=SwimClassDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="강습 클래스 생성",
)
async def create_swim_class(
    schema: SwimClassCreate,
    service: ClassroomService = Depends(get_classroom_service),
) -> SwimClassDetailResponse:
    return await service.create_swim_class(schema)

@router.delete(
    "/{swim_class_id}",
    status_code=status.HTTP_200_OK,
    summary="강습 클래스 삭제(소프트)",
)
async def delete_swim_class(
    swim_class_id: int,
    service: ClassroomService = Depends(get_classroom_service)):
    deleted_class = await service.delete_swim_class(swim_class_id)
    return {"id": deleted_class.id}

@router.patch(
    "/{swim_class_id}",
    response_model=SwimClassResponse,
    status_code=status.HTTP_200_OK,
    summary="강습 클래스 정보 수정",
)
async def update_swim_class(
    swim_class_id: int,
    schema: SwimClassUpdate,
    service: ClassroomService = Depends(get_classroom_service),
) -> SwimClassResponse:
    return await service.update_swim_class(swim_class_id, schema)
