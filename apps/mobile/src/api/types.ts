export type LevelType = 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
export type AgeGroupType = 'PRESCHOOL' | 'ELEMENTARY' | 'TEEN' | 'ADULT' | 'SENIOR';
export type ProgramStatusType = 'DRAFT' | 'SCHEDULED' | 'COMPLETED';

// 강습반 개괄 정보 (목록용)
export interface SwimClass {
  id: number;
  name: string;
  student_count: number;
  capacity: number;
  level: LevelType;
  age_groups: AgeGroupType;
  start_time: string;
  end_time: string;
  days_of_week: string;
  status: boolean;
  lesson_status: ProgramStatusType;
}

// 강습반 상세 정보
export interface SwimClassDetail extends SwimClass {
  created_at: Date;
  goal: string;
  goal_etc: string;
}
