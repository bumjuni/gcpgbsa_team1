# -*- coding: utf-8 -*-
"""personal_chat_ver1.py를 로컬에서 시각적으로 테스트하기 위한 개발자 전용
도구. personal_chat_ver1.py/teamprogram_ver1_1.py/drill_picker.py의 라우팅·
파이프라인 로직은 전혀 재구현하지 않고, 거기서 내보내는 이름만 그대로 가져다
쓴다(personal_chat_ver1.handle_turn 포함).

두 페이지를 제공한다:
  - `/`     : CHAT 의도 파이프라인(키워드 게이트→RAG→그라운딩)만 테스트
  - `/chat` : 가상 프로필로 세션을 시작해 실제 대화하며 의도 분류 라우팅
              (GENERATE_SESSION/FEEDBACK/CHAT) 전체를 테스트

실행 (반드시 이 디렉터리 안에서):
  cd apps/server/app/services/llm
  ../../../venv/bin/python3 personal_chat_dev_server.py
브라우저에서 http://127.0.0.1:8765 (또는 /chat) 접속.
"""
import warnings
warnings.filterwarnings("ignore")
import logging
logging.getLogger().setLevel(logging.ERROR)

import json
import os
import time
import traceback
import uuid

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import uvicorn

# personal_chat_ver1.py를 그대로 sibling import — 로직을 재구현하지 않는다.
from personal_chat_ver1 import (
    _looks_swim_related, _retrieve_theory_context, _SWIM_KEYWORDS, FOCUS_TERMS,
    _CHAT_EXTRA_KEYWORDS, RAG_CHAT_TOP_K, RAG_RELEVANCE_THRESHOLD, chat_reply, pdf_db,
    handle_turn,
)

_HERE = os.path.dirname(os.path.abspath(__file__))
_HTML_PATH = os.path.join(_HERE, "personal_chat_dev_page.html")
_FULL_HTML_PATH = os.path.join(_HERE, "personal_chat_full_dev_page.html")

app = FastAPI(title="personal_chat_ver1 dev tester")

# 이 도구 전용 더미 프로필 — chat_reply()는 goal_type/age만 참조하고 파이프라인
# 분기(키워드 게이트/RAG/그라운딩)에는 전혀 영향을 주지 않는다.
DEV_PROFILE = {"goal_type": "테스트", "age": 30}

# /chat 전용 세션 저장소. 로컬 개발자 1인용 도구라 DB·인증 없이 인메모리로
# 충분하다 — session_id로 구분해 브라우저 탭 여러 개를 써도 서로 안 섞인다.
SESSIONS: dict = {}


def _new_turn_state() -> dict:
    return {
        "history_messages": [], "history_text_log": [], "session_history": [],
        "last_feedback": None, "last_result": None, "pending_session_request": None,
    }


class AnalyzeRequest(BaseModel):
    message: str


class StartChatRequest(BaseModel):
    profile: dict
    session_id: str | None = None  # 재전달하면 "초기화", 없으면 신규 발급


class SendMessageRequest(BaseModel):
    session_id: str
    message: str


@app.get("/", response_class=HTMLResponse)
def index():
    with open(_HTML_PATH, encoding="utf-8") as f:
        return f.read()


@app.get("/chat", response_class=HTMLResponse)
def full_chat_page():
    with open(_FULL_HTML_PATH, encoding="utf-8") as f:
        return f.read()


