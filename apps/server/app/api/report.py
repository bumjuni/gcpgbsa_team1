from datetime import date

from fastapi import APIRouter, Depends, status

from api.dependencies import get_report_service
from schemas.report import WeeklyReportResponse
from services.report import ReportService

router = APIRouter(prefix="/report", tags=["Report"])


@router.get(
    "/{class_id}/{student_id}/{date}",
    response_model=WeeklyReportResponse,
    status_code=status.HTTP_200_OK,
    summary="학생 주간 웹 리포트 조회",
)
async def get_weekly_report(
    class_id: int,
    student_id: int,
    date: date,
    service: ReportService = Depends(get_report_service),
) -> WeeklyReportResponse:
    return await service.get_weekly_report_for_student(class_id, student_id, date)
