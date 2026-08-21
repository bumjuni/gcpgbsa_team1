import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  // 웹(Vercel 배포) 환경일 때는 빈 문자열 반환 -> vercel.json 프록시 동작
  if (Platform.OS === 'web') {
    return '';
  }

  // 모바일 앱(iOS/Android) 환경일 때만 실제 서버 주소 사용
  // return process.env.EXPO_PUBLIC_SERVER_URL || '';
  return '';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000, // 10초
} as const;
