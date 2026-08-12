export type LevelType = 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
export type AgeGroupType = 'PRESCHOOL' | 'ELEMENTARY' | 'TEEN' | 'ADULT' | 'SENIOR';
export type ProgramStatusType = 'DRAFT' | 'SCHEDULED' | 'COMPLETED';

// 강습반 개괄 정보 (목록용)
// 서버 응답 (조회 시 받는 형태) — 서버가 채워주는 필드 포함
export interface SwimClass {
  id: number;
  name: string;
  student_count: number | null;
  capacity: number;
  level: LevelType;
  age_groups: AgeGroupType;
  start_time: string;
  end_time: string;
  days_of_week: string;
  lesson_status: ProgramStatusType | null;
}

// 반 등록 시 클라이언트가 실제로 입력/전송하는 필드만
export interface SwimClassCreate {
  name: string;
  capacity: number;
  level: LevelType;
  age_groups: AgeGroupType;
  start_time: string;
  end_time: string;
  days_of_week: string;
}

// 강습반 상세 정보
export interface SwimClassDetail extends SwimClass {
  created_at: Date;
  goal: string;
  goal_etc: string;
}
