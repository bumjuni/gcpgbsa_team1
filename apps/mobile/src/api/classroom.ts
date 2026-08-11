import { apiClient } from "./client"

export interface SwimClass {
  id: number;
  name: string;
  capacity: number;
  level: string;
  age_groups: string;
  duration_min: number;
  is_active: boolean;
  status: boolean;
}

export const classroomApi = {
  // 강습 목록 조회
  getClasses: async (class_id: number) => {
    const response = await apiClient.get<SwimClass[]>(`/classroom/classes/${class_id}`);
    console.log(response);
    return response.data;
  }
}
