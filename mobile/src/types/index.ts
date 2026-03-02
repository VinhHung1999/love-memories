export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  coupleId?: string;
  googleId?: string | null;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

export interface CoupleProfile {
  id: string;
  name: string | null;
  anniversaryDate: string | null;
  inviteCode: string | null;
  users: { id: string; name: string; email: string; avatar: string | null }[];
}

export interface AuthResponse {
  token: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
