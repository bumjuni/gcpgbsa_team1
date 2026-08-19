import secrets
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select

from models import SwimClass, WeeklyReport, WeeklyReportItem
from models.enums import AgeGroupEnum, GenderEnum, LevelEnum
from crud.report import WeeklyReportCrud
from crud.program import ProgramCrud
from crud.enrollment import EnrollmentCrud
from schemas.report import WeeklyReportResponse


# level(강도)별 MET 대표값 - SRS §3-2 강도 구간(저/중/고강도)을 실제 LevelEnum 5단계에 매핑한 가정치
_MET_BY_LEVEL: dict[LevelEnum, float] = {
    LevelEnum.BEGINNER: 2.5,
    LevelEnum.ELEMENTARY: 2.5,
    LevelEnum.INTERMEDIATE: 4.5,
    LevelEnum.ADVANCED: 7.0,
    LevelEnum.MASTER: 7.0,
}

# 나이대(bracket) + 성별 평균 체중(kg) 근사표 - SRS §3-2
_WEIGHT_TABLE_KG: dict[str, dict[GenderEnum, int]] = {
    "<7": {GenderEnum.MALE: 21, GenderEnum.FEMALE: 20},
    "7-12": {GenderEnum.MALE: 35, GenderEnum.FEMALE: 33},
    "13-18": {GenderEnum.MALE: 60, GenderEnum.FEMALE: 52},
    "19-59": {GenderEnum.MALE: 74, GenderEnum.FEMALE: 58},
    "60+": {GenderEnum.MALE: 68, GenderEnum.FEMALE: 56},
}

# student.birth_year가 없을 때 swim_class.age_group으로 나이대를 대신 추정하기 위한 매핑
_AGE_GROUP_TO_BRACKET: dict[AgeGroupEnum, str] = {
    AgeGroupEnum.PRESCHOOL: "<7",
    AgeGroupEnum.ELEMENTARY: "7-12",
    AgeGroupEnum.TEEN: "13-18",
    AgeGroupEnum.ADULT: "19-59",
    AgeGroupEnum.SENIOR: "60+",
}


def _bracket_from_birth_year(birth_year: int) -> str:
    age = datetime.now().year - birth_year
    if age < 7:
        return "<7"
    if age <= 12:
        return "7-12"
    if age <= 18:
        return "13-18"
    if age <= 59:
        return "19-59"
    return "60+"


def _estimate_weight_kg(
    gender: Optional[GenderEnum],
    birth_year: Optional[int],
    class_age_group: AgeGroupEnum,
) -> float:
    """birth_year가 있으면 나이로, 없으면 반의 age_group으로 나이대를 추정한다.
    gender가 없으면 해당 나이대 남/여 평균 체중을 사용한다."""
    bracket = (
        _bracket_from_birth_year(birth_year)
        if birth_year is not None
        else _AGE_GROUP_TO_BRACKET[class_age_group]
    )
    weights = _WEIGHT_TABLE_KG[bracket]
    if gender is None:
        return sum(weights.values()) / len(weights)
    return weights[gender]


def _met_for_level(level: LevelEnum) -> float:
    return _MET_BY_LEVEL[level]


def _week_bounds(any_date: date) -> tuple[date, date]:
    """주어진 날짜가 속한 주의 월요일/일요일을 반환한다."""
    week_start = any_date - timedelta(days=any_date.weekday())
    week_end = week_start + timedelta(days=6)
    return week_start, week_end


class ReportService:
    def __init__(
        self,
        crud: WeeklyReportCrud,
        program_crud: ProgramCrud,
        enrollment_crud: EnrollmentCrud,
    ) -> None:
        self.crud = crud
        self.program_crud = program_crud
        self.enrollment_crud = enrollment_crud

    async def _get_swim_class(self, class_id: int) -> SwimClass:
        result = await self.crud.db.execute(
            select(SwimClass).where(SwimClass.id == class_id)
        )
        swim_class = result.scalar_one_or_none()
        if swim_class is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SwimClass with ID {class_id} not found.",
            )
        return swim_class

    async def _get_previous_cumulative(self, class_id: int, week_start: date) -> int:
        """같은 class_id의 직전 WeeklyReport의 누적 거리를 조회한다 (없으면 0)."""
        result = await self.crud.db.execute(
            select(WeeklyReportItem.cumulative_distance_m)
            .join(WeeklyReport, WeeklyReportItem.weekly_report_id == WeeklyReport.id)
            .where(
                WeeklyReport.class_id == class_id,
                WeeklyReport.week_start < week_start,
            )
            .order_by(WeeklyReport.week_start.desc())
            .limit(1)
        )
        return result.scalars().first() or 0

    async def get_or_create_weekly_report(
        self, class_id: int, week_start: date
    ) -> WeeklyReport:
        """해당 class_id + week의 WeeklyReport가 있으면 조회하고, 없으면 생성해서 반환한다."""
        week_start, week_end = _week_bounds(week_start)

        existing = await self.crud.get_by_class_and_week(class_id, week_start)
        if existing is not None:
            return existing

        swim_class = await self._get_swim_class(class_id)
        enrollments = await self.enrollment_crud.get_by_class_id(class_id)
        programs = await self.program_crud.get_completed_by_class_and_week(
            class_id, week_start, week_end
        )

        week_distance_m = sum(p.total_distance_m for p in programs)
        week_duration_min = sum(p.duration_min for p in programs)
        met = _met_for_level(swim_class.level)

        previous_cumulative = await self._get_previous_cumulative(class_id, week_start)
        cumulative_distance_m = previous_cumulative + week_distance_m

        items_data = []
        for enrollment in enrollments:
            student = enrollment.student
            weight_kg = _estimate_weight_kg(
                student.gender, student.birth_year, swim_class.age_group
            )
            week_calorie_kcal = round(met * weight_kg * (week_duration_min / 60))
            items_data.append(
                {
                    "student_id": student.id,
                    "week_distance_m": week_distance_m,
                    "week_duration_min": week_duration_min,
                    "week_calorie_kcal": week_calorie_kcal,
                    "cumulative_distance_m": cumulative_distance_m,
                    "apply_tip": None,
                    "key_points": None,
                    "is_included": True,
                    "share_token": secrets.token_hex(32),
                }
            )

        report_data = {
            "class_id": class_id,
            "week_start": week_start,
            "week_end": week_end,
        }
        return await self.crud.create(report_data, items_data)

    async def get_weekly_report_for_student(
        self, class_id: int, student_id: int, any_date: date
    ) -> WeeklyReportResponse:
        """08 화면용 학생별 웹 리포트 DTO를 조립한다 (get_or_create_weekly_report를 호출)."""
        week_start, _ = _week_bounds(any_date)
        report = await self.get_or_create_weekly_report(class_id, week_start)

        item = next((i for i in report.items if i.student_id == student_id), None)
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student {student_id}의 주간 리포트 항목을 찾을 수 없습니다.",
            )

        programs = await self.program_crud.get_completed_by_class_and_week(
            class_id, report.week_start, report.week_end
        )
        session_focus_list = [p.ai_summary_line for p in programs if p.ai_summary_line]

        return WeeklyReportResponse(
            week_start=report.week_start,
            week_end=report.week_end,
            week_distance_m=item.week_distance_m,
            week_duration_min=item.week_duration_min,
            week_calorie_kcal=item.week_calorie_kcal,
            session_focus_list=session_focus_list,
            apply_tip=item.apply_tip,
            key_points=item.key_points,
            rating=None,  # report_feedback 제출 플로우는 이번 작업 범위 밖
        )
