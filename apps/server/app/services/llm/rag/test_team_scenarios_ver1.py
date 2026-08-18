# -*- coding: utf-8 -*-
"""teamprogram_ver1.generate_curriculum()을 여러 시나리오로 한 번에 돌려서
비교하기 쉬운 형태로 출력하는 배치 러너 (실제 Gemini 호출 — gcloud 인증 필요).

사용법:
  python3 test_team_scenarios_ver1.py                 # SCENARIOS 전체 실행
  python3 test_team_scenarios_ver1.py preschool speed  # 이름으로 일부만 실행
  python3 test_team_scenarios_ver1.py --list           # 시나리오 이름 목록만 출력
"""
import sys
import warnings
warnings.filterwarnings("ignore")
import logging
logging.getLogger().setLevel(logging.ERROR)

import json
from .teamprogram_ver1 import generate_curriculum

# =====================================================================
# 시나리오 배터리 — 레벨×카테고리×장비×previous_session 조합으로 최대한
# 다른 코드 경로를 건드리도록 설계. "speed_repeat"는 "speed"와 완전히 같은
# 입력을 다시 돌려 같은 라운드 안에서도 LLM 응답 일관성을 바로 비교하기 위함.
# =====================================================================
SCENARIOS = [
    {
        "name": "preschool",
        "note": "유아+신규, 영법 언급 없음 — 카테고리 A 게이팅, 영법 기본값(any), Pre/Post 사전 차단 확인용",
        "request_body": {
            "class_name": "유아 물적응반", "level": "BEGINNER", "age_group": "PRESCHOOL",
            "duration_min": 30, "capacity": 8, "goal": "", "goal_etc": "",
            "equipment": "", "request": "물에 처음 들어가는 아이들이라 무서워하지 않게 해주세요",
        },
    },
    {
        "name": "speed",
        "note": "마스터즈+스피드 요청 — 카테고리 C(SP1~3), interval_set 경로, 리커버리 표기·인터벌 title 확인용",
        "request_body": {
            "class_name": "마스터즈반", "level": "MASTER", "age_group": "ADULT",
            "duration_min": 60, "capacity": 8, "goal": "", "goal_etc": "",
            "equipment": "", "request": "스피드 위주로 훈련하고 싶어요",
        },
    },
    {
        "name": "speed_repeat",
        "note": "speed와 완전히 동일한 입력 반복 — 같은 라운드 안에서 LLM 응답 일관성(휴식+티칭 두 문장, title 형식) 비교용",
        "request_body": {
            "class_name": "마스터즈반", "level": "MASTER", "age_group": "ADULT",
            "duration_min": 60, "capacity": 8, "goal": "", "goal_etc": "",
            "equipment": "", "request": "스피드 위주로 훈련하고 싶어요",
        },
    },
    {
        "name": "technique",
        "note": "중급+청소년, 평영 자세교정 — 카테고리 D, 드릴 title이 영어 그대로 나오는지(번역 금지 준수) 확인용",
        "request_body": {
            "class_name": "청소년 중급반", "level": "INTERMEDIATE", "age_group": "TEEN",
            "duration_min": 50, "capacity": 10, "goal": "", "goal_etc": "",
            "equipment": "", "request": "평영 팔동작 자세를 좀 봐주세요",
        },
    },
    {
        "name": "equip_periodization",
        "note": "상급+오리발 장비+previous_session(EN1) — 장비 가중치·1단계 상승 제한(EN1→EN2, EN3 금지) 확인용",
        "request_body": {
            "class_name": "상급반", "level": "ADVANCED", "age_group": "ADULT",
            "duration_min": 55, "capacity": 8, "goal": "지구력", "goal_etc": "",
            "equipment": "오리발", "request": "",
            "previous_session": {"category": "B", "zone": "EN1", "total_distance_m": 900,
                                 "main_drills": ["캐치업 드릴"]},
        },
    },
]


def _print_result(name, note, request_body, result):
    print("\n" + "#" * 70)
    print(f"# 시나리오: {name}")
    print(f"# {note}")
    print("#" * 70)
    print("[입력]", json.dumps(request_body, ensure_ascii=False))
    print()
    summary = result.get("session_summary", {})
    print(f"[요약] focus_point: {summary.get('focus_point')}")
    print(f"       총 {summary.get('total_distance_m')}m / {summary.get('total_min')}분")
    for phase_key, phase_label in (("pre_set", "Pre-Set"), ("main_set", "Main-Set"), ("post_set", "Post-Set")):
        items = result.get("program", {}).get(phase_key, [])
        print(f"\n[{phase_label}]")
        if not items:
            print("  (항목 없음)")
        for it in items:
            print(f"  - title: {it.get('title')}")
            print(f"    set={it.get('set')} distance_m={it.get('distance_m')} duration_min={it.get('duration_min')}")
            print(f"    detail: {it.get('detail')}")


def main():
    args = sys.argv[1:]
    if "--list" in args:
        for s in SCENARIOS:
            print(f"{s['name']}: {s['note']}")
        return

    selected = [s for s in SCENARIOS if s["name"] in args] if args else SCENARIOS
    if not selected:
        print(f"일치하는 시나리오가 없습니다. 사용 가능: {[s['name'] for s in SCENARIOS]}")
        return

    print(f"총 {len(selected)}개 시나리오 실행: {[s['name'] for s in selected]}\n")
    results = {}
    for s in selected:
        result = generate_curriculum(s["request_body"])
        results[s["name"]] = result
        _print_result(s["name"], s["note"], s["request_body"], result)

    print("\n" + "=" * 70)
    print(f"[완료] {len(selected)}개 시나리오 실행 완료")


if __name__ == "__main__":
    main()
