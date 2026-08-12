// constants/classLabels.ts
import { LevelType, AgeGroupType } from '../types/classroom';

export const LEVEL_LABEL: Record<LevelType, string> = {
  BEGINNER: '신규',
  ELEMENTARY: '초급',
  INTERMEDIATE: '중급',
  ADVANCED: '상급',
  MASTER: '마스터',
};

export const AGE_GROUP_LABEL: Record<AgeGroupType, string> = {
  PRESCHOOL: '유아',
  ELEMENTARY: '초등',
  TEEN: '청소년',
  ADULT: '성인',
  SENIOR: '시니어',
};
