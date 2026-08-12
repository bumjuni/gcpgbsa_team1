import { apiClient } from './client'; // 실제 경로에 맞게 조정 필요

// student_id는 백엔드가 name/phone/birth_year 기준으로 내부에서 매칭/생성한다고 가정
// -> 백엔드 EnrollmentCreate 스키마에서 student_id를 제거하거나 optional로 바꿔야 함 (확인 필요)
export interface EnrollmentCreate {
  class_id: number;
  name: string;
  phone?: string;
  birth_year?: number;
  memo?: string;
}

export interface EnrollmentResponse {
  id: number;
  student_id: number;
  class_id: number;
  name: string;
  phone?: string;
  birth_year?: number;
  memo?: string;
}

export const enrollmentApi = {
  createEnrollment: async (data: EnrollmentCreate) => {
    const response = await apiClient.post<EnrollmentResponse>('/enrollment', data);
    return response.data;
  },
};
