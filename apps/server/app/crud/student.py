from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from models.student import Student


class StudentCrud:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db


    async def create(self, student_data: dict) -> Student:
        """새로운 수강생 생성"""
        student = Student(
            **student_data,
            created_at=datetime.now(),
        )
        self.db.add(student)
        await self.db.commit()
        await self.db.refresh(student)

        return student


    async def delete(self, student_id: int) -> Optional[Student]:
        """수강생 소프트 삭제"""
        student = await self.db.get(Student, student_id)
        if student is None:
            return None

        student.deleted_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(student)

        return student
