# -*- coding: utf-8 -*-
"""drill_library.json의 name_ko(한글 드릴명)를 일괄 채운다. 1회만 실행하면 된다."""
import os, json, re
from langchain_google_vertexai import ChatVertexAI

GCP_PROJECT_ID = "***"                      # rag_service.py와 동일하게
os.environ["GOOGLE_CLOUD_PROJECT"] = GCP_PROJECT_ID
os.environ["CLOUD_ML_REGION"] = "asia-northeast3"

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "drill_library.json")
BATCH = 25

llm = ChatVertexAI(
    model_name="gemini-2.5-flash", temperature=0.1,
    project=GCP_PROJECT_ID, location="asia-northeast3",
    model_kwargs={"response_mime_type": "application/json"},
)

PROMPT = """당신은 한국 수영장에서 10년 이상 일한 수영 강사입니다.
아래 영어 수영 드릴 이름들을 한국 수영장에서 실제로 쓰는 표현으로 옮기십시오.

규칙:
- 한국 수영계에서 통용되는 외래어는 그대로 씁니다 (스컬링, 캐치업, 스트림라인, 플립턴, 돌핀킥).
- 직역이 어색하면 동작을 설명하는 이름으로 의역합니다.
  예: "BOARD ON TUMMY" -> "보드 배에 대고 킥"
      "ZIPPER DRILL aka. FINGERTIP DRAG" -> "지퍼 드릴(손끝 끌기)"
      "TARZAN DRILL" -> "타잔 드릴(고개 들고 자유형)"
- aka.로 별칭이 붙은 경우 대표 이름 하나만 옮깁니다.
- 20자 이내. 설명이 아니라 '이름'이어야 합니다.

아래 JSON 배열의 각 항목에 name_ko를 채워 같은 형식으로만 응답하십시오.
{items}
"""


def main():
    drills = json.load(open(PATH, encoding="utf-8"))
    todo = [d for d in drills if not d.get("name_ko")]
    print(f"번역 대상 {len(todo)}개 / 전체 {len(drills)}개")

    index = {d["id"]: d for d in drills}
    for i in range(0, len(todo), BATCH):
        chunk = todo[i:i + BATCH]
        payload = json.dumps(
            [{"id": d["id"], "name_en": d["name_en"],
              "hint": d["purpose_text"][:90]} for d in chunk],
            ensure_ascii=False, indent=1)
        try:
            raw = llm.invoke(PROMPT.format(items=payload)).content
            got = json.loads(re.sub(r"^```(json)?|```$", "", raw.strip(), flags=re.M))
            for g in got:
                if g.get("id") in index and g.get("name_ko"):
                    index[g["id"]]["name_ko"] = g["name_ko"].strip()
            print(f"  {i + len(chunk):3}/{len(todo)} 완료")
        except Exception as e:
            print(f"  {i}~ 배치 실패: {e}")

    json.dump(drills, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    done = sum(1 for d in drills if d.get("name_ko"))
    print(f"\n저장 완료 — 한글명 {done}/{len(drills)}개")
    for d in drills[:10]:
        print(f'  {d["id"]} {d["name_en"][:40]:42} → {d.get("name_ko", "")}')


if __name__ == "__main__":
    main()