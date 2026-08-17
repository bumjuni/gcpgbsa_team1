import { LessonPlanResponse, LessonPlanSession, LessonPlanSet, LessonPlanSetKey } from "../types/lessonPlan";

// export function calculateTotalDistance(lessonPlan: LessonPlanSession): number {
//   const allItems = [
//     ...lessonPlan.pre_set,
//     ...lessonPlan.main_set,
//     ...lessonPlan.post_set,
//   ];
//   return allItems.reduce((sum, item) => sum + item.distance_m * item.set, 0);
// }

const SECTION_ORDER: { key: LessonPlanSetKey; title: string }[] = [
  { key: 'pre_set', title: 'Pre-Set' },
  { key: 'main_set', title: 'Main-Set' },
  { key: 'post_set', title: 'Post-Set' },
];

export function toLessonPlanSets(session: LessonPlanSession): LessonPlanSet[] {
  return SECTION_ORDER.map(({ key, title }) => ({
    key,
    title,
    items: session[key],
  }));
}

export function getSectionTotalMeters(section: LessonPlanSet): number {
  return section.items.reduce((sum, item) => sum + item.distance_m * item.set, 0);
}

export function calculateTotalDistance(sections: LessonPlanSet[]): number {
  return sections.reduce((sum, section) => sum + getSectionTotalMeters(section), 0);
}

export function calculateCheckedDistance(response: LessonPlanResponse): number {
  const { pre_set, main_set, post_set } = response.program;
  const allItems = [...pre_set, ...main_set, ...post_set];

  return allItems
    .filter((item) => item.is_checked)
    .reduce((sum, item) => sum + item.distance_m * item.set, 0);
}
