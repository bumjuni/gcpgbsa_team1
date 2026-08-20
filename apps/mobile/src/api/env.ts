import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  console.log('Kakao Key:', KAKAO_CONFIG.CLIENT_ID);
  const configuredUrl = process.env.EXPO_PUBLIC_SERVER_URL;
  if (configuredUrl) {
    // 스킴이 빠져있으면 http://를 붙여 정규화 (예: "1.2.3.4:8080" -> "http://1.2.3.4:8080")
    return /^https?:\/\//.test(configuredUrl) ? configuredUrl : `http://${configuredUrl}`;
  }

  if (__DEV__) {
    // Android 에뮬레이터 localhost -> 10.0.2.2
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:8000'
      : 'http://localhost:8000';
  }
  return '';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000, // 10초
} as const;

export const KAKAO_CONFIG = {
  CLIENT_ID: process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID ?? '',
} as const;
