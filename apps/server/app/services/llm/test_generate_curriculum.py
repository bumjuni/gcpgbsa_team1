# -*- coding: utf-8 -*-
import json
from rag_service_ver3 import generate_curriculum

sample_request = {
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

if __name__ == "__main__":
    result = generate_curriculum(sample_request)
    print(json.dumps(result, ensure_ascii=False, indent=2))
