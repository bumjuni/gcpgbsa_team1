from crud.enrollment import EnrollmentCrud
from models.classroom import Enrollment
from schemas.classroom import (
    EnrollmentCreate,
)

class EnrollmentService:
    def __init__(self, crud: EnrollmentCrud):
         self.crud = crud

    async def create_enrollment(self, schema: EnrollmentCreate) -> Enrollment:
        return await self.crud.create(
            enrollment_data=schema.model_dump()
        )
