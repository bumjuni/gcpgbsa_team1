# personal_chat_ver1.py — 개인모드 채팅 오케스트레이션 (programlogic.md §3-1 ②)
#
# personar_ver1.generate_personal_session()은 "요청 dict 하나 → 응답 dict 하나"인
# 단발 호출 함수라 여러 턴에 걸친 자유 대화(문맥 유지, 잡담 응답)는 못 한다.
# 이 파일은 그 위에 매 턴 "일반 대화 / 세션 생성 요청 / 세션 후 피드백"을
# 판단해서 라우팅하는 얇은 챗봇 레이어를 얹는다. 세션 생성 자체의 로직(존
# 분류·ACSM·주기화)은 전혀 건드리지 않고 personar_ver1을 그대로 호출한다.
#
# ★ 상태 관리 원칙(§3-1): "채팅 로그 자체를 상태의 원천으로 쓰지 않는다."
#   이 CLI 데모는 편의상 session_history/last_feedback을 프로세스 메모리에
#   들고 있지만, 실제 서비스에서는 이 자리에 "마이페이지가 관리하는 프로필·
#   세션 기록 테이블을 매 턴 다시 읽어오는" 코드가 들어가야 한다(§3-1 "채팅은
#   매 응답마다 프로필을 새로 읽는다 — 캐시하지 않는다"). 그 지점을 흉내내려고
#   profile_path를 주면 매 세션 생성 요청마다 파일을 다시 읽는다.
import sys
import json
import time
from datetime import date

from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage, AIMessage

from teamprogram_ver1 import GCP_PROJECT_ID, pdf_db
from personar_ver1 import generate_personal_session, llm as _json_llm
from drill_picker import STROKE_DETECT, SKILL_DETECT, FOCUS_TERMS

# 자유 대화용 LLM — 세션 생성에 쓰는 llm(JSON 강제)과 분리한다.
# JSON 강제 모드로는 "오늘 컨디션 어때요?" 같은 잡담에 자연스럽게 답할 수 없다.
chat_llm = ChatVertexAI(
    model_name="gemini-2.5-flash",
    temperature=0.5,
    project=GCP_PROJECT_ID,
    location="asia-northeast3",
)

MAX_HISTORY_TURNS = 6  # 프롬프트에 넣을 최근 대화 턴 수(토큰 절약용, 요약 없이 단순 절단)


# =====================================================================
# 1. 의도 분류 / 피드백 추출 — JSON 강제 llm(_json_llm) 재사용
# =====================================================================
def classify_intent(user_message: str, recent_history_text: str) -> str:
    """반환: 'GENERATE_SESSION' | 'FEEDBACK' | 'CHAT'."""
    prompt = f"""당신은 수영 개인 코칭 챗봇의 의도 분류기입니다.
아래 회원의 마지막 메시지를 세 가지 중 하나로 분류하십시오.

- GENERATE_SESSION: 오늘/이번 훈련 세션을 만들어달라는 요청
  (예: "오늘 훈련 만들어줘", "스피드 위주로 세션 짜줘")
- FEEDBACK: 방금 끝낸(또는 지난) 훈련에 대한 완료 여부·체감 강도 보고
  (예: "오늘 다 했어요, 근데 좀 힘들었어요", "완료! rpe 8정도")
- CHAT: 그 외 일반 대화·질문·잡담 (예: "오늘 컨디션이 좀 별로예요", "평영 팔동작이 헷갈려요")

[최근 대화]
{recent_history_text or "(없음)"}

[회원의 마지막 메시지]
{user_message}

JSON으로만 답하십시오: {{"intent": "GENERATE_SESSION|FEEDBACK|CHAT"}}"""
    try:
        resp = _json_llm.invoke([HumanMessage(content=prompt)])
        data = json.loads(resp.content)
        intent = data.get("intent", "CHAT")
        return intent if intent in ("GENERATE_SESSION", "FEEDBACK", "CHAT") else "CHAT"
    except Exception:
        return "CHAT"  # 분류 실패 시 안전하게 일반 대화로 처리(세션을 함부로 안 만듦)


