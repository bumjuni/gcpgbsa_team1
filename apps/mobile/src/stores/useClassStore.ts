// store/useClassStore.ts

import { create } from 'zustand';
import { LevelType } from '../types/classroom';

interface ClassState {
  classId: number | null;
  className: string | null;
  studentCount: number | null;
  level: LevelType | null;
}

interface ClassActions {
  // 화면 진입 시 반 정보를 한 번에 세팅
  setClass: (data: {
    classId: number;
    className: string;
    studentCount: number;
    level: LevelType;
  }) => void;
  // 부분 업데이트가 필요할 때 (예: 인원 수만 갱신)
  updateClass: (data: Partial<ClassState>) => void;
  clearClass: () => void;
}

const initialState: ClassState = {
  classId: null,
  className: null,
  studentCount: null,
  level: null,
};

export const useClassStore = create<ClassState & ClassActions>((set) => ({
  ...initialState,

  setClass: ({ classId, className, studentCount, level }) =>
    set({ classId, className, studentCount, level }),

  updateClass: (data) => set((prev) => ({ ...prev, ...data })),

  clearClass: () => set(initialState),
}));

// ── 사용 예시 ──────────────────────────────────────────────────
//
// 저장 (예: 반 상세 화면 진입 시)
//   const setClass = useClassStore((s) => s.setClass);
//   setClass({ classId: 1, className: '화요일 저녁 초급반', studentCount: 8, level: 'beginner' });
//
// 불러오기 (예: LessonPlanCreateScreen)
//   const { classId, name, studentCount, level } = useClassStore();
//
// 특정 필드만 구독 (불필요한 리렌더 방지)
//   const classId = useClassStore((s) => s.classId);
