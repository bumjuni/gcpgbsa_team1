# rag_service.py (ver.4)
# ver.3 대비 변경 (2026-08-10):
#   [1] DB_PATH를 실행 위치(cwd) 기준 → 이 파일 위치 기준 절대경로로 변경.
#       (uvicorn 등 다른 폴더에서 실행 시 빈 DB를 새로 만들며 조용히 0건이 되는 버그 방지)
#   [2] 장비 가중치 도입: equipment 텍스트에서 장비를 감지해 목표 운동량에 배율 적용.
#       (오리발 1.20 / 패들 1.10 / 풀부이 0.95 / 킥판 0.85, 복수 장비는 평균) ★추정치, 강사 검수 필요
#   [3] 목표 운동량 판정을 "이동 시간" 기준으로 보정: 제자리(distance_m=0) 드릴 시간을
#       빼고 목표를 재계산. (플립턴 위주 세션 등에서 목표 미달로 오판하던 문제 해결)
#   [4] 목표 범위 벗어나면 LLM 1회 재생성 → 그래도 벗어나면 세트 수 기계적 비례 보정.
#   [5] 웜업/쿨다운 고강도 드릴 금지: 프롬프트 규칙 추가 + 고강도 드릴 명단 주입 + 코드 검증 경고.
#   [6] LLM JSON 파싱 실패 시 1회 재시도 후 실패 처리.
#   [7] 페이즈 명칭·JSON 키 변경: warmup/main/cooldown → pre_set/main_set/post_set.
#       ★ ResponseBody 계약 변경 — 서버 DB enum(SCHEMA.md phase)·앱 파싱 코드도 함께 변경 필요.
# (ver.3의 다른 로직 — 드릴 조건 조회, 레벨/나이대 테이블 — 은 그대로 유지)
import os
import json
import time
import warnings
from langchain_google_vertexai import VertexAIEmbeddings, ChatVertexAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage, HumanMessage
from dotenv import load_dotenv

from drill_picker import pick_drills, format_drills   # 드릴 라이브러리 조회

warnings.filterwarnings("ignore", category=UserWarning)

load_dotenv()

# =====================================================================
# 1. GCP 및 Vector DB 설정
# =====================================================================
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
os.environ["GOOGLE_CLOUD_PROJECT"] = GCP_PROJECT_ID
os.environ["CLOUD_ML_REGION"] = "asia-northeast3"

# [변경 1] cwd가 아니라 이 파일이 있는 폴더 기준으로 my_rag_db를 찾는다.
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "my_rag_db")

embedding_model = VertexAIEmbeddings(
    model_name="text-multilingual-embedding-002",
    project=GCP_PROJECT_ID,
    location="asia-northeast3"
)

# 한글 이론서 — 코칭 포인트 근거용으로만 사용
pdf_db = Chroma(collection_name="real_pdf_data", embedding_function=embedding_model,
                persist_directory=DB_PATH)

_llm_kwargs = dict(
    model_name="gemini-2.5-flash",
    temperature=0.3,
    project=GCP_PROJECT_ID,
    location="asia-northeast3",
    model_kwargs={"response_mime_type": "application/json"},
)
try:
    llm = ChatVertexAI(thinking_budget=1024, **_llm_kwargs)
except TypeError:
    print("⚠ thinking_budget 미지원 버전입니다. 속도 개선을 원하면:")
    print("   pip install -U langchain-google-vertexai")
    llm = ChatVertexAI(**_llm_kwargs)

# =====================================================================
# 1-2. 레벨·나이대별 목표 운동량 테이블
# ---------------------------------------------------------------------
# 근거: 판교스포츠센터 진도표(교정2=1,000m / 연수1=1,500m / 연수2=1,700m),
#      국내 마스터즈 동호인 실측(1시간 1,600~1,800m).
# ★ ELEMENTARY(초급)·INTERMEDIATE(중급)는 추정치 — 강사 검수 필요.
# =====================================================================
LEVEL_RATE = {
    "BEGINNER": 3, "ELEMENTARY": 9, "INTERMEDIATE": 15,
    "ADVANCED": 24, "MASTER": 30,
}
AGE_MULTIPLIER = {
    "PRESCHOOL": 0.5, "ELEMENTARY": 0.85, "TEEN": 1.0,
    "ADULT": 1.0, "SENIOR": 0.75,
}