def extract_feedback(user_message: str) -> dict:
    """반환: {"completed": bool|null, "rpe_actual": int|null}."""
    prompt = f"""아래 회원 메시지에서 운동 완료 여부와 체감 강도(RPE, 0~10)를 추출하십시오.
언급이 없으면 null로 두십시오.

메시지: {user_message}

JSON으로만 답하십시오: {{"completed": true/false/null, "rpe_actual": 0~10 정수 또는 null}}"""
    try:
        resp = _json_llm.invoke([HumanMessage(content=prompt)])
        data = json.loads(resp.content)
        return {"completed": data.get("completed"), "rpe_actual": data.get("rpe_actual")}
    except Exception:
        return {"completed": None, "rpe_actual": None}


# =====================================================================
# 1-2. 세션 생성 전 사전질문(슬롯 채우기)
# ---------------------------------------------------------------------
# stroke_primary가 온보딩 프로필에서 빠지면서(personal_onboarding_form.md 참고),
# 영법처럼 세션마다 달라질 수 있는 정보는 프로필이 아니라 매 GENERATE_SESSION
# 요청 시점에 채팅으로 확인한다. 여기서 확인하는 3개 슬롯 중 회원이 이미
# 메시지에 답을 해뒀으면 다시 묻지 않는다.
# =====================================================================
SESSION_SLOTS = {
    "stroke": {"label": "영법", "options": ["자유형", "배영", "평영", "접영", "상관없음"]},
    "focus": {"label": "오늘 세션 초점", "options": ["지구력 늘리기", "스피드 올리기", "자세 교정", "가볍게"]},
    "condition": {"label": "오늘 컨디션", "options": ["평소와 같음", "좀 피곤함(강도 낮춰줘)", "특정 부위 불편함"]},
}
_SLOT_ORDER = ["stroke", "focus", "condition"]
_SLOT_REQUEST_PHRASE = {
    "stroke": lambda v: f"{v} 위주로",
    "focus": lambda v: f"{v}에 초점",
    "condition": lambda v: f"컨디션은 {v}",
}


def find_missing_slots(user_message: str, recent_history_text: str) -> dict:
    """세션 생성 요청 메시지(및 최근 대화)에 슬롯 3개(영법/초점/컨디션)의 답이
    이미 있는지 판별한다. 반환: {"missing": [...남은 슬롯 키...],
    "filled": {슬롯키: 선택지 중 하나 또는 그와 가장 가까운 표현}}"""
    slot_desc = "\n".join(
        f'- {key} ("{v["label"]}"): {" / ".join(v["options"])}' for key, v in SESSION_SLOTS.items()
    )
    prompt = f"""당신은 수영 개인 코칭 챗봇의 슬롯 채우기 판별기입니다.
아래 회원의 세션 생성 요청 메시지(및 최근 대화)에 다음 3개 슬롯 각각의 답이
이미 들어있는지 판별하십시오. 답을 찾을 수 없는 슬롯은 missing에 그 키를
넣고, 답이 있는 슬롯은 filled에 그 키와 값(아래 선택지 중 하나, 또는 선택지와
가장 가까운 표현)을 넣으십시오. 한 슬롯은 missing과 filled 중 한 곳에만 넣으십시오.

[슬롯]
{slot_desc}

[최근 대화]
{recent_history_text or "(없음)"}

[회원 메시지]
{user_message}

JSON으로만 답하십시오:
{{"missing": ["stroke"|"focus"|"condition", ...], "filled": {{"stroke": "...", "focus": "...", "condition": "..."}}}}"""
    try:
        resp = _json_llm.invoke([HumanMessage(content=prompt)])
        data = json.loads(resp.content)
        filled = {k: v for k, v in (data.get("filled") or {}).items() if k in SESSION_SLOTS and v}
        missing = [s for s in (data.get("missing") or []) if s in SESSION_SLOTS and s not in filled]
        return {"missing": missing, "filled": filled}
    except Exception:
        # 판별 실패 시 안전하게 "3개 다 못 채움" 취급 — 슬롯을 못 물어보고
        # 넘어가는 것보다, 한 번 더 확인하는 쪽이 안전하다.
        return {"missing": list(SESSION_SLOTS.keys()), "filled": {}}


