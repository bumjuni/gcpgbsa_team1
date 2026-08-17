import { MemberFormValues } from "../hooks/memberForm.schema";

export type GenderType = 'FEMALE' | 'MALE' | 'NONE';

export interface MemberFormState {
  name: string;
  gender: GenderType;
  birthYear: string;
  phone: string;
  notes: string;
}

export interface Member extends MemberFormValues {
  id: string; // 로컬 임시 id (UI용, 서버로 전송 안 함)
}
