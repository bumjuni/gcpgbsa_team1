# 개인 모드 온보딩 폼 설계

> programlogic.md §3-1·§3-2를 실제 입력 폼으로 구체화한 문서. 여기서 정한 필드명은
> `personar_ver1.py`의 `request_body["profile"]`과 정확히 일치해야 한다(코드 쪽
> `_extract_profile`류 로직을 바꿀 때는 이 문서도 같이 갱신할 것).

## 원칙

- **온보딩은 진입 시 1회, 구조화된 폼(단계별 위저드)으로 수집한다.** 대화체로 순차
  질문해 파싱하는 방식은 쓰지 않는다 — 통증 여부·질환 여부 같은 안전 데이터를
  자유 텍스트에서 잘못 파싱하면 안전 문제로 직결되기 때문(programlogic.md §3-1).
- C(신체·안전) 섹션은 `personar_ver1.screen()`이 그대로 소비하는 **ACSM 3요소 모델**과
  1:1로 매핑되도록 문구까지 고정한다.
- 마이페이지에서 C 섹션을 수정하면, 그 즉시가 아니라 **다음 세션 생성 요청 시점에
  `screen()`을 자동 재실행**한다(§3-1). 조용히 반영만 되고 재스크리닝을 안 거치면
  안전 게이팅이 무력화된다.
- 이 문서의 필드는 `request_body.profile`에 그대로 담아 `generate_personal_session()`에
  전달한다. DB 저장은 별도 관리되는 서버 레이어의 책임이며, 이 폼 자체는 그 레이어가
  세션 생성 함수를 호출할 때 채워 넣을 입력 스펙이다.

---

## A. 기록·피트니스

| 필드명 | 타입 | 값/선택지 | 필수 | 용도 |
|---|---|---|---|---|
| `pb_50m` | 객체 | `{"free": 초 또는 null, "back": 초 또는 null, "breast": 초 또는 null, "fly": 초 또는 null}` | 선택 | 50m 고정 거리로 네 영법 최고기록을 한번에 받는다. 있으면 페이스 계산(§3-4) 참고자료 — 현재는 CSS 값이 있으면 그걸 우선 사용. 하나도 모르면 전부 null로 두어도 온보딩이 막히지 않는다 |
| `css_pace_sec_per_100m` | 정수(초) 또는 null | 200m+400m 타임트라이얼 2회로 산출한 100m당 역치 페이스 | 선택 | `calc_personal_intensity()`의 기준 페이스. **없으면 자동으로 RPE 기반 지도로 전환**되므로, 기록이 없는 회원은 비워도 온보딩이 막히지 않는다 |
| `weekly_frequency` | 정수 | 주당 훈련 횟수 | 필수 | `_infer_level()`의 레벨 추정 입력(★ 추정치, 강사 검수 필요) |
| `avg_session_distance_m` | 정수 또는 null | 평균 세션 거리(m) | 선택 | 레벨 추정 보조 지표(현재 로직엔 미반영, 추후 `_infer_level` 정교화 시 사용 예정) |

★ `stroke_primary`(주 영법)는 온보딩에서 받지 않는다 — 매 프로그램 생성 요청
시점에 필요하면 그때 채팅으로 물어본다(`personal_chat_ver1.py`의 슬롯 채우기 로직 참고).

CSS 테스트 안내 문구(기록 없는 회원에게 노출): "정확한 페이스가 없다면 200m와 400m를
최대 노력으로 수영한 뒤 (400m 기록 − 200m 기록) ÷ 2를 100m당 역치 페이스로 씁니다."
(§3-2A) — 이 계산 자체는 폼 밖에서 이뤄지고, 결과값만 `css_pace_sec_per_100m`에 담긴다.

## B. 목표

| 필드명 | 타입 | 값/선택지 | 필수 | 용도 |
|---|---|---|---|---|
| `goal_type` | 단일선택 | FITNESS(체력) / RECORD(기록단축) / COMPETITION(대회준비) / TECHNIQUE(자세교정) / REHAB(재활) | 필수 | `select_categories()` 키워드 매칭, `plan_context.phase` 산정 |
| `target_event_date` | 날짜(YYYY-MM-DD) 또는 null | goal_type이 COMPETITION일 때만 노출 | 조건부 | `apply_periodization()`의 대회 임박 판정(TAPER 전환) |
| `target_event` | 텍스트 또는 null | 종목(예: "자유형 100m") | 조건부 | 세션 코칭 문구 참고용(현재 로직 미소비, 표시용) |
| `target_time_sec` | 정수 또는 null | 목표 기록(초) | 선택 | 향후 페이스 목표 정교화용(현재 로직 미소비) |

## C. 신체·안전 — ACSM 사전 스크리닝 (§3-3, `screen()`이 그대로 소비)

