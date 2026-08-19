import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  // if (__DEV__) {
    // Android 에뮬레이터 localhost -> 10.0.2.2
  //   return Platform.OS === 'android'
  //     ? 'http://10.0.2.2:8000'
  //     : 'http://localhost:8000';
  // }
  // TODO: 클라우드 인스턴스 생성 후 .env에서 IP주소 수정
  return process.env.EXPO_PUBLIC_SERVER_URL;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000, // 10초
} as const;