def _build_missing_slots_question(missing: list) -> str:
    lines = ["오늘 세션 만들기 전에 몇 가지만 확인할게요."]
    for i, key in enumerate(missing, 1):
        slot = SESSION_SLOTS[key]
        lines.append(f"{i}) {slot['label']}: {' / '.join(slot['options'])}")
    return "\n".join(lines)


def _compose_request_text(original_message: str, filled: dict) -> str:
    clauses = [_SLOT_REQUEST_PHRASE[k](filled[k]) for k in _SLOT_ORDER if filled.get(k)]
    if not clauses:
        return original_message
    return f"{original_message}. " + ", ".join(clauses) + "."


# =====================================================================
# 1-3. 일반 대화용 RAG 그라운딩 — 수영 기술 질문일 때만 이론서 검색
# ---------------------------------------------------------------------
# generate_personal_session()(personar_ver1.py)과 달리 여기서는 매 CHAT 턴마다
# pdf_db를 조회하지 않는다: 세션 생성 요청은 항상 기술적 맥락이 있지만 잡담
# 한 줄("오늘 컨디션 어때요")은 이론서에 대응 내용이 없는 게 정상이라 무의미한
# 벡터 검색 비용만 붙는다. 그래서 (1) 저비용 키워드 게이트를 먼저 거치고,
# (2) 게이트를 통과해도 relevance score가 낮으면 이론 자료 없이 진행한다 —
# 두 경우 모두 결과적으로 "오늘과 동일한 순수 LLM 응답"으로 수렴한다.
# =====================================================================

# 새 키워드 목록을 만들지 않고 drill_picker.py의 감지 테이블을 그대로 재사용한다
# (영법/기술 키워드는 STROKE_DETECT·SKILL_DETECT, 코칭 관심사 키워드는 FOCUS_TERMS).
_SWIM_KEYWORDS = [w for table in (STROKE_DETECT, SKILL_DETECT)
                  for kws in table.values() for w in kws]

# ★ drill_picker.py의 테이블만으로는 놓치는 케이스가 있어 이 채팅 게이트
#   전용으로 보강한다 — 예를 들어 "수영" 자체가 STROKE_DETECT/SKILL_DETECT/
#   FOCUS_TERMS 어디에도 없어서 "수영 잘하는 팁 좀" 같은 뭉뚱그린 질문은
#   게이트를 통과 못 했다. drill_picker.py의 테이블은 건드리지 않는다 —
#   거긴 드릴 조회용 매칭이라 목적이 다르고(단어를 늘리면 드릴 스코어링에도
#   영향), 여기 게이트는 "이론서 검색을 시도할지"만 판단하는 저비용 필터라
#   넓게 잡아도 부작용이 작다(잘못 걸려도 RAG_RELEVANCE_THRESHOLD가 걸러줘서
#   최악의 경우는 '검색 한 번 헛도는 것'뿐 — 잘못된 그라운딩으로 이어지지 않음).
_CHAT_EXTRA_KEYWORDS = [
    # 일반 수영 용어 — 특정 영법/기술을 안 짚고 뭉뚱그려 물어도 잡히게
    "수영", "수영장", "물속", "레인", "영법", "물적응",
    # 장비 — drill_picker.EQUIP_DETECT와 겹치지만 코칭 질문에도 자주 나옴
    "오리발", "패들", "킥판", "풀부이", "물안경",
    # 신체 통증/불편 — 흔한 코칭 질문 패턴인데 기존 목록엔 전혀 없었음
    "어깨", "허리", "무릎", "손목", "통증", "아파요", "아픈", "뻐근", "쥐가",
    # 훈련·기록 관련 용어
    "페이스", "랩타임", "인터벌", "대회", "시합", "완주",
    # 체력/호흡의 캐주얼한 표현 (FOCUS_TERMS의 "체력"/"호흡"은 정확히 그 단어만 잡음)
    "숨차", "숨이 차", "지쳐", "힘들어요",
]


