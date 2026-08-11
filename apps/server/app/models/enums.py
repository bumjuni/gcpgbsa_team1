import enum

class LevelEnum(str, enum.Enum):
    BEGINNER = "BEGINNER"           # 신규
    ELEMENTARY = "ELEMENTARY"       # 초급
    INTERMEDIATE = "INTERMEDIATE"   # 중급
    ADVANCED = "ADVANCED"           # 상급
    MASTER = "MASTER"               # 마스터


class AgeGroupEnum(str, enum.Enum):
    PRESCHOOL = "PRESCHOOL"         # 유아
    ELEMENTARY = "ELEMENTARY"       # 초등
    TEEN = "TEEN"                   # 청소년
    ADULT = "ADULT"                 # 성인
    SENIOR = "SENIOR"               # 시니어


class ProgramStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"                 # 미확정
    SCHEDULED = "SCHEDULED"         # 확정
    COMPLETED = "COMPLETED"         # 완료


class ProgramPhaseEnum(str, enum.Enum):
    WARM_UP = "WARM_UP"             # 웜업
    MAIN = "MAIN"                   # 메인
    COOL_DOWN = "COOL_DOWN"         # 쿨다운
