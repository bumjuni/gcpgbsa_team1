from crud.enrollment import EnrollmentCrud
from services.student import StudentService
from schemas.enrollment import EnrollmentCreate, EnrollmentResponse


class EnrollmentService:
    def __init__(self, crud: EnrollmentCrud, student_service: StudentService) -> None:
        self.crud = crud
        self.student_service = student_service

    async def create_enrollment(self, schema: EnrollmentCreate) -> EnrollmentResponse:
        # 1. 학생 매칭/생성 (StudentService의 책임)
        student = await self.student_service.find_or_create_student(
            name=schema.name,
            phone=schema.phone,
            birth_year=schema.birth_year,
        )

        # 2. Enrollment 생성
        # is_active는 신규 등록 시 활성 상태로 간주해 True로 채운다 (기본값이 스키마/모델에 없어 명시적으로 설정).
        enrollment_data = {
            "student_id": student.id,
            "class_id": schema.class_id,
            "memo": schema.memo,
            "is_active": True,
        }
        enrollment = await self.crud.create(enrollment_data=enrollment_data)

        # 3. 응답 조립 (student + enrollment 결합 - FE가 기대하는 형태)
        return EnrollmentResponse(
            id=enrollment.id,
            student_id=enrollment.student_id,
            class_id=enrollment.class_id,
            name=student.name,
            phone=student.phone,
            birth_year=student.birth_year.year if hasattr(student.birth_year, "year") else student.birth_year,
            memo=enrollment.memo,
            created_at=enrollment.created_at,
        )
