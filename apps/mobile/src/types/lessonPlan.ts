export type LessonPlanSetKey = 'pre_set' | 'main_set' | 'post_set';
export type EquipmentValue = 'FINS' | 'BOARD' | 'PADDLE' | 'PULLBUOY' | 'NONE';
export type LessonPlanStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED';

export interface LessonPlanItem {
  id: number;
  title: string;
  set: number;
  is_checked: boolean;
  distance_m: number;
  duration_time: number;
  detail: string;
}

export interface LessonPlanSessionSummary {
  total_time_m: number;
  total_distance_m: number;
  focus_point: string;
}

export interface LessonPlanSet {
  key: LessonPlanSetKey;
  title: string;
  items: LessonPlanItem[];
}

export interface LessonPlanSession {
  pre_set: LessonPlanItem[];
  main_set: LessonPlanItem[];
  post_set: LessonPlanItem[];
}

export interface LessonPlanResponse {
  id: number;
  class_id: number;
  date: string;
  equipment: string | null;
  request: string | null;
  created_at: string;
  status: LessonPlanStatus;
  session_summary: LessonPlanSessionSummary;
  lesson_plan: LessonPlanSession;
}

export interface LessonPlanCreatePayload {
  class_id: number;
  date: string; // 'YYYY-MM-DD'
  equipment?: string; // 예: "FINS, PULLBUOY"
  request?: string;
}

export interface LessonPlanConfirmPayload {
  status: 'CONFIRMED';
  program: LessonPlanSession;
}
