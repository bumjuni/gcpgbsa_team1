from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import engine
from api import classroom, enrollment, program, auth
from models import Base

# DB 생성
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 비동기 엔진을 사용하여 테이블 생성
    async with engine.begin() as conn:
        # run_sync를 통해 동기 함수인 create_all을 비동기 환경에서 실행
        await conn.run_sync(Base.metadata.create_all)

    yield  # 이 시점부터 서버가 정상적으로 요청을 받습니다.

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://127.0.0.1:8081"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classroom.router)
app.include_router(enrollment.router)
app.include_router(program.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
