from datetime import date, datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.report import WeeklyReport, WeeklyReportItem


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
