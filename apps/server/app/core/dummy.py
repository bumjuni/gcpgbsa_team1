"""
더미데이터 시딩 스크립트 (async)
실행: python dummy.py

"""
import asyncio
from datetime import datetime, time, date

from core.database import async_session_factory
from models.student import Student
from models.classroom import SwimClass
from models.enrollment import Enrollment
from models.enums import LevelEnum, AgeGroupEnum


async def seed():
    db = async_session_factory()
    try:
        # 1. Student 먼저 생성 (FK 의존 없음)
        students = [
            Student(
                name="김민준",
                phone="010-1111-1111",
                birth_year=date(2015, 3, 1),
                created_at=datetime.now(),
            ),
            Student(
                name="이서연",
                phone="010-2222-2222",
                birth_year=date(2016, 7, 12),
                created_at=datetime.now(),
            ),
            Student(
                name="박도윤",
                phone=None,
                birth_year=date(2014, 11, 20),
                created_at=datetime.now(),
            ),
        ]
        db.add_all(students)
        await db.flush()  # id 확보 (commit 전에 PK 값 필요)

        # 2. SwimClass 생성 (FK 의존 없음, student와 독립적)
        swim_classes = [
            SwimClass(
                name="초급 자유형반",
                capacity=10,
                student_count=0,
                level=LevelEnum.BEGINNER,
                age_groups=AgeGroupEnum.PRESCHOOL,
                goals="BASIC_ADAPTATION",
                goal_etc=None,
                start_time=time(9, 0),
                end_time=time(9, 50),
                days_of_week="Mon, Wed, Fri",
                is_active=True,
                created_at=datetime.now(),
            ),
            SwimClass(
                name="중급 자세교정반",
                capacity=8,
                student_count=0,
                level=LevelEnum.INTERMEDIATE,
                age_groups=AgeGroupEnum.ADULT,
                goals="POSTURE_CORRECTION",
                goal_etc=None,
                start_time=time(10, 0),
                end_time=time(10, 50),
                days_of_week="Tue, Thu",
                is_active=True,
                created_at=datetime.now(),
            ),
        ]
        db.add_all(swim_classes)
        await db.flush()  # id 확보

        # 3. Enrollment 생성 (student, swim_class 둘 다 FK로 참조하므로 마지막)
        enrollments = [
            Enrollment(
                student_id=students[0].id,
                class_id=swim_classes[0].id,
                memo=None,
                is_active=True,
                created_at=datetime.now(),
            ),
            Enrollment(
                student_id=students[1].id,
                class_id=swim_classes[0].id,
                memo=None,
                is_active=True,
                created_at=datetime.now(),
            ),
            Enrollment(
                student_id=students[2].id,
                class_id=swim_classes[1].id,
                memo="자세 교정 필요",
                is_active=True,
                created_at=datetime.now(),
            ),
        ]
        db.add_all(enrollments)

        await db.commit()
        print(f"✅ 완료: student {len(students)}, swim_class {len(swim_classes)}, enrollment {len(enrollments)}")

    except Exception as e:
        await db.rollback()
        print(f"❌ 실패: {e}")
        raise
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed())
