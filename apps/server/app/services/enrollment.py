from fastapi import HTTPException, status

from crud.enrollment import EnrollmentCrud
from models.enrollment import Enrollment
from services.student import StudentService
from schemas.enrollment import EnrollmentCreate, EnrollmentResponse


class EnrollmentService:
    def __init__(self, crud: EnrollmentCrud, student_service: StudentService) -> None:
        self.crud = crud
        self.student_service = student_service

    @staticmethod
    def _to_response(enrollment, student) -> EnrollmentResponse:
        # student + enrollment 결합 (FE가 기대하는 형태). birth_year는 Date 컬럼이라 연도만 추출.
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

        return self._to_response(enrollment, student)

    async def get_enrollments_by_class(self, class_id: int) -> list[EnrollmentResponse]:
        enrollments = await self.crud.get_by_class_id(class_id)
        return [self._to_response(e, e.student) for e in enrollments]

    async def deactivate_enrollment(self, enrollment_id: int) -> Enrollment:
        # 반 소속만 비활성화 - Student/다른 반 소속은 건드리지 않음 (06-2C classroom 소프트삭제 패턴과 동일)
        enrollment = await self.crud.deactivate(enrollment_id)
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Enrollment with ID {enrollment_id} not found.",
            )
        return enrollment
