from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from crud import classroom as crud_classroom
from models.classroom import Enrollment, Program, ProgramItem, Student, SwimClass
from schemas.classroom import (
    EnrollmentCreate,
    ProgramCreate,
    ProgramItemCreate,
    StudentCreate,
    SwimClassCreate,
)


class ClassroomService:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # SwimClass Operations
    # ------------------------------------------------------------------
    async def create_swim_class(self, schema: SwimClassCreate) -> SwimClass:
        return await crud_classroom.create_swim_class(
            db=self.db, class_data=schema.model_dump()
        )

    async def delete_swim_class(self, swim_class_id: int) -> SwimClass:
        deleted_class = await crud_classroom.delete_swim_class(
            db=self.db, swim_class_id=swim_class_id
        )
        if not deleted_class:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SwimClass with ID {swim_class_id} not found.",
            )
        return deleted_class

    # ------------------------------------------------------------------
    # Student Operations
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    # Program Operations
    # ------------------------------------------------------------------
    async def create_program(self, schema: ProgramCreate) -> Program:
        return await crud_classroom.create_program(
            db=self.db, program_data=schema.model_dump()
        )

    async def delete_program(self, program_id: int) -> Program:
        deleted_program = await crud_classroom.delete_program(
            db=self.db, program_id=program_id
        )
        if not deleted_program:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Program with ID {program_id} not found.",
            )
        return deleted_program

    # ------------------------------------------------------------------
    # ProgramItem Operations
    # ------------------------------------------------------------------
    async def create_program_item(self, schema: ProgramItemCreate) -> ProgramItem:
        return await crud_classroom.create_program_item(
            db=self.db, program_item_data=schema.model_dump()
        )

    async def delete_program_item(self, program_item_id: int) -> ProgramItem:
        deleted_item = await crud_classroom.delete_program_item(
            db=self.db, program_item_id=program_item_id
        )
        if not deleted_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ProgramItem with ID {program_item_id} not found.",
            )
        return deleted_item

    # ------------------------------------------------------------------
    # Enrollment Operations
    # ------------------------------------------------------------------
    async def create_enrollment(self, schema: EnrollmentCreate) -> Enrollment:
        return await crud_classroom.create_enrollment(
            db=self.db, enrollment_data=schema.model_dump()
        )
