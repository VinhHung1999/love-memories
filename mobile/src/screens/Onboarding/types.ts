export interface OnboardingData {
  // Google flow
  googleIdToken?: string;
  googleProfile?: { name: string; email?: string; avatar?: string };
  // Email flow
  email?: string;
  password?: string;
  userName?: string;
  // Couple setup (set in CoupleScreen)
  coupleMode?: 'create' | 'join';
  coupleName?: string;
  inviteCode?: string;
  // Anniversary (set in AnniversaryScreen)
  anniversaryDate?: string; // ISO string
  // Avatar (set in AvatarScreen)
  avatarLocalUri?: string;
  avatarMimeType?: string;
}
