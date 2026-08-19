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
    DRAFT = "DRAFT"                 # 수업안 준비중
    CONFIRMED = "CONFIRMED"         # 수업안 확정됨
    INPROGRESS = "INPROGRESS"       # 수업 진행중
    COMPLETED = "COMPLETED"         # 수업 완료


class ProgramPhaseEnum(str, enum.Enum):
    PRE_SET = "PRE_SET"             # 웜업
    MAIN_SET = "MAIN_SET"                   # 메인
    POST_SET = "POST_SET"         # 쿨다운


class GenderEnum(str, enum.Enum):
    FEMALE = "FEMALE"
    MALE = "MALE"


class WeeklyReportStatusEnum(str, enum.Enum):
    PENDING = "PENDING"     # 발송 대기
    SENT = "SENT"            # 발송 완료
