const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_PATTERN = /^010-\d{4}-\d{4}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const DUPLICATE_EMAIL_MESSAGE = '이미 가입된 이메일이에요';

export function validateName(name: string): string | undefined {
  if (!name.trim()) return '이름을 입력해주세요';
  if (name.length > 10) return '이름은 10자 이내로 입력해주세요';
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return '이메일을 입력해주세요';
  if (!EMAIL_PATTERN.test(email)) return '이메일 형식을 확인해주세요';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!PASSWORD_PATTERN.test(password)) return '비밀번호는 8자 이상으로 만들어주세요';
  return undefined;
}

export function validatePasswordConfirm(password: string, passwordConfirm: string): string | undefined {
  if (password !== passwordConfirm) return '비밀번호가 일치하지 않아요';
  return undefined;
}

export function validatePhone(phone: string): string | undefined {
  if (!phone.trim()) return '휴대폰번호를 입력해주세요';
  if (!PHONE_PATTERN.test(phone)) return '휴대폰번호 형식을 확인해주세요 (010-0000-0000)';
  return undefined;
}
