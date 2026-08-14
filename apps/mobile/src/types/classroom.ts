export type LevelType = 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
export type AgeGroupType = 'PRESCHOOL' | 'ELEMENTARY' | 'TEEN' | 'ADULT' | 'SENIOR';
export type ProgramStatusType = 'DRAFT' | 'CONFIRMED' | 'INPROGRESS' | 'COMPLETED';


export interface SwimClass {
  id: number;
  name: string;
  student_count: number | null;
  capacity: number;
  level: LevelType;
  age_group: AgeGroupType;
  start_time: string;
  end_time: string;
  goals: string;
  goal_etc: string;
  days_of_week: string;
  today_program_status: ProgramStatusType | null;  // 오늘 program row 없으면 null
  next_program_status: ProgramStatusType | null;    // 미완료 중 가장 이른 program row, 없으면 null("수업안 없음")
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
  goals: string;
  goal_etc: string;
}
