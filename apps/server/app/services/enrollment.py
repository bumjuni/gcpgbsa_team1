from datetime import datetime

from services.classroom import ClassroomService
from schemas.student import Student as StudentSchema
from crud.enrollment import EnrollmentCrud
from services.student import StudentService
from schemas.enrollment import Enrollment as EnrollmentSchema, EnrollmentCreate, EnrollmentResponse


class EnrollmentService:
    def __init__(self, crud: EnrollmentCrud, student_service: StudentService, classroom_service: ClassroomService) -> None:
        self.crud = crud
        self.student_service = student_service
        self.classroom_service = classroom_service

    async def create_enrollment(self, schema: EnrollmentCreate) -> EnrollmentResponse:
        # 1. 학생 매칭/생성 (StudentService의 책임)
        student = await self.student_service.find_or_create_student(
            StudentSchema(
                name=schema.name,
                gender=schema.gender,
                phone=schema.phone,
                birth_year=schema.birth_year,
            )
        )

        # 2. Enrollment 생성
        enrollment_data = {
            "student_id": student.id,
            "class_id": schema.class_id,
            "memo": schema.memo,
        }

        await self.classroom_service.increment_student_count(schema.class_id)
        # 3. swim_class의 student_count++
        enrollment = await self.crud.create(enrollment_data=enrollment_data)

            # 4. student + enrollment를 함께 반환
        return EnrollmentResponse(
            student=StudentSchema.model_validate(student),
            enrollment=EnrollmentSchema.model_validate(enrollment),
        )
