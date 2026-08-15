import { LessonPlanSession } from "../types/lessonPlan";

export function calculateTotalDistance(lessonPlan: LessonPlanSession): number {
  const allItems = [
    ...lessonPlan.pre_set,
    ...lessonPlan.main_set,
    ...lessonPlan.post_set,
  ];
  return allItems.reduce((sum, item) => sum + item.distance_m * item.set, 0);
}
