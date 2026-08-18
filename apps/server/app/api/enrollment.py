from fastapi import APIRouter, Depends, status

from api.dependencies import get_enrollment_service
from schemas.enrollment import (
    EnrollmentCreate,
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
