from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services import AuthService, ClassroomService, EnrollmentService, ProgramService, StudentService
from services.llm.llm_service import LLMService
from crud import ClassroomCrud, StudentCrud, EnrollmentCrud, ProgramCrud, InstructorCrud
from core.security import decode_access_token
from models.instructor import Instructor

from services.dependencies import (
    get_classroom_crud,
    get_enrollment_crud,
    get_student_crud,
    get_program_crud,
    get_instructor_crud,
)

bearer_scheme = HTTPBearer(auto_error=False)


def get_classroom_service(
    crud: ClassroomCrud = Depends(get_classroom_crud),
) -> ClassroomService:
    return ClassroomService(crud)

def get_student_service(
    crud: StudentCrud = Depends(get_student_crud),
) -> StudentService:
    return StudentService(crud)


def get_enrollment_service(
    crud: EnrollmentCrud = Depends(get_enrollment_crud),
    student_service: StudentService = Depends(get_student_service),
    classroom_service: ClassroomService = Depends(get_classroom_service),
) -> EnrollmentService:
    return EnrollmentService(crud, student_service, classroom_service)

def get_llm_service() -> LLMService:
    return LLMService()

def get_program_service(
    crud: ProgramCrud = Depends(get_program_crud),
    llm_service: LLMService = Depends(get_llm_service),
) -> ProgramService:
    return ProgramService(crud, llm_service)

def get_auth_service(
    crud: InstructorCrud = Depends(get_instructor_crud),
) -> AuthService:
    return AuthService(crud)

async def get_current_instructor(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    crud: InstructorCrud = Depends(get_instructor_crud),
) -> Instructor:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    instructor = await crud.get_by_id(int(payload["sub"]))
    if instructor is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Instructor not found")
    return instructor
