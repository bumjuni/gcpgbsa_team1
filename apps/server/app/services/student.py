from typing import Optional

from fastapi import HTTPException, status

from models.student import Student
from schemas.student import Student as StudentSchema, StudentUpdate
from crud.student import StudentCrud


class StudentService:
    def __init__(self, crud: StudentCrud) -> None:
        self.crud = crud

    async def create_student(self, schema: StudentSchema) -> Student:
        return await self.crud.create(student_data=schema.model_dump(exclude={"id"}))

    async def find_matching_student(
        self, student: StudentSchema
    ) -> Optional[Student]:
        """
        name+gender+phone+birth_year 넷 다 있을 때만 매칭을 시도한다.
        셋 중 하나라도 없으면(이름만 존재 시) 동명이인 구분이 불가능하므로 None(=신규 등록 대상)을 반환한다.
        """
        if not (student.name and student.phone and student.gender and student.birth_year):
            return None
        return await self.crud.find_exact_match(student)

    async def find_or_create_student(self, student: Student) -> Student:
        """기존 학생을 찾으면 그 학생을, 없으면(또는 매칭 불가 조건이면) 새로 만들어 반환한다."""
        existing = await self.find_matching_student(student)
        if existing is not None:
            return existing

        return await self.create_student(student)

    async def get_student_detail(self, student_id: int, instructor_id: int) -> StudentSchema:
        """본인이 담당하는 반에 등록된 학생만 조회 가능"""
        student = await self.crud.get_by_id_for_instructor(student_id, instructor_id)
        if student is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "수강생을 찾을 수 없습니다.")
        return StudentSchema.model_validate(student)

    async def update_student(
        self, student_id: int, schema: StudentUpdate, instructor_id: int
    ) -> StudentSchema:
        student = await self.crud.get_by_id_for_instructor(student_id, instructor_id)
        if student is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "수강생을 찾을 수 없습니다.")

        update_data = schema.model_dump(exclude_unset=True)
        updated = await self.crud.update(student, update_data)
        return StudentSchema.model_validate(updated)
