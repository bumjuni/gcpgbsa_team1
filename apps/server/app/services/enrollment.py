from datetime import datetime

from schemas.student import Student
from models.enrollment import Enrollment
from crud.enrollment import EnrollmentCrud
from services.student import StudentService
from schemas.enrollment import EnrollmentCreate


class EnrollmentService:
    def __init__(self, crud: EnrollmentCrud, student_service: StudentService) -> None:
        self.crud = crud
        self.student_service = student_service

 # Todo: args 타입 확인(EnrollmentCreate 수정)
    async def create_enrollment(self, schema: EnrollmentCreate) -> Enrollment:
        # 1. 학생 매칭/생성 (StudentService의 책임)
        student = await self.student_service.find_or_create_student(
            Student(
                name=schema.name,
                gender=schema.gender,
                phone=schema.phone,
                birth_year=schema.birth_year,
            )
        )

        # 2. Enrollment 생성
        # is_active는 신규 등록 시 활성 상태로 간주해 True로 채운다 (기본값이 스키마/모델에 없어 명시적으로 설정).
        enrollment_data = {
            "student_id": student.id,
            "class_id": schema.class_id,
            "memo": schema.memo,
            "is_active": True,
        }
        return await self.crud.create(enrollment_data=enrollment_data)
