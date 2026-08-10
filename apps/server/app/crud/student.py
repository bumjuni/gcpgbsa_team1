from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from models.classroom import Student


class StudentCrud:
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


    async def delete_student(db: AsyncSession, student_id: int) -> Optional[Student]:
        """수강생 소프트 삭제"""
        student = await db.get(Student, student_id)
        if student is None:
            return None

        student.deleted_at = datetime.now()
        await db.commit()
        await db.refresh(student)

        return student
