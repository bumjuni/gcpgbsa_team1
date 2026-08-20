from pydantic import BaseModel
from schemas.base import ORMBaseModel


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


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class InstructorResponse(ORMBaseModel):
    id: int
    email: str
    name: str
    phone: str
    marketing_agreed: bool


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str  # <--- 추가됨
    token_type: str = "bearer"
    instructor: InstructorResponse
