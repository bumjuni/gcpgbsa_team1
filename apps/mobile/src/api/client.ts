import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './env';
import { useAuthStore } from '../stores/useAuthStore';

// 무한 루프 방지를 위한 순수 Axios 인스턴스 (인터셉터 미적용)
const refreshClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 동시 401 요청 처리를 위한 상태 변수
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // 재발급 API 자체가 401인 경우 무한 루프 방지
      if (originalRequest.url?.includes('/auth/refresh')) {
        await useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 이미 다른 요청이 재발급 진행 중이면 큐에 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        await useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      try {
        // 끝 슬래시 없이 백엔드 라우트에 맞춤
        const { data } = await refreshClient.post('/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken, instructor } = data;

        // 새로운 토큰으로 스토어 갱신
        await useAuthStore.getState().setAuth(access_token, newRefreshToken, instructor);

        processQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
