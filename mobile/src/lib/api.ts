import * as Keychain from 'react-native-keychain';
import { AuthResponse, CoupleProfile } from '../types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = __DEV__
  ? 'https://dev-love-scrum-api.hungphu.work'
  : 'https://love-scrum-api.hungphu.work';

const KEYCHAIN_SERVICE = 'love-scrum';

// ---------------------------------------------------------------------------
// Warmup — pre-resolve DNS + TLS on app start so first real API call is fast
// ---------------------------------------------------------------------------

export function warmupConnection(): void {
  fetch(`${API_BASE}/api/health`, { method: 'HEAD' }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Token storage helpers (keychain)
// ---------------------------------------------------------------------------

export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Keychain.setGenericPassword(accessToken, refreshToken, { service: KEYCHAIN_SERVICE });
}

export async function getStoredTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  if (!creds) return null;
  return { accessToken: creds.username, refreshToken: creds.password };
}

export async function clearStoredTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
}

// ---------------------------------------------------------------------------
// Token refresh mutex — prevents concurrent refresh races
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshListeners: Array<(token: string | null) => void> = [];

async function attemptRefresh(): Promise<string | null> {
  const stored = await getStoredTokens();
  if (!stored?.refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
    });
    if (!res.ok) {
      await clearStoredTokens();
      return null;
    }
    const data: AuthResponse = await res.json();
    await storeTokens(data.accessToken || data.token, data.refreshToken);
    return data.accessToken || data.token;
  } catch {
    await clearStoredTokens();
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper with auto-refresh on 401
// ---------------------------------------------------------------------------

type OnUnauthenticated = () => void;
let onUnauthenticatedCallback: OnUnauthenticated | null = null;

export function setOnUnauthenticated(cb: OnUnauthenticated): void {
  onUnauthenticatedCallback = cb;
}

// Note: Notification — exported so pushNotifications.ts can call mobile-subscribe/unsubscribe
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const stored = await getStoredTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (stored?.accessToken) {
    headers.Authorization = `Bearer ${stored.accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Attempt token refresh
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await attemptRefresh();
      isRefreshing = false;
      refreshListeners.forEach(cb => cb(newToken));
      refreshListeners = [];

      if (!newToken) {
        onUnauthenticatedCallback?.();
        return res;
      }

      // Retry with new token
      return fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
    } else {
      // Wait for the in-progress refresh
      return new Promise((resolve) => {
        refreshListeners.push(async (newToken) => {
          if (!newToken) {
            resolve(res);
            return;
          }
          resolve(
            fetch(`${API_BASE}${path}`, {
              ...options,
              headers: { ...headers, Authorization: `Bearer ${newToken}` },
            }),
          );
        });
      });
    }
  }

  return res;
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  register: async (
    email: string,
    password: string,
    name: string,
    opts?: { inviteCode?: string; coupleName?: string },
  ): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, ...opts }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  googleLogin: async (idToken: string): Promise<AuthResponse & { needsCouple?: boolean; googleProfile?: object }> => {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google login failed');
    return data;
  },

  googleComplete: async (
    idToken: string,
    opts: { inviteCode?: string; coupleName?: string },
  ): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/google/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, ...opts }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google signup failed');
    return data;
  },

  googleLink: async (idToken: string): Promise<{ ok: boolean; googleId: string }> => {
    const res = await apiFetch('/api/auth/google/link', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to link Google account');
    return data;
  },

  me: async (): Promise<import('../types').AuthUser> => {
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) throw new Error('Invalid token');
    return res.json();
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  },
};

// ---------------------------------------------------------------------------
// Couple API
// ---------------------------------------------------------------------------

export const coupleApi = {
  get: async (): Promise<CoupleProfile> => {
    const res = await apiFetch('/api/couple');
    if (!res.ok) throw new Error('Failed to fetch couple');
    return res.json();
  },

  update: async (data: { name?: string; anniversaryDate?: string | null }): Promise<CoupleProfile> => {
    const res = await apiFetch('/api/couple', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update couple');
    return res.json();
  },

  generateInvite: async (): Promise<{ inviteCode: string }> => {
    const res = await apiFetch('/api/couple/generate-invite', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate invite');
    return res.json();
  },
};

// ---------------------------------------------------------------------------
// Moments API
// ---------------------------------------------------------------------------

export const momentsApi = {
  list: async (): Promise<import('../types').Moment[]> => {
    const res = await apiFetch('/api/moments');
    if (!res.ok) throw new Error('Failed to fetch moments');
    return res.json();
  },

  get: async (id: string): Promise<import('../types').Moment> => {
    const res = await apiFetch(`/api/moments/${id}`);
    if (!res.ok) throw new Error('Failed to fetch moment');
    return res.json();
  },

  create: async (data: {
    title: string;
    caption?: string;
    date: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    tags?: string[];
    spotifyUrl?: string;
  }): Promise<import('../types').Moment> => {
    const res = await apiFetch('/api/moments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create moment');
    }
    return res.json();
  },

  update: async (
    id: string,
    data: {
      title?: string;
      caption?: string;
      date?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      tags?: string[];
      spotifyUrl?: string;
    },
  ): Promise<import('../types').Moment> => {
    const res = await apiFetch(`/api/moments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update moment');
    }
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/moments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete moment');
  },

  uploadPhoto: async (
    momentId: string,
    imageUri: string,
    mimeType: string,
  ): Promise<import('../types').MomentPhoto> => {
    const stored = await getStoredTokens();
    const formData = new FormData();
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    formData.append('photos', { uri: imageUri, type: mimeType, name: `photo.${ext}` } as unknown as Blob);
    const headers: Record<string, string> = {};
    if (stored?.accessToken) headers.Authorization = `Bearer ${stored.accessToken}`;
    const res = await fetch(`${API_BASE}/api/moments/${momentId}/photos`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload photo');
    return res.json();
  },

  deletePhoto: async (momentId: string, photoId: string): Promise<void> => {
    const res = await apiFetch(`/api/moments/${momentId}/photos/${photoId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete photo');
  },

  uploadAudio: async (
    momentId: string,
    audioUri: string,
  ): Promise<import('../types').MomentAudio> => {
    const stored = await getStoredTokens();
    const formData = new FormData();
    formData.append('audio', { uri: audioUri, type: 'audio/mp4', name: 'memo.m4a' } as unknown as Blob);
    const headers: Record<string, string> = {};
    if (stored?.accessToken) headers.Authorization = `Bearer ${stored.accessToken}`;
    const res = await fetch(`${API_BASE}/api/moments/${momentId}/audio`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload audio');
    return res.json();
  },

  deleteAudio: async (momentId: string, audioId: string): Promise<void> => {
    const res = await apiFetch(`/api/moments/${momentId}/audio/${audioId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete audio');
  },

  addComment: async (
    momentId: string,
    data: { content: string; author: string },
  ): Promise<import('../types').MomentComment> => {
    const res = await apiFetch(`/api/moments/${momentId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },

  deleteComment: async (momentId: string, commentId: string): Promise<void> => {
    const res = await apiFetch(`/api/moments/${momentId}/comments/${commentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete comment');
  },

  toggleReaction: async (
    momentId: string,
    data: { emoji: string; author: string },
  ): Promise<{ added: boolean }> => {
    const res = await apiFetch(`/api/moments/${momentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to toggle reaction');
    return res.json();
  },
};

// ---------------------------------------------------------------------------
// Location API (public — no auth required)
// ---------------------------------------------------------------------------

export async function resolveLocation(url: string): Promise<{ latitude?: number; longitude?: number; name: string }> {
  const res = await fetch(`${API_BASE}/api/resolve-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error('Failed to resolve location');
  return res.json();
}

interface GeoFeature { place_name: string; center: [number, number]; }

export const geocodeApi = {
  forward: async (q: string, proximity?: string, limit = 5): Promise<{ features: GeoFeature[] }> => {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (proximity) params.set('proximity', proximity);
    try {
      const res = await fetch(`${API_BASE}/api/geocode/forward?${params}`);
      if (!res.ok) return { features: [] };
      return res.json();
    } catch {
      return { features: [] };
    }
  },
  reverse: async (lat: number, lng: number): Promise<{ features: GeoFeature[] }> => {
    try {
      const res = await fetch(`${API_BASE}/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      if (!res.ok) return { features: [] };
      return res.json();
    } catch {
      return { features: [] };
    }
  },
};

// ---------------------------------------------------------------------------
// Profile API
// ---------------------------------------------------------------------------

export const profileApi = {
  updateName: async (name: string): Promise<import('../types').AuthUser> => {
    const res = await apiFetch('/api/profile/name', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to update name');
    return res.json();
  },

  uploadAvatar: async (imageUri: string, mimeType: string): Promise<import('../types').AuthUser> => {
    const stored = await getStoredTokens();
    const formData = new FormData();
    // React Native requires this cast for multipart file fields
    formData.append('avatar', { uri: imageUri, type: mimeType, name: 'avatar.jpg' } as unknown as Blob);
    const headers: Record<string, string> = {};
    if (stored?.accessToken) headers.Authorization = `Bearer ${stored.accessToken}`;
    const res = await fetch(`${API_BASE}/api/profile/avatar`, { method: 'POST', headers, body: formData });
    if (!res.ok) throw new Error('Failed to upload avatar');
    return res.json();
  },
};

// ---------------------------------------------------------------------------
// Food Spots API
// ---------------------------------------------------------------------------

export const foodSpotsApi = {
  list: async (): Promise<import('../types').FoodSpot[]> => {
    const res = await apiFetch('/api/foodspots');
    if (!res.ok) throw new Error('Failed to fetch food spots');
    return res.json();
  },

  get: async (id: string): Promise<import('../types').FoodSpot> => {
    const res = await apiFetch(`/api/foodspots/${id}`);
    if (!res.ok) throw new Error('Failed to fetch food spot');
    return res.json();
  },

  create: async (data: {
    name: string;
    description?: string;
    rating?: number;
    priceRange?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    tags?: string[];
  }): Promise<import('../types').FoodSpot> => {
    const res = await apiFetch('/api/foodspots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || 'Failed to create food spot');
    }
    return res.json();
  },

  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      rating?: number;
      priceRange?: number;
      location?: string;
      latitude?: number;
      longitude?: number;
      tags?: string[];
    },
  ): Promise<import('../types').FoodSpot> => {
    const res = await apiFetch(`/api/foodspots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || 'Failed to update food spot');
    }
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/foodspots/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete food spot');
  },

  uploadPhoto: async (
    foodSpotId: string,
    imageUri: string,
    mimeType: string,
  ): Promise<import('../types').FoodSpotPhoto> => {
    const stored = await getStoredTokens();
    const formData = new FormData();
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    formData.append('photos', { uri: imageUri, type: mimeType, name: `photo.${ext}` } as unknown as Blob);
    const headers: Record<string, string> = {};
    if (stored?.accessToken) headers.Authorization = `Bearer ${stored.accessToken}`;
    const res = await fetch(`${API_BASE}/api/foodspots/${foodSpotId}/photos`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload photo');
    return res.json();
  },

  deletePhoto: async (foodSpotId: string, photoId: string): Promise<void> => {
    const res = await apiFetch(`/api/foodspots/${foodSpotId}/photos/${photoId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete photo');
  },

  random: async (lat: number, lng: number, radius = 5): Promise<import('../types').FoodSpot & { distance: number }> => {
    const res = await apiFetch(`/api/foodspots/random?lat=${lat}&lng=${lng}&radius=${radius}`);
    if (!res.ok) throw new Error('No food spots found nearby');
    return res.json();
  },
};

// ---------------------------------------------------------------------------
// Map API
// ---------------------------------------------------------------------------

export const mapApi = {
  pins: async (): Promise<import('../types').MapPin[]> => {
    const res = await apiFetch('/api/map/pins');
    if (!res.ok) throw new Error('Failed to fetch map pins');
    return res.json();
  },
};

// ---------------------------------------------------------------------------
// Tags API
// ---------------------------------------------------------------------------

export const tagsApi = {
  list: async (): Promise<import('../types').TagMetadata[]> => {
    const res = await apiFetch('/api/tags');
    if (!res.ok) throw new Error('Failed to fetch tags');
    return res.json();
  },

  upsert: async (name: string, icon: string, color?: string): Promise<import('../types').TagMetadata> => {
    const res = await apiFetch(`/api/tags/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify({ icon, color }),
    });
    if (!res.ok) throw new Error('Failed to upsert tag');
    return res.json();
  },
};

// ---------------------------------------------------------------------------
// Recipes API
// ---------------------------------------------------------------------------

export const recipesApi = {
  list: async (): Promise<import('../types').Recipe[]> => {
    const res = await apiFetch('/api/recipes');
    if (!res.ok) throw new Error('Failed to fetch recipes');
    return res.json();
  },

  get: async (id: string): Promise<import('../types').Recipe> => {
    const res = await apiFetch(`/api/recipes/${id}`);
    if (!res.ok) throw new Error('Failed to fetch recipe');
    return res.json();
  },

  create: async (data: {
    title: string;
    description?: string;
    ingredients?: string[];
    ingredientPrices?: number[];
    steps?: string[];
    stepDurations?: number[];
    tags?: string[];
    notes?: string;
    tutorialUrl?: string;
    foodSpotId?: string;
  }): Promise<import('../types').Recipe> => {
    const res = await apiFetch('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || 'Failed to create recipe');
    }
    return res.json();
  },

  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      ingredients?: string[];
      ingredientPrices?: number[];
      steps?: string[];
      stepDurations?: number[];
      tags?: string[];
      notes?: string;
      tutorialUrl?: string;
      cooked?: boolean;
      foodSpotId?: string | null;
    },
  ): Promise<import('../types').Recipe> => {
    const res = await apiFetch(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || 'Failed to update recipe');
    }
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/recipes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete recipe');
  },

  uploadPhoto: async (
    recipeId: string,
    imageUri: string,
    mimeType: string,
  ): Promise<import('../types').RecipePhoto> => {
    const stored = await getStoredTokens();
    const formData = new FormData();
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    formData.append('photos', { uri: imageUri, type: mimeType, name: `photo.${ext}` } as unknown as Blob);
    const headers: Record<string, string> = {};
    if (stored?.accessToken) headers.Authorization = `Bearer ${stored.accessToken}`;
    const res = await fetch(`${API_BASE}/api/recipes/${recipeId}/photos`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload photo');
    return res.json();
  },

  deletePhoto: async (recipeId: string, photoId: string): Promise<void> => {
    const res = await apiFetch(`/api/recipes/${recipeId}/photos/${photoId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete photo');
  },
};

// ---------------------------------------------------------------------------
// Cooking Sessions API
// ---------------------------------------------------------------------------

export const cookingSessionsApi = {
  active: async (): Promise<import('../types').CookingSession | null> => {
    const res = await apiFetch('/api/cooking-sessions/active');
    if (!res.ok) throw new Error('Failed to fetch active session');
    return res.json();
  },

  list: async (): Promise<import('../types').CookingSession[]> => {
    const res = await apiFetch('/api/cooking-sessions');
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  get: async (id: string): Promise<import('../types').CookingSession> => {
    const res = await apiFetch(`/api/cooking-sessions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch session');
    return res.json();
  },

  create: async (recipeIds: string[]): Promise<import('../types').CookingSession> => {
    const res = await apiFetch('/api/cooking-sessions', {
      method: 'POST',
      body: JSON.stringify({ recipeIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || 'Failed to create session');
    }
    return res.json();
  },

  updateStatus: async (
    id: string,
    status: import('../types').CookingSessionStatus,
    notes?: string,
  ): Promise<import('../types').CookingSession> => {
    const res = await apiFetch(`/api/cooking-sessions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...(notes !== undefined ? { notes } : {}) }),
    });
    if (!res.ok) throw new Error('Failed to update session status');
    return res.json();
  },

  toggleItem: async (
    sessionId: string,
    itemId: string,
    checked: boolean,
  ): Promise<import('../types').CookingSessionItem> => {
    const res = await apiFetch(`/api/cooking-sessions/${sessionId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ checked }),
    });
    if (!res.ok) throw new Error('Failed to toggle item');
    return res.json();
  },

  toggleStep: async (
    sessionId: string,
    stepId: string,
    checked: boolean,
    checkedBy?: string,
  ): Promise<import('../types').CookingSessionStep> => {
    const res = await apiFetch(`/api/cooking-sessions/${sessionId}/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify({ checked, ...(checkedBy ? { checkedBy } : {}) }),
    });
    if (!res.ok) throw new Error('Failed to toggle step');
    return res.json();
  },

  uploadPhoto: async (
    sessionId: string,
    imageUri: string,
    mimeType: string,
  ): Promise<import('../types').CookingSessionPhoto> => {
    const stored = await getStoredTokens();
    const formData = new FormData();
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    formData.append('photos', { uri: imageUri, type: mimeType, name: `photo.${ext}` } as unknown as Blob);
    const headers: Record<string, string> = {};
    if (stored?.accessToken) headers.Authorization = `Bearer ${stored.accessToken}`;
    const res = await fetch(`${API_BASE}/api/cooking-sessions/${sessionId}/photos`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload photo');
    return res.json();
  },

  rate: async (id: string, rating: number): Promise<import('../types').CookingSession> => {
    const res = await apiFetch(`/api/cooking-sessions/${id}/rate`, {
      method: 'PATCH',
      body: JSON.stringify({ rating }),
    });
    if (!res.ok) throw new Error('Failed to rate session');
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/cooking-sessions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete session');
  },
};

// ---------------------------------------------------------------------------
// Settings API
// ---------------------------------------------------------------------------

export interface AIRecipeResult {
  title: string;
  description: string | null;
  ingredients: string[];
  ingredientPrices: (number | null)[];
  steps: string[];
  stepDurations: (number | null)[];
  tags: string[];
  notes: string | null;
  tutorialUrl: string | null;
}

export const aiApi = {
  generateRecipe: async (mode: 'text' | 'youtube' | 'url', input: string): Promise<AIRecipeResult> => {
    const res = await apiFetch('/api/ai/generate-recipe', {
      method: 'POST',
      body: JSON.stringify({ mode, input }),
    });
    if (!res.ok) throw new Error('Failed to generate recipe');
    return res.json();
  },
};

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Notifications API
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: async (): Promise<AppNotification[]> => {
    const res = await apiFetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },
  unreadCount: async (): Promise<{ count: number }> => {
    const res = await apiFetch('/api/notifications/unread-count');
    if (!res.ok) throw new Error('Failed to fetch unread count');
    return res.json();
  },
  markRead: async (id: string): Promise<AppNotification> => {
    const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to mark read');
    return res.json();
  },
  markAllRead: async (): Promise<{ ok: boolean }> => {
    const res = await apiFetch('/api/notifications/read-all', { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to mark all read');
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete notification');
  },
};

// ---------------------------------------------------------------------------
// Expenses API
// ---------------------------------------------------------------------------

export type ExpenseCategory = 'food' | 'dating' | 'shopping' | 'transport' | 'gifts' | 'other';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string;
  note: string | null;
  receiptUrl: string | null;
  foodSpotId: string | null;
  datePlanId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseStats {
  total: number;
  count: number;
  month: string | null;
  byCategory: Record<ExpenseCategory, { total: number; count: number }>;
}

export interface DailyStats {
  month: string;
  days: { date: string; total: number; byCategory: Record<string, number> }[];
}

export const expensesApi = {
  list: async (month?: string): Promise<Expense[]> => {
    const res = await apiFetch(`/api/expenses${month ? `?month=${month}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },
  stats: async (month?: string): Promise<ExpenseStats> => {
    const res = await apiFetch(`/api/expenses/stats${month ? `?month=${month}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch expense stats');
    return res.json();
  },
  getLimits: async (): Promise<Record<string, number | null>> => {
    const res = await apiFetch('/api/expenses/limits');
    if (!res.ok) throw new Error('Failed to fetch limits');
    return res.json();
  },
  setLimits: async (limits: Record<string, number | null>): Promise<Record<string, number | null>> => {
    const res = await apiFetch('/api/expenses/limits', {
      method: 'PUT',
      body: JSON.stringify(limits),
    });
    if (!res.ok) throw new Error('Failed to set limits');
    return res.json();
  },
  create: async (data: { amount: number; description: string; category: ExpenseCategory; date: string; note?: string }): Promise<Expense> => {
    const res = await apiFetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create expense');
    return res.json();
  },
  update: async (id: string, data: Partial<{ amount: number; description: string; category: ExpenseCategory; date: string; note: string }>): Promise<Expense> => {
    const res = await apiFetch(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expense');
  },
  dailyStats: async (month: string): Promise<DailyStats> => {
    const res = await apiFetch(`/api/expenses/daily-stats?month=${month}`);
    if (!res.ok) throw new Error('Failed to fetch daily stats');
    return res.json();
  },
};

// ---------------------------------------------------------------------------

export const settingsApi = {
  get: async (key: string): Promise<{ key: string; value: string | null }> => {
    const res = await apiFetch(`/api/settings/${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error('Failed to fetch setting');
    return res.json();
  },

  set: async (key: string, value: string): Promise<{ key: string; value: string }> => {
    const res = await apiFetch(`/api/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error('Failed to save setting');
    return res.json();
  },
};
