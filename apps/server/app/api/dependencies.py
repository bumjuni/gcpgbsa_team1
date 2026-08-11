from fastapi import Depends

from services import ClassroomService, EnrollmentService, ProgramService, StudentService
from crud import ClassroomCrud, StudentCrud, EnrollmentCrud, ProgramCrud

from services.dependencies import get_classroom_crud, get_enrollment_crud, get_student_crud, get_program_crud


def get_classroom_service(
    crud: ClassroomCrud = Depends(get_classroom_crud),
) -> ClassroomService:
    return ClassroomService(crud)

def get_enrollment_service(
    crud: EnrollmentCrud = Depends(get_enrollment_crud),
) -> EnrollmentService:
    return EnrollmentService(crud)

def get_program_service(
    crud: ProgramCrud = Depends(get_program_crud),
) -> ProgramService:
    return ProgramService(crud)

def get_student_service(
    crud: StudentCrud = Depends(get_student_crud),
) -> StudentService:
    return StudentService(crud)
