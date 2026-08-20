from typing import List
from fastapi import APIRouter, Depends, status

from api.dependencies import get_enrollment_service
from schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentUpdate,
    EnrollmentResponse,
)
from services.enrollment import EnrollmentService

router = APIRouter(prefix="/enrollment", tags=["Enrollment"])


@router.post(
    "/",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="수강 신청 등록",
)
async def create_enrollment(
    schema: EnrollmentCreate,
    service: EnrollmentService = Depends(get_enrollment_service),
) -> EnrollmentResponse:
    return await service.create_enrollment(schema)


@router.delete(
    "/{enrollment_id}",
    status_code=status.HTTP_200_OK,
    summary="수강 신청 취소/삭제",
)
async def delete_enrollment(
    enrollment_id: int,
    service: EnrollmentService = Depends(get_enrollment_service),
):
    return await service.delete_enrollment(enrollment_id)


@router.patch(
    "/{enrollment_id}",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_200_OK,
    summary="수강 신청 정보 수정",
)
async def update_enrollment(
    enrollment_id: int,
    schema: EnrollmentUpdate,
    service: EnrollmentService = Depends(get_enrollment_service),
) -> EnrollmentResponse:
    return await service.update_enrollment(enrollment_id, schema)


@router.get(
    "/class/{class_id}",
    response_model=List[EnrollmentResponse],
    status_code=status.HTTP_200_OK,
    summary="클래스별 수강 신청 목록 조회",
)
async def get_enrollments_by_class(
    class_id: int,
    service: EnrollmentService = Depends(get_enrollment_service),
) -> List[EnrollmentResponse]:
    return await service.get_enrollments_by_class(class_id)