# [변경 2] 장비별 운동량 가중치 — ★ 추정치, 강사 검수 필요.
#   같은 시간 동안 오리발·패들은 더 먼 거리를, 킥판·풀부이 세트는 더 짧은 거리를 만든다.
EQUIP_MULTIPLIER = {
    "fins": 1.20,      # 오리발: 추진력 증가
    "paddle": 1.10,    # 패들: 스트로크당 추진 증가
    "pullbuoy": 0.95,  # 풀부이: 하체 미사용
    "kickboard": 0.85, # 킥판: 킥 전용 세트는 이동 속도 낮음
}
EQUIP_KEYWORDS = {
    "fins": ["오리발", "핀", "fin"],
    "paddle": ["패들", "paddle"],
    "kickboard": ["킥판", "킥보드", "보드", "kickboard", "board"],
    "pullbuoy": ["풀부이", "풀부표", "pull buoy", "pullbuoy", "buoy"],
}

# ★★ 주의: 대소문자 변환(.upper() 등)을 절대 쓰지 말 것.
#    DB enum의 'beginner'는 초급, RequestBody의 'BEGINNER'는 신규라서
#    대문자 변환 시 수준이 한 단계씩 밀립니다.
LEVEL_ALIAS = {
    "BEGINNER": "BEGINNER", "ELEMENTARY": "ELEMENTARY",
    "INTERMEDIATE": "INTERMEDIATE", "ADVANCED": "ADVANCED", "MASTER": "MASTER",
    "new": "BEGINNER", "beginner": "ELEMENTARY", "intermediate": "INTERMEDIATE",
    "advanced": "ADVANCED", "masters": "MASTER",
}
AGE_ALIAS = {
    "PRESCHOOL": "PRESCHOOL", "ELEMENTARY": "ELEMENTARY", "TEEN": "TEEN",
    "ADULT": "ADULT", "SENIOR": "SENIOR",
    "toddler": "PRESCHOOL", "elementary": "ELEMENTARY", "teen": "TEEN",
    "adult": "ADULT", "senior": "SENIOR",
}


def _round25(x):
    """25m 단위 반올림."""
    return int(round(x / 25.0) * 25)


def detect_equip_multiplier(equipment_text: str):
    """[변경 2] 장비 텍스트(한국어/영어)에서 장비를 감지해 (배율, 감지목록)을 반환.
    복수 장비면 배율의 평균, 감지 실패 시 1.0."""
    text = (equipment_text or "").lower()
    found = []
    for equip, keywords in EQUIP_KEYWORDS.items():
        if any(k in text for k in keywords):
            found.append(equip)
    if not found:
        return 1.0, []
    mult = sum(EQUIP_MULTIPLIER[e] for e in found) / len(found)
    return mult, found


def calc_target_distance(level: str, age_group: str, duration_min: int,
                         equip_mult: float = 1.0):
    """레벨·나이대·수업시간(·장비 배율)으로 목표 운동량(m)을 계산.
    반환: (min, center, max)
    [변경 2] equip_mult 인자 추가 (기본 1.0 — 기존 호출과 호환)."""
    lv = LEVEL_ALIAS.get(level, "ELEMENTARY")
    ag = AGE_ALIAS.get(age_group, "ADULT")
    center = duration_min * LEVEL_RATE[lv] * AGE_MULTIPLIER[ag] * equip_mult

    return _round25(center * 0.8), _round25(center), _round25(center * 1.2)


def calc_phase_minutes(duration_min: int):
    """웜업/메인/쿨다운 목표 시간(분). 합은 항상 duration_min과 정확히 일치."""
    warmup = round(duration_min * 0.18)
    cooldown = round(duration_min * 0.12)
    main = duration_min - warmup - cooldown
    return warmup, main, cooldown


