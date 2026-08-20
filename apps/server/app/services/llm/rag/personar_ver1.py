# personar_ver1.py — 개인(챗봇) 모드
# 근거: programlogic.md §3 (개인 설계)
#
# teamprogram_ver1_2.py의 §1 공통 코어(존 분류·게이팅·인터벌 세트 계산·Vertex/pdf_db
# 인프라)를 그대로 import해서 재사용한다 — 이 파일에는 개인 모드에만 필요한 로직
# (ACSM 스크리닝, 개인 강도 계산, 다중 세션 주기화, 피드백 루프)만 둔다.
# 팀 모드 파일을 건드리지 않고도 이 파일만 수정할 수 있도록 하기 위함(programlogic.md §5).
#
# 입출력 경계: 팀 모드와 동일하게 "요청 dict → 응답 dict" 순수 함수다.
# DB·세션 저장/조회는 별도로 관리되는 서버 레이어의 책임이며, 이 파일은 상태를
# 갖지 않는다 — 여러 세션에 걸친 정보(session_history, last_feedback)가 필요하면
# 호출자가 매번 request_body에 실어서 넘겨준다(팀 모드의 optional previous_session과
# 동일한 패턴, §2-5 참고).
#
# request_body에 들어가는 온보딩 필드(§3-2)의 상세 스펙은
# personal_onboarding_form.md 를 참고 — 이 파일의 _extract_profile()이 그 필드명과
# 정확히 일치해야 한다.
import json
import time

from teamprogram_ver1_2 import (
    pdf_db, llm,
    ZONE_PARAMS, CATEGORY_INFO, LEVEL_CATEGORY_GATING, PRE_POST_ZONE,
    LEVEL_ALIAS, AGE_ALIAS,
    calc_phase_minutes, calc_target_distance, detect_equip_multiplier, _round25,
    select_categories, get_zone_params, build_interval_set,
    _collect_items, _sum_distance, _sum_minutes, _parse_llm_json,
)
from drill_picker import pick_drills, format_drills
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage, HumanMessage

# =====================================================================
# 1. ACSM 사전 스크리닝 (§3-3)
# ---------------------------------------------------------------------
# 최신 ACSM 모델의 3요소만 본다: 현재 신체활동 수준 / 심혈관·대사·신장 질환
# 징후·진단 여부 / 원하는 운동 강도. 이 판단은 온보딩 1회 + 마이페이지에서
# §3-2C 항목을 수정한 직후에만 재실행한다(§3-1) — 매 세션 재실행하지 않는다.
# =====================================================================
def screen(activity_level: str, has_symptoms_or_disease: bool, desired_intensity: str) -> str:
    """activity_level: 'INACTIVE'|'REGULAR', desired_intensity: 'LIGHT_MODERATE'|'VIGOROUS'."""
    if has_symptoms_or_disease:
        return "REFER_TO_PHYSICIAN"
    if activity_level == "INACTIVE" and desired_intensity == "VIGOROUS":
        return "REFER_TO_PHYSICIAN"
    return "PROCEED"


# =====================================================================
# 2. 개인 강도 계산 (§3-4)
# ---------------------------------------------------------------------
# 존별 "무산소역치(AT) 대비 %"는 팀 모드에서는 버린 값이지만(선수 PB 전제),
# 개인 모드는 실측 페이스(CSS/PB)가 있으므로 되살려 쓴다.
# 출처: 훈련지도서 표5-1(EN1 80% · EN2 85% · EN3 90% · SP1 95% · SP2 97.5% · SP3 100%).
# CSS(역치) 페이스 자체가 EN2(85%) 지점이라고 보고, 다른 존은 그 비율로 스케일한다.
# ★ 선형 스케일 가정은 근사치 — 강사 검수 필요.
# =====================================================================
ZONE_PCT_OF_THRESHOLD = {
    "RECOVERY": 0.75, "EN1": 0.80, "EN2": 0.85, "EN3": 0.90,
    "SP1": 0.95, "SP2": 0.975, "SP3": 1.00, "RACE_PACE": 1.00,
}
_THRESHOLD_PCT = 0.85  # CSS/역치 페이스 자체의 기준 %


