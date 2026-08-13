// mapLLMCurriculumResponse.ts
//
export interface LessonSetItem {
  title: string;
  set: number;
  distance_m: number;
  detail: string;
}

export interface LessonSection {
  title: string;
  items: LessonSetItem[];
}

// LLM(generate_curriculum)이 그대로 반환하는 원본 응답 형태
export interface LLMCurriculumItem {
  title: string;
  set: number;
  distance_m: number;
  duration_time: number;
  detail: string;
}

export interface LLMCurriculumSessionSummary {
  total_time_m: number;
  total_distance_m: number;
  focus_point: string;
}

export interface LLMCurriculumProgram {
  pre_set: LLMCurriculumItem[];
  main_set: LLMCurriculumItem[];
  post_set: LLMCurriculumItem[];
}

export interface LLMCurriculumResponse {
  session_summary: LLMCurriculumSessionSummary;
  program: LLMCurriculumProgram;
}

// ── 매핑 후(서버/클라이언트가 실제로 쓰는) 형태 ──────────────────
export interface ProgramItemResult {
  title: string;
  set: number;
  distance_m: number;
  duration_min: number; // duration_time -> duration_min
  detail: string;
}

export interface SessionSummaryResult {
  total_min: number; // total_time_m -> total_min
  total_distance_m: number;
  focus_point: string;
}

export interface ProgramPlanResult {
  pre_set: ProgramItemResult[];
  main_set: ProgramItemResult[];
  post_set: ProgramItemResult[];
}

export interface CurriculumResult {
  session_summary: SessionSummaryResult;
  program: ProgramPlanResult;
}

const mapItem = (item: LLMCurriculumItem): ProgramItemResult => ({
  title: item.title,
  set: item.set,
  distance_m: item.distance_m,
  duration_min: item.duration_time,
  detail: item.detail,
});

export const mapLLMCurriculumResponse = (
  raw: LLMCurriculumResponse
): CurriculumResult => ({
  session_summary: {
    total_min: raw.session_summary.total_time_m,
    total_distance_m: raw.session_summary.total_distance_m,
    focus_point: raw.session_summary.focus_point,
  },
  program: {
    pre_set: raw.program.pre_set.map(mapItem),
    main_set: raw.program.main_set.map(mapItem),
    post_set: raw.program.cooldown.map(mapItem),
  },
});
