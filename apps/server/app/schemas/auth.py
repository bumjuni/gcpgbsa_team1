from pydantic import BaseModel

from schemas.base import ORMBaseModel


# 필드별 상세 검증(길이/형식/중복 등)은 정확한 한글 에러 문구를 위해
# 스키마가 아닌 services/auth.py에서 수행한다.
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    password_confirm: str
    phone: str
    agree_terms: bool = False
    agree_privacy: bool = False
    agree_age: bool = False
    agree_marketing: bool = False


class LoginRequest(BaseModel):
    email: str
    password: str


class InstructorResponse(ORMBaseModel):
    id: int
    email: str
    name: str
    phone: str
    marketing_agreed: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    instructor: InstructorResponse
