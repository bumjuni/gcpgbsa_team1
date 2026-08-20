// store/useAuthStore.ts

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Instructor } from '../types/auth';

const TOKEN_KEY = 'growdy_auth_token';
const INSTRUCTOR_KEY = 'growdy_auth_instructor';

interface AuthState {
  token: string | null;
  instructor: Instructor | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
}

interface AuthActions {
  // 앱 시작 시 저장된 토큰/프로필을 복원
  hydrate: () => Promise<void>;
  // 회원가입/로그인 성공 시 토큰 + 강사 프로필 저장
  setAuth: (token: string, instructor: Instructor) => Promise<void>;
  // 로그아웃 시 저장된 인증 정보 제거
  clearAuth: () => Promise<void>;
}

const initialState: AuthState = {
  token: null,
  instructor: null,
  isAuthenticated: false,
  isHydrating: true,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  hydrate: async () => {
    const [token, raw] = await Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(INSTRUCTOR_KEY),
    ]);
    set({
      token,
      instructor: raw ? JSON.parse(raw) : null,
      isAuthenticated: !!token,
      isHydrating: false,
    });
  },

  setAuth: async (token, instructor) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(INSTRUCTOR_KEY, JSON.stringify(instructor));
    set({ token, instructor, isAuthenticated: true, isHydrating: false });
  },

  clearAuth: async () => {
    await AsyncStorage.removeMany([TOKEN_KEY, INSTRUCTOR_KEY]);
    set({ ...initialState, isHydrating: false });
  },
}));