# =====================================================================
# 2. 최종 프롬프트 (v1.6)
#    [변경 5] "웜업·쿨다운 강도 제한" 블록 추가. 그 외 본문은 v1.5와 동일.
# =====================================================================
prompt_template = ChatPromptTemplate.from_template("""
# Role
당신은 10년 차 이상의 베테랑 전문 수영 코치이자 프로그램 디자이너입니다.
[드릴 목록]에서 항목을 골라 안전하고 효과적인 수영 세션 계획표를 작성합니다.

# 입력 데이터 해석

★ age_group과 level에는 ELEMENTARY라는 값이 둘 다 존재하지만 의미가
  완전히 다릅니다. 반드시 어느 필드의 값인지 확인하고 해석하십시오.

- age_group (나이대):
    PRESCHOOL(유아) · ELEMENTARY(초등) · TEEN(청소년) · ADULT(성인) · SENIOR(시니어)
- level (수준):
    BEGINNER(신규) · ELEMENTARY(초급) · INTERMEDIATE(중급) · ADVANCED(상급) · MASTER(마스터)
    → level의 BEGINNER는 "초급"이 아니라 신규(입문)입니다.
    → level의 ELEMENTARY는 "초등"이 아니라 초급입니다.

- duration_min: 수업 길이(분) / capacity: 정원(명)
- goal / goal_etc: 수업 목표 / equipment: 사용 장비 / request: 강사 자유 요청

★ class_name(반 이름)은 강사가 임의로 지은 이름입니다. 이름에 "초급반",
  "마스터반" 같은 단어가 들어 있어도 수준 판단 근거로 삼지 마십시오.
  수준은 오직 level 값으로만 판단합니다.

# ★ 드릴 선택 규칙 (가장 중요)
- 세션 항목은 반드시 아래 [드릴 목록]에 있는 것만 사용하십시오.
  이 목록은 이미 이 반의 수준·나이대·영법·장비에 맞게 걸러진 것입니다.
- 목록에 없는 드릴을 만들어내지 마십시오.
- title은 목록의 드릴 이름을 그대로 쓰십시오(한글명이 있으면 한글명).
- 각 드릴의 `배치` 표시를 참고해 구간을 정하십시오.
  배치 표시와 출력 구간의 대응: warmup→pre_set / main→main_set / cooldown→post_set.
- 목록의 `⚠` 경고는 반드시 반영하십시오. 위험 경고가 있는 드릴을
  유아·신규 세션에 넣지 마십시오.

# ★ 목표 운동량 (반드시 지킬 것)
이 세션의 목표 총 운동량은 {target_center}m 입니다.
허용 범위는 {target_min}m ~ {target_max}m 이지만, 하한에 겨우 맞추지 말고
{target_center}m에 가깝게 구성하십시오.
모든 항목의 (set × distance_m) 합이 이 값이 되도록 세트 수와 거리를
조정하십시오. 부족하면 세트 수를 늘리십시오.
(거리 개념이 없는 제자리 드릴은 이 합계에 포함되지 않습니다)

# ★ 나이대와 레벨의 역할 구분
- level이 훈련 강도와 세트 구성을 결정합니다.
- age_group은 안전 배려와 설명 방식만 결정합니다.
- 둘이 어긋나 보여도 level을 우선하십시오.
  예: age_group=ELEMENTARY, level=MASTER 인 경우
  → "초급 수업"이 아니라, 마스터 수준의 훈련을 초등학생이
     이해할 수 있게 설명한 것이어야 합니다.

# 레벨별 훈련 구성 기준
- BEGINNER(신규): 물 적응·호흡·뜨기·단일 동작 반복. 거리보다 시간·횟수 중심.
- ELEMENTARY(초급): 한 영법 완영이 목표. 25m 단위. 부분 동작 분리 연습 중심.
- INTERMEDIATE(중급): 2~3영법 구사. 25~50m 단위. 교정 드릴과 연속 수영을 섞습니다.
- ADVANCED(상급): 인터벌 훈련 도입. 50~100m 세트. 페이스 조절, 스트로크 효율.
- MASTER(마스터): 기록·대회 지향. 인터벌 세트(예: 4×100m 휴식 20초),
  스프린트 세트와 지구력 세트를 구분해 배치합니다.

# 장비 활용
- 목록의 `필수장비`가 있는 드릴은 그 장비가 반드시 필요합니다.
  강사가 준비한 장비(equipment)에 없는 장비를 요구하는 드릴은 쓰지 마십시오.
- `선택장비`는 없어도 수행할 수 있으므로 자유롭게 쓰십시오.
- 강사가 장비를 준비했다면 그 장비를 쓰는 드릴을 최소 1개 포함하십시오.
  목록에 해당 장비 드릴이 없으면 focus_point에 그 사실을 밝히십시오.

# 드릴 다양성
- 같은 드릴을 Pre-Set·Main-Set·Post-Set에 중복해서 넣지 마십시오.
- Main-Set에는 서로 다른 훈련 목적(기술 교정 / 지구력 / 스피드 / 협응)이
  최소 2가지 이상 섞이도록 구성하십시오.

# ★ Pre-Set·Post-Set 강도 제한
- Pre-Set과 Post-Set에는 스프린트, 스타트, 폭발적 동작, 고강도 드릴을
  절대 배치하지 마십시오.
- Pre-Set은 저강도 유영·감각 익히기 드릴만, Post-Set은 저강도 이지 스윔이나
  이완성 드릴만 배치하십시오.
- [드릴 목록] 하단에 "고강도 드릴" 명단이 있으면, 그 드릴들은
  Main-Set에만 배치할 수 있습니다.

# 항목 개수와 시간 배분 (시간은 이미 계산되어 있습니다)
- pre_set:  최대 3개 항목, 합계 정확히 {warmup_min}분
- main_set: 최대 5개 항목, 합계 정확히 {main_min}분
- post_set: 최대 2개 항목, 합계 정확히 {cooldown_min}분
각 구간에 배정된 분을 그 구간의 항목들에 나눠 담으십시오.
구간별 합계가 위 숫자와 정확히 일치해야 합니다.

# 항목 필드 (하나의 문자열로 합치지 마십시오)
- title: 드릴 이름 (목록의 이름 그대로, 100자 이내)
- set: 반복 횟수 (정수, 최소 1)
- distance_m: 반복 1회당 거리(m), 정수.
  물 적응·호흡·스트레칭처럼 이동 거리가 없는 드릴은 0을 쓰고,
  title 끝에 "(제자리)"를 붙여 구분하십시오.
- duration_min: 이 항목 소요 시간(분), 정수
- detail: 현장 강사가 바로 쓸 수 있는 코칭 포인트 한 문장. 80자 이내.
  목록의 `방법`과 [기술 이론 자료]를 근거로, 자세의 핵심이나 흔한 실수를
  짚어주십시오. ("천천히 유영합니다" 같은 정보 없는 문장은 금지)

# 출력 형식
- 유효한 단일 JSON 객체만 출력합니다. 마크다운, 인삿말, 부연 설명 금지.
- 총 운동량·총 시간의 합계는 서버가 계산하므로 출력하지 마십시오.
- title과 detail은 반드시 한글로 작성하십시오. 목록의 드릴명이 영어면
  한국 수영장에서 통용되는 한글 표현으로 옮겨 쓰십시오.
- "context", "RAG", "목록", "제공된 자료" 같은 내부 용어를 출력에
  쓰지 마십시오. 강사가 그대로 읽는 문장입니다.

# JSON Output Schema
{{
  "session_summary": {{
    "focus_point": "이 세션의 핵심 지도 목표. 마침표 하나로 끝나는 한 문장, 100자 이내"
  }},
  "program": {{
    "pre_set": [
      {{
        "title": "자유형 이지 스윔",
        "set": 4,
        "distance_m": 50,
        "duration_min": 10,
        "detail": "어깨 힘을 빼고 스트로크를 길게 가져가며 물감을 익힙니다."
      }}
    ],
    "main_set": [
      {{
        "title": "캐치업 드릴",
        "set": 8,
        "distance_m": 25,
        "duration_min": 20,
        "detail": "앞손이 완전히 뻗어 대기한 뒤 반대 팔이 들어오게 해 스트로크를 늘립니다."
      }}
    ],
    "post_set": [
      {{
        "title": "배영 이지",
        "set": 2,
        "distance_m": 50,
        "duration_min": 5,
        "detail": "자유형과 반대 근육을 쓰며 어깨 긴장을 풀어줍니다."
      }}
    ]
  }}
}}

---
[드릴 목록 — 이 안에서만 고르십시오]
{drill_list}

[기술 이론 자료 — 코칭 포인트 작성 근거로만 쓰십시오]
{context}

[수업 정보 & 강사 요청사항 (Input JSON)]:
{class_info}
""")


