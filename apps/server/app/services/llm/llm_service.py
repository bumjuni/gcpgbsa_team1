# llm_service.py
#
# ProgramService가 DB에서 모아준 SwimClass 정보 + equipment/request를 받아
# RequestBody 11개 키를 조립하고 generate_curriculum을 호출한다.
# 이 서비스는 DB에 접근하지 않는다 (DB 조회는 ProgramService의 책임).

from services.llm.rag.teamprogram_ver1_2 import generate_curriculum
from schemas.program import Program as ProgramSchema, SessionSummary


# ── 매핑 테이블 ────────────────────────────────────────────────
# 반드시 매핑표로 변환한다. .upper() 금지.
# DB의 'beginner'(초급)를 .upper()하면 'BEGINNER'(신규)가 되어 수준이 한 단계 밀린다.
LEVEL_MAP = {
    "new": "BEGINNER",
    "beginner": "ELEMENTARY",
    "intermediate": "INTERMEDIATE",
    "advanced": "ADVANCED",
    "masters": "MASTER",
}

AGE_GROUP_MAP = {
    "toddler": "PRESCHOOL",
    "elementary": "ELEMENTARY",
    "teen": "TEEN",
    "adult": "ADULT",
    "senior": "SENIOR",
}

# goal 영문 enum 매핑 (기획 확정값)
GOAL_MAP = {
    "완영 목표": "COMPLETE_SWIM",
    "자세 교정": "POSTURE_CORRECTION",
    "체력 증진": "FITNESS_IMPROVEMENT",
    "기초 적응": "BASIC_ADAPTATION",
    "기타": "ETC",
}

JOIN_SEP = ", "


def build_request_body(swim_class, equipment: str, request: str) -> dict:
    """SwimClass ORM 객체 + equipment/request로 RequestBody 11개 키를 조립한다."""
    days = swim_class.days_of_week
    days_str = JOIN_SEP.join(days) if isinstance(days, list) else days

    duration_min = (
        (swim_class.end_time.hour * 60 + swim_class.end_time.minute)
        - (swim_class.start_time.hour * 60 + swim_class.start_time.minute)
    )

    return {
        "class_name": swim_class.name,
        "days_of_week": days_str,
        "start_time": swim_class.start_time.strftime("%H:%M"),
        "duration_min": duration_min,
        "capacity": swim_class.capacity,
        "age_group": swim_class.age_group,
        "level": swim_class.level,
        "goal": swim_class.goals,
        "goal_etc": swim_class.goal_etc or "",
        "equipment": equipment or "",
        "request": request or "",
    }


def _remap_item_keys(item: dict) -> dict:
    """LLM 응답의 duration_time 키를 스키마의 duration_min으로 맞춘다."""
    remapped = dict(item)
    if "duration_time" in remapped:
        remapped["duration_min"] = remapped.pop("duration_time")
    return remapped


def _remap_program_keys(raw_program: dict) -> dict:
    return {
        phase: [_remap_item_keys(item) for item in items]
        for phase, items in raw_program.items()
    }


class LLMService:
    """LLM(수업안 생성) 호출만 담당. DB 접근 없음."""

    async def generate(self, swim_class, equipment: str, request: str) -> dict:
        """
        반환값: {"session_summary": SessionSummary, "program": ProgramSchema}
        generate_curriculum이 동기 함수인지 async인지는 실제 구현에 따라 조정 필요.
        """
        request_body = build_request_body(swim_class, equipment, request)
        raw = generate_curriculum(request_body)

        return {
            "session_summary": SessionSummary(**raw["session_summary"]),
            "program": ProgramSchema(**_remap_program_keys(raw["program"])),
        }
