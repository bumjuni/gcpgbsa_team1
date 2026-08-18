# llm 서비스 — 신규 파일 안내 (2026-08-17 기준)

> 이 문서는 `feat/be/rag-service` 브랜치에서 최근 세션들에 새로 생긴 파일들을
> 한눈에 파악할 수 있도록 정리한 스냅샷입니다. **파일을 삭제하거나 옮기지
> 않았습니다** — 아래 표는 지금 이 디렉터리에 있는 그대로의 위치를 설명만
> 합니다. (하위 폴더로 옮기지 않은 이유: 이 디렉터리의 스크립트들은 서로
> `from teamprogram_ver1 import ...` 식으로 같은 폴더에 있다는 전제로
> import하고 있어서, 물리적으로 옮기면 import가 깨집니다.)

## 아키텍처 한눈에 보기 (3계층)

```
teamprogram_ver1.py   — 공통 코어(카테고리 A~E, 8존 분류, 게이팅, 인터벌 세트 계산)
                         + 팀(강사) 전용 엔트리포인트 generate_curriculum()
        │  (공통 코어 표·함수를 라이브러리처럼 import)
        ▼
personar_ver1.py       — ACSM 안전 스크리닝 + 개인 강도 계산 + 다중 세션 주기화
                         + 개인 전용 엔트리포인트 generate_personal_session()
        │  (단발 세션 생성 함수를 그대로 호출)
        ▼
personal_chat_ver1.py — 의도 분류·슬롯 채우기·잡담 RAG 그라운딩을 얹은
                         채팅 오케스트레이션 레이어 (페르소나 "그로우디")
```

`personar_ver1.py`/`personal_chat_ver1.py`는 `teamprogram_ver1.generate_curriculum()`을
호출하지 않습니다 — 그 안에 정의된 공통 표·함수(zone/category 로직)만 가져다 쓰고,
각자 독립된 엔트리포인트(`generate_personal_session()`)를 갖습니다.

★ **`personal_chat_ver1.py`는 아직 FastAPI 백엔드(`apps/server/app/api`)에
연결되지 않은 CLI·로컬 개발서버 전용 프로토타입입니다.** 저장소 전체에서
이 모듈을 참조하는 곳은 자기 자신과 아래 테스트/개발 도구뿐입니다.

더 상세한 파이프라인 설명은 아래 "개발자용 로직 시각화 문서" 두 개를 참고하세요 —
이 문서만 읽어도 각 로직의 흐름을 처음부터 끝까지 이해할 수 있도록 만들었습니다.

---

## ① 팀 프로그램 — 핵심 로직 · 테스트

| 파일 | 설명 | 실행법 |
|---|---|---|
| `teamprogram_ver1.py` | 팀(강사) 커리큘럼 생성 핵심 로직. `generate_curriculum(request_body) -> dict`가 엔트리포인트이며, §1 공통 코어(존/카테고리 분류)도 이 파일에 있음. `rag_service_ver4.py`의 후속 버전(출력 스키마 100% 동일). | 아래 두 스크립트로 실행 |
| `run_team_ver1.py` | `generate_curriculum()` 단발 실행용 대화형 스크립트. JSON을 붙여넣거나 Enter만 치면 내장 샘플로 실행. | `python3 run_team_ver1.py` |
| `test_team_scenarios_ver1.py` | 시나리오 5종(preschool/speed/speed_repeat/technique/equip_periodization) 배치 실행 — 실제 Gemini 호출. | `python3 test_team_scenarios_ver1.py --list` (목록만) / 이름 지정 실행 |

## ② 개인모드 챗봇 — 핵심 로직 · 온보딩

| 파일 | 설명 | 실행법 |
|---|---|---|
| `personar_ver1.py` | 개인 세션 생성 로직(ACSM 스크리닝, 개인 강도 계산, 다중 세션 주기화, 피드백 반영). `generate_personal_session(request_body) -> dict`가 엔트리포인트. | 아래 스크립트로 실행 |
| `personal_chat_ver1.py` | 위 함수 위에 얹은 채팅 레이어 — 의도 분류(`GENERATE_SESSION`/`FEEDBACK`/`CHAT`), 슬롯 채우기(영법/오늘 초점/컨디션), 잡담용 RAG 그라운딩, 페르소나 "그로우디". | `python3 personal_chat_ver1.py [profile.json]` |
| `personal_onboarding_form.md` | 개인모드 온보딩 폼 필드 스펙 문서(A~E 섹션: 기록·피트니스/목표/ACSM 안전/환경·제약/RPE 캘리브레이션). `stroke_primary`를 온보딩에서 뺀 이유도 여기 설명돼 있음. | — |
| `run_personal_ver1.py` | `generate_personal_session()` 단발 실행용 대화형 스크립트(채팅 레이어 건너뛰고 직접 테스트). | `python3 run_personal_ver1.py [profile.json]` |
| `calibrate_rag_threshold.py` | 잡담 RAG 그라운딩의 `RAG_RELEVANCE_THRESHOLD` 값을 실측으로 재보정하기 위한 1회성 스크립트. 수영 질문/잡담 샘플 각각의 relevance score를 나란히 출력. | `python3 calibrate_rag_threshold.py` (사전에 `gcloud auth application-default login` 필요) |

