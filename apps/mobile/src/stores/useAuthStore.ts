import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Instructor } from '../types/auth';

const TOKEN_KEY = 'growdy_auth_token';
const REFRESH_TOKEN_KEY = 'growdy_auth_refresh_token';
const INSTRUCTOR_KEY = 'growdy_auth_instructor';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  instructor: Instructor | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
}

interface AuthActions {
  // 앱 시작 시 저장된 토큰/리프레시 토큰/프로필을 복원
  hydrate: () => Promise<void>;
  // 회원가입/로그인/재발급 성공 시 토큰 + 리프레시 토큰 + 강사 프로필 저장
  setAuth: (token: string, refreshToken: string, instructor: Instructor) => Promise<void>;
  // 로그아웃/만료 시 저장된 모든 인증 정보 제거
  clearAuth: () => Promise<void>;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  instructor: null,
  isAuthenticated: false,
  isHydrating: true,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  hydrate: async () => {
    try {
      const [token, refreshToken, raw] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(INSTRUCTOR_KEY),
      ]);

      set({
        token,
        refreshToken,
        instructor: raw ? JSON.parse(raw) : null,
        isAuthenticated: !!token,
        isHydrating: false,
      });
    } catch {
      set({ ...initialState, isHydrating: false });
    }
  },

  setAuth: async (token, refreshToken, instructor) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
      AsyncStorage.setItem(INSTRUCTOR_KEY, JSON.stringify(instructor)),
    ]);

    set({
      token,
      refreshToken,
      instructor,
      isAuthenticated: true,
      isHydrating: false,
    });
  },

  clearAuth: async () => {
    await AsyncStorage.removeMany([TOKEN_KEY, REFRESH_TOKEN_KEY, INSTRUCTOR_KEY]);
    set({ ...initialState, isHydrating: false });
  },
}));
