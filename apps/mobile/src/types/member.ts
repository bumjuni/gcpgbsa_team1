import { MemberFormValues } from "../hooks/memberForm.schema";

export type GenderType = 'FEMALE' | 'MALE' | undefined;

export interface MemberFormState extends MemberFormValues {
  name: string;
  gender: GenderType;
  birthYear: string;
  phone: string;
  notes: string;
}
