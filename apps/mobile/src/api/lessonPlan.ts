import { LLMCurriculumResponse } from '../types/lessonPlan';
import { apiClient } from './client'; // TODO: 실제 apiClient 경로에 맞게 조정

export type EquipmentValue = 'FINS' | 'BOARD' | 'PADDLE' | 'PULLBUOY' | 'NONE';

// LessonPlanCreate 스키마와 1:1 대응
export interface LessonPlanCreatePayload {
  class_id: number;
  date: string; // 'YYYY-MM-DD'
  equipment?: string; // 예: "FINS, PULLBUOY"
  request?: string;
}

export interface LessonPlanItemResponse {
  title: string;
  set: number;
  distance_m: number;
  duration_min: number;
  detail: string;
}

export interface LessonPlanSession {
  pre_set: LessonPlanItemResponse[];
  main_set: LessonPlanItemResponse[];
  post_set: LessonPlanItemResponse[];
}

export interface SessionSummary {
  total_min: number;
  total_distance_m: number;
  focus_point: string;
}

// LessonPlanResponse 스키마와 1:1 대응
export interface LessonPlanResponse {
  id: number;
  class_id: number;
  date: string;
  equipment: string | null;
  request: string | null;
  created_at: string;
  session_summary: SessionSummary;
  program: LessonPlanSession;
}

export const lessonPlanApi = {
  // 수업안(루틴 프로그램) 생성
  createLessonPlan: async (payload: LessonPlanCreatePayload) => {
    const response = await apiClient.post<LLMCurriculumResponse>('/program', payload);
    console.log(response);
    return response.data;
  },
};
