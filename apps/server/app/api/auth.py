import os
from dotenv import load_dotenv

from fastapi import APIRouter, Depends, status

from api.dependencies import get_auth_service, get_current_instructor
from models.instructor import Instructor
from schemas.auth import InstructorResponse, KakaoLoginRequest, TokenResponse
from services.auth import AuthService
from fastapi.responses import RedirectResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

load_dotenv()
KAUTH_HOST=os.getenv("KAUTH_HOST", "")
CLIENT_ID=os.getenv("KAKAO_CLIENT_ID", "")
REDIRECT_URI=os.getenv("KAKAO_REDIRECT_URI", "")


# 카카오 인증 서버로 인가 코드 발급 요청
@router.get("/authorize")
def authorize():

    url="{0}/oauth/authorize?response_type=code&client_id={1}&redirect_uri={2}&response_type=code".format(
        KAUTH_HOST, CLIENT_ID, REDIRECT_URI)
    # 카카오 인증 서버로 리다이렉트
    # 사용자 동의 후 리다이렉트 URI로 인가 코드가 전달
    return RedirectResponse(url=url)


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
