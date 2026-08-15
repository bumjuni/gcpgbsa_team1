import { create } from "zustand";
import { LessonSection, LessonSetItem } from "../types/lessonPlan";

interface LessonPlanStore {
  sections: LessonSection[];
  setSections: (program: { pre_set: LessonSetItem[]; main_set: LessonSetItem[]; post_set: LessonSetItem[] } | null) => void;
  updateItem: (sectionTitle: string, itemIndex: number, newItem: LessonSetItem) => void;
  clearSections: () => void;
}

export const useLessonPlanStore = create<LessonPlanStore>((set) => ({
  sections: [],
  setSections: (program) =>
    set({
      sections: program
        ? [
            { title: 'Pre-Set', items: program.pre_set },
            { title: 'Main-Set', items: program.main_set },
            { title: 'Post-Set', items: program.post_set },
          ]
        : [],
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
