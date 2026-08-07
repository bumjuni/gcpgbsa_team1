from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from models.classroom import SwimClass, Student, Program, ProgramItem


# ======================================================================
# 1. SwimClass (강습 클래스) CRUD
# ======================================================================
async def create_swim_class(db: AsyncSession, class_data: dict) -> SwimClass:
    """새로운 강습 생성"""
    swim_class = SwimClass(
        **class_data,
        created_at=datetime.now(),
    )
    db.add(swim_class)
    await db.commit()
    await db.refresh(swim_class)

    return swim_class


# ======================================================================
# 2. Student (수강생) CRUD
# ======================================================================
async def create_student(db: AsyncSession, student_data: dict) -> Student:
    """새로운 수강생 생성"""
    student = Student(
        **student_data,
        created_at=datetime.now(),
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)

    return student


# ======================================================================
# 3. Program (프로그램) CRUD
# ======================================================================
async def create_program(db: AsyncSession, program_data: dict) -> Program:
    """새로운 프로그램 생성"""
    program = Program(
        **program_data,
        created_at=datetime.now(),
    )
    db.add(program)
    await db.commit()
    await db.refresh(program)

    return program


# ======================================================================
# 4. ProgramItem (프로그램 아이템) CRUD
# ======================================================================
async def create_program_item(db: AsyncSession, program_item_data: dict) -> ProgramItem:
    """새로운 프로그램 아이템 생성"""
    program_item = ProgramItem(
        **program_item_data,
        created_at=datetime.now(),
    )
    db.add(program_item)
    await db.commit()
    await db.refresh(program_item)

    return program_item
