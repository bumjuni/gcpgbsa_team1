from typing import Optional

from fastapi import HTTPException, status

from models.student import Student
from crud.student import StudentCrud
from schemas.student import StudentCreate, StudentUpdate


class StudentService:
    def __init__(self, crud: StudentCrud) -> None:
        self.crud = crud

    async def create_student(self, schema: StudentCreate) -> Student:
        return await self.crud.create(student_data=schema.model_dump())

    async def get_student(self, student_id: int) -> Student:
        student = await self.crud.get_by_id(student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )
        return student

    async def update_student(self, student_id: int, schema: StudentUpdate) -> Student:
        update_data = schema.model_dump(exclude_unset=True)
        student = await self.crud.update(student_id, update_data)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )
        return student

    async def delete_student(self, student_id: int) -> Student:
        student = await self.crud.delete(student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )
        return student

    async def find_matching_student(
        self, name: str, phone: Optional[str], birth_year: Optional[int]
    ) -> Optional[Student]:
        """
        name+phone+birth_year 셋 다 있을 때만 매칭을 시도한다.
        셋 중 하나라도 없으면 동명이인 구분이 불가능하므로 None(=신규 등록 대상)을 반환한다.
        """
        if not (name and phone and birth_year):
            return None
        return await self.crud.find_exact_match(
            name=name, phone=phone, birth_year=birth_year
        )

    async def find_or_create_student(
        self, name: str, phone: Optional[str], birth_year: Optional[int]
    ) -> Student:
        """기존 학생을 찾으면 그 학생을, 없으면(또는 매칭 불가 조건이면) 새로 만들어 반환한다."""
        existing = await self.find_matching_student(name, phone, birth_year)
        if existing is not None:
            return existing

        return await self.create_student(
            StudentCreate(name=name, phone=phone, birth_year=birth_year)
        )
