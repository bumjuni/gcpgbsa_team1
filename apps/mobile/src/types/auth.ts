export interface Instructor {
  id: number;
  kakao_id: number;
  email: string | null;
  nickname: string;
  profile_image_url: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  instructor: Instructor;
}
