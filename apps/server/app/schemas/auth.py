from typing import Optional

from pydantic import BaseModel

from schemas.base import ORMBaseModel


class KakaoLoginRequest(BaseModel):
    code: str
    redirect_uri: str


class InstructorResponse(ORMBaseModel):
    id: int
    kakao_id: int
    email: Optional[str] = None
    nickname: str
    profile_image_url: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    instructor: InstructorResponse
