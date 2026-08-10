from collections import defaultdict
from typing import Any, Dict, Type, TypeVar, Optional

from datetime import datetime, time
from models.classroom import AgeGroupEnum, LevelEnum, SwimClass

# 인메모리 테이블 저장소 및 ID 채번 카운터 (모듈 수준 공유)
_IN_MEMORY_STORAGE: Dict[Type, Dict[int, Any]] = defaultdict(dict)
_ID_COUNTERS: Dict[Type, int] = defaultdict(int)

T = TypeVar("T")

# ---------------------------------------------------------
# 더미 데이터 초기화
# ---------------------------------------------------------

def _init_dummy_data():
    dummy_data = {
        "id": 1,
        "name": "초급 자유형 & 배영반",
        "capacity": 15,
        "level": LevelEnum.BEGINNER,
        "age_groups": AgeGroupEnum.ADULT,
        "goals": "자유형 50m 완성 및 배영 발차기 습득",
        "goal_etc": "자유형 호흡 패턴 교정 포함",
        "duration_min": 50,
        "start_time": time(9, 0),
        "days_of_week": "월,수,금",
        "is_active": True,  # 모델에 필수(nullable=False)이므로 추가
        "created_at": datetime.now(),
    }
    dummy_swim_class = SwimClass(**dummy_data)

    # 1. 인메모리 딕셔너리에 삽입
    _IN_MEMORY_STORAGE[SwimClass][dummy_swim_class.id] = dummy_swim_class
    # 2. 다음번 생성 시 ID 충돌(1번 중복)이 발생하지 않도록 카운터 조정
    _ID_COUNTERS[SwimClass] = max(_ID_COUNTERS[SwimClass], dummy_swim_class.id)

# 모듈이 로드될 때 더미 데이터 세팅 실행
_init_dummy_data()

# ---------------------------------------------------------
# 가짜 세션 클래스
# ---------------------------------------------------------

class FakeAsyncSession:
    """SQLAlchemy AsyncSession 인터페이스를 흉내 내는 임시 인메모리 세션"""

    def __init__(self):
        self._pending = []

    def add(self, instance: Any) -> None:
        model_cls = type(instance)
        # ID가 설정되어 있지 않다면 자동 증가 ID 부여
        if getattr(instance, "id", None) is None:
            _ID_COUNTERS[model_cls] += 1
            instance.id = _ID_COUNTERS[model_cls]
        self._pending.append(instance)

    async def commit(self) -> None:
        # pending 객체들을 메모리 저장소로 이관
        for instance in self._pending:
            model_cls = type(instance)
            _IN_MEMORY_STORAGE[model_cls][instance.id] = instance
        self._pending.clear()

    async def refresh(self, instance: Any) -> None:
        # 메모리 참조 객체이므로 값은 이미 동기화되어 있음 (no-op)
        pass

    async def get(self, entity_cls: Type[T], ident: int) -> Optional[T]:
        # 커밋 전 대기 중인 객체 우선 검색 후 저장소 조회
        for item in self._pending:
            if isinstance(item, entity_cls) and getattr(item, "id", None) == ident:
                return item
        return _IN_MEMORY_STORAGE.get(entity_cls, {}).get(ident)

    async def rollback(self) -> None:
        self._pending.clear()

    async def close(self) -> None:
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


def async_session_factory():
    return FakeAsyncSession()
