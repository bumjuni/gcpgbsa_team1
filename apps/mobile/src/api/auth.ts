import { apiClient } from './client';
import { TokenResponse } from '../types/auth';

export const authApi = {
  // 카카오 인가 코드로 로그인
  kakaoLogin: async (code: string, redirectUri: string) => {
    const response = await apiClient.post<TokenResponse>('/auth/kakao/login', {
      code,
      redirect_uri: redirectUri,
    });
    return response.data;
  },
};
