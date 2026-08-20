# teamprogram_ver1.py — 팀(강사) 모드, rag_service_ver4.py 계승
# 근거: programlogic.md (§1 공통 코어, §2 팀 설계)
#
# ver4 대비 변경:
#   [1] §1 공통 코어 추가: CATEGORY_INFO/ZONE_PARAMS/LEVEL_CATEGORY_GATING
#       — 훈련지도서 8존(Recovery~SP3) 분류를 생활체육용으로 재해석한 표를 코드에 하드코딩.
#       (RAG로 표를 다시 읽어오지 않는 이유: PDF 추출 시 표의 행/열 구조가 깨져서
#        재현이 불안정함 — 사람이 검수한 값을 코드에 고정하는 쪽이 안전하다고 판단)
#   [2] select_categories()/get_zone_params()/build_interval_set() 추가.
#   [3] Pre-Set·Post-Set 드릴 후보를 "경고"가 아니라 "사전 차단"으로 승격:
#       intensity=='low'인 드릴만 후보 목록 자체에 포함시킨다.
#       (drill_library.json 감사 결과: intensity=='low' ⇔ phase에 warmup/cooldown 포함,
#        100% 일치하는 라벨이라 별도 재라벨링 없이 이 필드를 그대로 하드필터에 사용)
#   [4] Main-Set에서 카테고리가 EN2 이상/SP1~3/레이스페이스면 드릴 조회 없이
#       build_interval_set()으로 세트 구조(반복수·거리)를 먼저 계산해 프롬프트에 고정 지시로 준다.
#   [5] previous_session(optional) — 있으면 "강도 상승 1단계까지만" 규칙을 존 선택에 반영.
#   [6] 출력 스키마(session_summary/program.pre_set·main_set·post_set)는 ver4와 100% 동일.
# (그 외 목표운동량 계산·장비가중치·JSON 파싱 재시도·재생성·세트 수 보정 로직은 ver4와 동일하게 유지)
import os
import json
import time
import warnings
from collections import Counter
from langchain_google_vertexai import VertexAIEmbeddings, ChatVertexAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage, HumanMessage
from dotenv import load_dotenv

from .drill_picker import pick_drills, format_drills   # 드릴 라이브러리 조회

warnings.filterwarnings("ignore", category=UserWarning)

load_dotenv()

# =====================================================================
# 1. GCP 및 Vector DB 설정 (ver4와 동일)
# =====================================================================
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
os.environ["GOOGLE_CLOUD_PROJECT"] = GCP_PROJECT_ID
os.environ["CLOUD_ML_REGION"] = "asia-northeast3"

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
# 1-2. 레벨·나이대별 목표 운동량 테이블 (ver4와 동일)
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
EQUIP_KO = {"fins": "오리발", "paddle": "패들", "kickboard": "킥판", "pullbuoy": "풀부이"}

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
    """장비 텍스트(한국어/영어)에서 장비를 감지해 (배율, 감지목록)을 반환.
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
    반환: (min, center, max)"""
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
# 1-3. §1 공통 코어 — 존 분류 체계
# ---------------------------------------------------------------------
# 근거: 『체육지도자 훈련지도서 [수영]』 pp.221~232, 표 5-1~5-6
#      (apps/server/app/services/llm/my_rag_db 에 이미 임베딩되어 있음 — 897p 전체 ingest
#       완료 상태를 확인했으나, PDF의 표 구조가 텍스트 추출 시 깨져서 수치는
#       사람이 원문을 대조해 이 아래 표에 직접 옮겨 적었다. ★ 강사 검수 필요.)
# =====================================================================

# 존별 구조 파라미터. rep_unit_m은 build_interval_set()이 반복거리를 정할 때 쓰는
# (최소, 최대) 범위(m) — 원문의 "25~50m 단위" 같은 표현을 숫자로 옮긴 것.
#
# pace_factor: ★ 실측 테스트에서 발견한 문제의 수정치 — 강사 검수 필요.
#   LEVEL_RATE(레벨별 "분당 이동거리")는 원래 꾸준히 헤엄치는 연속 유영 기준이다.
#   SP1~3처럼 "짧게 전력질주 + 길게 휴식"하는 존을 이 기준 그대로 쓰면, 실제로는
#   쉬는 시간이 훨씬 많은데도 같은 분당 거리를 채우라고 요구하게 되어 — 반복수를
#   비현실적으로 부풀리거나(예: SP3에서 25m를 60~70회) 목표 미달로 계속
#   재생성되는 원인이 됐다. pace_factor는 LEVEL_RATE 대비 "휴식 포함 실질
#   분당 이동거리" 배율이다(1.0=연속 유영과 비슷, 낮을수록 휴식 비중이 큰 존).
#   생성 로직(generate_curriculum)이 목표 운동량·반복수를 계산할 때
#   `LEVEL_RATE × pace_factor`를 실제 기준으로 쓴다 — calc_target_distance()
#   자체는 건드리지 않는다(그건 카테고리/존을 모르는 일반 기본값으로 남겨둠).
ZONE_PARAMS = {
    "RECOVERY": dict(
        # ★ "회복"이 아니라 "리커버리"로 표기한다 — 스트로크 동작 중 팔이
        # 앞으로 되돌아오는 구간도 수영에서 "리커버리"라고 부르기 때문에,
        # 이 존(낮은 강도 구간)을 "회복"으로 번역해버리면 코칭 포인트를 쓸 때
        # 동작 설명(팔 리커버리)과 강도 존(리커버리 존)이 헷갈릴 수 있다.
        name_ko="리커버리(Recovery/A1)", rpe_range=(2, 3), rest_desc="자유",
        rep_unit_m=(0, 0), unit_desc="연속 이지스윔", content_type="drill", pace_factor=0.8,
        purpose="리커버리(가벼운 유영) — 스트로크 동작의 '리커버리'와는 다른 개념으로, "
               "부담 없는 페이스로 몸을 풀거나 다운시키는 낮은 강도 구간을 뜻한다.",
    ),
    "EN1": dict(
        name_ko="기초지구력(EN1)", rpe_range=(3, 4), rest_desc="10~30초",
        rep_unit_m=(25, 50), unit_desc="25~50m 단위, 다회 반복", content_type="drill", pace_factor=0.8,
        purpose="기초 지구력 — 가벼운 강도(RPE 3~4)로 다회 반복하며 지구력 기반을 다진다.",
    ),
    "EN2": dict(
        name_ko="역치지구력(EN2)", rpe_range=(5, 6), rest_desc="10~30초",
        rep_unit_m=(50, 100), unit_desc="50~100m 단위", content_type="interval_set", pace_factor=0.95,
        purpose="무산소역치 부근 강도(RPE 5~6)로 젖산 생성·제거 균형 능력을 향상시킨다.",
    ),
    "EN3": dict(
        name_ko="과부하지구력(EN3)", rpe_range=(7, 7), rest_desc="20초 또는 1:1",
        rep_unit_m=(100, 200), unit_desc="100~200m 단위", content_type="interval_set", pace_factor=1.2,
        purpose="최대산소섭취량 향상을 위한 과부하 지구력 훈련(RPE 7, 힘들다).",
    ),
    "SP1": dict(
        name_ko="젖산내성(SP1)", rpe_range=(8, 9), rest_desc="1:1~1:2",
        rep_unit_m=(50, 100), unit_desc="50~100m 단위", content_type="interval_set", pace_factor=0.85,
        purpose="젖산 내성 향상(RPE 8~9, 매우 힘들다) — 고강도 인터벌.",
    ),
    "SP2": dict(
        name_ko="젖산생성(SP2)", rpe_range=(9, 9), rest_desc="1:2~1:3",
        rep_unit_m=(25, 50), unit_desc="25~50m 단위", content_type="interval_set", pace_factor=0.55,
        purpose="젖산 생성 능력 향상(RPE 9) — 짧고 강한 인터벌.",
    ),
    "SP3": dict(
        name_ko="파워(SP3)", rpe_range=(9, 10), rest_desc="1:2~1:6",
        rep_unit_m=(12.5, 25), unit_desc="12.5~25m 단위", content_type="interval_set", pace_factor=0.5,
        purpose="파워(순발력) 향상(RPE 9~10, 최대) — 최대 강도의 초단거리 반복.",
    ),
    "RACE_PACE": dict(
        name_ko="레이스 페이스", rpe_range=(9, 10), rest_desc="세트 간 2~3분",
        rep_unit_m=(50, 200), unit_desc="출전 종목 거리 기준", content_type="interval_set", pace_factor=0.7,
        purpose="대회 시뮬레이션 — 목표 페이스 감각을 훈련한다.",
    ),
}
# Pre-Set·Post-Set은 메인 카테고리가 무엇이든 항상 이 zone만 쓴다(§1-3).
PRE_POST_ZONE = dict(
    name_ko="리커버리~기초지구력(Recovery/A1·EN1)", rpe_range=(2, 4), rest_desc="자유~10~30초",
    rep_unit_m=(0, 50), unit_desc="연속 이지스윔 또는 25~50m 단위", content_type="drill", pace_factor=0.8,
    purpose="본운동 전후 준비·정리 — 낮은 강도로 감각을 익히거나 이완한다.",
)