def calc_personal_intensity(threshold_pace_sec_per100, zone_key: str, rpe_calibration=None):
    """threshold_pace_sec_per100: CSS 테스트로 구한 100m당 역치 페이스(초). 없으면 None.
    반환: {"target_pace_sec": 100m당 목표 페이스(초) 또는 None, "rpe_target": int}"""
    zp = ZONE_PARAMS.get(zone_key) or PRE_POST_ZONE
    rpe_lo, rpe_hi = zp["rpe_range"]
    rpe_target = round((rpe_lo + rpe_hi) / 2)

    if threshold_pace_sec_per100:
        pct = ZONE_PCT_OF_THRESHOLD.get(zone_key, _THRESHOLD_PCT)
        # % 강도가 높을수록(더 빠를수록) 100m당 시간(초)은 짧아진다.
        target_pace = threshold_pace_sec_per100 * (_THRESHOLD_PCT / pct)
        return {"target_pace_sec": round(target_pace), "rpe_target": rpe_target}

    # 기록 없음 → RPE 기반 기본값 (§3-2E 캘리브레이션 참고용, 강제 조정은 하지 않음)
    return {"target_pace_sec": None, "rpe_target": rpe_target}


# =====================================================================
# 3. 다중 세션 주기화 (§3-5) — 팀 모드에 없는 개인 모드 핵심 기능
# ---------------------------------------------------------------------
# session_history: [{"date":..., "category":"B", "zone":"EN2", ...}, ...] 최신순.
# 대회 날짜 역산의 상세 계산식은 programlogic.md도 "원칙만 정의, 별도 설계 문서로
# 분리"라고 명시했다 — 여기서는 그 원칙(대회가 가까우면 SP/E 비중을 높인다)만
# 가벼운 휴리스틱으로 반영한다.
# =====================================================================
DELOAD_EVERY_N_SESSIONS = 4
TAPER_WINDOW_DAYS = 14


def _gating_candidates(category: str, level: str):
    lv = LEVEL_ALIAS.get(level, "ELEMENTARY")
    gating = LEVEL_CATEGORY_GATING.get(lv, LEVEL_CATEGORY_GATING["ELEMENTARY"])
    return {"B": gating["b_zones"], "C": gating["c_zones"], "E": gating["e_zones"]}.get(category, [])


def _step_zone(category: str, level: str, zone_key: str, steps: int):
    """zone_key를 그 카테고리의 후보 리스트 안에서 steps만큼(음수면 하향) 이동."""
    candidates = _gating_candidates(category, level)
    if not candidates or zone_key not in candidates:
        return zone_key
    idx = candidates.index(zone_key)
    new_idx = max(0, min(len(candidates) - 1, idx + steps))
    return candidates[new_idx]


def apply_periodization(session_history, target_event_date, category: str, level: str,
                        today: str = None):
    """§3-5. previous_session 1단계 상승 제한은 teamprogram_ver1_1의
    get_zone_params(...previous_session=...)가 이미 처리한다 — 여기서는 그 위에
    (a) N회마다 디로드 세션 삽입 (b) 대회 임박 시 고강도 카테고리 우대만 얹는다.
    반환: (recommended_category, is_deload: bool)"""
    is_deload = bool(session_history) and (len(session_history) % DELOAD_EVERY_N_SESSIONS
                                            == DELOAD_EVERY_N_SESSIONS - 1)

    recommended_category = category
    if target_event_date and today:
        try:
            from datetime import date
            d_event = date.fromisoformat(target_event_date)
            d_today = date.fromisoformat(today)
            days_left = (d_event - d_today).days
            if 0 <= days_left <= TAPER_WINDOW_DAYS:
                recommended_category = "E" if "E" in CATEGORY_INFO else category
        except ValueError:
            pass

    return recommended_category, is_deload


def apply_feedback_adjustment(last_feedback, category: str, level: str, planned_zone: str):
    """§3-7. 체감 RPE가 계획보다 훨씬(=2 이상) 높았으면 한 단계 하향, 낮았거나
    비슷하면 계획대로 진행한다. 조정 폭도 §3-5와 같은 '1단계' 규칙 안에서 이뤄진다."""
    if not last_feedback or planned_zone not in ZONE_PARAMS:
        return planned_zone
    rpe_actual = last_feedback.get("rpe_actual")
    if rpe_actual is None:
        return planned_zone
    rpe_lo, rpe_hi = ZONE_PARAMS[planned_zone]["rpe_range"]
    planned_mid = (rpe_lo + rpe_hi) / 2
    if rpe_actual >= planned_mid + 2:
        return _step_zone(category, level, planned_zone, -1)
    return planned_zone


