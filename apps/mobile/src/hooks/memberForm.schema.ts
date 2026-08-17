import { z } from 'zod';
import { GenderType } from '../types/member';

export const memberFormSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.'),
  gender: z
    .custom<GenderType | ''>((val) => typeof val === 'string')
    .refine((val) => val !== '', { message: '성별을 선택해 주세요.' }),
  birthYear: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export type MemberFormValues = z.input<typeof memberFormSchema>;
