import { apiClient } from './client';

export interface SessionFocusItem {
  date: string;
  note: string;
}

export interface WeeklyReportResponse {
  week_start: string;
  week_end: string;
  week_distance_m: number;
  week_duration_min: number;
  week_calorie_kcal: number;
  calorie_caption: string;
  cumulative_distance_m: number;
  session_focus_list: SessionFocusItem[];
  apply_tip: string | null;
  key_points: string[] | null;
  rating: number | null;
}

export interface RatingResponse {
  rating: number;
}

export const reportApi = {
  getWeeklyReport: async (classId: number, studentId: number, date: string) => {
    const response = await apiClient.get<WeeklyReportResponse>(
      `/report/${classId}/${studentId}/${date}`,
    );
    console.log(response);
    return response.data;
  },

  submitRating: async (classId: number, studentId: number, date: string, rating: number) => {
    const response = await apiClient.post<RatingResponse>(
      `/report/${classId}/${studentId}/${date}/rating`,
      { rating },
    );
    console.log(response);
    return response.data;
  },
};
