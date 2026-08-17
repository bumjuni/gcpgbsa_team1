# -*- coding: utf-8 -*-
"""teamprogram_ver1.generate_curriculum() 수동 테스트 스크립트.
JSON을 붙여넣으면 그걸로, 그냥 Enter만 치면 기본 샘플로 실행한다."""
import warnings
warnings.filterwarnings("ignore")

import logging
logging.getLogger().setLevel(logging.ERROR)

import json
from teamprogram_ver1 import generate_curriculum

SAMPLE_REQUEST = {
    "class_name": "청소년 중급반",
    "level": "INTERMEDIATE",
    "age_group": "TEEN",
    "duration_min": 50,
    "capacity": 10,
    "goal": "",
    "goal_etc": "",
    "equipment": "킥판",
    "request": "평영 발차기 자세를 봐주세요",
}

print("RequestBody JSON을 붙여넣고 Enter를 한 번 더 누르세요.")
print("(그냥 바로 Enter만 치면 기본 샘플로 실행합니다)")
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

result = generate_curriculum(request_body)
print("\n=== 결과 ===")
print(json.dumps(result, ensure_ascii=False, indent=2))
