from fastapi import APIRouter, Depends, status

from api.dependencies import get_auth_service, get_current_instructor
from models.instructor import Instructor
from schemas.auth import InstructorResponse, LoginRequest, SignupRequest, TokenResponse
from services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입",
)
async def signup(
    schema: SignupRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await service.signup(schema)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="로그인",
)
async def login(
    schema: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await service.login(schema)


@router.get(
    "/me",
    response_model=InstructorResponse,
    status_code=status.HTTP_200_OK,
    summary="현재 로그인한 강사 정보 조회",
)
async def get_me(
    instructor: Instructor = Depends(get_current_instructor),
) -> InstructorResponse:
    return InstructorResponse.model_validate(instructor)
