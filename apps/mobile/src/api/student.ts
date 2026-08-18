import { apiClient } from "./client";
import { EnrollmentStudent } from "./enrollment";

export const studentApi = {
  getStudentDetail: async (studentId: number) => {
    const response = await apiClient.post<EnrollmentStudent>(`/student/${studentId}`);
    console.log(response)
    return response.data;
  },

  updateStudent: async (studentId: number, data: EnrollmentStudent) => {
    const response = await apiClient.patch(`/student/${studentId}`, data);
    console.log(response);
    return response.data;
  },
};
