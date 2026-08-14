import { LessonSetItem, LLMCurriculumResponse } from '../types/lessonPlan';
import { ProgramHistoryItem } from '../utils/classSchedule';
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

interface LessonPlanConfirmPayload {
  status: 'CONFIRMED';
  program: {
    pre_set: LessonSetItem[];
    main_set: LessonSetItem[];
    post_set: LessonSetItem[];
  };
}

export const lessonPlanApi = {
  // 수업안(루틴 프로그램) 생성
  createLessonPlan: async (payload: LessonPlanCreatePayload) => {
    const response = await apiClient.post<LLMCurriculumResponse>('/program', payload);
    console.log(response);
    return response.data;
  },

  confirmLessonPlan: async (programId: number, payload: LessonPlanConfirmPayload) => {
    console.log(payload)
    const response = await apiClient.patch<LLMCurriculumResponse>(`/program/${programId}/confirm`, payload);
    console.log(response);
    return response.data;
  },

  getLessonPlanHistory: async (swimClassId: number) => {
    const response = await apiClient.get<ProgramHistoryItem[]>(`/program/${swimClassId}/programs/history`);
    console.log(response);
    return response.data;
  },

  getLessonPlanToday: async (swimClassId: number) => {
    const response = await apiClient.get<LLMCurriculumResponse>(`/program/${swimClassId}/programs/today`);
    console.log(response);
    return response.data;
  }
};
