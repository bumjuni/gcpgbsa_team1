from fastapi import APIRouter, Depends, status

from api.dependencies import get_student_service
from schemas.student import StudentResponse, StudentUpdate
from services.student import StudentService

router = APIRouter(prefix="/student", tags=["Student"])


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
    status_code=status.HTTP_200_OK,
    summary="수강생 상세 조회",
)
async def get_student(
    student_id: int,
    service: StudentService = Depends(get_student_service),
) -> StudentResponse:
    return await service.get_student(student_id)


@router.patch(
    "/{student_id}",
    response_model=StudentResponse,
    status_code=status.HTTP_200_OK,
    summary="수강생 정보 수정",
)
async def update_student(
    student_id: int,
    schema: StudentUpdate,
    service: StudentService = Depends(get_student_service),
) -> StudentResponse:
    return await service.update_student(student_id, schema)


@router.delete(
    "/{student_id}",
    status_code=status.HTTP_200_OK,
    summary="수강생 삭제(소프트)",
)
async def delete_student(
    student_id: int,
    service: StudentService = Depends(get_student_service),
):
    deleted_student = await service.delete_student(student_id)
    return {"id": deleted_student.id}
