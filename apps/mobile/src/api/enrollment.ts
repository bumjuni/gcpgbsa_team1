import { GenderType } from '../types/member';
import { apiClient } from './client'; // 실제 경로에 맞게 조정 필요

// student_id는 백엔드가 name/phone/birth_year 기준으로 내부에서 매칭/생성한다고 가정
// -> 백엔드 EnrollmentCreate 스키마에서 student_id를 제거하거나 optional로 바꿔야 함 (확인 필요)
export interface EnrollmentCreate {
  class_id: number;
  name: string;
  gender?: GenderType;
  phone?: string;
  birth_year?: number;
  memo?: string;
}

export interface EnrollmentStudent {
  id: number;
  name: string;
  gender?: GenderType;
  phone?: string;
  birth_year?: number;
}

export interface EnrollmentDetail {
  id: number;
  student_id: number;
  class_id: number;
  memo?: string;
  created_at: string;
  deleted_at: string | null;
}

export interface EnrollmentResponse {
  student: EnrollmentStudent;
  enrollment: EnrollmentDetail;
}

export const enrollmentApi = {
  createEnrollment: async (data: EnrollmentCreate) => {
    const response = await apiClient.post<EnrollmentResponse>('/enrollment', data);
    console.log(response)
    return response.data;
  },

  deleteEnrollment: async (enrollmentId: number) => {
    const response = await apiClient.delete(`/enrollment/${enrollmentId}`);
    console.log(response);
    return response.data;
  },

  updateEnrollment: async (enrollmentId: number, data: EnrollmentDetail) => {
    const response = await apiClient.patch(`/enrollment/${enrollmentId}`, data);
    console.log(response);
    return response.data;
  },

  getEnrollments: async (classId: number) => {
    const response = await apiClient.get<EnrollmentResponse[]>(`/enrollment/class/${classId}`);
    console.log(response)
    return response.data;
  },
};
