# -*- coding: utf-8 -*-
"""수업 정보를 JSON으로 통째로 입력받아 커리큘럼을 생성."""
import warnings
warnings.filterwarnings("ignore")

import logging
logging.getLogger().setLevel(logging.ERROR)

import json
from rag_service_ver4 import generate_curriculum

print("JSON을 붙여넣으세요. 다 넣었으면 Enter를 한 번 더 눌러 끝내세요.")
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

if not raw:
    print("입력이 없습니다. 종료합니다.")
    raise SystemExit(0)

request_body = json.loads(raw)
result = generate_curriculum(request_body)
print("\n=== 결과 ===")
print(json.dumps(result, ensure_ascii=False, indent=2))