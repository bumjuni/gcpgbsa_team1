from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from crud.enrollment import EnrollmentCrud
from crud.student import StudentCrud
from crud.classroom import ClassroomCrud
from crud.program import ProgramCrud

def get_enrollment_crud(db: AsyncSession = Depends(get_db)) -> EnrollmentCrud:
    return EnrollmentCrud(db)

def get_student_crud(db: AsyncSession = Depends(get_db)) -> StudentCrud:
    return StudentCrud(db)

def get_classroom_crud(db: AsyncSession = Depends(get_db)) -> ClassroomCrud:
    return ClassroomCrud(db)

def get_program_crud(db: AsyncSession = Depends(get_db)) -> ProgramCrud:
    return ProgramCrud(db)
