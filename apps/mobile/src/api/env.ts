import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  if (__DEV__) {
    // Android 에뮬레이터 localhost -> 10.0.2.2
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:8000'
      : 'http://localhost:8000';
  }
  // TODO: 클라우드 인스턴스 생성 후 .env에서 IP주소 수정
  return 'https://api.yourdomain.com';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000, // 10초
} as const;

export const KAKAO_CONFIG = {
  CLIENT_ID: process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID ?? '',
} as const;
