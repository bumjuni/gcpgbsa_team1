import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from './env';
import { useAuthStore } from '../stores/useAuthStore';

// 1. Axios 인스턴스 생성
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// 2. 요청 시 저장된 토큰을 Authorization 헤더에 부착
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
