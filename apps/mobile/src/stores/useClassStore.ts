// store/useClassStore.ts

import { create } from 'zustand';
import { SwimClass } from '../types/classroom';

interface ClassState {
  currentClass: SwimClass | null;
}

interface ClassActions {
  // 화면 진입 시 반 객체를 통째로 세팅
  setClass: (currentClass: SwimClass) => void;
  // 부분 업데이트가 필요할 때 (예: 인원 수만 갱신)
  updateClass: (data: Partial<SwimClass>) => void;
  clearClass: () => void;
}

const initialState: ClassState = {
  currentClass: null,
};

export const useClassStore = create<ClassState & ClassActions>((set) => ({
  ...initialState,

  setClass: (currentClass) => set({ currentClass }),

  updateClass: (data) =>
    set((prev) => ({
      currentClass: prev.currentClass ? { ...prev.currentClass, ...data } : prev.currentClass,
    })),

  clearClass: () => set(initialState),
}));

// ── 사용 예시 ──────────────────────────────────────────────────
//
// 저장 (예: 반 상세 화면 진입 시)
//   const setClass = useClassStore((s) => s.setClass);
//   setClass(swimClass); // SwimClass 객체 통째로
//
// 불러오기 (예: LessonPlanCreateScreen)
//   const currentClass = useClassStore((s) => s.currentClass);
//   if (!currentClass) { /* 반 정보 없음 처리 */ }
//   const { id, name, level } = currentClass;
//
// 부분 업데이트 (예: today_program_status만 갱신)
//   const updateClass = useClassStore((s) => s.updateClass);
//   updateClass({ today_program_status: 'inProgress' });
