# -*- coding: utf-8 -*-
"""RAG_RELEVANCE_THRESHOLD(personal_chat_ver1.py) 값을 잡기 위한 1회성 보정
스크립트. ML 지식 없이도 쓸 수 있게, 수영 기술 질문 예시들과 잡담 예시들 각각에
대해 pdf_db에서 나온 최고 relevance score만 나란히 출력한다. "기술 질문 점수는
대체로 높고 잡담 점수는 대체로 낮은" 경계선을 눈으로 찾아 그 값을
personal_chat_ver1.py의 RAG_RELEVANCE_THRESHOLD에 넣으면 된다.

사용법:
  gcloud auth application-default login   # ADC 만료 시 먼저
  python calibrate_rag_threshold.py
"""
import warnings
warnings.filterwarnings("ignore")
import logging
logging.getLogger().setLevel(logging.ERROR)

from teamprogram_ver1_2 import pdf_db

# ★ 필요하면 자유롭게 추가/교체 — 실제 회원들이 쓸 법한 문장으로 채울수록 좋다.
SWIM_TECHNIQUE_SAMPLES = [
    "자유형 팔동작이 자꾸 헷갈려요",
    "평영 킥할 때 무릎이 아파요",
    "턴할 때 벽을 놓치는 느낌이에요",
    "호흡할 때 자꾸 물을 먹어요",
    "접영 스트로크 타이밍 좀 알려주세요",
]
SMALL_TALK_SAMPLES = [
    "오늘 컨디션이 좀 별로예요",
    "안녕하세요",
    "오늘 날씨 좋네요",
    "다음 대회 언제였죠?",
    "감사합니다!",
]


def _top_score(query, k=4):
    hits = pdf_db.similarity_search_with_relevance_scores(query, k=k)
    if not hits:
        return None, None
    doc, score = hits[0]
    return score, doc.page_content[:60].replace("\n", " ")


def _run(label, samples):
    print(f"\n=== {label} ===")
    for q in samples:
        score, snippet = _top_score(q)
        if score is None:
            print(f"  [점수 없음] {q}")
        else:
            print(f"  {score:.3f}  {q!r}  <- {snippet!r}")


if __name__ == "__main__":
    _run("수영 기술 질문 (점수가 높아야 함)", SWIM_TECHNIQUE_SAMPLES)
    _run("잡담 (점수가 낮아야 함)", SMALL_TALK_SAMPLES)
    print("\n두 그룹 점수 사이의 '경계값'을 personal_chat_ver1.py의 "
          "RAG_RELEVANCE_THRESHOLD에 넣으세요 (기본값 0.5).")
