import { apiClient } from "./client"
import { SwimClass } from "./types";

export const classroomApi = {
  // 강습 목록 조회
  getClasses: async () => {
    const response = await apiClient.get<SwimClass[]>(`/classroom`);
    console.log(response);
    return response.data;
  },

  // 강습 상세정보 조회
  getClassDetail: async (class_id: number) => {
    const response = await apiClient.get<SwimClass[]>(`/classroom/${class_id}`);
    console.log(response);
    return response.data;
  },

  // 새로운 강습반 등록
  createClass: async (classData: SwimClass) => {
      const response = await apiClient.post<SwimClass>('/classroom', classData);
      console.log(response);
      return response.data;
  },

  // 강습반 삭제
  deleteClass: async (class_id: number) => {
      const response = await apiClient.delete<SwimClass>(`/classroom/${class_id}`);
      console.log(response);
      return response.data;
  },
}
