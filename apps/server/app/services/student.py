from typing import Optional

from models.student import Student
from schemas.student import Student as StudentSchema
from crud.student import StudentCrud


class StudentService:
    def __init__(self, crud: StudentCrud) -> None:
        self.crud = crud

    async def create_student(self, schema: StudentSchema) -> Student:
        return await self.crud.create(student_data=schema.model_dump())

    async def find_matching_student(
        self, student: StudentSchema
    ) -> Optional[Student]:
        """
        name+gender+phone+birth_year 넷 다 있을 때만 매칭을 시도한다.
        셋 중 하나라도 없으면(이름만 존재 시) 동명이인 구분이 불가능하므로 None(=신규 등록 대상)을 반환한다.
        """
        if not (student.name and student.phone and student.gemder and student.birth_year):
            return None
        return await self.crud.find_exact_match(student)

    async def find_or_create_student(self, student: Student) -> Student:
        """기존 학생을 찾으면 그 학생을, 없으면(또는 매칭 불가 조건이면) 새로 만들어 반환한다."""
        existing = await self.find_matching_student(student)
        if existing is not None:
            return existing

        return await self.create_student(student)
