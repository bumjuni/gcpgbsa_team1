from fastapi import HTTPException, status

from sqlalchemy import select

from crud.program import ProgramCrud
from services.llm.llm_service import LLMService
from models.classroom import SwimClass
from models.program import Program, ProgramItem
from models.enums import ProgramStatusEnum
from schemas.program import (
    ProgramCreate,
    ProgramItemCreate,
    ProgramResponse,
    Program as ProgramSchema
)


class ProgramService:
    def __init__(self, crud: ProgramCrud,  llm_service: LLMService):
         self.crud = crud
         self.llm_service = llm_service

    async def _get_swim_class(self, class_id: int) -> SwimClass:
            result = await self.crud.db.execute(
                select(SwimClass).where(SwimClass.id == class_id)
            )
            swim_class = result.scalar_one_or_none()
            if swim_class is None:
                raise ValueError(f"SwimClass를 찾을 수 없습니다: {class_id}")
            return swim_class


    async def create_program(self, schema: ProgramCreate) -> ProgramResponse:
            # 1. DB에서 반 정보 조회 (ProgramService의 책임)
            swim_class = await self._get_swim_class(schema.class_id)

            # 2. LLM 호출 (LLMService의 책임 - RequestBody 조립 + generate_curriculum 호출)
            llm_result = await self.llm_service.generate(
                swim_class=swim_class,
                equipment=schema.equipment or "",
                request=schema.request or "",
            )
            session_summary = llm_result["session_summary"]
            program_plan: ProgramSchema = llm_result["program"]

            # 3. Program 행 생성
            # duration_min은 요청 시 사용한 swim_class.durationMin을 그대로 저장한다.
            # (LLM이 돌려주는 session_summary.total_time_m은 참고용 요약치이며 Program.duration_min에는 쓰지 않는다)
            program = await self.crud.create_program(
                program_data={
                    "class_id": schema.class_id,
                    "date": schema.date,
                    "duration_min": swim_class.durationMin,
                    "equipment": schema.equipment,
                    "status": ProgramStatusEnum.DRAFT,
                }
            )
            # 4. ProgramItem 생성 (warmup/main/cooldown 순서대로, phase enum 부여)
            phase_groups = {
                "WARMUP": program_plan.warmup,
                "MAIN": program_plan.main,
                "COOLDOWN": program_plan.cooldown,
            }
            for phase, items in phase_groups.items():
                for item in items:
                    await self.crud.create_program_item(
                        program_item_data={
                            "program_id": program.id,
                            "phase": phase,
                            "title": item.title,
                            "detail": item.detail,
                            "set": item.set,
                            "distance_m": item.distance_m,
                            "duration_min": item.duration_min,
                        }
                    )

            # 5. 응답 조립 (LLM 응답 그대로 재사용 - DB 재조회 불필요)
            return ProgramResponse(
                id=program.id,
                class_id=program.class_id,
                date=program.date,
                equipment=program.equipment,
                request=schema.request,
                created_at=program.created_at,
                session_summary=session_summary,
                program=program_plan,
            )


    async def delete_program(self, program_id: int) -> Program:
        deleted_program = await self.crud.delete_program(
            program_id=program_id
        )
        if not deleted_program:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Program with ID {program_id} not found.",
            )
        return deleted_program

    async def create_program_item(self, schema: ProgramItemCreate) -> ProgramItem:
        return await self.crud.create_program_item(
            program_item_data=schema.model_dump()
        )

    async def delete_program_item(self, program_item_id: int) -> ProgramItem:
        deleted_item = await self.crud.delete_program_item(
            program_item_id=program_item_id
        )
        if not deleted_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ProgramItem with ID {program_item_id} not found.",
            )
        return deleted_item
