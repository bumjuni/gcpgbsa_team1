import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
# Access Token 만료 시간 (기본값: 60분 또는 .env 설정값)
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
# Refresh Token 만료 시간 (기본값: 14일 또는 .env 설정값)
JWT_REFRESH_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_EXPIRE_DAYS", "14"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or JWT_EXPIRE_MINUTES
    )
    payload = {
        "sub": subject,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(subject: str, expires_days: Optional[int] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=expires_days or JWT_REFRESH_EXPIRE_DAYS
    )
    payload = {
        "sub": subject,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        # type 검증 (access 토큰이 맞는지)
        if payload.get("type") and payload.get("type") != "access":
            raise ValueError("Invalid token type")
        return payload
    except JWTError as e:
        raise ValueError("Invalid or expired token") from e


def decode_refresh_token(token: str) -> str:
    """
    Refresh Token을 검증하고 subject(instructor_id)를 반환합니다.
    유효하지 않거나 만료된 경우 HTTPException 401을 발생시킵니다.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        token_type = payload.get("type")
        subject = payload.get("sub")

        if token_type != "refresh" or not subject:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        return subject
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
