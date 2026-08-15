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

  updateItem: (setKey, itemIndex, newItem) =>
    set((state) => {
      if (!state.lessonPlan) return state;
      return {
        lessonPlan: {
          ...state.lessonPlan,
          lesson_plan: {
            ...state.lessonPlan.lesson_plan,
            [setKey]: state.lessonPlan.lesson_plan[setKey].map((it, i) =>
              i !== itemIndex ? it : newItem
            ),
          },
        },
      };
    }),

  clearLessonPlan: () => set({ lessonPlan: null }),
}));
