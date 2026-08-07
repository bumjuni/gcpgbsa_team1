from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from models.classroom import SwimClass, Student


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


# ======================================================================
# 2. Student (수강생) CRUD
# ======================================================================
async def create_student(db: AsyncSession, student_data: dict) -> Student:
    """새로운 수강생 생성"""
    student = Student(
        **student_data,
        created_at=datetime.now(),
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)

    return student
