from typing import Optional

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
    class_id: Optional[int] = None,
    service: StudentService = Depends(get_student_service),
) -> StudentResponse:
    return await service.get_student(student_id, class_id)


@router.patch(
    "/{student_id}",
    response_model=StudentResponse,
    status_code=status.HTTP_200_OK,
    summary="수강생 정보 수정",
)
async def update_student(
    student_id: int,
    schema: StudentUpdate,
    class_id: Optional[int] = None,
    service: StudentService = Depends(get_student_service),
) -> StudentResponse:
    return await service.update_student(student_id, schema, class_id)


# 실제 DB 삭제가 다른 작업과 얽힐 수 있어 임시로 잠가둠 - 06-3-1C 확정 시 재활성화 예정
# @router.delete(
#     "/{student_id}",
#     status_code=status.HTTP_200_OK,
#     summary="수강생 삭제(소프트)",
# )
# async def delete_student(
#     student_id: int,
#     service: StudentService = Depends(get_student_service),
# ):
#     deleted_student = await service.delete_student(student_id)
#     return {"id": deleted_student.id}