# =====================================================================
# 2-2. 응답 후처리 헬퍼  [변경 3][4]
# =====================================================================
def _collect_items(result: dict):
    """program의 warmup/main/cooldown 항목을 하나의 리스트로."""
    program = result.get("program", {})
    items = []
    for phase in ("pre_set", "main_set", "post_set"):
        items.extend(program.get(phase, []) or [])
    return items


def _sum_distance(items):
    return sum(int(i.get("set", 0) or 0) * int(i.get("distance_m", 0) or 0)
               for i in items)


def _sum_minutes(items):
    return sum(int(i.get("duration_min", 0) or 0) for i in items)


def _stationary_minutes(items):
    """제자리(distance_m=0) 드릴들의 시간 합."""
    return sum(int(i.get("duration_min", 0) or 0) for i in items
               if int(i.get("distance_m", 0) or 0) == 0)


def _adjusted_targets(target_min, target_center, target_max,
                      duration_min, stationary_min):
    """[변경 3] 제자리 시간을 뺀 '이동 시간' 비율로 목표 운동량을 재조정.
    비율 하한 0.25 (전부 제자리여도 목표가 0으로 붕괴하지 않게)."""
    ratio = 1.0 - (stationary_min / duration_min) if duration_min else 1.0
    ratio = max(0.25, min(1.0, ratio))
    return (_round25(target_min * ratio),
            _round25(target_center * ratio),
            _round25(target_max * ratio),
            ratio)