def _looks_swim_related(text: str) -> bool:
    """사용자 메시지가 수영 기술/코칭 관련인지 키워드로만 판별한다(LLM 호출 없음
    — 매 턴 판별이라 비용을 최소화). True일 때만 RAG 조회를 시도한다."""
    q = (text or "").lower()
    if any(w in q for w in _SWIM_KEYWORDS):
        return True
    if any(w in text for w in _CHAT_EXTRA_KEYWORDS):
        return True
    return any(focus_ko in text for focus_ko in FOCUS_TERMS)  # 키 자체가 한글 코칭 키워드


# RAG 조회 파라미터. k=4는 세션 생성(personar_ver1.py, k=8)보다 작게 잡았다 —
# 챗봇 답변은 한두 문장이라 이론 자료를 그렇게 많이 실을 필요가 없다.
RAG_CHAT_TOP_K = 4

# ★ RAG_RELEVANCE_THRESHOLD — 실제 데이터로 검증하지 못한 기본값이다(로컬 ADC
#   재인증이 필요해 설계 시점엔 pdf_db에 실제 쿼리를 못 던져봤음). score는
#   [0,1] 범위(0=무관, 1=매우 유사)이지만 정확한 스케일은 임베딩·컬렉션마다
#   다르므로 0.5는 "일단 중간값"일 뿐 근거 있는 값이 아니다.
#   재보정 방법(ML 지식 불필요): ADC 재인증(`gcloud auth application-default
#   login`) 후 `python calibrate_rag_threshold.py` 실행 → 수영 기술 질문
#   샘플들과 잡담 샘플들 각각의 최고 relevance score가 나란히 출력된다.
#   "기술 질문 점수들은 대체로 이 값 위, 잡담 점수들은 대체로 이 값 아래"가
#   되는 경계값을 찾아 여기에 넣으면 된다.
RAG_RELEVANCE_THRESHOLD = 0.5


def _retrieve_theory_context(query: str) -> str:
    """pdf_db에서 relevance score가 RAG_RELEVANCE_THRESHOLD 이상인 이론 조각만
    모아 반환한다. 통과하는 문서가 없으면(임계값 미달 포함) 빈 문자열을 반환
    한다 — 호출부(chat_reply)는 이 경우를 '애초에 수영 관련이 아니었던 경우'와
    동일하게 취급한다. personar_ver1.py의 중복 제거 방식(앞 80자 기준)을 그대로
    따른다."""
    try:
        hits = pdf_db.similarity_search_with_relevance_scores(
            query, k=RAG_CHAT_TOP_K, score_threshold=RAG_RELEVANCE_THRESHOLD)
    except Exception:
        # 벡터 DB/임베딩 호출 실패가 잡담 응답까지 막으면 안 된다 — 그라운딩은
        # 있으면 좋은 부가 기능이지 chat_reply()의 필수 경로가 아니다.
        return ""
    seen, lines = set(), []
    for doc, _score in hits:
        key = doc.page_content[:80]
        if key in seen:
            continue
        seen.add(key)
        lines.append(f"- {doc.page_content}")
    return "\n".join(lines)


