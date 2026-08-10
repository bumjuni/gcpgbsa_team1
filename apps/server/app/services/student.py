from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from crud import classroom as crud_classroom
from models.classroom import Student
from schemas.classroom import (
    StudentCreate,
)

class StudentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_student(self, schema: StudentCreate) -> Student:
        return await crud_classroom.create_student(
            db=self.db, student_data=schema.model_dump()
        )

    async def delete_student(self, student_id: int) -> Student:
        deleted_student = await crud_classroom.delete_student(
            db=self.db, student_id=student_id
        )
        if not deleted_student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )
        return deleted_student