# 카테고리(강사에게 노출되는 상위 분류, §1-2). zones=None이면 존 개념 없이
# drill_library.json 조회로 끝(카테고리 A/D). zones가 있으면 그 안에서 레벨별로
# 허용된 zone 하나를 골라 EN2 이상은 interval_set으로 직접 계산한다.
CATEGORY_INFO = {
    "A": dict(name_ko="놀이·물적응", zones=None, keywords=["물적응", "놀이", "적응", "친수", "물놀이"]),
    "B": dict(name_ko="지구력", zones=["RECOVERY", "EN1", "EN2", "EN3"],
              keywords=["지구력", "체력", "완주", "오래", "페이스유지", "유산소"]),
    "C": dict(name_ko="스피드·파워", zones=["SP1", "SP2", "SP3"],
              keywords=["스피드", "파워", "순발력", "스프린트", "빠르게", "폭발"]),
    "D": dict(name_ko="기술·교정", zones=None, keywords=["교정", "자세", "기술", "폼", "호흡", "스트로크"]),
    "E": dict(name_ko="레이스 준비", zones=["RACE_PACE"], keywords=["대회", "시합", "레이스", "기록단축", "출전"]),
}

# 레벨 × 카테고리 게이팅(§1-5). b_zones/c_zones/e_zones가 비어 있으면 해당
# 카테고리 자체가 그 레벨에 허용되지 않는다는 뜻(SP1~3·레이스페이스는
# ADVANCED 이상만 — 검증되지 않은 회원 집단에 고강도 자동 배치 방지).
LEVEL_CATEGORY_GATING = {
    "BEGINNER":     dict(base=["A", "D"], b_zones=["RECOVERY", "EN1"], c_zones=[], e_zones=[]),
    "ELEMENTARY":   dict(base=["D"],      b_zones=["EN1"],             c_zones=[], e_zones=[]),
    "INTERMEDIATE": dict(base=["D"],      b_zones=["EN1", "EN2"],      c_zones=[], e_zones=[]),
    "ADVANCED":     dict(base=["D"],      b_zones=["EN1", "EN2", "EN3"], c_zones=["SP1"], e_zones=[]),
    "MASTER":       dict(base=["D"],      b_zones=["RECOVERY", "EN1", "EN2", "EN3"],
                          c_zones=["SP1", "SP2", "SP3"], e_zones=["RACE_PACE"]),
}
# age_group=PRESCHOOL(유아)이면 레벨과 무관하게 카테고리 A(놀이·물적응)만 허용.
AGE_CATEGORY_CAP = {"PRESCHOOL": {"A"}}


def _allowed_categories(level: str, age_group: str):
    lv = LEVEL_ALIAS.get(level, "ELEMENTARY")
    gating = LEVEL_CATEGORY_GATING.get(lv, LEVEL_CATEGORY_GATING["ELEMENTARY"])
    allowed = set(gating["base"])
    if gating["b_zones"]:
        allowed.add("B")
    if gating["c_zones"]:
        allowed.add("C")
    if gating["e_zones"]:
        allowed.add("E")
    ag = AGE_ALIAS.get(age_group, "ADULT")
    if ag in AGE_CATEGORY_CAP:
        allowed &= AGE_CATEGORY_CAP[ag]
    return allowed or {"A"}


def select_categories(level: str, age_group: str, goal_text: str, request_text: str):
    """§1-6. 레벨×나이대 게이팅으로 후보를 좁힌 뒤, goal/request 키워드로 1~2개 선정.
    강사가 명시적으로 요청한 게 있으면 그것을 우선한다."""
    allowed = _allowed_categories(level, age_group)
    text = f"{goal_text} {request_text}".lower()

    matched = [c for c in allowed if any(k in text for k in CATEGORY_INFO[c]["keywords"])]
    if matched:
        return matched[:2]

    # 기본 우선순위: 기술교정(D) → 지구력(B) → 놀이적응(A) → 스피드(C) → 레이스(E)
    priority = ["D", "B", "A", "C", "E"]
    picked = [c for c in priority if c in allowed][:2]
    return picked or list(allowed)[:2]


def _pick_zone_for_category(category: str, level: str, previous_session: dict = None):
    """카테고리 안에서 이번 세션에 쓸 zone을 하나 고른다.
    기본은 그 레벨에서 허용된 가장 높은 강도. previous_session이 있고 같은
    카테고리였다면 '1단계 이상 연속 상승 금지'(§2-5) 규칙으로 상한을 제한한다."""
    lv = LEVEL_ALIAS.get(level, "ELEMENTARY")
    gating = LEVEL_CATEGORY_GATING.get(lv, LEVEL_CATEGORY_GATING["ELEMENTARY"])
    key = {"B": "b_zones", "C": "c_zones", "E": "e_zones"}.get(category)
    if not key:
        return None
    candidates = gating[key]
    if not candidates:
        return None

    zone = candidates[-1]  # 레벨이 허용하는 한 가장 발전된 zone을 기본값으로
    if previous_session and previous_session.get("category") == category:
        prev_zone = previous_session.get("zone")
        if prev_zone in candidates:
            prev_idx = candidates.index(prev_zone)
            zone = candidates[min(prev_idx + 1, len(candidates) - 1)]
    return zone


def get_zone_params(category: str, level: str, phase: str, previous_session: dict = None):
    """§1-6. phase가 pre_set·post_set이면 카테고리와 무관하게 Recovery/A1~EN1로
    강제 치환한다(content_type은 항상 'drill'). phase가 main_set이면 선택된
    카테고리 그대로 조회 — content_type이 'drill'이면 drill_picker 경로,
    'interval_set'이면 build_interval_set() 경로로 이어진다."""
    if phase in ("pre_set", "post_set"):
        return dict(category=category, zone="PRE_POST", **PRE_POST_ZONE)

    info = CATEGORY_INFO[category]
    if info["zones"] is None:
        # 카테고리 A/D — 존 개념 없이 드릴 라이브러리 전체 조회.
        # 존 표에 없는 카테고리라 rest_desc도 없지만, 기술 드릴은 "다음 반복 전
        # 자세를 점검할 정도"로 쉬는 게 일반적인 지도 원칙이라 기본값을 준다.
        return dict(category=category, zone=None, content_type="drill", pace_factor=1.0,
                    # ★ 실측: 여기 값이 완결된 문장 형태("~후 다음 반복" 등)면 LLM이
                    # 그대로 베껴 써서 Main-Set 여러 항목의 detail이 토씨 하나 안 틀리고
                    # 똑같아지는 문제가 있었다 — 문장이 아니라 사실값(숫자)만 남긴다.
                    name_ko=info["name_ko"], rest_desc="15~30초",
                    purpose=f"{info['name_ko']} 중심 구성 — 자세 교정·감각 습득에 집중")

    zone_key = _pick_zone_for_category(category, level, previous_session)
    zp = ZONE_PARAMS[zone_key]
    return dict(category=category, zone=zone_key, **zp)


# 실측 테스트(라이브 Gemini 라운드)에서 나온 문제: 총 반복수를 캡 없이 한 항목에
# 다 몰아넣으면 "set=72" 같은 비현실적인 한 줄이 나온다(예: MASTER+스피드 60분
# 세션에서 SP3 인터벌이 72×25m로 통짜 배정됨). 실제 코치는 이렇게 안 짜고
# "8×25m를 3라운드" 식으로 나눈다. ★ 12는 임의로 잡은 상한 — 강사 검수 필요.
_MAX_REPS_PER_ROUND = 12
_MAX_ROUNDS = 4  # main_set 항목 수 상한(5개)을 넘지 않도록 여유를 둔 값

# 드릴 후보 풀이 "얇다"고 판단하는 기준. 실측: level=BEGINNER(신규)+영법 미지정
# 조합만 나이대 불문 풀이 2~5개로 붕괴하고, 그 외 조합은 전부 11개 이상(대부분
# 40~93개) — 그 사이인 8을 경계로 잡는다. PRE_POST_THIN_THRESHOLD=4는
# pick_drills()가 스스로 보장하려는 "저강도 최소 4개" 목표(§구간 균형)를
# 재사용한 값이다.
POOL_THIN_THRESHOLD = 8
PRE_POST_THIN_THRESHOLD = 4


