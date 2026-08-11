import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from './env';

// 1. Axios 인스턴스 생성
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
