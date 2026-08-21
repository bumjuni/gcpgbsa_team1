export interface Instructor {
  id: number;
  email: string;
  name: string;
  phone: string;
  marketing_agreed: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  instructor: Instructor;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  password_confirm: string;
  phone: string;
  agree_terms: boolean;
  agree_privacy: boolean;
  agree_age: boolean;
  agree_marketing: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// 회원가입 실패 시 백엔드가 필드별 에러를 { field: message } 형태로 내려준다.
export type SignupFieldErrors = Partial<Record<keyof SignupPayload | 'agreement', string>>;
