from fastapi import APIRouter, Depends, status

from api.dependencies import get_enrollment_service
from schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentResponse,
)
from services.enrollment import EnrollmentService

router = APIRouter(prefix="/enrollment", tags=["Enrollment"])


@router.get(
    "/class/{class_id}",
    response_model=list[EnrollmentResponse],
    status_code=status.HTTP_200_OK,
    summary="반별 회원 목록 조회",
)
async def get_enrollments_by_class(
    class_id: int,
    service: EnrollmentService = Depends(get_enrollment_service),
) -> list[EnrollmentResponse]:
    return await service.get_enrollments_by_class(class_id)


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
