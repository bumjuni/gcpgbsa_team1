import { LessonPlanCreatePayload, LessonPlanResponse, LessonPlanStatusPayload } from '../types/lessonPlan';
import { ProgramHistoryItem } from '../utils/classSchedule';
import { apiClient } from './client';

export const lessonPlanApi = {
  // 수업안(루틴 프로그램) 생성
  createLessonPlan: async (payload: LessonPlanCreatePayload) => {
    const response = await apiClient.post<LessonPlanResponse>('/program/', payload);
    console.log(response);
    return response.data;
  },

  confirmLessonPlan: async (programId: number, payload: LessonPlanStatusPayload) => {
    console.log(payload)
    const response = await apiClient.patch<LessonPlanResponse>(`/program/${programId}/confirm`, payload);
    console.log(response);
    return response.data;
  },

  getLessonPlanHistory: async (swimClassId: number) => {
    const response = await apiClient.get<ProgramHistoryItem[]>(`/program/${swimClassId}/history`);
    console.log(response);
    return response.data;
  },

  getLessonPlanDate: async (swimClassId: number, date: string) => {
    const response = await apiClient.get<LessonPlanResponse | null>(`/program/${swimClassId}/${date}`);
    console.log(response);
    return response.data;
  },

  toggleLessonPlanItemChecked: async (lessonPlanItemId: number) => {
    const response = await apiClient.patch<number>(`/program/${lessonPlanItemId}/check`);
    console.log(response)
    return response.data;
  },

  completeLessonPlan: async (programId: number, payload: LessonPlanStatusPayload) => {
    console.log(payload)
    const response = await apiClient.patch<LessonPlanResponse>(`/program/${programId}/complete`, payload);
    console.log(response);
    return response.data;
  },

};