def build_interval_set(zone_params: dict, target_distance_budget_m: int,
                       duration_budget_min: int, stroke_hint: str = "", equip_names=None):
    """main_set에서만 호출된다(pre_set·post_set은 이 함수를 호출하지 않는다).
    zone의 rep_unit_m·rest_desc로 세트 수·거리를 나눠 담는다. 드릴 조회 없음.
    반복수가 _MAX_REPS_PER_ROUND를 넘으면 한 항목이 아니라 여러 '라운드'
    항목으로 쪼개서 반환한다(호출부는 이미 리스트를 순회하므로 별도 처리 불필요).
    duration_min은 LLM이 구간 합계 규칙에 맞춰 채운다(기존 파이프라인과 동일하게
    최종 검증·재생성 단계에서 총량을 다시 검증한다).

    equip_names: ★ 실측 — Main-Set이 인터벌 세트로만 구성되면(예: 레이스페이스
    단독 선택) 드릴이 하나도 없어서 강사가 준비한 장비(오리발·패들 등)가 세션
    어디에도 안 나타나는 문제가 있었다. equip_names가 있으면 마지막 항목(라운드
    분할 시 마지막 라운드)에 장비를 명시해, 드릴이 없는 세션에서도 장비 사용이
    보장되게 한다. distance_m 자체는 이미 main_shares(_zone_aware_targets가
    equip_mult를 반영해 계산)로 들어오므로 여기서 다시 배율을 곱하지 않는다."""
    lo, hi = zone_params["rep_unit_m"]
    step = 12.5 if hi <= 25 else 25
    unit = lo if lo == hi else (lo + hi) / 2
    unit = max(step, round(unit / step) * step)

    total_reps = max(1, round(target_distance_budget_m / unit)) if target_distance_budget_m > 0 else 1
    unit_disp = int(unit) if float(unit).is_integer() else unit
    stroke_txt = f"{stroke_hint} " if stroke_hint else ""
    # ★ 반복수·거리를 title에 다시 박아넣지 않는다 — set/distance_m 필드에
    # 이미 그 값이 구조화되어 있어서, title에도 "12×150m"처럼 중복해서 넣으면
    # 같은 정보가 두 군데(제목 텍스트 vs 필드)에 따로 노는 꼴이 된다.
    base_title = f"{zone_params.get('name_ko', '')} {stroke_txt}인터벌".strip()
    rest_desc = zone_params.get("rest_desc", "")
    purpose = zone_params.get("purpose", "")
    equip_tag = f" · {'+'.join(equip_names)} 착용" if equip_names else ""
    equip_note = (f" (장비: {'+'.join(equip_names)} 착용 상태로 진행 — 장비 배율만큼 "
                 f"같은 시간에 더 먼 거리를 소화하도록 distance_m에 이미 반영됨)") if equip_names else ""

    if total_reps <= _MAX_REPS_PER_ROUND:
        return [{
            "title": base_title + equip_tag,
            "set": total_reps,
            "distance_m": unit_disp,
            "duration_min": duration_budget_min,
            "rest_desc": rest_desc,
            "purpose": purpose + equip_note,
        }]

    # 라운드로 분할 — 반복수·시간을 라운드 수만큼 최대한 고르게 나눈다.
    num_rounds = min(_MAX_ROUNDS, -(-total_reps // _MAX_REPS_PER_ROUND))  # ceil(total/cap)
    base_reps, rep_rem = divmod(total_reps, num_rounds)
    base_min, min_rem = divmod(duration_budget_min, num_rounds)

    items = []
    for i in range(num_rounds):
        is_last = (i == num_rounds - 1)
        items.append({
            "title": f"{base_title} {i + 1}라운드" + (equip_tag if is_last else ""),
            "set": base_reps + (1 if i < rep_rem else 0),
            "distance_m": unit_disp,
            "duration_min": max(1, base_min + (1 if i < min_rem else 0)),
            "rest_desc": rest_desc,
            "purpose": purpose + " (라운드 사이 1~2분 정도 더 길게 휴식)" + (equip_note if is_last else ""),
        })
    return items


# =====================================================================
# 2. 최종 프롬프트 (v1.7 — §1 존 정보 주입 + Pre/Post 사전 차단)
# =====================================================================
prompt_template = ChatPromptTemplate.from_template("""
# Role
당신은 10년 차 이상의 베테랑 전문 수영 코치이자 프로그램 디자이너입니다.
[Pre/Post 드릴 후보]·[Main-Set 드릴 후보]·[Main-Set 인터벌 세트 지시]를 바탕으로
안전하고 효과적인 수영 세션 계획표를 작성합니다.

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

# ★ 이번 세션의 훈련 분류 (가장 중요 — 훈련지도서 근거)
이번 세션의 카테고리와 각 구간의 목적은 아래와 같이 이미 정해져 있습니다.
{zone_summary}

# ★ Pre-Set·Post-Set 규칙 (반드시 지킬 것)
- Pre-Set과 Post-Set 항목은 반드시 [Pre/Post 드릴 후보] 목록에 있는 것만 쓰십시오.
  이 목록은 이미 낮은 강도(리커버리·기초지구력)로만 걸러져 있습니다 — 다른 곳에서
  드릴을 가져오거나 만들어내지 마십시오.
- Pre-Set은 저강도 유영·감각 익히기 드릴만, Post-Set은 저강도 이지 스윔이나
  이완성 드릴만 배치하십시오.

# ★ Main-Set 구성 규칙
- content_type이 'drill'인 카테고리는 [Main-Set 드릴 후보] 목록에서만 고르십시오.
  목록에 없는 드릴을 만들어내지 마십시오. title은 목록의 드릴 이름을 그대로
  쓰십시오(한글명이 있으면 한글명).
- content_type이 'interval_set'인 카테고리는 [Main-Set 인터벌 세트 지시]에 있는
  title·set·distance_m을 그대로 사용하십시오(숫자를 임의로 바꾸지 마십시오).
  이 항목의 detail 작성 규칙은 아래 "항목 필드"의 detail 설명을 그대로 따르십시오
  (동작 설명 대신 목표 강도·페이스 문장 + 휴식 문장 + 티칭 포인트, 총 세 문장).
- 두 카테고리가 함께 선택된 경우, Main-Set 안에서 서로 다른 목적(예: 기술 교정 +
  지구력)이 섞이도록 두 콘텐츠를 모두 포함하십시오.

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

# ★ 장비 활용 (강사가 장비를 준비했다면 반드시 지킬 것)
- 드릴 후보 목록의 `필수장비`가 있는 드릴은 그 장비가 반드시 필요합니다.
  강사가 준비한 장비(equipment)에 없는 장비를 요구하는 드릴은 쓰지 마십시오.
- `선택장비`는 없어도 수행할 수 있으므로 자유롭게 쓰십시오.
- ★ 장비가 여러 개면(예: "오리발, 패들") **장비마다 각각** 그 장비를 쓰는 항목을
  최소 1개씩 포함하십시오. 장비 하나만 쓰고 나머지는 언급도 안 하는 건 금지입니다
  — "최소 1개 항목"은 장비 종류별 기준이지, 전체 세션 기준이 아닙니다.
- Main-Set이 [Main-Set 인터벌 세트 지시]로만 구성돼 드릴이 하나도 없는 경우에도,
  그 지시에 장비 착용이 명시된 항목이 있으면 detail에 장비 이름을 반드시
  언급하십시오. "장비를 준비했는데 세션 어디에도 안 나온다"는 절대 금지입니다.
- 장비를 쓰는 항목은 장비 배율만큼 같은 시간에 더 먼 거리를 갈 수 있습니다(예:
  오리발 배율 1.20이면 장비 없는 비슷한 항목보다 distance_m을 그만큼 더 크게
  잡으십시오). 드릴 항목의 distance_m·set을 정할 때 이걸 반영하십시오.

# 드릴 다양성
- 같은 드릴을 Pre-Set·Main-Set·Post-Set에 중복해서 넣지 마십시오.

{previous_session_note}

# 항목 개수와 시간 배분 (시간은 이미 계산되어 있습니다)
- pre_set:  최대 3개 항목, 합계 정확히 {warmup_min}분
- main_set: 최대 5개 항목, 합계 정확히 {main_min}분
- post_set: 최대 2개 항목, 합계 정확히 {cooldown_min}분
각 구간에 배정된 분을 그 구간의 항목들에 나눠 담으십시오.
구간별 합계가 위 숫자와 정확히 일치해야 합니다.

# 항목 필드 (하나의 문자열로 합치지 마십시오)
- title: 드릴/세트 이름 (100자 이내)
- set: 반복 횟수 (정수, 최소 1)
- distance_m: 반복 1회당 거리(m), 정수.
  물 적응·호흡·스트레칭처럼 이동 거리가 없는 드릴은 0을 쓰고,
  title 끝에 "(제자리)"를 붙여 구분하십시오.
- duration_min: 이 항목 소요 시간(분), 정수
- detail: 현장 강사가 바로 쓸 수 있는 코칭 노트. 세 문장, 200자 이내.
  **반드시 아래 세 가지를 이 순서로 모두 담으십시오** — 하나라도 빠지거나 순서를
  바꾸면 안 됩니다.
  ① 동작 설명 문장 — 이게 실제로 어떤 동작인지 쉬운 한국어로 설명하십시오.
     title이 영어(또는 드릴 별명)면 강사가 이름만 보고는 무슨 동작인지 알 수
     없습니다 — 반드시 후보 목록에 있는 그 드릴의 `방법`(how) 내용을 근거로
     "손/발/몸으로 무엇을 하는 동작인지"를 풀어 설명하십시오. 목록에 없는
     내용을 지어내지 말고, `방법`에 실제로 적힌 사실만 한국어로 옮기십시오.
     (인터벌 세트 항목은 title이 이미 한글이므로, 이 문장은 대신 목표 강도·
     페이스를 짧게 짚어주는 문장으로 씁니다.)
  ② 휴식 문장 — 이 항목의 반복 사이를 어떻게 쉬는지 구체적으로.
     위 [이번 세션의 훈련 분류]에 적힌 "휴식" 값을 그대로 문장으로 풀어 쓰십시오
     (예: 휴식이 "10~30초"면 "반복마다 10~30초씩 가볍게 쉬고" 같은 식. 휴식이
     "자유"면 "숨이 편안해질 때까지 자유롭게 쉬고"처럼 풀어 쓰십시오. 인터벌
     세트 항목은 [Main-Set 인터벌 세트 지시]의 휴식 가이드를 그대로 씁니다).
  ③ 티칭 포인트 문장 — 강사가 회원에게 무엇을 보고 무엇을 고쳐줘야 하는지.
     근거 우선순위: (a) 이 구간의 존 목적/티칭 포커스(위 [이번 세션의 훈련 분류])
     (b) 드릴의 `목적`(purpose_text)·`방법`(how) (c) [기술 이론 자료]. 즉흥적으로
     지어내지 말고 이 근거를 바탕으로 자세의 핵심이나 흔한 실수를 구체적으로
     짚어주십시오("천천히 유영합니다" 같은 정보 없는 문장은 금지).
  ★ ①(동작 설명)과 ③(티칭 포인트)은 반드시 서로 다른 내용이어야 합니다 — ①은
     "뭘 하는 동작인지"(사실 설명), ③은 "뭘 조심하거나 고쳐야 하는지"(코칭 지시)로
     역할이 다릅니다. 같은 문장을 두 번 쓰지 마십시오.
  ★ 같은 구간(Main-Set 등) 안에 항목이 여러 개일 때, 휴식 문장의 표현을 항목마다
     다르게 쓰십시오. 휴식 값(예: "15~30초")은 같아도 "반복마다 ~쉬고",
     "항목 사이 ~초간 회복하고", "~초 정도 숨을 고른 뒤" 등 표현을 바꿔써서,
     두 항목 이상에서 휴식 문장이 토씨 하나 안 틀리고 똑같이 나오지 않게 하십시오.

# 출력 형식
- 유효한 단일 JSON 객체만 출력합니다. 마크다운, 인삿말, 부연 설명 금지.
- 총 운동량·총 시간의 합계는 서버가 계산하므로 출력하지 마십시오.
- detail은 반드시 한글로 작성하십시오.
- ★ title은 절대 번역하거나 다른 표현으로 바꾸지 마십시오. [Pre/Post 드릴 후보]·
  [Main-Set 드릴 후보]·[Main-Set 인터벌 세트 지시]에 적힌 이름을 글자 그대로
  복사해서 쓰십시오. 후보 목록의 이름이 영어면 title도 영어 그대로 출력하십시오.
  (임의로 한글 이름을 지어내면 같은 드릴이 세션마다 다른 이름으로 나와서
  강사가 같은 드릴인지 알아보기 어려워집니다 — 한글 이름 통일은 별도 작업으로
  드릴 데이터 자체에 반영할 예정이니, 지금은 절대 즉석 번역하지 마십시오.)
- "context", "RAG", "목록", "제공된 자료" 같은 내부 용어를 출력에
  쓰지 마십시오. 강사가 그대로 읽는 문장입니다.

# JSON Output Schema
(아래 title 값은 형식을 보여주는 예시일 뿐입니다 — 실제로는 반드시 후보 목록에
있는 이름을 그대로 쓰십시오. 후보가 영어 이름이면 예시처럼 한글로 바꾸지 말고
영어 그대로 출력하십시오.)
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
        "detail": "가볍게 자유형으로 헤엄치며 몸을 풀어주는 동작입니다. 반복마다 숨이 편안해질 때까지 자유롭게 쉬고, 어깨 힘을 빼고 스트로크를 길게 가져가며 물감을 익힙니다."
      }}
    ],
    "main_set": [
      {{
        "title": "CATCH-UP DRILL",
        "set": 8,
        "distance_m": 25,
        "duration_min": 20,
        "detail": "한쪽 팔이 앞으로 완전히 뻗어 대기한 상태에서 반대쪽 팔이 입수해 손을 맞닿게 한 뒤 다음 스트로크로 넘어가는 자유형 드릴입니다. 반복마다 10~30초씩 가볍게 쉬고, 앞손이 완전히 뻗어 대기한 뒤 반대 팔이 들어오게 해 스트로크 길이를 늘립니다."
      }}
    ],
    "post_set": [
      {{
        "title": "배영 이지",
        "set": 2,
        "distance_m": 50,
        "duration_min": 5,
        "detail": "가볍게 배영으로 헤엄치며 정리하는 동작입니다. 숨이 편안해질 때까지 자유롭게 쉬고, 자유형과 반대 근육을 쓰며 어깨 긴장을 풀어줍니다."
      }}
    ]
  }}
}}

---
[Pre/Post 드릴 후보 — 낮은 강도로 사전 필터링됨, 여기서만 고르십시오]
{pre_post_drill_list}

[Main-Set 드릴 후보]
{main_drill_list}

[Main-Set 인터벌 세트 지시 — 숫자는 고정, detail만 작성]
{interval_set_instructions}

[기술 이론 자료 — 코칭 포인트 작성 근거로만 쓰십시오]
{context}

[수업 정보 & 강사 요청사항 (Input JSON)]:
{class_info}
""")


# =====================================================================
# 2-1. 완화된 프롬프트 (드릴 후보 부족 시 전용) — pool_is_thin일 때만 사용
# ---------------------------------------------------------------------
# ★ 실측: level=BEGINNER+영법 미지정처럼 드릴 후보 풀이 2~5개로 붕괴하는
# 경우, 위 prompt_template의 "후보 목록에 있는 것만 쓰고 만들어내지 마십시오"
# 지시를 그대로 따르면 LLM이 같은 드릴 1~2개를 set/duration만 바꿔가며
# Pre/Main/Post 전체를 채운다. 기존 지시 뒤에 완화 문구를 덧붙이는 방식은
# "절대 만들어내지 마십시오"라는 강한 금지와 모순되어 LLM이 어느 쪽을 따를지
# 불확실해지므로 채택하지 않았다 — 대신 후보 제한·다양성·이름 규칙 부분만
# 아래처럼 고쳐 쓴 별도 템플릿을 쓴다. 그 외 섹션(역할 도입부·입력 해석·
# zone_summary·인터벌 세트 지시·목표 운동량·장비 규칙·항목 개수/시간 배분·
# 필드 정의·JSON 스키마)은 prompt_template과 100% 동일하게 유지한다.
# =====================================================================
prompt_template_freer = ChatPromptTemplate.from_template("""
# Role
당신은 10년 차 이상의 베테랑 전문 수영 코치이자 프로그램 디자이너입니다.
[Pre/Post 드릴 후보]·[Main-Set 드릴 후보]·[Main-Set 인터벌 세트 지시]를 바탕으로
안전하고 효과적인 수영 세션 계획표를 작성합니다.
이번 세션은 드릴 후보 데이터가 부족한 상황입니다 — 후보를 최대한 활용하면서도,
부족한 만큼은 전문 코치로서 직접 구성한 항목을 더해 다양하고 안전한 프로그램을
만드는 것이 이번 임무의 핵심입니다.

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

# ★ 이번 세션의 훈련 분류 (가장 중요 — 훈련지도서 근거)
이번 세션의 카테고리와 각 구간의 목적은 아래와 같이 이미 정해져 있습니다.
{zone_summary}

# ★ Pre-Set·Post-Set 규칙 (반드시 지킬 것)
- Pre-Set과 Post-Set 항목은 [Pre/Post 드릴 후보] 목록에 있는 항목을 최우선으로
  쓰십시오. 이 목록은 이미 낮은 강도(리커버리·기초지구력)로만 걸러져 있습니다.
- 다만 후보 목록의 항목 수가 적거나 아예 없어 그것만으로 다양한 구성이 어렵다면,
  목록에 없는 항목이라도 같은 level·age_group에 안전하고 적절한 저강도(리커버리·
  기초지구력 수준) 드릴을 베테랑 코치로서 당신의 지식으로 직접 구성해 추가하십시오.
  새로 구성한 항목도 Pre-Set은 물 적응·감각 익히기, Post-Set은 이완·정리
  목적에서 벗어나면 안 되고, 아래 [장비 활용] 규칙을 동일하게 지켜야 합니다.

# ★ Main-Set 구성 규칙
- content_type이 'drill'인 카테고리는 [Main-Set 드릴 후보] 목록에 있는 항목을
  최우선으로 고르고, title은 목록의 드릴 이름을 그대로 쓰십시오(한글명이 있으면
  한글명). 다만 후보가 부족해 다양한 구성이 어려우면, 같은 level·age_group·
  카테고리 목적에 맞는 항목을 직접 구성해 추가해도 됩니다 — 새로 구성한 항목은
  자연스러운 이름으로 title을 지으십시오.
- content_type이 'interval_set'인 카테고리는 [Main-Set 인터벌 세트 지시]에 있는
  title·set·distance_m을 그대로 사용하십시오(숫자를 임의로 바꾸지 마십시오).
  이 항목의 detail 작성 규칙은 아래 "항목 필드"의 detail 설명을 그대로 따르십시오
  (동작 설명 대신 목표 강도·페이스 문장 + 휴식 문장 + 티칭 포인트, 총 세 문장).
- 두 카테고리가 함께 선택된 경우, Main-Set 안에서 서로 다른 목적(예: 기술 교정 +
  지구력)이 섞이도록 두 콘텐츠를 모두 포함하십시오.

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

# ★ 장비 활용 (강사가 장비를 준비했다면 반드시 지킬 것)
- 드릴 후보 목록의 `필수장비`가 있는 드릴은 그 장비가 반드시 필요합니다.
  강사가 준비한 장비(equipment)에 없는 장비를 요구하는 드릴은 쓰지 마십시오.
- `선택장비`는 없어도 수행할 수 있으므로 자유롭게 쓰십시오.
- ★ 장비가 여러 개면(예: "오리발, 패들") **장비마다 각각** 그 장비를 쓰는 항목을
  최소 1개씩 포함하십시오. 장비 하나만 쓰고 나머지는 언급도 안 하는 건 금지입니다
  — "최소 1개 항목"은 장비 종류별 기준이지, 전체 세션 기준이 아닙니다.
- Main-Set이 [Main-Set 인터벌 세트 지시]로만 구성돼 드릴이 하나도 없는 경우에도,
  그 지시에 장비 착용이 명시된 항목이 있으면 detail에 장비 이름을 반드시
  언급하십시오. "장비를 준비했는데 세션 어디에도 안 나온다"는 절대 금지입니다.
- 장비를 쓰는 항목은 장비 배율만큼 같은 시간에 더 먼 거리를 갈 수 있습니다(예:
  오리발 배율 1.20이면 장비 없는 비슷한 항목보다 distance_m을 그만큼 더 크게
  잡으십시오). 드릴 항목의 distance_m·set을 정할 때 이걸 반영하십시오.

# 드릴 다양성
- 같은 드릴/항목을 Pre-Set·Main-Set·Post-Set 사이에서, 그리고 같은 구간 안에서도
  중복해서 넣지 마십시오 — 예를 들어 Main-Set 항목이 3개면 3개 모두 서로 다른
  이름이어야 합니다. 후보 목록만으로 항목 수를 다양하게 채울 수 없다면, 위
  [Pre-Set·Post-Set 규칙]·[Main-Set 구성 규칙]에 따라 후보 목록 밖에서도 적절한
  항목을 추가로 구성해 채우십시오.

{previous_session_note}

# 항목 개수와 시간 배분 (시간은 이미 계산되어 있습니다)
- pre_set:  최대 3개 항목, 합계 정확히 {warmup_min}분
- main_set: 최대 5개 항목, 합계 정확히 {main_min}분
- post_set: 최대 2개 항목, 합계 정확히 {cooldown_min}분
각 구간에 배정된 분을 그 구간의 항목들에 나눠 담으십시오.
구간별 합계가 위 숫자와 정확히 일치해야 합니다.

# 항목 필드 (하나의 문자열로 합치지 마십시오)
- title: 드릴/세트 이름 (100자 이내)
- set: 반복 횟수 (정수, 최소 1)
- distance_m: 반복 1회당 거리(m), 정수.
  물 적응·호흡·스트레칭처럼 이동 거리가 없는 드릴은 0을 쓰고,
  title 끝에 "(제자리)"를 붙여 구분하십시오.
- duration_min: 이 항목 소요 시간(분), 정수
- detail: 현장 강사가 바로 쓸 수 있는 코칭 노트. 세 문장, 200자 이내.
  **반드시 아래 세 가지를 이 순서로 모두 담으십시오** — 하나라도 빠지거나 순서를
  바꾸면 안 됩니다.
  ① 동작 설명 문장 — 이게 실제로 어떤 동작인지 쉬운 한국어로 설명하십시오.
     title이 영어(또는 드릴 별명)면 강사가 이름만 보고는 무슨 동작인지 알 수
     없습니다 — 후보 목록에 있는 드릴이면 그 드릴의 `방법`(how) 내용을 근거로,
     새로 구성한 항목이면 당신이 설계한 동작 그대로 "손/발/몸으로 무엇을 하는
     동작인지"를 풀어 설명하십시오.
     (인터벌 세트 항목은 title이 이미 한글이므로, 이 문장은 대신 목표 강도·
     페이스를 짧게 짚어주는 문장으로 씁니다.)
  ② 휴식 문장 — 이 항목의 반복 사이를 어떻게 쉬는지 구체적으로.
     위 [이번 세션의 훈련 분류]에 적힌 "휴식" 값을 그대로 문장으로 풀어 쓰십시오
     (예: 휴식이 "10~30초"면 "반복마다 10~30초씩 가볍게 쉬고" 같은 식. 휴식이
     "자유"면 "숨이 편안해질 때까지 자유롭게 쉬고"처럼 풀어 쓰십시오. 인터벌
     세트 항목은 [Main-Set 인터벌 세트 지시]의 휴식 가이드를 그대로 씁니다).
  ③ 티칭 포인트 문장 — 강사가 회원에게 무엇을 보고 무엇을 고쳐줘야 하는지.
     근거 우선순위: (a) 이 구간의 존 목적/티칭 포커스(위 [이번 세션의 훈련 분류])
     (b) 드릴의 `목적`(purpose_text)·`방법`(how)(후보 목록에 있는 경우) (c) [기술
     이론 자료]. 즉흥적으로 지어내지 말고 이 근거를 바탕으로 자세의 핵심이나
     흔한 실수를 구체적으로 짚어주십시오("천천히 유영합니다" 같은 정보 없는
     문장은 금지).
  ★ ①(동작 설명)과 ③(티칭 포인트)은 반드시 서로 다른 내용이어야 합니다 — ①은
     "뭘 하는 동작인지"(사실 설명), ③은 "뭘 조심하거나 고쳐야 하는지"(코칭 지시)로
     역할이 다릅니다. 같은 문장을 두 번 쓰지 마십시오.
  ★ 같은 구간(Main-Set 등) 안에 항목이 여러 개일 때, 휴식 문장의 표현을 항목마다
     다르게 쓰십시오. 휴식 값(예: "15~30초")은 같아도 "반복마다 ~쉬고",
     "항목 사이 ~초간 회복하고", "~초 정도 숨을 고른 뒤" 등 표현을 바꿔써서,
     두 항목 이상에서 휴식 문장이 토씨 하나 안 틀리고 똑같이 나오지 않게 하십시오.

# 출력 형식
- 유효한 단일 JSON 객체만 출력합니다. 마크다운, 인삿말, 부연 설명 금지.
- 총 운동량·총 시간의 합계는 서버가 계산하므로 출력하지 마십시오.
- detail은 반드시 한글로 작성하십시오.
- ★ [Pre/Post 드릴 후보]·[Main-Set 드릴 후보]·[Main-Set 인터벌 세트 지시]에 있는
  항목을 쓸 때는 그 이름을 절대 번역하거나 바꾸지 말고 글자 그대로 복사해서
  쓰십시오. 후보 목록의 이름이 영어면 title도 영어 그대로 출력하십시오.
  (임의로 한글 이름을 지어내면 같은 드릴이 세션마다 다른 이름으로 나와서
  강사가 같은 드릴인지 알아보기 어려워집니다.)
- ★ 반면 후보 목록에 없어서 당신이 새로 구성한 항목은, 후보 목록에 있는 이름과
  헷갈리지 않도록 그와 다르고 구체적인 새 이름을 지어 쓰십시오 — 후보 목록의
  이름과 비슷하게 짓지 마십시오(강사가 검증된 드릴과 새로 구성된 항목을
  헷갈릴 수 있습니다).
- "context", "RAG", "목록", "제공된 자료" 같은 내부 용어를 출력에
  쓰지 마십시오. 강사가 그대로 읽는 문장입니다.

# JSON Output Schema
(아래 title 값은 형식을 보여주는 예시일 뿐입니다 — 실제로는 위 규칙에 따라
후보 목록의 이름을 그대로 쓰거나, 새로 구성한 항목이면 구체적인 이름을 쓰십시오.
후보가 영어 이름이면 예시처럼 한글로 바꾸지 말고 영어 그대로 출력하십시오.)
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
        "detail": "가볍게 자유형으로 헤엄치며 몸을 풀어주는 동작입니다. 반복마다 숨이 편안해질 때까지 자유롭게 쉬고, 어깨 힘을 빼고 스트로크를 길게 가져가며 물감을 익힙니다."
      }}
    ],
    "main_set": [
      {{
        "title": "CATCH-UP DRILL",
        "set": 8,
        "distance_m": 25,
        "duration_min": 20,
        "detail": "한쪽 팔이 앞으로 완전히 뻗어 대기한 상태에서 반대쪽 팔이 입수해 손을 맞닿게 한 뒤 다음 스트로크로 넘어가는 자유형 드릴입니다. 반복마다 10~30초씩 가볍게 쉬고, 앞손이 완전히 뻗어 대기한 뒤 반대 팔이 들어오게 해 스트로크 길이를 늘립니다."
      }}
    ],
    "post_set": [
      {{
        "title": "배영 이지",
        "set": 2,
        "distance_m": 50,
        "duration_min": 5,
        "detail": "가볍게 배영으로 헤엄치며 정리하는 동작입니다. 숨이 편안해질 때까지 자유롭게 쉬고, 자유형과 반대 근육을 쓰며 어깨 긴장을 풀어줍니다."
      }}
    ]
  }}
}}

---
[Pre/Post 드릴 후보 — 낮은 강도로 사전 필터링됨, 최우선으로 고르고 부족하면 직접 구성하십시오]
{pre_post_drill_list}

[Main-Set 드릴 후보]
{main_drill_list}

[Main-Set 인터벌 세트 지시 — 숫자는 고정, detail만 작성]
{interval_set_instructions}

[기술 이론 자료 — 코칭 포인트 작성 근거로만 쓰십시오]
{context}

[수업 정보 & 강사 요청사항 (Input JSON)]:
{class_info}
""")


# =====================================================================
# 2-2. 응답 후처리 헬퍼 (ver4와 동일)
# =====================================================================
def _collect_items(result: dict):
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
    return sum(int(i.get("duration_min", 0) or 0) for i in items
               if int(i.get("distance_m", 0) or 0) == 0)


def _missing_equipment(result: dict, equip_found: list):
    """★ 실측: "장비마다 최소 1개 항목" 프롬프트 지시만으로는 LLM이 종종 장비
    하나를 통째로 빼먹는다(특히 2개 이상 요청했을 때). title+detail 텍스트에
    장비 키워드가 실제로 등장했는지 서버가 다시 확인 — 누락되면 재생성 피드백에
    반영한다(아래 재생성 로직과 결합)."""
    if not equip_found:
        return []
    text = " ".join(
        f"{i.get('title', '')} {i.get('detail', '')}" for i in _collect_items(result)
    ).lower()
    missing = []
    for equip in equip_found:
        keywords = EQUIP_KEYWORDS.get(equip, [])
        if not any(k.lower() in text for k in keywords):
            missing.append(EQUIP_KO.get(equip, equip))
    return missing


def _title_repetition(items):
    """세션 전체(구간 통틀어) title 반복 여부를 확인한다. 드릴 후보가 적을 때
    LLM이 같은 항목을 set/duration만 바꿔 여러 번 채우는 문제(실측 확인)를
    잡기 위한 사후 검증. (top_title, top_count, top_ratio)를 반환."""
    titles = [str(i.get("title", "")).strip() for i in items if i.get("title")]
    if not titles:
        return "", 0, 0.0
    counts = Counter(titles)
    top_title, top_count = counts.most_common(1)[0]
    return top_title, top_count, top_count / len(titles)


REPEAT_COUNT_THRESHOLD = 3     # 동일 title이 세션 전체에서 3회 이상
REPEAT_RATIO_THRESHOLD = 0.5   # 또는 전체 항목의 50% 초과


def _tag_stationary_items(result: dict):
    """distance_m==0인 항목의 title 끝에 "(제자리)"가 없으면 서버가 직접 붙인다
    (프롬프트 지시만으로는 LLM이 종종 빼먹는 걸 실측으로 확인했다)."""
    for item in _collect_items(result):
        if int(item.get("distance_m", 0) or 0) == 0:
            title = str(item.get("title", ""))
            if "(제자리)" not in title:
                item["title"] = f"{title} (제자리)".strip()


def _distance_range(center, min_gap_m=25):
    """center의 ±20%를 25m 단위로 반올림하되, 목표량이 작을 때 반올림 때문에
    min==max로 붕괴하지 않도록 최소 폭(min_gap_m)을 보장한다.
    (★ 실측: 유아반처럼 목표가 25m 안팎이면 0.8x/1.2x이 둘 다 25m로 반올림돼
    사실상 "정확히 이 숫자"를 요구하는 셈이 되어 1차 시도가 거의 항상
    "범위 벗어남" 판정을 받고 재생성이 걸렸다 — 매번 레이턴시·비용이 2배.)"""
    lo = _round25(center * 0.8)
    hi = _round25(center * 1.2)
    if hi - lo < min_gap_m:
        hi = lo + min_gap_m
    return lo, hi


def _adjusted_targets(target_min, target_center, target_max,
                      duration_min, stationary_min):
    ratio = 1.0 - (stationary_min / duration_min) if duration_min else 1.0
    ratio = max(0.25, min(1.0, ratio))
    adj_center = _round25(target_center * ratio)
    adj_min, adj_max = _distance_range(target_center * ratio)
    return (adj_min, adj_center, adj_max, ratio)


def _rescale_sets(result: dict, adj_center: int):
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
# 2-3. §1 콘텐츠 플랜 빌더 — select_categories/get_zone_params 결과를
#      실제 드릴 후보 목록과 인터벌 세트 지시문으로 변환
# =====================================================================
def _build_zone_summary(categories, level, zone_plan):
    """존별 목적·휴식 가이드를 프롬프트에 명시적으로 준다 — detail 필드에
    '휴식을 어떻게 주고 뭘 가르쳐야 하는지'가 반영되게 하려면 LLM이 이 정보를
    먼저 봐야 한다(그냥 드릴 목록만 주면 두루뭉술한 문장으로 채워버린다)."""
    lines = []
    for cat in categories:
        zp = zone_plan[cat]
        zone_label = zp.get("name_ko") or zp.get("zone") or CATEGORY_INFO[cat]["name_ko"]
        lines.append(f"- 카테고리 {cat}({CATEGORY_INFO[cat]['name_ko']}) → "
                     f"Main-Set 존: {zone_label} | content_type={zp['content_type']} | "
                     f"휴식: {zp.get('rest_desc', '자유')} | 목적/티칭 포커스: {zp.get('purpose', '')}")
    lines.append(f"- Pre-Set·Post-Set → {PRE_POST_ZONE['name_ko']} | "
                 f"휴식: {PRE_POST_ZONE['rest_desc']} | 목적/티칭 포커스: {PRE_POST_ZONE['purpose']}")
    return "\n".join(lines)


def _build_zone_plan(categories, level, previous_session):
    return {cat: get_zone_params(cat, level, "main_set", previous_session) for cat in categories}


def _zone_aware_targets(level, age_group, equip_mult, categories, zone_plan, w_min, m_min, c_min):
    """목표 운동량을 calc_target_distance()의 평평한 레벨 페이스가 아니라,
    실제 선택된 존의 pace_factor로 계산한다(★ 실측 테스트에서 발견 — ZONE_PARAMS의
    pace_factor 주석 참고). pre_set·post_set은 항상 PRE_POST_ZONE 페이스,
    main_set은 카테고리별로 선택된 존의 페이스 × 배정 시간을 더한다.
    반환: (target_min, target_center, target_max, main_shares{cat: dist_m}, dur_share)"""
    lv = LEVEL_ALIAS.get(level, "ELEMENTARY")
    ag = AGE_ALIAS.get(age_group, "ADULT")
    base_rate = LEVEL_RATE[lv] * AGE_MULTIPLIER[ag] * equip_mult

    pre_post_pace = base_rate * PRE_POST_ZONE["pace_factor"]
    expected_pre = pre_post_pace * w_min
    expected_post = pre_post_pace * c_min

    n = max(1, len(categories))
    dur_share = max(1, m_min // n)
    main_shares = {}
    expected_main = 0.0
    for cat in categories:
        pace = base_rate * zone_plan[cat].get("pace_factor", 1.0)
        dist = _round25(pace * dur_share)
        main_shares[cat] = dist
        expected_main += dist

    expected_center = expected_pre + expected_main + expected_post
    target_center = _round25(expected_center)
    target_min, target_max = _distance_range(expected_center)
    return target_min, target_center, target_max, main_shares, dur_share


# =====================================================================
# 3. rag_service 모듈
# =====================================================================
def generate_curriculum(request_body: dict) -> dict:
    """
    Server -> LLM RequestBody JSON(dict)을 받아
    LLM -> Server ResponseBody JSON(dict)을 반환합니다.

    ※ ResponseBody 형식은 ver4와 100% 동일합니다(session_summary/program
      pre_set·main_set·post_set). previous_session은 optional이며 없어도
      기존과 완전히 동일하게 동작합니다.
    """
    total_start_time = time.time()
    print("\n" + "=" * 50)
    print("[teamprogram_ver1] 커리큘럼 생성 요청 시작")

    level = str(request_body.get("level", "ELEMENTARY"))
    age_group = str(request_body.get("age_group", "ADULT"))
    duration_min = int(request_body.get("duration_min", 50) or 50)
    request_text = str(request_body.get("request", "") or "")
    goal_text = f'{request_body.get("goal", "") or ""} {request_body.get("goal_etc", "") or ""}'
    equipment_text = str(request_body.get("equipment", "") or "")
    previous_session = request_body.get("previous_session") or None

    # 1) 구간별 목표 시간 · §1 카테고리·존 선정 (목표 운동량 계산보다 먼저 해야
    # 존별 pace_factor를 반영할 수 있다 — 아래 참고)
    equip_mult, equip_found = detect_equip_multiplier(equipment_text)
    w_min, m_min, c_min = calc_phase_minutes(duration_min)
    categories = select_categories(level, age_group, goal_text, request_text)
    zone_plan = _build_zone_plan(categories, level, previous_session)
    print(f" ├──  선정된 카테고리: {categories} "
          f"({[zone_plan[c].get('zone') for c in categories]})")

    # 2) 목표 운동량 — 존별 실제 페이스(pace_factor) 반영 (★ 수정: 예전엔
    # calc_target_distance()의 평평한 레벨 페이스만 썼는데, SP1~3처럼 휴식이
    # 많은 존엔 안 맞아서 반복수가 부풀려지거나 재생성이 계속 걸렸다)
    target_min, target_center, target_max, main_shares, dur_share = _zone_aware_targets(
        level, age_group, equip_mult, categories, zone_plan, w_min, m_min, c_min)
    print(f" ├──  목표 운동량: {target_center}m (허용 {target_min}~{target_max}m) "
          f"[존별 실제 페이스 반영: {[(c, main_shares[c]) for c in categories]}]")
    if equip_found:
        print(f" │     장비 가중치: x{equip_mult:.2f} ({', '.join(equip_found)})")
    print(f" ├──  목표 시간 배분: Pre-Set {w_min}분 / Main-Set {m_min}분 / Post-Set {c_min}분")

    # 3) 드릴 라이브러리 조건 조회 (기존 pick_drills 그대로, 결과만 사전 필터링)
    pick_start = time.time()
    drills, info = pick_drills(
        level=LEVEL_ALIAS.get(level, "ELEMENTARY"),
        age_group=AGE_ALIAS.get(age_group, "ADULT"),
        request_text=request_text,
        goal_text=goal_text,
        equipment_text=equipment_text,
        limit=18,
    )
    # [핵심 변경] Pre/Post 후보 = intensity=='low'만 (사전 차단, §2-4)
    pre_post_drills = [d for d in drills if d.get("intensity") == "low"]
    pre_post_drill_list = format_drills(pre_post_drills) or "(후보 없음 — 레벨/나이대 조건을 확인하십시오)"

    # Main-Set 드릴 후보는 드릴 카테고리(A/D 혹은 B의 Recovery·EN1)가 선택된
    # 경우에만 의미가 있다 — 전체 풀(low+mid+high, 레벨 필터는 이미 적용됨)을 그대로 노출.
    need_main_drills = any(zone_plan[c]["content_type"] == "drill" for c in categories)
    main_drill_list = format_drills(drills) if need_main_drills else "(이번 세션의 Main-Set은 인터벌 세트로만 구성됩니다)"

    pick_elapsed = time.time() - pick_start
    print(f" ├──  드릴 조회 완료: {pick_elapsed * 1000:.0f}ms "
          f"(후보 {info['pool']}개 → Pre/Post {len(pre_post_drills)}개 사전 필터링)")
    print(f" │     감지 — 영법:{info['strokes'] or '전체'} "
          f"스킬:{info['skills'] or '없음'} 장비:{info['equips'] or '없음'}")

    # ★ 실측: level=BEGINNER(신규)이고 영법 미지정이면 LEVEL_STROKE_PROGRESSION이
    # ["any"]만 허용해 후보 풀이 나이대와 무관하게 2~5개로 붕괴한다(정상 케이스는
    # 대부분 40개 이상). 이 경우 후보 목록만으로 채우면 같은 드릴이 반복된다 —
    # 아래에서 감지해 완화된 프롬프트(prompt_template_freer)로 전환한다.
    pool_is_thin = (
        len(pre_post_drills) < PRE_POST_THIN_THRESHOLD
        or (need_main_drills and info['pool'] < POOL_THIN_THRESHOLD)
    )
    if pool_is_thin:
        print(f" │  ⚠ 드릴 후보 부족(풀 {info['pool']}개) → LLM 창작 허용 프롬프트로 전환")

    # 4) Main-Set 인터벌 세트 지시문 (content_type=='interval_set'인 카테고리만)
    # ★ 실측: 장비를 요청했는데 Main-Set이 인터벌 세트뿐이면(드릴이 하나도 없음)
    # 장비가 세션 어디에도 안 나타나는 문제가 있었다 — equip_names를 넘겨
    # 최소 한 항목엔 장비가 명시되도록 보장한다.
    equip_names_ko = [EQUIP_KO.get(e, e) for e in equip_found]
    interval_lines = []
    for cat in categories:
        zp = zone_plan[cat]
        if zp["content_type"] != "interval_set":
            continue
        items = build_interval_set(zp, main_shares[cat], dur_share, equip_names=equip_names_ko)
        for it in items:
            interval_lines.append(
                f"- [{cat}] title=\"{it['title']}\" set={it['set']} "
                f"distance_m={it['distance_m']} (휴식 가이드: {it['rest_desc']}) "
                f"목적: {it['purpose']}"
            )
    interval_set_instructions = "\n".join(interval_lines) or "(이번 세션은 인터벌 세트가 없습니다)"

    zone_summary = _build_zone_summary(categories, level, zone_plan)

    previous_session_note = ""
    if previous_session:
        previous_session_note = (
            "# ★ 이전 수업 참고\n"
            f"지난 세션: 카테고리 {previous_session.get('category')}, "
            f"존 {previous_session.get('zone')}, "
            f"운동량 {previous_session.get('total_distance_m', '?')}m. "
            "이번 세션 강도는 지난 세션 대비 한 단계까지만 올릴 수 있습니다 "
            "(이미 위 [이번 세션의 훈련 분류]에 반영되어 있으니 그대로 따르십시오)."
        )

    # 5) 한글 이론서 벡터 검색 — 코칭 포인트 근거용 (기존과 동일)
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

    # 6) LLM 실행
    class_info_text = json.dumps(request_body, ensure_ascii=False, indent=2)
    llm_start = time.time()
    active_template = prompt_template_freer if pool_is_thin else prompt_template
    base_messages = active_template.format_messages(
        zone_summary=zone_summary,
        pre_post_drill_list=pre_post_drill_list,
        main_drill_list=main_drill_list,
        interval_set_instructions=interval_set_instructions,
        previous_session_note=previous_session_note,
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

    # 7) 파싱 (실패 시 1회 재시도)
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

    # 7-1) "(제자리)" 표시 서버 보정 — ★ 실측: 프롬프트로 distance_m==0이면
    # title 끝에 "(제자리)"를 붙이라고 지시해도 LLM이 종종 빼먹는다(예: 유아반
    # BOARD ON TUMMY). 프롬프트 지시에만 기대지 않고 서버가 직접 보정한다.
    _tag_stationary_items(result)

    # 8) 제자리 시간 기준으로 목표 재조정 후 판정
    items = _collect_items(result)
    stat_min = _stationary_minutes(items)
    adj_min, adj_center, adj_max, ratio = _adjusted_targets(
        target_min, target_center, target_max, duration_min, stat_min)
    if stat_min > 0:
        print(f" │     제자리 드릴 {stat_min}분 감지 → 목표 재조정: "
              f"{adj_center}m (허용 {adj_min}~{adj_max}m)")

    sum_distance = _sum_distance(items)
    missing_equip = _missing_equipment(result, equip_found)
    repeat_title, repeat_count, repeat_ratio = _title_repetition(items)
    repetitive = len(items) >= 3 and (
        repeat_count >= REPEAT_COUNT_THRESHOLD or repeat_ratio > REPEAT_RATIO_THRESHOLD)

    # 9) 범위를 벗어나거나 요청 장비가 응답에 안 보이거나 항목이 반복되면 LLM 1회 재생성
    # ★ 실측: "장비마다 최소 1개 포함" 프롬프트 지시만으로는 장비 하나를
    # 통째로 빼먹는 경우가 있었다(2개 이상 요청 시 특히) — 거리 범위 검증과
    # 같은 자리에서 장비 등장 여부도 재생성 트리거 조건에 포함시킨다.
    # 반복(repetitive)도 같은 자리에 포함시킨다 — 드릴 후보가 부족할 때
    # (pool_is_thin) LLM이 같은 항목을 set/duration만 바꿔 채우는 문제(실측
    # 확인) 대응.
    distance_out_of_range = not (adj_min <= sum_distance <= adj_max)
    if distance_out_of_range or missing_equip or repetitive:
        reasons = []
        if distance_out_of_range:
            print(f" │  ⚠ 운동량 {sum_distance}m — 목표({adj_min}~{adj_max}m) 벗어남")
            reasons.append(f"직전 응답의 총 운동량(set × distance_m 합)이 {sum_distance}m로 "
                          f"목표 범위({adj_min}~{adj_max}m)를 벗어났습니다. "
                          f"거리 있는 항목의 세트 수나 distance_m을 조정해 총합이 "
                          f"{adj_center}m에 가깝도록 다시 작성하십시오.")
        if missing_equip:
            print(f" │  ⚠ 요청 장비 중 응답에 안 나타난 것: {', '.join(missing_equip)}")
            reasons.append(f"강사가 준비한 장비 중 {', '.join(missing_equip)}가 응답 어디에도 "
                          f"등장하지 않습니다. 해당 장비를 쓰는 항목을 최소 1개씩 반드시 "
                          f"포함하고 title 또는 detail에 장비 이름을 명시하십시오.")
        if repetitive:
            print(f" │  ⚠ 항목 반복 감지 — \"{repeat_title}\"가 {repeat_count}회 "
                  f"(전체 {len(items)}개 중 {repeat_ratio:.0%})")
            if pool_is_thin:
                # 풀이 애초에 얇았던 경우 — prompt_template_freer의 취지를 다시
                # 강조해 "직접 구성해서 채우라"는 허가를 재확인시킨다.
                reasons.append(f"직전 응답은 \"{repeat_title}\" 항목이 {repeat_count}회나 "
                              f"반복돼 다양성이 부족합니다. 후보 목록에 있는 항목을 우선"
                              f"쓰되, 부족한 만큼은 같은 level·age_group에 맞는 안전한"
                              f"항목을 직접 구성해 추가로 채워서 서로 다른 항목으로"
                              f"다시 작성하십시오.")
            else:
                # 풀이 충분했는데도 반복된 경우 — 자유도를 늘리지 않고 기존
                # 후보 안에서 다양하게 고르라고만 요구한다.
                reasons.append(f"직전 응답은 \"{repeat_title}\" 항목이 {repeat_count}회나 "
                              f"반복돼 다양성이 부족합니다. 후보 목록에 다른 선택지가 "
                              f"충분히 있으니, 그 안에서 서로 다른 항목을 골라 다시 "
                              f"작성하십시오.")
        print(" │     재생성 1회 시도")
        feedback = " ".join(reasons) + " 구성과 나머지 규칙은 동일하게 유지하십시오."
        retry_messages = base_messages + [
            AIMessage(content=result_str),
            HumanMessage(content=feedback),
        ]
        retry_start = time.time()
        retry_response = llm.invoke(retry_messages)
        print(f" │     재생성 완료: {time.time() - retry_start:.2f}초")
        try:
            retry_result = _parse_llm_json(retry_response.content)
            _tag_stationary_items(retry_result)
            retry_items = _collect_items(retry_result)
            retry_sum = _sum_distance(retry_items)
            retry_missing = _missing_equipment(retry_result, equip_found)
            _, retry_repeat_count, retry_repeat_ratio = _title_repetition(retry_items)
            better_distance = abs(retry_sum - adj_center) < abs(sum_distance - adj_center)
            better_equip = len(retry_missing) < len(missing_equip)
            better_repetition = (retry_repeat_count, retry_repeat_ratio) < (repeat_count, repeat_ratio)
            if better_distance or better_equip or better_repetition:
                result, items, sum_distance = retry_result, retry_items, retry_sum
                missing_equip = retry_missing
                repeat_title, repeat_count, repeat_ratio = _title_repetition(items)
                repetitive = len(items) >= 3 and (
                    repeat_count >= REPEAT_COUNT_THRESHOLD or repeat_ratio > REPEAT_RATIO_THRESHOLD)
                stat_min = _stationary_minutes(items)
                adj_min, adj_center, adj_max, ratio = _adjusted_targets(
                    target_min, target_center, target_max, duration_min, stat_min)
        except Exception:
            print(" │  ⚠ 재생성 응답 파싱 실패 — 첫 번째 결과 유지")

        # 10) 그래도 벗어나면 세트 수 기계적 보정 (거리만 — 장비 누락·반복은 기계적으로 못 고침)
        if not (adj_min <= sum_distance <= adj_max):
            if _rescale_sets(result, adj_center):
                items = _collect_items(result)
                sum_distance = _sum_distance(items)
                print(f" │     세트 수 자동 보정 적용 → {sum_distance}m")
        if missing_equip:
            print(f" │  ⚠ 재생성 후에도 장비 누락: {', '.join(missing_equip)} — 강사 확인 필요")
        if repetitive:
            print(f" │  ⚠ 재생성 후에도 항목 반복: \"{repeat_title}\" {repeat_count}회 — 강사 확인 필요")

    # 11) Pre-Set/Post-Set 고강도 항목 검증 (사전 차단이 뚫렸는지 최종 확인용 로그)
    pre_post_low_names = {d.get("name_en", "") for d in pre_post_drills if d.get("name_en")}
    high_mid_names = {d.get("name_en", "") for d in drills
                      if d.get("intensity") in ("mid", "high") and d.get("name_en")}
    if high_mid_names:
        program = result.get("program", {})
        for phase in ("pre_set", "post_set"):
            for item in (program.get(phase, []) or []):
                title_upper = str(item.get("title", "")).upper()
                for hn in high_mid_names:
                    if hn.upper() in title_upper or title_upper in hn.upper():
                        print(f" │  ⚠ {phase}에 중/고강도 드릴이 뚫고 들어감: {item.get('title')}")

    # 12) 총량은 서버가 계산해 채운다
    sum_min = _sum_minutes(items)
    result.setdefault("session_summary", {})
    result["session_summary"]["total_distance_m"] = sum_distance
    result["session_summary"]["total_min"] = sum_min

    # 13) 검증 경고 (실패 처리하지 않고 로그만)
    if sum_min != duration_min:
        print(f" │  ⚠ 시간 불일치: 항목 합 {sum_min}분 ≠ 수업 시간 {duration_min}분")
    if not (adj_min <= sum_distance <= adj_max):
        print(f" │  ⚠ 운동량 범위 벗어남: {sum_distance}m (조정 목표 {adj_min}~{adj_max}m)")

    total_elapsed = time.time() - total_start_time
    print(f" └── [최종 완료] 총 소요 시간: {total_elapsed:.2f}초  "
          f"|  총 {sum_distance}m / {sum_min}분")
    print("=" * 50 + "\n")

    return result
