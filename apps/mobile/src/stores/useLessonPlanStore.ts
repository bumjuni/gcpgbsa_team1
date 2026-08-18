import { create } from "zustand";
import { LessonPlanItem, LessonPlanResponse, LessonPlanSetKey } from "../types/lessonPlan";


interface LessonPlanStore {
  lessonPlan: LessonPlanResponse | null;
  setLessonPlan: (lessonPlan: LessonPlanResponse) => void;
  updateItem: (
    setKey: LessonPlanSetKey,
    itemIndex: number,
    newItem: LessonPlanItem
  ) => void;
  clearLessonPlan: () => void;
}

export const useLessonPlanStore = create<LessonPlanStore>((set) => ({
  lessonPlan: null,

  setLessonPlan: (lessonPlan) => set({ lessonPlan }),

  updateItem: (setKey, index, updatedItem) =>
    set((state) => {
      if (!state.lessonPlan) return state;

      // 1. 기존 프로그램 객체 복사
      const currentSet = state.lessonPlan.program[setKey] ?? [];

      // 2. 해당 배열 항목 불변성 유지하며 교체
      const updatedSet = currentSet.map((item, i) =>
        i === index ? { ...item, ...updatedItem } : item
      );

      // 3. 새로운 참조를 가진 상태로 반환 (Immer 사용 시 draft 직접 수정도 가능)
      return {
        lessonPlan: {
          ...state.lessonPlan,
          program: {
            ...state.lessonPlan.program,
            [setKey]: updatedSet,
          },
        },
      };
    }),

  clearLessonPlan: () => set({ lessonPlan: null }),
}));
