import { z } from 'zod';

export const memberFormSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.'),
  birthYear: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export type MemberFormValues = z.input<typeof memberFormSchema>;
