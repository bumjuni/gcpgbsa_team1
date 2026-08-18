import { apiClient } from "./client";
import { EnrollmentStudent } from "./enrollment";

export const studentApi = {
  getStudentDetail: async (studentId: number) => {
    const response = await apiClient.post<EnrollmentStudent>(`/student/${studentId}`);
    console.log(response)
    return response.data;
  },
};
