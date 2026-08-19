from datetime import date, datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.report import ReportFeedback, WeeklyReport, WeeklyReportItem


class WeeklyReportCrud:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, report_data: dict, items_data: list[dict]) -> WeeklyReport:
        """새로운 주간 리포트와 학생별 아이템을 함께 생성"""
        weekly_report = WeeklyReport(
            **report_data,
            created_at=datetime.now(),
        )
        self.db.add(weekly_report)
        await self.db.flush()  # weekly_report.id 확보 (아이템의 FK로 사용)

        for item_data in items_data:
            self.db.add(
                WeeklyReportItem(
                    **item_data,
                    weekly_report_id=weekly_report.id,
                    created_at=datetime.now(),
                )
            )
        await self.db.commit()

        return await self.get_by_class_and_week(
            weekly_report.class_id, weekly_report.week_start
        )

    async def get_by_class_and_week(
        self, class_id: int, week_start: date
    ) -> Optional[WeeklyReport]:
        """class_id + week_start로 기존 WeeklyReport를 학생별 아이템과 함께 조회한다."""
        result = await self.db.execute(
            select(WeeklyReport)
            .options(selectinload(WeeklyReport.items))
            .where(
                WeeklyReport.class_id == class_id,
                WeeklyReport.week_start == week_start,
            )
        )
        return result.scalar_one_or_none()

    async def upsert_feedback(
        self, weekly_report_item_id: int, rating: int
    ) -> ReportFeedback:
        """weekly_report_item에 대한 별점을 등록하거나(없으면), 이미 있으면 갱신한다."""
        result = await self.db.execute(
            select(ReportFeedback).where(
                ReportFeedback.weekly_report_item_id == weekly_report_item_id
            )
        )
        feedback = result.scalar_one_or_none()

        if feedback is not None:
            feedback.rating = rating
            feedback.submitted_at = datetime.now()
        else:
            feedback = ReportFeedback(
                weekly_report_item_id=weekly_report_item_id,
                rating=rating,
                submitted_at=datetime.now(),
            )
            self.db.add(feedback)

        await self.db.commit()
        await self.db.refresh(feedback)
        return feedback
