from datetime import datetime
from typing import Optional

from sqlalchemy import select
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

    async def find_exact_match(
        self, student: Student
    ) -> Optional[Student]:
        """
        name+phone+birth_year 셋 다 정확히 일치하는 '활성'(소프트 삭제 안 된) 학생을 찾는다.
        여러 명이 일치하면(이론상 매우 드묾) 가장 최근에 등록된 학생을 반환한다.
        """
        result = await self.db.execute(
            select(Student)
            .where(
                Student.name == student.name,
                Student.gender == student.gender,
                Student.phone == student.phone,
                Student.birth_year == student.birth_year,
                Student.deleted_at.is_(None),
            )
            .order_by(Student.created_at.desc())
        )
        return result.scalars().first()

    async def delete(self, student_id: int) -> Optional[Student]:
        """수강생 소프트 삭제"""
        student = await self.db.get(Student, student_id)
        if student is None:
            return None
        student.deleted_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(student)
        return student
