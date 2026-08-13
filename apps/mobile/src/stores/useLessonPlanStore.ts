import { create } from "zustand";
import { LessonSection, LessonSetItem } from "../types/lessonPlan";

interface LessonPlanStore {
  sections: LessonSection[];
  initSections: (result: any) => void;
  updateItem: (sectionTitle: string, itemIndex: number, newItem: LessonSetItem) => void;
  clearSections: () => void;
}

export const useLessonPlanStore = create<LessonPlanStore>((set) => ({
  sections: [],
  initSections: (result) =>
    set({
      sections: [
        { title: 'Pre-Set', items: result.program.pre_set },
        { title: 'Main-Set', items: result.program.main_set },
        { title: 'Post-Set', items: result.program.post_set },
      ],
    }),
  updateItem: (sectionTitle, itemIndex, newItem) =>
    set((state) => ({
      sections: state.sections.map((section) =>
        section.title !== sectionTitle
          ? section
          : {
              ...section,
              items: section.items.map((it, i) => (i !== itemIndex ? it : newItem)),
            }
      ),
    })),
    clearSections: () => set({ sections: [] }),
}));
