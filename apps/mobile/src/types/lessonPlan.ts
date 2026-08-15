export interface LessonPlanItem {
  id: number;
  title: string;
  set: number;
  distance_m: number;
  duration_time: number;
  detail: string;
}
export interface LessonPlanSessionSummary {
  total_time_m: number;
  total_distance_m: number;
  focus_point: string;
}
export interface LessonPlanSets {
  pre_set: LessonPlanItem[];
  main_set: LessonPlanItem[];
  post_set: LessonPlanItem[];
}
export interface LessonPlanResponse {
  id: number;
  session_summary: LessonPlanSessionSummary;
  lesson_plan: LessonPlanSets;
}
