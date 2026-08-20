from typing import List
from fastapi import HTTPException, status

from crud.enrollment import EnrollmentCrud
from schemas.enrollment import (
    Enrollment as EnrollmentSchema,
    EnrollmentCreate,
    EnrollmentUpdate,
    EnrollmentResponse,
)
from schemas.student import Student as StudentSchema
from services.classroom import ClassroomService
from services.student import StudentService


class EnrollmentService:
    def __init__(
        self,
        crud: EnrollmentCrud,
        student_service: StudentService,
        classroom_service: ClassroomService,
    ) -> None:
        self.crud = crud
        self.student_service = student_service
        self.classroom_service = classroom_service

    async def create_enrollment(self, schema: EnrollmentCreate, instructor_id: int) -> EnrollmentResponse:
        # 0. 대상 반이 본인 소유인지 확인 (없거나 소유가 아니면 404)
        await self.classroom_service.get_swim_class_detail(schema.class_id, instructor_id)

        # 1. 학생 매칭/생성 (StudentService의 책임)
        student = await self.student_service.find_or_create_student(
            StudentSchema(
                name=schema.name,
                gender=schema.gender,
                phone=schema.phone,
                birth_year=schema.birth_year,
            )
        )

        # 2. Enrollment 생성 데이터 구성
        enrollment_data = {
            "student_id": student.id,
            "class_id": schema.class_id,
            "memo": schema.memo,
        }

        # 3. swim_class의 student_count 증가
        await self.classroom_service.increment_student_count(schema.class_id)

        # 4. Enrollment 생성
        enrollment = await self.crud.create(enrollment_data=enrollment_data)

        # 5. student + enrollment 반환
        return EnrollmentResponse(
            student=StudentSchema.model_validate(student),
            enrollment=EnrollmentSchema.model_validate(enrollment),
        )

    async def update_enrollment(
        self, enrollment_id: int, schema: EnrollmentUpdate, instructor_id: int
    ) -> EnrollmentResponse:
        # 1. 수정할 수강 정보 조회
        enrollment = await self.crud.get_by_id(enrollment_id)
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="수강 신청 정보를 찾을 수 없습니다.",
            )

        # 1-1. 소속 반이 본인 소유인지 확인
        await self.classroom_service.get_swim_class_detail(enrollment.class_id, instructor_id)

        # 2. 수강 정보 업데이트
        updated_enrollment = await self.crud.update(enrollment, schema)

        # 3. student 정보와 함께 반환
        return EnrollmentResponse(
            student=StudentSchema.model_validate(updated_enrollment.student),
            enrollment=EnrollmentSchema.model_validate(updated_enrollment),
        )

    async def delete_enrollment(self, enrollment_id: int, instructor_id: int) -> bool:
        # 1. 수강 정보 존재 여부 확인
        enrollment = await self.crud.get_by_id(enrollment_id)
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="수강 신청 정보를 찾을 수 없습니다.",
            )

        # 1-1. 소속 반이 본인 소유인지 확인
        await self.classroom_service.get_swim_class_detail(enrollment.class_id, instructor_id)

        # 2. swim_class의 student_count 감소
        await self.classroom_service.decrement_student_count(enrollment.class_id)

        # 3. Soft Delete 수행
        await self.crud.delete(enrollment_id)
        return True

    async def get_enrollments_by_class(
        self, class_id: int, instructor_id: int
    ) -> List[EnrollmentResponse]:
        # 0. 대상 반이 본인 소유인지 확인
        await self.classroom_service.get_swim_class_detail(class_id, instructor_id)

        # 특정 클래스의 전체 수강 목록 조회
        enrollments = await self.crud.get_by_class_id(class_id)
        return [
            EnrollmentResponse(
                student=StudentSchema.model_validate(e.student),
                enrollment=EnrollmentSchema.model_validate(e),
            )
            for e in enrollments
        ]
