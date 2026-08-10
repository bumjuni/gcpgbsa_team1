from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.classroom import SwimClass, Student, Program, ProgramItem, Enrollment


# ======================================================================
# 1. SwimClass (강습 클래스) CRUD
# ======================================================================
async def get_swim_classes(
        db: AsyncSession
    ) -> Optional[list[SwimClass]]:
        """
        클래스 목록 조회 (Soft Delete 된 데이터는 제외)
        """
        query = select(SwimClass).where(
            SwimClass.deleted_at.is_(None)
        )
        result = await db.execute(query)
        return result.scalars().all()


async def get_swim_class_detail(
        db: AsyncSession, swim_class_id: int
    ) -> Optional[SwimClass]:
        """
        단건 클래스 조회 (Soft Delete 된 데이터는 제외)
        """
        query = select(SwimClass).where(
            SwimClass.id == swim_class_id,
            SwimClass.deleted_at.is_(None)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()


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


async def delete_swim_class(db: AsyncSession, swim_class_id: int) -> Optional[SwimClass]:
    """강습 소프트 삭제"""
    swim_class = await db.get(SwimClass, swim_class_id)
    if swim_class is None:
        return None

    swim_class.deleted_at = datetime.now()
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


async def delete_student(db: AsyncSession, student_id: int) -> Optional[Student]:
    """수강생 소프트 삭제"""
    student = await db.get(Student, student_id)
    if student is None:
        return None

    student.deleted_at = datetime.now()
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


async def delete_program(db: AsyncSession, program_id: int) -> Optional[Program]:
    """프로그램 소프트 삭제"""
    program = await db.get(Program, program_id)
    if program is None:
        return None

    program.deleted_at = datetime.now()
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


async def delete_program_item(db: AsyncSession, program_item_id: int) -> Optional[ProgramItem]:
    """프로그램 아이템 소프트 삭제"""
    program_item = await db.get(ProgramItem, program_item_id)
    if program_item is None:
        return None

    program_item.deleted_at = datetime.now()
    await db.commit()
    await db.refresh(program_item)

    return program_item


# ======================================================================
# 5. Enrollment (수강 신청) CRUD
# ======================================================================
async def create_enrollment(db: AsyncSession, enrollment_data: dict) -> Enrollment:
    """새로운 수강 신청 생성"""
    enrollment = Enrollment(
        **enrollment_data,
        created_at=datetime.now(),
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    return enrollment


async def delete_enrollment(db: AsyncSession, enrollment_id: int) -> Optional[Enrollment]:
    """수강 정보 삭제 (soft delete)"""
    enrollment = await db.get(Enrollment, enrollment_id)
    if enrollment is None:
        return None

    enrollment.deleted_at = datetime.now()
    await db.commit()
    await db.refresh(enrollment)

    return enrollment