# =====================================================================
# 2. 일반 대화 응답
# =====================================================================
def chat_reply(user_message: str, history_messages: list, profile: dict) -> str:
    # stroke_primary는 온보딩 프로필에서 빠졌다(영법은 세션 생성 시점에 슬롯
    # 채우기로 물어봄) — 잡담 응답에서도 더 이상 참고하지 않는다.
    theory_context = _retrieve_theory_context(user_message) if _looks_swim_related(user_message) else ""
    grounding_note = (
        f"\n\n[기술 이론 자료 — 답변 근거로만 쓰십시오. 이 자료와 무관한 질문이면 "
        f"무시하고 평소처럼 일반 지식으로 답하십시오]\n{theory_context}"
        if theory_context else ""
    )
    system_note = HumanMessage(content=(
        "당신은 친절한 수영 개인 코치 챗봇 \"그로우디\"입니다. 회원과 자유롭게 대화하십시오. "
        "훈련 세션을 만들어달라는 요청이 아니므로 세션 JSON을 출력하지 말고, "
        "짧고 자연스러운 한국어 문장으로만 답하십시오. "
        f"회원 프로필 참고: 목표 {profile.get('goal_type','미지정')}, 나이 {profile.get('age','?')}."
        + grounding_note
    ))
    messages = [system_note] + history_messages[-MAX_HISTORY_TURNS * 2:] + [HumanMessage(content=user_message)]
    resp = chat_llm.invoke(messages)
    return resp.content


# =====================================================================
# 3. 대화 루프
# =====================================================================
def _load_profile(profile_path):
    with open(profile_path, encoding="utf-8") as f:
        return json.load(f)


def _summarize_session(result: dict) -> str:
    if result.get("referral"):
        return result["message"]
    s = result.get("session_summary", {})
    pc = result.get("plan_context", {})
    lines = [
        f"[{pc.get('phase', '?')}] {s.get('focus_point', '')}",
        f"총 {s.get('total_distance_m', '?')}m / {s.get('total_min', '?')}분",
    ]
    hint = result.get("next_session_hint")
    if hint:
        lines.append(f"다음 세션 방향: {hint}")
    lines.append("(전체 JSON은 'json' 이라고 입력하면 볼 수 있습니다)")
    return "\n".join(lines)


def _generate_and_reply(request_text: str, profile_path, profile: dict,
                        session_history: list, last_feedback):
    """generate_personal_session() 호출 + 응답 요약 + session_history 갱신을
    묶은 헬퍼. GENERATE_SESSION 즉시 처리 경로와 슬롯 답변 완료 후 처리 경로
    양쪽에서 그대로 재사용한다. 반환: (reply, result, new_last_feedback)"""
    # §3-1: 채팅은 매 응답마다 프로필을 새로 읽는다(캐시하지 않음).
    current_profile = _load_profile(profile_path) if profile_path else profile
    request_body = {
        "profile": current_profile,
        "request": request_text,
        "session_history": session_history,
        "last_feedback": last_feedback,
        "today": date.today().isoformat(),
    }
    result = generate_personal_session(request_body)
    reply = _summarize_session(result)
    if not result.get("referral"):
        pc = result.get("plan_context", {})
        session_history.append({
            "date": date.today().isoformat(),
            "category": pc.get("category"),
            "zone": pc.get("zone"),
            "total_distance_m": result.get("session_summary", {}).get("total_distance_m"),
        })
        last_feedback = None  # 이번 세션에 대한 피드백은 아직 없음
    return reply, result, last_feedback


