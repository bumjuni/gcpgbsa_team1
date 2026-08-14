from typing import Optional

from fastapi import HTTPException, status

from crud.enrollment import EnrollmentCrud
from models.student import Student
from crud.student import StudentCrud
from schemas.student import StudentCreate, StudentResponse, StudentUpdate


class StudentService:
    def __init__(self, crud: StudentCrud, enrollment_crud: Optional[EnrollmentCrud] = None) -> None:
        self.crud = crud
        self.enrollment_crud = enrollment_crud

    async def create_student(self, schema: StudentCreate) -> Student:
        return await self.crud.create(student_data=schema.model_dump())

    async def _to_response(self, student: Student, class_id: Optional[int]) -> StudentResponse:
        # memo는 Student에 없는 필드 - class_id가 주어지면 해당 반 소속(Enrollment)의 memo를 찾아 채운다.
        memo = None
        if class_id is not None and self.enrollment_crud is not None:
            enrollment = await self.enrollment_crud.get_by_student_and_class(student.id, class_id)
            if enrollment is not None:
                memo = enrollment.memo
        return StudentResponse(
            id=student.id,
            name=student.name,
            phone=student.phone,
            birth_year=student.birth_year,
            memo=memo,
            created_at=student.created_at,
        )

    async def get_student(self, student_id: int, class_id: Optional[int] = None) -> StudentResponse:
        student = await self.crud.get_by_id(student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )
        return await self._to_response(student, class_id)

    async def update_student(
        self, student_id: int, schema: StudentUpdate, class_id: Optional[int] = None
    ) -> StudentResponse:
        update_data = schema.model_dump(exclude_unset=True, exclude={"memo"})
        student = await self.crud.update(student_id, update_data)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )

        # memo는 Student가 아니라 해당 반 소속(Enrollment)에 반영
        if "memo" in schema.model_fields_set and class_id is not None and self.enrollment_crud is not None:
            enrollment = await self.enrollment_crud.get_by_student_and_class(student_id, class_id)
            if enrollment is not None:
                await self.enrollment_crud.update(enrollment.id, {"memo": schema.memo})

        return await self._to_response(student, class_id)

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
