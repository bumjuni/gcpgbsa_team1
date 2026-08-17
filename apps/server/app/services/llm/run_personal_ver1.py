# -*- coding: utf-8 -*-
"""personar_ver1.generate_personal_session() 수동 테스트 스크립트.
JSON을 붙여넣으면 그걸로, 그냥 Enter만 치면 기본 샘플로 실행한다.
필드 스펙은 personal_onboarding_form.md 참고."""
import warnings
warnings.filterwarnings("ignore")

import logging
logging.getLogger().setLevel(logging.ERROR)

import json
from personar_ver1 import generate_personal_session

SAMPLE_REQUEST = {
    "profile": {
        "stroke_primary": "freestyle",
        "pb_record": None,
        "css_pace_sec_per_100m": 95,
        "weekly_frequency": 3,
        "avg_session_distance_m": 1800,
        "goal_type": "RECORD",
        "target_event_date": "2026-10-01",
        "target_event": "자유형 100m",
        "target_time_sec": 70,
        "age": 34,
        "activity_level": "REGULAR",
        "has_symptoms_or_disease": False,
        "desired_intensity": "VIGOROUS",
        "injury_notes": "왼쪽 어깨 통증 이력 있음(현재는 괜찮음)",
        "pregnant": False,
        "pool_length_m": 25,
        "available_days": ["MON", "WED", "FRI"],
        "session_duration_min": 60,
        "equipment": "패들, 풀부이",
        "indoor_outdoor": "INDOOR",
        "has_partner": False,
        "rpe_calibration": 7,
    },
    "request": "다음 대회 전에 스피드를 좀 끌어올리고 싶어요",
    "session_history": [
        {"date": "2026-08-07", "category": "B", "zone": "EN1", "total_distance_m": 1500}
    ],
    "last_feedback": {"completed": True, "rpe_actual": 6},
    "today": "2026-08-14",
}

print("RequestBody JSON을 붙여넣고 Enter를 한 번 더 누르세요.")
print("(그냥 바로 Enter만 치면 기본 샘플로 실행합니다 — REGULAR/무질환/VIGOROUS라 PROCEED로 진행됩니다)")
lines = []
while True:
    try:
        line = input()
    except EOFError:
        break
    if line.strip() == "":
        break
    lines.append(line)
raw = "\n".join(lines).strip()

request_body = json.loads(raw) if raw else SAMPLE_REQUEST
if not raw:
    print("(기본 샘플 사용)")

result = generate_personal_session(request_body)
print("\n=== 결과 ===")
print(json.dumps(result, ensure_ascii=False, indent=2))
