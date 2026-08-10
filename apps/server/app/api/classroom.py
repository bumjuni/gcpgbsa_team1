from fastapi import APIRouter, Depends, status

from api.dependencies import get_classroom_service
from schemas.classroom import (
    EnrollmentCreate,
    EnrollmentResponse,
    ProgramCreate,
    ProgramItemCreate,
    ProgramItemResponse,
    ProgramResponse,
    SwimClassCreate,
    SwimClassDetailResponse,
    SwimClassResponse,
)
from services.classroom import ClassroomService

router = APIRouter(prefix="/classroom", tags=["Classroom"])


# ----------------------------------------------------------------------
# 1. SwimClass Endpoints
# ----------------------------------------------------------------------
@router.get(
    "/classes",
    response_model=list[SwimClassResponse],
    status_code=status.HTTP_200_OK,
    summary="강습 클래스 목록 조회",
)
async def get_swim_classes(
    service: ClassroomService = Depends(get_classroom_service),
) -> list[SwimClassResponse]:
    return await service.get_swim_class()


@router.get(
    "/class/{swim_class_id}",
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
    "/class",
    response_model=SwimClassDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="강습 클래스 생성",
)
# Todo: 객체에서 불필요한 정보 반환하지 않도록 수정
async def create_swim_class(
    schema: SwimClassCreate,
    service: ClassroomService = Depends(get_classroom_service),
) -> SwimClassDetailResponse:
    return await service.create_swim_class(schema)

@router.delete(
    "/classes/{swim_class_id}",
    status_code=status.HTTP_200_OK,
    summary="강습 클래스 삭제(소프트)",
)
async def delete_swim_class(
    swim_class_id: int,
    service: ClassroomService = Depends(get_classroom_service)):
    deleted_class = await service.delete_swim_class(swim_class_id)
    return {"id": deleted_class.id}


# ----------------------------------------------------------------------
# 2. Student Endpoints => TODO: 수강생 생성/삭제 앱에서 가능한지 기획팀에 문의
# ----------------------------------------------------------------------
# @router.post(
#     "/students",
#     response_model=StudentResponse,
#     status_code=status.HTTP_201_CREATED,
#     summary="수강생 생성",
# )
# async def create_student(
#     schema: StudentCreate,
#     service: ClassroomService = Depends(get_classroom_service),
# ) -> StudentResponse:
#     return await service.create_student(schema)


# @router.delete(
#     "/students/{student_id}",
#     response_model=StudentResponse,
#     status_code=status.HTTP_200_OK,
#     summary="수강생 삭제(소프트)",
# )
# async def delete_student(
#     student_id: int,
#     service: ClassroomService = Depends(get_classroom_service),
# ) -> StudentResponse:
#     return await service.delete_student(student_id)


# ----------------------------------------------------------------------
# 3. Program Endpoints
# ----------------------------------------------------------------------
@router.post(
    "/programs",
    response_model=ProgramResponse,
    status_code=status.HTTP_201_CREATED,
    summary="루틴 프로그램 생성",
)
async def create_program(
    schema: ProgramCreate,
    service: ClassroomService = Depends(get_classroom_service),
) -> ProgramResponse:
    return await service.create_program(schema)


@router.delete(
    "/programs/{program_id}",
    response_model=ProgramResponse,
    status_code=status.HTTP_200_OK,
    summary="루틴 프로그램 삭제(소프트)",
)
async def delete_program(
    program_id: int,
    service: ClassroomService = Depends(get_classroom_service),
) -> ProgramResponse:
    return await service.delete_program(program_id)


# ----------------------------------------------------------------------
# 4. ProgramItem Endpoints
# ----------------------------------------------------------------------
@router.post(
    "/program-items",
    response_model=ProgramItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="프로그램 세부 아이템 생성",
)
async def create_program_item(
    schema: ProgramItemCreate,
    service: ClassroomService = Depends(get_classroom_service),
) -> ProgramItemResponse:
    return await service.create_program_item(schema)


@router.delete(
    "/program-items/{program_item_id}",
    response_model=ProgramItemResponse,
    status_code=status.HTTP_200_OK,
    summary="프로그램 세부 아이템 삭제(소프트)",
)
async def delete_program_item(
    program_item_id: int,
    service: ClassroomService = Depends(get_classroom_service),
) -> ProgramItemResponse:
    return await service.delete_program_item(program_item_id)


# ----------------------------------------------------------------------
# 5. Enrollment Endpoints
# ----------------------------------------------------------------------
@router.post(
    "/enrollments",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="수강 신청 등록",
)
async def create_enrollment(
    schema: EnrollmentCreate,
    service: ClassroomService = Depends(get_classroom_service),
) -> EnrollmentResponse:
    return await service.create_enrollment(schema)
