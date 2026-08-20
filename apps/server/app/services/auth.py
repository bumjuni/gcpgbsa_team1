import re

from fastapi import HTTPException, status

from core.security import create_access_token, hash_password, verify_password
from crud.instructor import InstructorCrud
from schemas.auth import InstructorResponse, LoginRequest, SignupRequest, TokenResponse

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_PATTERN = re.compile(r"^010-\d{4}-\d{4}$")
PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")

# 이메일 중복 에러 문구. 프론트에서 이 문구를 보고 [로그인하기] 버튼을 함께 노출한다.
DUPLICATE_EMAIL_MESSAGE = "이미 가입된 이메일이에요"


class AuthService:
    def __init__(self, crud: InstructorCrud) -> None:
        self.crud = crud

    async def signup(self, schema: SignupRequest) -> TokenResponse:
        errors: dict[str, str] = {}

        # 이름
        if not schema.name.strip():
            errors["name"] = "이름을 입력해주세요"
        elif len(schema.name) > 10:
            errors["name"] = "이름은 10자 이내로 입력해주세요"

        # 이메일
        if not schema.email.strip():
            errors["email"] = "이메일을 입력해주세요"
        elif not EMAIL_PATTERN.match(schema.email):
            errors["email"] = "이메일 형식을 확인해주세요"
        elif await self.crud.get_by_email(schema.email):
            errors["email"] = DUPLICATE_EMAIL_MESSAGE

        # 비밀번호
        if not PASSWORD_PATTERN.match(schema.password):
            errors["password"] = "비밀번호는 8자 이상으로 만들어주세요"
        elif schema.password != schema.password_confirm:
            errors["password_confirm"] = "비밀번호가 일치하지 않아요"

        # 휴대폰번호
        if not schema.phone.strip():
            errors["phone"] = "휴대폰번호를 입력해주세요"
        elif not PHONE_PATTERN.match(schema.phone):
            errors["phone"] = "휴대폰번호 형식을 확인해주세요 (010-0000-0000)"
        elif await self.crud.get_by_phone(schema.phone):
            errors["phone"] = "이미 가입된 번호예요"

        # 필수 동의
        if not (schema.agree_terms and schema.agree_privacy and schema.agree_age):
            errors["agreement"] = "필수 항목에 동의하면 가입할 수 있어요"

        if errors:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=errors)

        instructor = await self.crud.create(
            email=schema.email,
            password_hash=hash_password(schema.password),
            name=schema.name,
            phone=schema.phone,
            terms_agreed=schema.agree_terms,
            privacy_agreed=schema.agree_privacy,
            age_over_14=schema.agree_age,
            marketing_agreed=schema.agree_marketing,
        )

        access_token = create_access_token(subject=str(instructor.id))
        return TokenResponse(
            access_token=access_token,
            instructor=InstructorResponse.model_validate(instructor),
        )

    async def login(self, schema: LoginRequest) -> TokenResponse:
        instructor = await self.crud.get_by_email(schema.email)
        if instructor is None or not verify_password(schema.password, instructor.password_hash):
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED,
                "이메일 또는 비밀번호가 일치하지 않아요",
            )

        access_token = create_access_token(subject=str(instructor.id))
        return TokenResponse(
            access_token=access_token,
            instructor=InstructorResponse.model_validate(instructor),
        )
