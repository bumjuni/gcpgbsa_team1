from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from models.classroom import SwimClass


# ======================================================================
# 1. SwimClass (강습 클래스) CRUD
# ======================================================================
async def create_swim_class(db: AsyncSession, class_data: dict) -> SwimClass:
    """새로운 강습 생성"""
    swim_class = SwimClass(
        **class_data,
        created_at=datetime.now(),
    )
    db.add(swim_class)
    await db.commit()
    await db.refresh(swim_class)

    return swim_class