# =====================================================================
# 4. 출력 스키마용 프롬프트 (§3-6) — 팀 모드 스키마와 무관, 자유 설계
# =====================================================================
personal_prompt_template = ChatPromptTemplate.from_template("""
# Role
당신은 개인 맞춤 수영 트레이닝을 설계하는 베테랑 코치입니다. 이 회원의 프로필과
오늘의 목표 존을 바탕으로 1회 세션 계획을 작성합니다.

# 이번 세션의 훈련 분류
{zone_summary}

# 개인 프로필 요약
{profile_summary}

# ★ Pre-Set·Post-Set 규칙
[Pre/Post 드릴 후보] 목록(낮은 강도로 사전 필터링됨)에서만 고르십시오.

# ★ Main-Set 구성 규칙
- content_type이 'drill'이면 [Main-Set 드릴 후보]에서만 고르십시오.
- content_type이 'interval_set'이면 [Main-Set 인터벌 세트 지시]의 title·set·
  distance_m을 그대로 사용하고, target_pace_sec은 아래 [개인 강도] 값을 쓰십시오.

# ★ 개인 강도
{intensity_note}
각 항목에 target_pace_sec(정수, 초 단위. 페이스 정보가 없으면 null)과
rpe_target(정수 0~10)을 반드시 채우십시오.

# ★ 목표 운동량
목표 총 운동량은 {target_center}m (허용 {target_min}~{target_max}m)이며,
Pre-Set {warmup_min}분 / Main-Set {main_min}분 / Post-Set {cooldown_min}분입니다.

# 항목 필드
- title/set/distance_m/duration_min: 팀 모드와 동일한 의미.
- target_pace_sec: 100m 기준 목표 페이스(초). 없으면 null.
- rpe_target: 목표 체감강도(0~10, CR-10).
- detail: 코칭 포인트 한 문장(80자 이내).
- effect: 이 항목이 전체 계획에서 어떤 효과를 내는지 한 문장(60자 이내).

# 출력 형식
유효한 단일 JSON 객체만 출력합니다. 마크다운·설명 금지. 한글로 작성.

# JSON Output Schema
{{
  "plan_context": {{
    "phase": "{plan_phase}",
    "note": "이번 세션이 전체 계획에서 어떤 위치인지 한 문장"
  }},
  "session_summary": {{ "focus_point": "이 세션의 핵심 목표, 100자 이내" }},
  "program": {{
    "pre_set": [ {{"title":"...", "set":1, "distance_m":50, "duration_min":5,
                    "target_pace_sec": null, "rpe_target": 3,
                    "detail":"...", "effect":"..."}} ],
    "main_set": [ "...동일 구조..." ],
    "post_set": [ "...동일 구조..." ]
  }},
  "next_session_hint": "다음 세션 방향 한 문장",
  "feedback_request": ["오늘 세션 완료했나요?", "체감 강도는 몇 점이었나요(0-10)?"]
}}

---
[Pre/Post 드릴 후보]
{pre_post_drill_list}

[Main-Set 드릴 후보]
{main_drill_list}

[Main-Set 인터벌 세트 지시]
{interval_set_instructions}

[기술 이론 자료]
{context}

[회원 요청사항]
{request_text}
""")


# =====================================================================
# 5. 헬퍼 — 프로필 해석 / 드릴 풀 구성 (teamprogram_ver1_1과 동일한 사전 차단 철학)
# =====================================================================
def _age_group_from_age(age):
    if age is None:
        return "ADULT"
    age = int(age)
    if age < 7:
        return "PRESCHOOL"
    if age < 13:
        return "ELEMENTARY"
    if age < 19:
        return "TEEN"
    if age < 65:
        return "ADULT"
    return "SENIOR"