@app.post("/api/chat/start")
def start_chat(req: StartChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    SESSIONS[session_id] = {"profile": req.profile, "state": _new_turn_state()}
    return {"session_id": session_id}


@app.post("/api/chat/message")
def send_chat_message(req: SendMessageRequest):
    session = SESSIONS.get(req.session_id)
    if session is None:
        return JSONResponse(
            {"error": f"알 수 없는 session_id: {req.session_id!r} — 먼저 /api/chat/start를 호출하세요."},
            status_code=404,
        )
    try:
        reply, session["state"], branch = handle_turn(
            req.message, session["state"], session["profile"], profile_path=None)
    except Exception as e:
        return JSONResponse(
            {"error": f"{type(e).__name__}: {e}", "traceback": traceback.format_exc()},
            status_code=500,
        )
    return JSONResponse({
        "reply": reply if isinstance(reply, str) else json.dumps(reply, ensure_ascii=False),
        "branch": branch,  # "SLOT_QUESTION" | "GENERATE_SESSION" | "FEEDBACK" | "CHAT"
        "last_result": session["state"]["last_result"],  # CLI의 'json' 커맨드와 동일 소스
    })


@app.get("/api/chat/last_result")
def get_last_result(session_id: str):
    session = SESSIONS.get(session_id)
    if session is None:
        return JSONResponse({"error": f"알 수 없는 session_id: {session_id!r}"}, status_code=404)
    return {"last_result": session["state"]["last_result"]}


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    text = req.message
    timings = {}

    # ---- Stage 1: 키워드 게이트 (실제 함수 그대로 호출) ----
    t0 = time.time()
    gate_passed = _looks_swim_related(text)
    timings["stage1_ms"] = round((time.time() - t0) * 1000, 1)

    # 표시용 매치 목록만 별도로 뽑는다 (판정 자체는 위 결과를 그대로 씀).
    # STROKE/SKILL 쪽은 실제 함수와 동일하게 lower() 비교, FOCUS_TERMS는
    # 원문 대소문자 그대로 비교 — _looks_swim_related()의 비대칭을 그대로 따름.
    q_lower = (text or "").lower()
    matched_stroke_skill = sorted({w for w in _SWIM_KEYWORDS if w in q_lower})
    matched_extra = sorted({w for w in _CHAT_EXTRA_KEYWORDS if w in text})
    matched_focus = sorted({k for k in FOCUS_TERMS if k in text})

    # ---- Stage 2: RAG — threshold 없이 모든 후보 + 원점수 ----
    stage2 = {
        "attempted": gate_passed,
        "top_k": RAG_CHAT_TOP_K,
        "relevance_threshold": RAG_RELEVANCE_THRESHOLD,
        "candidates": [],
        "num_passed": 0,
        "error": None,
    }
    theory_context = ""
    if gate_passed:
        t0 = time.time()
        try:
            raw_hits = pdf_db.similarity_search_with_relevance_scores(text, k=RAG_CHAT_TOP_K)
        except Exception as e:
            raw_hits = []
            stage2["error"] = f"{type(e).__name__}: {e}"
        timings["stage2_rag_search_ms"] = round((time.time() - t0) * 1000, 1)

        for rank, (doc, score) in enumerate(raw_hits, start=1):
            passed = score >= RAG_RELEVANCE_THRESHOLD
            stage2["candidates"].append({
                "rank": rank,
                "score": round(float(score), 4),
                "passed_threshold": passed,
                "content_preview": doc.page_content[:120],
                "content_full": doc.page_content,
            })
        stage2["num_passed"] = sum(1 for c in stage2["candidates"] if c["passed_threshold"])

        # 실제 프로덕션 경로와 100% 동일한 theory_context를 얻기 위해 real fn 재호출.
        t0 = time.time()
        theory_context = _retrieve_theory_context(text)
        timings["stage2b_retrieve_theory_context_ms"] = round((time.time() - t0) * 1000, 1)

    stage3 = {
        "grounding_used": bool(theory_context),
        "theory_context_char_count": len(theory_context),
        "theory_context_text": theory_context,
    }

    # ---- Stage 4: 실제 chat_reply() 그대로 호출 ----
    t0 = time.time()
    try:
        reply = chat_reply(text, [], DEV_PROFILE)
        error = None
    except Exception as e:
        reply = None
        error = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
    timings["stage4_chat_llm_ms"] = round((time.time() - t0) * 1000, 1)

    return JSONResponse({
        "input": {"message": text},
        "stage1_keyword_gate": {
            "gate_passed": gate_passed,
            "matched_stroke_skill_keywords": matched_stroke_skill,
            "matched_extra_keywords": matched_extra,
            "matched_focus_terms": matched_focus,
        },
        "stage2_rag_search": stage2,
        "stage3_grounding": stage3,
        "stage4_llm_response": {"reply": reply, "error": error},
        "timings_ms": timings,
    })


if __name__ == "__main__":
    print("personal_chat_ver1 dev tester")
    print("  CHAT 파이프라인만: http://127.0.0.1:8765")
    print("  전체 대화(라우팅 포함): http://127.0.0.1:8765/chat")
    uvicorn.run(app, host="127.0.0.1", port=8765)