| 필드명 | 타입 | 값/선택지 | 필수 | ACSM 3요소 대응 |
|---|---|---|---|---|
| `age` | 정수 | 나이 | 필수 | `_age_group_from_age()`로 안전 배려·설명 방식 결정(훈련 강도 자체는 결정 안 함) |
| `activity_level` | 단일선택 | INACTIVE(비활동적) / REGULAR(규칙적으로 운동 중) | 필수 | **요소①** 현재 신체활동 수준 |
| `has_symptoms_or_disease` | boolean | "심혈관·대사·신장 질환 진단을 받았거나, 관련 증상(가슴 통증, 어지러움, 호흡곤란 등)이 있습니까?" | 필수 | **요소②** — `True`면 강도 무관하게 무조건 `REFER_TO_PHYSICIAN` |
| `desired_intensity` | 단일선택 | LIGHT_MODERATE(가볍게~중간강도) / VIGOROUS(고강도) | 필수 | **요소③** 희망 운동 강도 — INACTIVE + VIGOROUS 조합만 REFER |
| `injury_notes` | 텍스트 또는 null | 부상 이력/현재 통증 부위 자유 기술 | 선택 | 현재 `screen()`엔 미반영(구조화 안 된 자유텍스트라 안전 판정에 안 씀) — 코칭 프롬프트의 참고 메모로만 전달 권장 |
| `pregnant` | boolean 또는 null | 임신 여부 | 선택(해당자만) | 현재 로직 미소비 — 추후 강도 상한 별도 게이팅 추가 시 사용 |

★ `injury_notes`/`pregnant`를 실제 강도 게이팅에 반영하려면 `screen()`을 확장하는
별도 작업이 필요하다 — 이번 범위에서는 "표시·전달"까지만 하고 판정 로직엔 넣지 않았다.
자유 텍스트를 안전 판정에 직접 쓰는 건 오분류 위험이 커서 의도적으로 제외함.

## D. 환경·제약

| 필드명 | 타입 | 값/선택지 | 필수 | 용도 |
|---|---|---|---|---|
| `pool_length_m` | 단일선택 | 25 / 50 | 필수 | 인터벌 세트 반복거리 반올림 단위 참고(현재는 25m 고정 로직, 50m 레인 대응은 추후) |
| `available_days` | 다중선택 | 월~일 | 선택 | 세션 스케줄링(현재 단일 세션 생성 함수 범위 밖 — 호출자 레이어에서 사용) |
| `session_duration_min` | 정수 | 세션당 가능 시간(분) | 필수 | `calc_phase_minutes()`/`calc_target_distance()` 입력 |
| `equipment` | 텍스트 | 보유 장비 자유 기술(예: "오리발, 패들") | 선택 | `detect_equip_multiplier()` — 팀 모드와 동일 로직 재사용 |
| `indoor_outdoor` | 단일선택 | INDOOR / OUTDOOR | 선택 | 현재 로직 미소비, 표시용 |
| `has_partner` | boolean | 파트너 유무 | 선택 | 현재 로직 미소비, 향후 파트너 드릴 추천 시 사용 예정 |

## E. 주관 캘리브레이션

| 필드명 | 타입 | 값/선택지 | 필수 | 용도 |
|---|---|---|---|---|
| `rpe_calibration` | 정수 0~10 | "가장 최근 힘들었던 수영이 10점 만점에 몇 점이었나요?" (CR-10 스케일) | 필수 | 페이스 기록이 없을 때 RPE 기반 지도의 기준점(`calc_personal_intensity`의 `intensity_note`에 노출) |

CR-10 스케일 안내(폼에 툴팁으로 노출): 0=전혀 힘들지 않음 · 2~3=가볍다 · 5~6=약간
힘들다 · 7~8=힘들다 · 9~10=매우 힘들다/최대. programlogic.md §1-4의 존별 RPE 표기와
동일한 스케일을 쓴다.

---

## request_body 전체 예시

```json
{
  "profile": {
    "pb_50m": {
      "free": 38,
      "back": null,
      "breast": null,
      "fly": null
    },
    "css_pace_sec_per_100m": 95,
    "weekly_frequency": 3,
    "avg_session_distance_m": 1800,
    "goal_type": "RECORD",
    "target_event_date": "2026-10-01",
    "target_event": "자유형 100m",
    "target_time_sec": 70,
    "age": 34,
    "activity_level": "REGULAR",
    "has_symptoms_or_disease": false,
    "desired_intensity": "VIGOROUS",
    "injury_notes": "왼쪽 어깨 통증 이력 있음(현재는 괜찮음)",
    "pregnant": false,
    "pool_length_m": 25,
    "available_days": ["MON", "WED", "FRI"],
    "session_duration_min": 60,
    "equipment": "패들, 풀부이",
    "indoor_outdoor": "INDOOR",
    "has_partner": false,
    "rpe_calibration": 7
  },
  "request": "다음 대회 전에 스피드를 좀 끌어올리고 싶어요",
  "session_history": [
    {"date": "2026-08-07", "category": "B", "zone": "EN1", "total_distance_m": 1500}
  ],
  "last_feedback": {"completed": true, "rpe_actual": 6},
  "today": "2026-08-14"
}
```

## 미해결/추후 확장 항목

- HRR/Karvonen(§3-4) 입력 필드(안정심박·최대심박)는 웨어러블 연동 전제라 이번
  폼에는 넣지 않았다. 넣게 되면 C 섹션이 아니라 A(기록·피트니스)에 선택 필드로
  추가하는 게 자연스럽다.
- `injury_notes`/`pregnant`를 실제 강도 상한에 반영하려면 `screen()` 확장이 필요 —
  별도 작업으로 분리.
- `pool_length_m=50`일 때 인터벌 세트 반복거리 반올림 단위를 어떻게 바꿀지는
  아직 미정(현재는 25m 단위 고정).
