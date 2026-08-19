from datetime import date

from fastapi import APIRouter, Depends, status

from api.dependencies import get_report_service
from schemas.report import RatingRequest, RatingResponse, WeeklyReportResponse
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


@router.post(
    "/{class_id}/{student_id}/{date}/rating",
    response_model=RatingResponse,
    status_code=status.HTTP_200_OK,
    summary="웹 리포트 별점 등록",
)
async def submit_rating(
    class_id: int,
    student_id: int,
    date: date,
    schema: RatingRequest,
    service: ReportService = Depends(get_report_service),
) -> RatingResponse:
    return await service.submit_rating(class_id, student_id, date, schema)