def run_chat(profile: dict, profile_path: str = None):
    print("개인 모드 채팅을 시작합니다. 'exit' 입력 시 종료.")
    print("예: '오늘 스피드 위주로 훈련 만들어줘' / '오늘 훈련 다 했어요, rpe 8이었어요' / 그 외 자유 대화\n")

    history_messages = []       # chat_llm용 (HumanMessage/AIMessage)
    history_text_log = []       # classify_intent용 짧은 텍스트 로그
    session_history = []        # generate_personal_session의 session_history 입력
    last_feedback = None
    last_result = None
    # GENERATE_SESSION인데 슬롯(영법/초점/컨디션)이 덜 채워졌을 때, 되물은 뒤
    # "다음 턴은 슬롯 답변"이라는 걸 기억해두는 상태. {"original_message":...,
    # "filled":...} 또는 None(대기 중인 질문 없음).
    pending_session_request = None

    while True:
        try:
            user_message = input("회원> ").strip()
        except EOFError:
            break
        if not user_message:
            continue
        if user_message.lower() == "exit":
            break
        if user_message.lower() == "json" and last_result is not None:
            print(json.dumps(last_result, ensure_ascii=False, indent=2))
            continue

        recent_text = "\n".join(history_text_log[-MAX_HISTORY_TURNS:])

        if pending_session_request is not None:
            # 직전 턴에 슬롯을 되물었으므로, 이번 입력은 새로 의도 분류하지 않고
            # 곧장 "슬롯 답변"으로 취급한다 — 원래 메시지 + 이미 채운 슬롯 +
            # 이번에 채운 슬롯을 합쳐 request 문자열 하나로 만들어 넘긴다.
            answer = find_missing_slots(user_message, recent_text)
            merged_filled = {**pending_session_request["filled"], **answer["filled"]}
            combined_request = _compose_request_text(
                pending_session_request["original_message"], merged_filled)
            reply, last_result, last_feedback = _generate_and_reply(
                combined_request, profile_path, profile, session_history, last_feedback)
            pending_session_request = None

        else:
            intent = classify_intent(user_message, recent_text)

            if intent == "GENERATE_SESSION":
                slots = find_missing_slots(user_message, recent_text)
                if slots["missing"]:
                    pending_session_request = {
                        "original_message": user_message,
                        "filled": slots["filled"],
                    }
                    reply = _build_missing_slots_question(slots["missing"])
                else:
                    combined_request = _compose_request_text(user_message, slots["filled"])
                    reply, last_result, last_feedback = _generate_and_reply(
                        combined_request, profile_path, profile, session_history, last_feedback)

            elif intent == "FEEDBACK":
                parsed = extract_feedback(user_message)
                last_feedback = parsed
                reply = (f"기록했습니다 (완료: {parsed['completed']}, 체감 RPE: {parsed['rpe_actual']}). "
                        "다음 세션 생성 시 반영할게요.")

            else:  # CHAT
                reply = chat_reply(user_message, history_messages, profile)

        print(f"코치> {reply}\n")
        history_messages.append(HumanMessage(content=user_message))
        history_messages.append(AIMessage(content=reply if isinstance(reply, str) else json.dumps(reply, ensure_ascii=False)))
        history_text_log.append(f"회원: {user_message}")
        history_text_log.append(f"코치: {reply if isinstance(reply, str) else '(세션 생성됨)'}")


if __name__ == "__main__":
    import warnings
    warnings.filterwarnings("ignore")
    import logging
    logging.getLogger().setLevel(logging.ERROR)

    profile_path = sys.argv[1] if len(sys.argv) > 1 else None
    if profile_path:
        profile = _load_profile(profile_path)
        print(f"(프로필 파일 사용: {profile_path} — 세션 생성 시마다 다시 읽습니다)")
    else:
        profile = {
            "pb_50m": {"free": None, "back": None, "breast": None, "fly": None},
            "css_pace_sec_per_100m": 95,
            "weekly_frequency": 3, "goal_type": "RECORD", "target_event_date": "2026-10-01",
            "age": 34, "activity_level": "REGULAR", "has_symptoms_or_disease": False,
            "desired_intensity": "VIGOROUS", "pool_length_m": 25, "session_duration_min": 60,
            "equipment": "", "rpe_calibration": 7,
        }
        print("(내장 샘플 프로필 사용 — 파일로 테스트하려면: python3 personal_chat_ver1.py my_profile.json)")

    run_chat(profile, profile_path)
