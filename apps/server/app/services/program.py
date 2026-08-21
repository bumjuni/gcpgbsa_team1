from fastapi import HTTPException, status

from datetime import date, datetime
from typing import Optional

from sqlalchemy import select

from models import SwimClass
from models.enums import ProgramStatusEnum
from schemas.program import ProgramConfirm, ProgramCreate, ProgramHistoryItem, ProgramResponse, Program as ProgramSchema, SessionSummary, ProgramFeedbackCreate
from models import Program, ProgramItem
from services.llm.llm_service import LLMService
from crud.program import ProgramCrud


class ProgramService:
    def __init__(self, crud: ProgramCrud, llm_service: LLMService) -> None:
        self.crud = crud
        self.llm_service = llm_service

    async def _get_swim_class(self, class_id: int, instructor_id: int) -> SwimClass:
        result = await self.crud.db.execute(
            select(SwimClass).where(
                SwimClass.id == class_id,
                SwimClass.instructor_id == instructor_id,
            )
        )
        swim_class = result.scalar_one_or_none()
        if swim_class is None:
            raise ValueError(f"SwimClass를 찾을 수 없습니다: {class_id}")
        return swim_class

    async def create_program(self, schema: ProgramCreate, instructor_id: int) -> ProgramResponse:
        # 1. DB에서 반 정보 조회 (ProgramService의 책임, 본인 소유만)
        swim_class = await self._get_swim_class(schema.class_id, instructor_id)

        # 1-1. 같은 class_id+date에 기존 Program row가 있는지 확인
        # (lazy 생성 등으로 이미 만들어져 있을 수 있음 - uq_program_class_date 유니크 제약)
        existing_program = await self.crud.get_by_class_and_date(
            class_id=schema.class_id, date=schema.date
        )
        if existing_program is not None and existing_program.status != ProgramStatusEnum.DRAFT:
            raise ValueError(
                f"이미 '{existing_program.status.value}' 상태의 수업안이 있어 재생성할 수 없습니다."
            )

        # 2. LLM 호출 (LLMService의 책임 - RequestBody 조립 + generate_curriculum 호출)
        llm_result = await self.llm_service.generate(
            swim_class=swim_class,
            equipment=schema.equipment or "",
            request=schema.request or "",
        )
        session_summary = llm_result["session_summary"]
        program_plan: ProgramSchema = llm_result["program"]

        # 3. Program 행 생성 또는 (DRAFT면) 갱신
        # duration_min은 요청 시 사용한 값과 동일하게 start_time/end_time 차이로 계산해 저장한다.
        swim_class_duration_min = (
            (swim_class.end_time.hour * 60 + swim_class.end_time.minute)
            - (swim_class.start_time.hour * 60 + swim_class.start_time.minute)
        )

        if existing_program is not None:
            # DRAFT 상태 재생성: 기존 row 갱신 + 기존 아이템 전부 삭제 후 재생성
            program = await self.crud.update_program(
                program_id=existing_program.id,
                update_data={
                    "duration_min": swim_class_duration_min,
                    "equipment": schema.equipment,
                    "total_distance_m": session_summary.total_distance_m,
                },
            )
            await self.crud.delete_program_items(program.id)
        else:
            program = await self.crud.create_program(
                program_data={
                    "class_id": schema.class_id,
                    "date": schema.date,
                    "duration_min": swim_class_duration_min,
                    "total_distance_m": session_summary.total_distance_m,
                    "equipment": schema.equipment,
                    "status": ProgramStatusEnum.DRAFT,
                }
            )

        # 4. ProgramItem 생성
        phase_groups = {
            "PRE_SET": program_plan.pre_set,
            "MAIN_SET": program_plan.main_set,
            "POST_SET": program_plan.post_set,
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

        response = ProgramResponse(
            id=program.id,
            class_id=program.class_id,
            date=program.date,
            equipment=program.equipment,
            request=schema.request,
            created_at=program.created_at,
            session_summary=session_summary,
            program=program_plan,
        )

        print(response)

        # 5. 응답 조립 (LLM 응답 그대로 재사용 - DB 재조회 불필요)
        return response

    async def confirm_program(self, program_id: int, schema: ProgramConfirm, instructor_id: int) -> ProgramResponse:
        program = await self.crud.db.get(Program, program_id)
        if program is None:
            raise ValueError(f"Program을 찾을 수 없습니다: {program_id}")

        # 소속 반이 본인 소유인지 확인
        await self._get_swim_class(program.class_id, instructor_id)

        existing_items = await self.crud.get_program_items(program.id)
        existing_ids = {item.id for item in existing_items}

        phase_groups = {
            "PRE_SET": schema.program.pre_set,
            "MAIN_SET": schema.program.main_set,
            "POST_SET": schema.program.post_set,
        }

        incoming_ids = set()
        for phase, items in phase_groups.items():
            for item in items:
                item_data = {
                    "title": item.title,
                    "detail": item.detail,
                    "set": item.set,
                    "distance_m": item.distance_m,
                    "duration_min": item.duration_min,
                    "phase": phase,
                }
                if item.id is not None and item.id in existing_ids:
                    # 기존 항목 수정
                    await self.crud.update_program_item(item.id, item_data)
                    incoming_ids.add(item.id)
                else:
                    # 신규 항목 생성 (id가 없거나, 있어도 이 program 소속이 아니면 새로 생성)
                    created = await self.crud.create_program_item(
                        program_item_data={"program_id": program.id, **item_data}
                    )
                    incoming_ids.add(created.id)

        # 프론트에서 삭제된 항목(기존엔 있었는데 요청에 없는 id) 정리
        removed_ids = existing_ids - incoming_ids
        if removed_ids:
            await self.crud.delete_program_items_by_ids(list(removed_ids))

        program = await self.crud.confirm_program(
            program_id=program.id,
            status=ProgramStatusEnum.CONFIRMED,
        )

        updated_items = await self.crud.get_program_items(program.id)
        program_plan = ProgramSchema(
            pre_set=[i for i in updated_items if i.phase == "PRE_SET"],
            main_set=[i for i in updated_items if i.phase == "MAIN_SET"],
            post_set=[i for i in updated_items if i.phase == "POST_SET"],
        )

        return ProgramResponse(
            id=program.id,
            class_id=program.class_id,
            date=program.date,
            equipment=program.equipment,
            request="",
            created_at=program.created_at,
            session_summary=SessionSummary(
                total_min=program.duration_min,
                total_distance_m=sum(i.set * i.distance_m for i in updated_items),
            ),
            program=program_plan,
        )

    async def complete_program(self, program_id: int, schema: ProgramConfirm, instructor_id: int) -> ProgramResponse:
        program = await self.crud.db.get(Program, program_id)
        if program is None:
            raise ValueError(f"Program을 찾을 수 없습니다: {program_id}")

        # 소속 반이 본인 소유인지 확인
        await self._get_swim_class(program.class_id, instructor_id)

        program = await self.crud.confirm_program(
            program_id=program.id,
            status=ProgramStatusEnum.COMPLETED,
        )

        updated_items = await self.crud.get_program_items(program.id)
        program_plan = ProgramSchema(
            pre_set=[i for i in updated_items if i.phase == "PRE_SET"],
            main_set=[i for i in updated_items if i.phase == "MAIN_SET"],
            post_set=[i for i in updated_items if i.phase == "POST_SET"],
        )

        return ProgramResponse(
            id=program.id,
            class_id=program.class_id,
            date=program.date,
            equipment=program.equipment,
            request="",
            created_at=program.created_at,
            session_summary=SessionSummary(
                total_min=program.duration_min,
                total_distance_m=sum(i.set * i.distance_m for i in updated_items),
            ),
            program=program_plan,
        )
    async def get_program_history(self, class_id: int, instructor_id: int) -> list[ProgramHistoryItem]:
        await self._get_swim_class(class_id, instructor_id)
        programs = await self.crud.get_non_draft_programs_by_class(class_id)
        return [
            ProgramHistoryItem(program_id=p.id, status=p.status, date=p.date)
            for p in programs
        ]


    async def get_program_by_date(self, class_id: int, date: date, instructor_id: int) -> Optional[ProgramResponse]:
        await self._get_swim_class(class_id, instructor_id)
        program = await self.crud.get_by_class_and_date(class_id, date)
        print("get_program_by_date: ", program)

        if program is None:
            return None

        return ProgramResponse(
            id=program.id,
            class_id=program.class_id,
            date=program.date,
            status=program.status,
            equipment=program.equipment,
            request="",
            created_at=program.created_at,
            session_summary=SessionSummary(
                total_min=program.duration_min,
                total_distance_m=program.total_distance_m,
            ),
            program=ProgramSchema.model_validate(program),
        )

    async def submit_feedback(
            self, program_id: int, schema: ProgramFeedbackCreate, instructor_id: int
        ) -> None:
            program = await self.crud.db.get(Program, program_id)
            if program is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Program을 찾을 수 없습니다: {program_id}",
                )

            # 소속 반이 본인 소유인지 확인
            await self._get_swim_class(program.class_id, instructor_id)

            await self.crud.add_feedback(program_id, schema.rating, schema.memo)


    async def check_program_item(self, program_item_id: int, instructor_id: int) -> int:
        item = await self.crud.db.get(ProgramItem, program_item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ProgramItem with ID {program_item_id} not found.",
            )

        program = await self.crud.db.get(Program, item.program_id)
        if not program:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ProgramItem with ID {program_item_id} not found.",
            )

        # 소속 반이 본인 소유인지 확인
        await self._get_swim_class(program.class_id, instructor_id)

        checked_program_item = await self.crud.check_program_item(program_item_id)
        return checked_program_item.id
