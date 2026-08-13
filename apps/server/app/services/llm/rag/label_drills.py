# -*- coding: utf-8 -*-
"""드릴 txt 파일 → 메타데이터 라벨링된 JSON 생성"""
import os, re, json, glob

FILE_META = {
    "Freestyle_Drills.txt":        {"stroke": ["freestyle"],                 "skill": None},
    "Backstroke_Drills.txt":       {"stroke": ["backstroke"],                "skill": None},
    "Breaststroke_Drills.txt":     {"stroke": ["breaststroke"],              "skill": None},
    "Butterfly_Drills.txt":        {"stroke": ["butterfly"],                 "skill": None},
    "Kicking_Streamline_Drills.txt": {"stroke": ["any"],                     "skill": "kick_streamline"},
    "Flip_Turn_Drills.txt":        {"stroke": ["freestyle", "backstroke"],   "skill": "turn"},
    "Open_Turn_Drills.txt":        {"stroke": ["breaststroke", "butterfly"], "skill": "turn"},
    "Transition_Turn_Drills.txt":  {"stroke": ["any"],                       "skill": "turn"},
    "Dive_Starts_Drills.txt":      {"stroke": ["any"],                       "skill": "start"},
    "Backstroke_Start_Drills.txt": {"stroke": ["backstroke"],                "skill": "start"},
    "Finishes_Drills.txt":         {"stroke": ["any"],                       "skill": "finish"},
}

PURPOSE_TAGS = ["ESSENTIAL", "DETAIL", "BEGINNER", "APPRECIATION", "STRENGTH", "PROGRESSION"]