def _rescale_sets(result: dict, adj_center: int):
    """[변경 4] 거리 있는 항목들의 set 수를 비례 조정해 합계를 목표에 근접시킨다."""
    items = _collect_items(result)
    moving = [i for i in items if int(i.get("distance_m", 0) or 0) > 0]
    cur = _sum_distance(moving)
    if cur <= 0 or adj_center <= 0:
        return False
    ratio = adj_center / cur
    for i in moving:
        new_set = max(1, int(round(int(i.get("set", 1) or 1) * ratio)))
        i["set"] = new_set
    return True


def _parse_llm_json(result_str: str):
    return json.loads(result_str)


# =====================================================================
# 3. rag_service 모듈
# =====================================================================
def generate_curriculum(request_body: dict) -> dict:
    """
    Server -> LLM RequestBody JSON(dict)을 받아
    LLM -> Server ResponseBody JSON(dict)을 반환합니다.

    ※ ResponseBody 형식은 기존 계약과 100% 동일합니다.
      session_summary의 total_min / total_distance_m은 LLM이 아니라
      이 함수가 항목에서 직접 합산해 채웁니다.
    """
    total_start_time = time.time()
    print("\n" + "=" * 50)
    print("[RAG-Service] 커리큘럼 생성 요청 시작")

    level = str(request_body.get("level", "ELEMENTARY"))
    age_group = str(request_body.get("age_group", "ADULT"))
    duration_min = int(request_body.get("duration_min", 50) or 50)
    request_text = str(request_body.get("request", "") or "")
    goal_text = f'{request_body.get("goal", "") or ""} {request_body.get("goal_etc", "") or ""}'
    equipment_text = str(request_body.get("equipment", "") or "")

    # 1) 목표 운동량 · 구간별 목표 시간  [변경 2: 장비 가중치 반영]
    equip_mult, equip_found = detect_equip_multiplier(equipment_text)
    target_min, target_center, target_max = calc_target_distance(
        level, age_group, duration_min, equip_mult)
    w_min, m_min, c_min = calc_phase_minutes(duration_min)
    print(f" ├──  목표 운동량: {target_center}m (허용 {target_min}~{target_max}m)")
    if equip_found:
        print(f" │     장비 가중치: x{equip_mult:.2f} ({', '.join(equip_found)})")
    print(f" ├──  목표 시간 배분: Pre-Set {w_min}분 / Main-Set {m_min}분 / Post-Set {c_min}분")

    # 2) 드릴 라이브러리 조건 조회 — 벡터 검색 아님
    pick_start = time.time()
    drills, info = pick_drills(
        level=LEVEL_ALIAS.get(level, "ELEMENTARY"),
        age_group=AGE_ALIAS.get(age_group, "ADULT"),
        request_text=request_text,
        goal_text=goal_text,
        equipment_text=equipment_text,
        limit=18,
    )
    drill_list_text = format_drills(drills)

    # [변경 5] 고강도 드릴 명단을 목록 하단에 주입 (웜업/쿨다운 배치 금지 근거)
    high_intensity_names = [d.get("name_en", "") for d in drills
                            if d.get("intensity") == "high" and d.get("name_en")]
    if high_intensity_names:
        drill_list_text += ("\n\n★ 고강도 드릴 (Pre-Set·Post-Set 배치 금지, Main-Set 전용): "
                            + ", ".join(high_intensity_names))

    pick_elapsed = time.time() - pick_start
    print(f" ├──  드릴 조회 완료: {pick_elapsed * 1000:.0f}ms "
          f"(후보 {info['pool']}개 → 선택 {len(drills)}개)")
    print(f" │     감지 — 영법:{info['strokes'] or '전체'} "
          f"스킬:{info['skills'] or '없음'} 장비:{info['equips'] or '없음'}")

    # 3) 한글 이론서 벡터 검색 — 코칭 포인트 근거용
    db_start = time.time()
    theory_query = f"{request_text} {goal_text}".strip() or "수영 지도 기술"
    raw = pdf_db.similarity_search(theory_query, k=8)
    seen, theory = set(), []
    for d in raw:
        key = d.page_content[:80]
        if key in seen:
            continue
        seen.add(key)
        theory.append(d)
    context_text = "\n".join(f"- {d.page_content}" for d in theory)
    db_elapsed = time.time() - db_start
    print(f" ├──  이론 자료 검색 완료: {db_elapsed:.2f}초 ({len(theory)}건, 중복제거 후)")

    # 4) LLM 실행
    class_info_text = json.dumps(request_body, ensure_ascii=False, indent=2)
    llm_start = time.time()
    base_messages = prompt_template.format_messages(
        drill_list=drill_list_text,
        context=context_text,
        class_info=class_info_text,
        target_min=target_min,
        target_center=target_center,
        target_max=target_max,
        warmup_min=w_min,
        main_min=m_min,
        cooldown_min=c_min,
    )
    response = llm.invoke(base_messages)
    result_str = response.content
    llm_elapsed = time.time() - llm_start

    usage = getattr(response, "usage_metadata", None) or {}
    think_tok = (usage.get("output_token_details") or {}).get("reasoning", 0)
    print(f" ├──  Gemini LLM JSON 생성 완료: {llm_elapsed:.2f}초 소요")
    print(f" │     입력 {usage.get('input_tokens', 0)} / 출력 {usage.get('output_tokens', 0)}"
          f" / thinking {think_tok} 토큰")

    # 5) 파싱  [변경 6: 실패 시 1회 재시도]
    try:
        result = _parse_llm_json(result_str)
    except Exception:
        print(" │  ⚠ JSON 파싱 실패 — 1회 재시도")
        retry_messages = base_messages + [
            AIMessage(content=result_str),
            HumanMessage(content="직전 응답이 유효한 JSON이 아닙니다. 규칙에 맞는 "
                                 "유효한 단일 JSON 객체만 다시 출력하십시오."),
        ]
        response = llm.invoke(retry_messages)
        result_str = response.content
        try:
            result = _parse_llm_json(result_str)
        except Exception as e:
            raise ValueError(f"LLM JSON 출력 파싱에 실패했습니다: {str(e)}\n응답 원문: {result_str}")

    # 6) [변경 3] 제자리 시간 기준으로 목표 재조정 후 판정
    items = _collect_items(result)
    stat_min = _stationary_minutes(items)
    adj_min, adj_center, adj_max, ratio = _adjusted_targets(
        target_min, target_center, target_max, duration_min, stat_min)
    if stat_min > 0:
        print(f" │     제자리 드릴 {stat_min}분 감지 → 목표 재조정: "
              f"{adj_center}m (허용 {adj_min}~{adj_max}m)")

    sum_distance = _sum_distance(items)

    # 7) [변경 4] 범위 벗어나면 LLM 1회 재생성
    if not (adj_min <= sum_distance <= adj_max):
        print(f" │  ⚠ 운동량 {sum_distance}m — 목표({adj_min}~{adj_max}m) 벗어남, 재생성 1회 시도")
        feedback = (f"직전 응답의 총 운동량(set × distance_m 합)이 {sum_distance}m로 "
                    f"목표 범위({adj_min}~{adj_max}m)를 벗어났습니다. "
                    f"거리 있는 드릴의 세트 수나 distance_m을 조정해 총합이 "
                    f"{adj_center}m에 가깝도록 다시 작성하십시오. "
                    f"드릴 구성과 나머지 규칙은 동일하게 유지하십시오.")
        retry_messages = base_messages + [
            AIMessage(content=result_str),
            HumanMessage(content=feedback),
        ]
        retry_start = time.time()
        retry_response = llm.invoke(retry_messages)
        print(f" │     재생성 완료: {time.time() - retry_start:.2f}초")
        try:
            retry_result = _parse_llm_json(retry_response.content)
            retry_items = _collect_items(retry_result)
            retry_sum = _sum_distance(retry_items)
            # 재생성 결과가 더 낫다면 채택
            if abs(retry_sum - adj_center) < abs(sum_distance - adj_center):
                result, items, sum_distance = retry_result, retry_items, retry_sum
                # 제자리 시간이 바뀌었을 수 있으므로 목표 재계산
                stat_min = _stationary_minutes(items)
                adj_min, adj_center, adj_max, ratio = _adjusted_targets(
                    target_min, target_center, target_max, duration_min, stat_min)
        except Exception:
            print(" │  ⚠ 재생성 응답 파싱 실패 — 첫 번째 결과 유지")

        # 8) 그래도 벗어나면 세트 수 기계적 보정
        if not (adj_min <= sum_distance <= adj_max):
            if _rescale_sets(result, adj_center):
                items = _collect_items(result)
                sum_distance = _sum_distance(items)
                print(f" │     세트 수 자동 보정 적용 → {sum_distance}m")

    # 9) [변경 5] Pre-Set/Post-Set 고강도 드릴 검증 (경고만)
    if high_intensity_names:
        program = result.get("program", {})
        for phase in ("pre_set", "post_set"):
            for item in (program.get(phase, []) or []):
                title_upper = str(item.get("title", "")).upper()
                for hn in high_intensity_names:
                    if hn.upper() in title_upper or title_upper in hn.upper():
                        print(f" │  ⚠ {phase}에 고강도 드릴 배치됨: {item.get('title')}")

    # 10) 총량은 서버가 계산해 채운다 (LLM 자체 신고값을 신뢰하지 않음)
    sum_min = _sum_minutes(items)
    result.setdefault("session_summary", {})
    result["session_summary"]["total_distance_m"] = sum_distance
    result["session_summary"]["total_min"] = sum_min

    # 11) 검증 경고 (실패 처리하지 않고 로그만)
    if sum_min != duration_min:
        print(f" │  ⚠ 시간 불일치: 항목 합 {sum_min}분 ≠ 수업 시간 {duration_min}분")
    if not (adj_min <= sum_distance <= adj_max):
        print(f" │  ⚠ 운동량 범위 벗어남: {sum_distance}m (조정 목표 {adj_min}~{adj_max}m)")

    total_elapsed = time.time() - total_start_time
    print(f" └── [최종 완료] 총 소요 시간: {total_elapsed:.2f}초  "
          f"|  총 {sum_distance}m / {sum_min}분")
    print("=" * 50 + "\n")

    return result