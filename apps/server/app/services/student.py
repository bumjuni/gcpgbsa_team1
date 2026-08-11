from fastapi import HTTPException, status

from crud.student import StudentCrud
from models.classroom import Student
from schemas.classroom import (
    StudentCreate,
)

class StudentService:
    def __init__(self, crud: StudentCrud) -> None:
        self.crud = crud

    async def create_student(self, schema: StudentCreate) -> Student:
        return await self.crud.create(
            student_data=schema.model_dump()
        )

    async def delete_student(self, student_id: int) -> Student:
        deleted_student = await self.crud.delete(
            student_id=student_id
        )
        if not deleted_student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )
        return deleted_student