def _infer_level(profile: dict):
    """★ 추정치 — PB/CSS 유무와 주당 빈도로 개인의 훈련 레벨을 근사한다.
    강사 검수 필요. request_body가 level을 직접 지정하면 그것을 우선한다."""
    if profile.get("level"):
        return str(profile["level"])
    freq = int(profile.get("weekly_frequency", 0) or 0)
    pb_50m = profile.get("pb_50m") or {}
    has_record = bool(any(v is not None for v in pb_50m.values())
                      or profile.get("css_pace_sec_per_100m"))
    if freq <= 1 and not has_record:
        return "BEGINNER"
    if freq <= 2:
        return "ELEMENTARY"
    if freq <= 3:
        return "INTERMEDIATE"
    if freq <= 5:
        return "ADVANCED"
    return "MASTER"


def _build_drill_pools(level, age_group, request_text, goal_text, equipment_text, need_main_drills):
    drills, info = pick_drills(
        level=LEVEL_ALIAS.get(level, "ELEMENTARY"),
        age_group=AGE_ALIAS.get(age_group, "ADULT"),
        request_text=request_text, goal_text=goal_text, equipment_text=equipment_text,
        limit=18,
    )
    pre_post_drills = [d for d in drills if d.get("intensity") == "low"]
    pre_post_drill_list = format_drills(pre_post_drills) or "(후보 없음)"
    main_drill_list = format_drills(drills) if need_main_drills else "(이번 세션의 Main-Set은 인터벌 세트로만 구성됩니다)"
    return pre_post_drill_list, main_drill_list, drills


def _build_interval_instructions(categories, zone_plan, dist_share, dur_share, intensity_by_cat):
    lines = []
    for cat in categories:
        zp = zone_plan[cat]
        if zp["content_type"] != "interval_set":
            continue
        items = build_interval_set(zp, dist_share, dur_share)
        pace_info = intensity_by_cat.get(cat, {})
        for it in items:
            lines.append(
                f"- [{cat}] title=\"{it['title']}\" set={it['set']} distance_m={it['distance_m']} "
                f"(휴식 가이드: {it['rest_desc']}) target_pace_sec={pace_info.get('target_pace_sec')} "
                f"rpe_target={pace_info.get('rpe_target')} 목적: {it['purpose']}"
            )
    return "\n".join(lines) or "(이번 세션은 인터벌 세트가 없습니다)"


