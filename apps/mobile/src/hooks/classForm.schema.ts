import { z } from 'zod';

export const classFormSchema = z.object({
  name: z.string().min(1, '반 이름을 입력해 주세요.'),
  days: z.array(z.string()).min(1, '수업 요일을 하나 이상 선택해 주세요.'),
  startTime: z.string().min(1, '시작 시각을 선택해 주세요.'),
  durationMin: z.number({ message: '수업 길이를 선택해 주세요.' }),
  capacity: z
    .string()
    .min(1, '정원을 입력해 주세요.')
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, '정원은 1명 이상이어야 합니다.'),
  ageGroups: z.array(z.string()).min(1, '나이대를 하나 이상 선택해 주세요.'),
  level: z.string().min(1, '수준을 선택해 주세요.'),
  goals: z.array(z.string()).min(1, '수업목표를 하나 이상 선택해 주세요.')
  // goals: z.array(z.string()).default([]),
});

export type ClassFormValues = z.input<typeof classFormSchema>; // Form 내부 상태 타입
export type ClassFormParsedValues = z.output<typeof classFormSchema>; // Validation 검증 후 타입
