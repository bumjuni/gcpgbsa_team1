# apps/server 를 빌드 컨텍스트로 사용 (backend-deploy.yml: docker build -t "$IMAGE" apps/server)

# ---- builder: 의존성만 별도 스테이지에서 설치 ----
FROM python:3.13-slim AS builder

WORKDIR /build

# requirements.txt의 일부 패키지(예: cryptography, grpcio)가 선컴파일된 wheel이 없어
# 소스 빌드로 폴백할 경우를 대비한 최소 빌드 도구. 첫 실제 빌드에서 실패하는
# 패키지가 있으면 여기 시스템 라이브러리를 추가할 것.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- runtime: venv만 복사, 빌드 도구는 최종 이미지에 남기지 않음 ----
FROM python:3.13-slim AS runtime

# onnxruntime/numpy 계열이 요구하는 공유 라이브러리 (chromadb 의존성 체인에서 사용)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1000 appuser

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# main.py가 `from core.database import engine`처럼 app/ 기준 평면 임포트를 쓰므로
# apps/server/app/* 를 이미지의 /app 루트로 그대로 복사한다 (app/ 하위 폴더 자체는 안 만듦).
COPY app/ ./
ENV PYTHONPATH=/app
RUN chown -R appuser:appuser /app

USER appuser

# Cloud Run이 컨테이너 기동 시 PORT 환경변수를 주입한다 (로컬 기본값 8080).
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
# CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