# 우리 level enum: BEGINNER(신규) ELEMENTARY(초급) INTERMEDIATE(중급) ADVANCED(상급) MASTER(마스터)
TAG_TO_LEVEL = {
    "BEGINNER":     ["BEGINNER", "ELEMENTARY"],
    "PROGRESSION":  ["BEGINNER", "ELEMENTARY"],
    "ESSENTIAL":    ["ELEMENTARY", "INTERMEDIATE"],
    "APPRECIATION": ["INTERMEDIATE", "ADVANCED"],
    "DETAIL":       ["ADVANCED", "MASTER"],
    "STRENGTH":     ["ADVANCED", "MASTER"],
}
SKILL_MIN_LEVEL = {   # 턴/스타트/피니시는 초급 이상부터
    "turn":   ["INTERMEDIATE", "ADVANCED", "MASTER"],
    "start":  ["INTERMEDIATE", "ADVANCED", "MASTER"],
    "finish": ["ADVANCED", "MASTER"],
}
LEVEL_ORDER = ["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "ADVANCED", "MASTER"]
AGE_ORDER = ["PRESCHOOL", "ELEMENTARY", "TEEN", "ADULT", "SENIOR"]

EQUIP_PATTERNS = {          # 우리 equipment enum과 매칭되는 것
    "fins":      r"\bfins?\b",
    "paddle":    r"\bpaddles?\b",
    "kickboard": r"\b(kickboards?|kick boards?)\b",
    "pullbuoy":  r"\bpull buoys?\b",
}
EQUIP_EXTRA = {             # enum 밖이지만 실제로 필요한 도구
    "snorkel":   r"\bsnorkels?\b",
    "noodle":    r"\bnoodles?\b",
    "band":      r"\b(ankle band|resistance band|bands?)\b",
    "lane_line": r"\blane lines?\b",
}
OPTIONAL_HINTS = ["if needed", "if desired", "may use", "optional", "make it easier",
                  "makes the drill easier", "for assistance", "can be used"]

CHILD_HINTS = ["young swimmer", "younger swimmer", "smaller child", "smaller children",
               "children", "kids", "child "]
DEEPWATER_HINTS = ["deep end", "deep water", "blocks", "starting block", "diving"]


def parse_file(path):
    fname = os.path.basename(path)
    meta = FILE_META.get(fname)
    if not meta:
        return []
    raw = open(path, encoding="utf-8").read()
    blocks = re.split(r"\nName:", raw)[1:]          # 첫 조각은 헤더
    drills = []
    for b in blocks:
        b = "Name:" + b
        name = re.search(r"^Name:\s*(.+)", b).group(1).strip()
        pm = re.search(r"^Purpose:\s*(.+)", b, re.M)
        purpose = pm.group(1).strip() if pm else ""
        hm = re.search(r"^How:\s*\n(.+?)(?=\n\*\*|\Z)", b, re.M | re.S)
        how = hm.group(1).strip() if hm else ""
        warns = re.findall(r"\*\* Warning reason \(([^)]+)\):\s*(.+?)\*\*", b, re.S)
        drills.append(dict(file=fname, name=name, purpose=purpose, how=how,
                           warnings=[(w[0].strip(), " ".join(w[1].split())) for w in warns],
                           **meta))
    return drills


def label(d):
    text = (d["purpose"] + " " + d["how"]).lower()
    head = d["purpose"].split(".")[0].upper()
    tags = [t for t in PURPOSE_TAGS if t in head]

    # ── level ──────────────────────────────────────────────
    levels = set()
    for t in tags:
        levels |= set(TAG_TO_LEVEL.get(t, []))
    if d["skill"] in SKILL_MIN_LEVEL:
        levels |= set(SKILL_MIN_LEVEL[d["skill"]])
        levels -= {"BEGINNER"}
    if any(w[0].lower().startswith("competition") for w in d["warnings"]):
        levels |= {"ADVANCED", "MASTER"}
    if not levels:
        levels = {"ELEMENTARY", "INTERMEDIATE", "ADVANCED"}

    # ── equipment ─────────────────────────────────────────
    equip_req, equip_opt = [], []
    for key, pat in {**EQUIP_PATTERNS, **EQUIP_EXTRA}.items():
        if re.search(pat, text):
            m = re.search(pat, text)
            window = text[max(0, m.start() - 120): m.end() + 120]
            sent_start = text.rfind(".", 0, m.start()) + 1
            sentence = text[sent_start: text.find(".", m.end()) + 1 or None]
            if re.search(r"\b(no|without|not use|never use|instead of|limit|"
                         r"restrict|avoid|discourage|may restrict|rather than)\b", sentence):
                continue                                   # 부정 문장이면 장비 불필요
            (equip_opt if any(h in window for h in OPTIONAL_HINTS) else equip_req).append(key)
    equip_opt = [e for e in equip_opt if e not in equip_req]

    # ── age_group ─────────────────────────────────────────
    ages = set(AGE_ORDER)
    has_safety = any(w[0].lower().startswith("safety") for w in d["warnings"])
    if "BEGINNER" not in tags:
        ages -= {"PRESCHOOL"}
    if has_safety or "paddle" in equip_req or "band" in equip_req:
        ages -= {"PRESCHOOL"}
    if any(h in text for h in DEEPWATER_HINTS) or d["skill"] == "start":
        ages -= {"PRESCHOOL"}
    if "STRENGTH" in tags or d["skill"] in ("start", "finish"):
        ages -= {"SENIOR"}
    if any(h in text for h in CHILD_HINTS):
        ages |= {"ELEMENTARY"}
    if not ages:
        ages = {"TEEN", "ADULT"}

    # ── intensity / phase ─────────────────────────────────
    if "STRENGTH" in tags or d["skill"] in ("start", "finish"):
        intensity = "high"
    elif "BEGINNER" in tags or "APPRECIATION" in tags:
        intensity = "low"
    else:
        intensity = "mid"
    phases = {"low": ["warmup", "main", "cooldown"],
              "mid": ["main"], "high": ["main"]}[intensity]

    # ── safety flags ──────────────────────────────────────
    flags = []
    for cat, _ in d["warnings"]:
        c = cat.lower()
        if c.startswith("safety"):             flags.append("safety_risk")
        elif c.startswith("technical"):        flags.append("technique_caution")
        elif c.startswith("competition"):      flags.append("not_race_legal")
        elif c.startswith("expression"):       flags.append("wording_unclear")
    if "PRESCHOOL" not in ages:                flags.append("not_for_preschool")
    if "SENIOR" not in ages:                   flags.append("not_for_senior")

    return {
        "name_en": d["name"],
        "name_ko": "",
        "stroke": d["stroke"],
        "skill": d["skill"],
        "is_skill_drill": d["skill"] in ("turn", "start", "finish"),
        "purpose_tags": tags,
        "level": [l for l in LEVEL_ORDER if l in levels],
        "age_group": [a for a in AGE_ORDER if a in ages],
        "equipment_required": sorted(set(equip_req)),
        "equipment_optional": sorted(set(equip_opt)),
        "intensity": intensity,
        "phase": phases,
        "safety_flags": sorted(set(flags)),
        "purpose_text": d["purpose"],
        "how": d["how"],
        "warnings": [{"type": c, "reason": r} for c, r in d["warnings"]],
        "source_file": d["file"],
    }


# 드릴 원본 txt 파일이 있는 폴더 (이 스크립트 기준 상대경로)
DRILL_TXT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "drills")

all_drills = []
for p in sorted(glob.glob(os.path.join(DRILL_TXT_DIR, "*.txt"))):
    all_drills += [label(d) for d in parse_file(p)]

for i, d in enumerate(all_drills, 1):
    d["id"] = f"D{i:03d}"

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "drill_library.json")
json.dump(all_drills, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"총 {len(all_drills)}개 드릴 라벨링 완료")