## ③ 개발자용 로직 시각화 문서 (신규 — 이번에 함께 추가)

| 파일 | 설명 |
|---|---|
| `team_program_logic.html` | 팀 프로그램 생성(`teamprogram_ver1.py`) 전체 파이프라인을 처음부터 끝까지 설명하는 단독 HTML 문서. 브라우저로 열어서 보면 됨(서버 실행 불필요). |
| `personal_chat_logic.html` | 개인모드 챗봇(온보딩/슬롯채우기/RAG 그라운딩, `personal_chat_ver1.py`+`personar_ver1.py`) 전체 파이프라인을 설명하는 단독 HTML 문서. 마찬가지로 서버 실행 불필요. |

## ④ 로컬 개발 서버 / 실시간 테스트 도구

| 파일 | 설명 | 실행법 |
|---|---|---|
| `personal_chat_dev_server.py` | `personal_chat_ver1.py`의 CHAT 의도 파이프라인(키워드 게이트→RAG 검색→그라운딩→응답)만 실시간으로 테스트하는 로컬 FastAPI 서버. 로직을 재구현하지 않고 실제 함수를 그대로 호출함. | `cd apps/server/app/services/llm && ../../../venv/bin/python3 personal_chat_dev_server.py` 후 `http://127.0.0.1:8765` 접속 |
| `personal_chat_dev_page.html` | 위 서버가 서빙하는 테스트 페이지. CHAT 파이프라인 구조 다이어그램 + 실시간 테스트 결과(매치 키워드, RAG 후보 점수, 최종 응답)를 시각화. `team_program_logic.html`/`personal_chat_logic.html`과 달리 이건 실제 라이브 테스트용이고, 서버가 켜져 있어야 동작함. | (위 서버 실행 후 브라우저로 접속) |

## ⑤ 공용 설계 문서

| 파일 | 설명 |
|---|---|
| `programlogic.md` | "PROGRAM_LOGIC v2" — 팀/개인 모드 분리 설계안(승인 전 초안). §1 공통 코어, §2 팀 설계, §3 개인 설계(신규), §5에 제안된 파일 구조(`zone_logic_common.py` 등)가 있지만 **실제로는 그 구조대로 분리되지 않고 `teamprogram_ver1.py` 안에 공통 코어가 그대로 남아 있음** — 문서와 실제 파일 구조가 다르다는 점 참고. |

## ⑥ 레거시 참고용 — 이번 작업과 무관

| 파일 | 설명 |
|---|---|
| `run_once.py` | `generate_curriculum`을 **`rag_service_ver4.py`에서** import — `teamprogram_ver1.py`가 아님. 파일명만 범용적일 뿐 구버전 대상 스크립트. |
| `test_generate_curriculum.py` | `generate_curriculum`을 **`rag_service_ver3.py`에서** import — 마찬가지로 이번 팀 프로그램 작업과 무관한 더 오래된 버전 대상 스크립트. |

`drill_picker.py`는 이번 세션에서 수정하지 않았습니다(직전 세션에 `LEVEL_STROKE_PROGRESSION` 등이 이미 반영됨) — git에는 수정(M) 상태로 표시되지만 새 파일은 아닙니다.

---

## 참고 — 알려진 사소한 불일치 (버그는 아니고 정리 차원의 메모)

- `run_personal_ver1.py`의 `SAMPLE_REQUEST`는 아직 구 스키마(`stroke_primary`/`pb_record`)를 쓰고 있어, `personal_onboarding_form.md`가 정의한 현재 스키마(`pb_50m`)와 어긋납니다. 현재 로직은 이 필드들을 읽지 않으므로 실행 자체는 되지만, 예시로서는 오래된 값입니다. 수정이 필요하면 `personal_chat_ver1.py`의 `__main__` 블록에 있는 샘플 프로필(현재 스키마 반영됨)을 참고해 갱신하면 됩니다.