# =====================================================================
# 6. 메인 진입점
# =====================================================================
def generate_personal_session(request_body: dict) -> dict:
    """
    요청 dict → 응답 dict 순수 함수 (DB/세션 저장 없음, 호출자가 이력을 넘겨준다).

    request_body 필드(§3-2, personal_onboarding_form.md 참고):
      profile: {age, activity_level, has_symptoms_or_disease, desired_intensity,
                pb_50m, css_pace_sec_per_100m, weekly_frequency,
                goal_type, target_event_date, pool_length_m, session_duration_min,
                equipment, rpe_calibration, level(optional)}
      request: 자유 요청 텍스트
      session_history: optional list (최신 항목이 마지막 세션)
      last_feedback: optional {"completed": bool, "rpe_actual": int}
      today: optional "YYYY-MM-DD" (주기화 계산 기준일, 없으면 오늘 날짜 로직 스킵)
    """
    total_start = time.time()
    print("\n" + "=" * 50)
    print("[personar_ver1] 개인 세션 생성 요청 시작")

    profile = request_body.get("profile", {}) or {}
    request_text = str(request_body.get("request", "") or "")
    session_history = request_body.get("session_history") or []
    last_feedback = request_body.get("last_feedback") or None
    today = request_body.get("today")

    # 1) ACSM 사전 스크리닝 (§3-3) — REFER면 세션 생성 자체를 하지 않는다.
    screen_result = screen(
        activity_level=profile.get("activity_level", "INACTIVE"),
        has_symptoms_or_disease=bool(profile.get("has_symptoms_or_disease", False)),
        desired_intensity=profile.get("desired_intensity", "LIGHT_MODERATE"),
    )
    if screen_result == "REFER_TO_PHYSICIAN":
        print(" └── ACSM 스크리닝 결과: REFER_TO_PHYSICIAN — 세션 생성 중단")
        return {
            "referral": True,
            "message": "현재 입력하신 건강 정보로는 운동 전 전문의 상담이 먼저 필요합니다. "
                       "의료진과 상담 후 다시 이용해 주세요.",
        }

    age_group = _age_group_from_age(profile.get("age"))
    level = _infer_level(profile)
    duration_min = int(profile.get("session_duration_min", 50) or 50)
    goal_text = str(profile.get("goal_type", "") or "")
    equipment_text = str(profile.get("equipment", "") or "")

    equip_mult, equip_found = detect_equip_multiplier(equipment_text)
    target_min, target_center, target_max = calc_target_distance(level, age_group, duration_min, equip_mult)
    w_min, m_min, c_min = calc_phase_minutes(duration_min)

    # 2) 카테고리 선정 + 주기화 (§3-5) + 피드백 반영 (§3-7)
    categories = select_categories(level, age_group, goal_text, request_text)
    primary_category = categories[0] if categories else "D"
    recommended_category, is_deload = apply_periodization(
        session_history, profile.get("target_event_date"), primary_category, level, today)
    if recommended_category in CATEGORY_INFO and recommended_category not in categories:
        categories = [recommended_category] + [c for c in categories if c != recommended_category][:1]
    primary_category = categories[0] if categories else primary_category  # 위에서 바뀌었을 수 있으니 최종값으로 갱신

    previous_session = session_history[-1] if session_history else None

    zone_plan = {}
    for cat in categories:
        zp = get_zone_params(cat, level, "main_set", previous_session)
        if zp.get("zone") and last_feedback:
            adj_zone = apply_feedback_adjustment(last_feedback, cat, level, zp["zone"])
            if adj_zone != zp["zone"]:
                zp = get_zone_params(cat, level, "main_set", {"category": cat, "zone": adj_zone})
                zp["zone"] = adj_zone
                zp.update(ZONE_PARAMS[adj_zone])
        if is_deload and zp.get("zone"):
            deload_zone = _step_zone(cat, level, zp["zone"], -2)
            zp = dict(zp)
            zp["zone"] = deload_zone
            zp.update(ZONE_PARAMS.get(deload_zone, {}))
        zone_plan[cat] = zp

    n = max(1, len(categories))
    dist_share = _round25(target_center / n) if target_center else 0
    dur_share = max(1, m_min // n)

    # 3) 개인 강도 계산 (§3-4) — 카테고리별로 목표 zone의 pace/RPE 산출
    threshold_pace = profile.get("css_pace_sec_per_100m")
    rpe_calibration = profile.get("rpe_calibration")
    intensity_by_cat = {}
    for cat in categories:
        zone_key = zone_plan[cat].get("zone")
        intensity_by_cat[cat] = calc_personal_intensity(threshold_pace, zone_key, rpe_calibration) \
            if zone_key else {"target_pace_sec": None, "rpe_target": None}

    # 4) 드릴 풀 구성 (사전 차단 — teamprogram_ver1_1과 동일한 철학)
    need_main_drills = any(zone_plan[c]["content_type"] == "drill" for c in categories)
    pre_post_drill_list, main_drill_list, drills = _build_drill_pools(
        level, age_group, request_text, goal_text, equipment_text, need_main_drills)

    interval_set_instructions = _build_interval_instructions(
        categories, zone_plan, dist_share, dur_share, intensity_by_cat)

    zone_summary_lines = []
    for cat in categories:
        zp = zone_plan[cat]
        zone_summary_lines.append(
            f"- 카테고리 {cat}({CATEGORY_INFO[cat]['name_ko']}) → "
            f"존: {zp.get('name_ko') or zp.get('zone')} | content_type={zp['content_type']} | "
            f"목적: {zp.get('purpose', '')}"
        )
    if is_deload:
        zone_summary_lines.append("- ※ 이번 세션은 주기화 규칙상 디로드(회복) 세션입니다 — 강도를 낮추십시오.")
    zone_summary_lines.append(f"- Pre-Set·Post-Set → {PRE_POST_ZONE['name_ko']} | {PRE_POST_ZONE['purpose']}")
    zone_summary = "\n".join(zone_summary_lines)

    # stroke_primary는 온보딩 프로필에서 제거됐다 — 영법은 이제 profile이 아니라
    # 요청 시점에 request_text로 들어온다(personal_chat_ver1.find_missing_slots가
    # 채팅에서 물어봐서 request 문자열에 자연어로 녹여 넘김). 그래서 여기 요약에서도
    # 뺀다 — 매번 "미지정"만 찍히는 항목을 프롬프트에 남겨둘 이유가 없다.
    profile_summary = (
        f"나이 {profile.get('age', '?')} / 활동수준 {profile.get('activity_level', '?')} / "
        f"주 {profile.get('weekly_frequency', '?')}회 / 목표 {goal_text or '미지정'}"
    )
    if threshold_pace:
        intensity_note = f"이 회원의 역치(CSS) 페이스는 100m당 {threshold_pace}초입니다. 이를 기준으로 존별 목표 페이스를 스케일링하십시오."
    else:
        intensity_note = f"실측 페이스 기록이 없으므로 RPE 기반으로 지도하십시오(회원 자가 캘리브레이션: {rpe_calibration if rpe_calibration is not None else '미입력'}/10)."

    plan_phase = "RECOVERY" if is_deload else ("SP_BUILD" if recommended_category in ("C", "E") else "EN_BASE")

    # 5) 이론 자료 검색
    # ★ team 모드 RC10과 동일 — 검색어가 강사/회원 입력(request/goal)만 쓰면
    # 입력이 비어있을 때 매번 "수영 지도 기술"이라는 너무 일반적인 검색이 되고,
    # 채워져 있어도 이번 세션의 실제 존/카테고리와 무관할 수 있다.
    zone_focus = " ".join(zone_plan[c].get("name_ko", "") for c in categories)
    theory_query = f"{zone_focus} {request_text} {goal_text}".strip() or "수영 지도 기술"
    raw = pdf_db.similarity_search(theory_query, k=8)
    seen, theory = set(), []
    for d in raw:
        key = d.page_content[:80]
        if key in seen:
            continue
        seen.add(key)
        theory.append(d)
    context_text = "\n".join(f"- {d.page_content}" for d in theory)

    # 6) LLM 호출
    base_messages = personal_prompt_template.format_messages(
        zone_summary=zone_summary,
        profile_summary=profile_summary,
        intensity_note=intensity_note,
        pre_post_drill_list=pre_post_drill_list,
        main_drill_list=main_drill_list,
        interval_set_instructions=interval_set_instructions,
        context=context_text,
        request_text=request_text or "(별도 요청 없음)",
        target_min=target_min, target_center=target_center, target_max=target_max,
        warmup_min=w_min, main_min=m_min, cooldown_min=c_min,
        plan_phase=plan_phase,
    )
    response = llm.invoke(base_messages)
    result_str = response.content

    try:
        result = _parse_llm_json(result_str)
    except Exception:
        print(" │  ⚠ JSON 파싱 실패 — 1회 재시도")
        retry_messages = base_messages + [
            AIMessage(content=result_str),
            HumanMessage(content="직전 응답이 유효한 JSON이 아닙니다. 유효한 단일 JSON 객체만 다시 출력하십시오."),
        ]
        response = llm.invoke(retry_messages)
        result_str = response.content
        try:
            result = _parse_llm_json(result_str)
        except Exception as e:
            raise ValueError(f"LLM JSON 출력 파싱에 실패했습니다: {str(e)}\n응답 원문: {result_str}")

    items = _collect_items(result)
    sum_distance = _sum_distance(items)
    sum_min = _sum_minutes(items)
    result.setdefault("session_summary", {})
    result["session_summary"]["total_distance_m"] = sum_distance
    result["session_summary"]["total_min"] = sum_min
    plan_context = result.setdefault("plan_context", {})
    plan_context["phase"] = plan_context.get("phase") or plan_phase
    # 다음 세션 주기화(§3-5)를 이어가려면 호출자가 이번에 어떤 category/zone이
    # 쓰였는지 알아야 한다 — session_history에 그대로 append할 수 있게 노출한다.
    plan_context["category"] = primary_category
    plan_context["zone"] = zone_plan.get(primary_category, {}).get("zone")
    result.setdefault("feedback_request", ["오늘 세션 완료했나요?", "체감 강도는 몇 점이었나요(0-10)?"])

    print(f" └── [최종 완료] 총 소요 시간: {time.time() - total_start:.2f}초 "
          f"| 카테고리 {categories} | 디로드 {is_deload} | 총 {sum_distance}m / {sum_min}분")
    print("=" * 50 + "\n")
    return result
