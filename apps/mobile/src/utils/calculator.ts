import { LessonPlanSet } from "../types/lessonPlan";

export function calculateTotalDistance(sections: LessonPlanSet[]): number {
  return sections.reduce((sectionSum, section) => {
    const sectionDistance = section.items.reduce(
      (itemSum, item) => itemSum + item.distance_m * item.set,
      0
    );
    return sectionSum + sectionDistance;
  }, 0);
}
