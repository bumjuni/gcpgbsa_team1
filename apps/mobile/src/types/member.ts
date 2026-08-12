export interface MemberFormState {
  name: string;
  birthYear: string;
  phone: string;
  notes: string;
}

export interface Member extends MemberFormState {
  id: string; // 로컬 임시 id (UI용, 서버로 전송 안 함)
}
