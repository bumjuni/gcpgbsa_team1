import { apiClient } from './client';
import { Instructor, LoginPayload, SignupPayload, TokenResponse } from '../types/auth';

export const authApi = {
  signup: async (payload: SignupPayload) => {
    const response = await apiClient.post<TokenResponse>('/auth/signup', payload);
    return response.data;
  },

  login: async (payload: LoginPayload) => {
    const response = await apiClient.post<TokenResponse>('/auth/login', payload);
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get<Instructor>('/auth/me');
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },
};
