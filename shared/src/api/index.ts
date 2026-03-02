// ---------------------------------------------------------------------------
// API endpoint path constants
// ---------------------------------------------------------------------------

export const API_PATHS = {
  auth: {
    login:           '/api/auth/login',
    register:        '/api/auth/register',
    refresh:         '/api/auth/refresh',
    logout:          '/api/auth/logout',
    me:              '/api/auth/me',
    google:          '/api/auth/google',
    googleComplete:  '/api/auth/google/complete',
    googleLink:      '/api/auth/google/link',
  },
  couple: {
    get:             '/api/couple',
    generateInvite:  '/api/couple/generate-invite',
  },
  profile: {
    updateName:      '/api/profile/name',
    updateAvatar:    '/api/profile/avatar',
  },
  moments:           '/api/moments',
  foodSpots:         '/api/foodspots',
  map:               '/api/map',
  sprints:           '/api/sprints',
  goals:             '/api/goals',
  recipes:           '/api/recipes',
  cookingSessions:   '/api/cooking-sessions',
  datePlans:         '/api/date-plans',
  dateWishes:        '/api/date-wishes',
  expenses:          '/api/expenses',
  loveLetters:       '/api/love-letters',
  achievements:      '/api/achievements',
  notifications:     '/api/notifications',
  recap: {
    weekly:          '/api/recap/weekly',
    monthly:         '/api/recap/monthly',
  },
  tags:              '/api/tags',
  share:             '/api/share',
  settings:          '/api/settings',
} as const;

// ---------------------------------------------------------------------------
// Auth request shapes
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  inviteCode?: string;
  coupleName?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface GoogleCompleteRequest {
  idToken: string;
  inviteCode?: string;
  coupleName?: string;
}

export interface GoogleLinkRequest {
  idToken: string;
}

// ---------------------------------------------------------------------------
// Profile request shapes
// ---------------------------------------------------------------------------

export interface UpdateNameRequest {
  name: string;
}
