import os

import httpx
from dotenv import load_dotenv
from fastapi import HTTPException, status

from core.security import create_access_token
from crud.instructor import InstructorCrud
from schemas.auth import InstructorResponse, TokenResponse

load_dotenv()
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID", "")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET", "")
KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
KAKAO_USERINFO_URL = "https://kapi.kakao.com/v2/user/me"


class AuthService:
    def __init__(self, crud: InstructorCrud) -> None:
        self.crud = crud

    async def login_with_kakao(self, code: str, redirect_uri: str) -> TokenResponse:
        kakao_access_token = await self._exchange_code(code, redirect_uri)
        profile = await self._fetch_profile(kakao_access_token)

        instructor = await self.crud.get_by_kakao_id(profile["kakao_id"])
        if instructor is None:
            instructor = await self.crud.create(**profile)
        else:
            instructor = await self.crud.update_profile(
                instructor,
                email=profile["email"],
                nickname=profile["nickname"],
                profile_image_url=profile["profile_image_url"],
            )

        access_token = create_access_token(subject=str(instructor.id))
        return TokenResponse(
            access_token=access_token,
            instructor=InstructorResponse.model_validate(instructor),
        )

    async def _exchange_code(self, code: str, redirect_uri: str) -> str:
        data = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "code": code,
        }
        if KAKAO_CLIENT_SECRET:
            data["client_secret"] = KAKAO_CLIENT_SECRET

        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.post(KAKAO_TOKEN_URL, data=data)
            except httpx.HTTPError as e:
                raise HTTPException(
                    status.HTTP_502_BAD_GATEWAY, "Failed to reach Kakao auth server"
                ) from e

        if resp.status_code != 200:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, "Invalid Kakao authorization code"
            )
        return resp.json()["access_token"]

    async def _fetch_profile(self, kakao_access_token: str) -> dict:
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(
                    KAKAO_USERINFO_URL,
                    headers={"Authorization": f"Bearer {kakao_access_token}"},
                )
            except httpx.HTTPError as e:
                raise HTTPException(
                    status.HTTP_502_BAD_GATEWAY, "Failed to reach Kakao user API"
                ) from e

        if resp.status_code != 200:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, "Failed to fetch Kakao profile"
            )

        body = resp.json()
        account = body.get("kakao_account", {})
        profile = account.get("profile", {})
        return {
            "kakao_id": body["id"],
            "email": account.get("email"),
            "nickname": profile.get("nickname", "카카오사용자"),
            "profile_image_url": profile.get("profile_image_url"),
        }
