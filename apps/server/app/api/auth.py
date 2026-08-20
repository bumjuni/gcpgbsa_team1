from fastapi import APIRouter, Depends, status

from api.dependencies import get_auth_service, get_current_instructor
from models.instructor import Instructor
from schemas.auth import InstructorResponse, KakaoLoginRequest, TokenResponse
from services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/kakao/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="카카오 소셜 로그인",
)
async def kakao_login(
    schema: KakaoLoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await service.login_with_kakao(code=schema.code, redirect_uri=schema.redirect_uri)


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
