import { z } from 'zod';

export const classFormSchema = z
  .object({
    name: z.string().min(1, '반 이름을 입력해 주세요.'),
    days: z.array(z.string()).min(1, '수업 요일을 하나 이상 선택해 주세요.'),
    startTime: z.string({
      required_error: '시작 시각을 선택해 주세요.',
      invalid_type_error: '시작 시각을 선택해 주세요.',
    }),
    endTime: z.string({
      required_error: '종료 시각을 선택해 주세요.',
      invalid_type_error: '종료 시각을 선택해 주세요.',
    }),
    capacity: z
      .string()
      .min(1, '정원을 입력해 주세요.')
      .transform((val) => Number(val))
      .refine((val) => !isNaN(val) && val > 0, '정원은 1명 이상이어야 합니다.'),
    ageGroups: z.array(z.string()).min(1, '나이대를 하나 이상 선택해 주세요.'),
    level: z.string().min(1, '수준을 선택해 주세요.'),
    goals: z.array(z.string()).min(1, '수업목표를 하나 이상 선택해 주세요.')
    })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '종료 시각은 시작 시각보다 늦어야 해요.',
        path: ['endTime'],
      });
    }
  });

export type ClassFormValues = z.input<typeof classFormSchema>; // Form 내부 상태 타입
