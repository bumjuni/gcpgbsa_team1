# -*- coding: utf-8 -*-
"""drill_library.json에서 수업 조건에 맞는 드릴을 조회한다. (벡터 검색 없음)"""
import json, os, re

_HERE = os.path.dirname(os.path.abspath(__file__))
DRILLS = json.load(open(os.path.join(_HERE, "drill_library.json"), encoding="utf-8"))

STROKE_KO = {
    "freestyle": "자유형", "backstroke": "배영",
    "breaststroke": "평영", "butterfly": "접영", "any": "공통",
}
STROKE_DETECT = {
    "freestyle":    ["자유형", "크롤", "free"],
    "backstroke":   ["배영", "back"],
    "breaststroke": ["평영", "breast"],
    "butterfly":    ["접영", "butterfly", "버터"],
}
SKILL_DETECT = {
    "turn":   ["턴", "플립", "회전", "turn"],
    "start":  ["스타트", "다이빙", "출발", "입수", "start", "dive"],
    "finish": ["피니시", "터치", "finish"],
}
EQUIP_DETECT = {
    "fins":      ["오리발", "핀", "fins"],
    "kickboard": ["킥판", "보드", "킥보드", "board"],
    "paddle":    ["패들", "paddle"],
    "pullbuoy":  ["풀부이", "부이", "buoy"],
}
# 요청 키워드 → 드릴 본문에서 찾을 영어 단어
FOCUS_TERMS = {
    "자세": ["position", "alignment", "technique", "posture"],
    "교정": ["correct", "technique", "fix", "avoid"],
    "발차기": ["kick", "flutter", "dolphin"], "킥": ["kick"],
    "팔": ["arm", "pull", "stroke", "catch"], "스트로크": ["stroke", "pull"],
    "호흡": ["breath", "breathing", "exhale"],
    "회전": ["rotation", "rotate"], "밸런스": ["balance"],
    "지구력": ["endurance", "continuous", "distance"],
    "체력": ["endurance", "strength", "power"],
    "속도": ["speed", "fast", "sprint", "race"], "기록": ["speed", "race", "pace"],
    "완영": ["continuous", "endurance", "full stroke"],
    "적응": ["beginner", "balance", "float"], "기초": ["beginner", "basic"],
}


def _detect(text, table):
    return [k for k, kws in table.items() if any(w in text for w in kws)]


def pick_drills(level, age_group, request_text="", goal_text="",
                equipment_text="", limit=18):
    """조건에 맞는 드릴을 골라 반환한다."""
    q = f"{request_text} {goal_text} {equipment_text}".lower()

    strokes = _detect(q, STROKE_DETECT)
    skills = _detect(q, SKILL_DETECT)
    equips = _detect(q, EQUIP_DETECT)

    # 1) 하드 필터 ─ 레벨·나이대는 반드시 통과
    cand = [d for d in DRILLS
            if level in d["level"] and age_group in d["age_group"]]

    # 2) 영법 필터 ─ 요청에 영법이 있으면 그것만 (없으면 전부)
    if strokes:
        cand = [d for d in cand
                if any(s in d["stroke"] for s in strokes) or "any" in d["stroke"]]

    # 3) 스킬 드릴 ─ 명시 요청이 없으면 제외
    if skills:
        cand = [d for d in cand if (not d["is_skill_drill"]) or d["skill"] in skills]
    else:
        cand = [d for d in cand if not d["is_skill_drill"]]

    # 4) 점수화
    focus_words = []
    for ko, ens in FOCUS_TERMS.items():
        if ko in q:
            focus_words += ens

    def score(d):
        s = 0
        body = (d["name_en"] + " " + d["purpose_text"] + " " + d["how"]).lower()
        s += sum(2 for w in set(focus_words) if w in body)
        if "ESSENTIAL" in d["purpose_tags"]:
            s += 3
        if skills and d["skill"] in skills:
            s += 8                      # 강사가 콕 집어 요청한 기술(턴/스타트 등)
        if any(e in d["equipment_required"] for e in equips):
            s += 5                      # 강사가 준비한 장비를 쓰는 드릴 우대
        if d["equipment_required"] and not any(
                e in equips for e in d["equipment_required"]):
            s -= 4                      # 없는 장비를 요구하는 드릴은 감점
        if d["safety_flags"]:
            s -= 1
        return s

    cand.sort(key=score, reverse=True)

    # 5) 구간 균형 ─ 웜업·쿨다운용 저강도 드릴을 최소 4개 확보
    picked = cand[:limit]
    low = [d for d in picked if d["intensity"] == "low"]
    if len(low) < 4:
        extra = [d for d in cand if d["intensity"] == "low" and d not in picked]
        picked = picked[:limit - min(4 - len(low), len(extra))] + extra[:4 - len(low)]

    # 6) 장비 커버리지 ─ 요청 장비를 쓰는 드릴이 없으면 강제 편입
    for e in equips:
        if not any(e in d["equipment_required"] or e in d["equipment_optional"]
                   for d in picked):
            hit = next((d for d in cand
                        if e in d["equipment_required"] or e in d["equipment_optional"]),
                       None)
            if hit:
                picked = picked[:-1] + [hit]

    return picked, dict(strokes=strokes, skills=skills, equips=equips,
                        pool=len(cand))


def format_drills(drills):
    """LLM 프롬프트에 넣을 텍스트로 변환."""
    lines = []
    for d in drills:
        name = d["name_ko"] or d["name_en"]
        eq = ", ".join(d["equipment_required"]) or "없음"
        opt = ", ".join(d["equipment_optional"])
        head = (f'[{d["id"]}] {name}'
                f' | 영법:{"/".join(STROKE_KO.get(s, s) for s in d["stroke"])}'
                f' | 강도:{d["intensity"]}'
                f' | 배치:{"/".join(d["phase"])}'
                f' | 필수장비:{eq}' + (f' | 선택장비:{opt}' if opt else ''))
        lines.append(head)
        lines.append(f'   목적: {d["purpose_text"]}')
        lines.append(f'   방법: {d["how"][:400]}')
        for w in d["warnings"]:
            lines.append(f'   ⚠ {w["type"]}: {w["reason"][:150]}')
        lines.append("")
    return "\n".join(lines)