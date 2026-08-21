from fastapi import APIRouter, Depends, status

from api.dependencies import get_current_instructor, get_student_service
from models.instructor import Instructor
from schemas.student import Student, StudentUpdate
from services.student import StudentService

router = APIRouter(prefix="/student", tags=["Student"])


@router.get(
    "/{student_id}",
    response_model=Student,
    status_code=status.HTTP_200_OK,
    summary="수강생 상세 조회",
)
async def get_student_detail(
    student_id: int,
    service: StudentService = Depends(get_student_service),
    instructor: Instructor = Depends(get_current_instructor),
) -> Student:
    return await service.get_student_detail(student_id, instructor.id)


@router.patch(
    "/{student_id}",
    response_model=Student,
    status_code=status.HTTP_200_OK,
    summary="수강생 정보 수정",
)
async def update_student(
    student_id: int,
    schema: StudentUpdate,
    service: StudentService = Depends(get_student_service),
    instructor: Instructor = Depends(get_current_instructor),
) -> Student:
    return await service.update_student(student_id, schema, instructor.id)
