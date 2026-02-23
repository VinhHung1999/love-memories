import type { Moment, MomentComment, MomentReaction, FoodSpot, MapPin, Sprint, Goal, TagMetadata, Recipe, CookingSession, Achievement, AppNotification, DateWish, DatePlan } from '../types';
import { uploadWithProgress } from './uploadWithProgress';

const API = '/api';
const TOKEN_KEY = 'love-scrum-token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${url}`, {
    headers,
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Moments
export const momentsApi = {
  list: () => request<Moment[]>('/moments'),
  get: (id: string) => request<Moment>(`/moments/${id}`),
  create: (data: Partial<Moment>) => request<Moment>('/moments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Moment>) => request<Moment>(`/moments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/moments/${id}`, { method: 'DELETE' }),
  uploadPhotos: (id: string, files: File[], onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    return uploadWithProgress(`${API}/moments/${id}/photos`, formData, getToken(), onProgress);
  },
  deletePhoto: (momentId: string, photoId: string) =>
    request(`/moments/${momentId}/photos/${photoId}`, { method: 'DELETE' }),
  uploadAudio: (id: string, file: File, duration?: number, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('audio', file);
    if (duration != null) formData.append('duration', String(duration));
    return uploadWithProgress(`${API}/moments/${id}/audio`, formData, getToken(), onProgress);
  },
  deleteAudio: (momentId: string, audioId: string) =>
    request(`/moments/${momentId}/audio/${audioId}`, { method: 'DELETE' }),
  addComment: (momentId: string, data: { author: string; content: string }) =>
    request<MomentComment>(`/moments/${momentId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  deleteComment: (momentId: string, commentId: string) =>
    request(`/moments/${momentId}/comments/${commentId}`, { method: 'DELETE' }),
  toggleReaction: (momentId: string, data: { emoji: string; author: string }) =>
    request<MomentReaction[]>(`/moments/${momentId}/reactions`, { method: 'POST', body: JSON.stringify(data) }),
};

// Food Spots
export const foodSpotsApi = {
  list: () => request<FoodSpot[]>('/foodspots'),
  get: (id: string) => request<FoodSpot>(`/foodspots/${id}`),
  create: (data: Partial<FoodSpot>) => request<FoodSpot>('/foodspots', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<FoodSpot>) => request<FoodSpot>(`/foodspots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/foodspots/${id}`, { method: 'DELETE' }),
  uploadPhotos: (id: string, files: File[], onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    return uploadWithProgress(`${API}/foodspots/${id}/photos`, formData, getToken(), onProgress);
  },
  deletePhoto: (foodSpotId: string, photoId: string) =>
    request(`/foodspots/${foodSpotId}/photos/${photoId}`, { method: 'DELETE' }),
  random: (lat: number, lng: number, radius = 5) =>
    request<FoodSpot & { distance: number }>(`/foodspots/random?lat=${lat}&lng=${lng}&radius=${radius}`),
};

// Map
export const mapApi = {
  pins: () => request<MapPin[]>('/map/pins'),
};

// Tags
export const tagsApi = {
  list: () => request<TagMetadata[]>('/tags'),
  upsert: (name: string, icon: string, color?: string) =>
    request<TagMetadata>(`/tags/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify({ icon, color }),
    }),
};

// Sprints
export const sprintsApi = {
  list: () => request<Sprint[]>('/sprints'),
  get: (id: string) => request<Sprint>(`/sprints/${id}`),
  getActive: () => request<Sprint>('/sprints/active'),
  create: (data: Partial<Sprint>) => request<Sprint>('/sprints', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Sprint>) => request<Sprint>(`/sprints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) => request<Sprint>(`/sprints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string) => request(`/sprints/${id}`, { method: 'DELETE' }),
};

// Settings
export const settingsApi = {
  get: (key: string) => request<{ key: string; value: string | null }>(`/settings/${key}`),
  set: (key: string, value: string) =>
    request<{ key: string; value: string }>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
};

// Recipes
export const recipesApi = {
  list: () => request<Recipe[]>('/recipes'),
  get: (id: string) => request<Recipe>(`/recipes/${id}`),
  create: (data: Partial<Recipe>) => request<Recipe>('/recipes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Recipe>) => request<Recipe>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/recipes/${id}`, { method: 'DELETE' }),
  uploadPhotos: (id: string, files: File[], onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    return uploadWithProgress(`${API}/recipes/${id}/photos`, formData, getToken(), onProgress);
  },
  deletePhoto: (recipeId: string, photoId: string) =>
    request(`/recipes/${recipeId}/photos/${photoId}`, { method: 'DELETE' }),
};

// Cooking Sessions
export const cookingSessionsApi = {
  list: () => request<CookingSession[]>('/cooking-sessions'),
  get: (id: string) => request<CookingSession>(`/cooking-sessions/${id}`),
  getActive: () => request<CookingSession | null>('/cooking-sessions/active'),
  create: (data: { recipeIds: string[] }) =>
    request<CookingSession>('/cooking-sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string, notes?: string) =>
    request<CookingSession>(`/cooking-sessions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),
  toggleItem: (sessionId: string, itemId: string, checked: boolean) =>
    request(`/cooking-sessions/${sessionId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ checked }),
    }),
  toggleStep: (sessionId: string, stepId: string, checked: boolean, checkedBy?: string) =>
    request(`/cooking-sessions/${sessionId}/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify({ checked, checkedBy }),
    }),
  uploadPhotos: (id: string, files: File[], onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    return uploadWithProgress(`${API}/cooking-sessions/${id}/photos`, formData, getToken(), onProgress);
  },
  delete: (id: string) => request(`/cooking-sessions/${id}`, { method: 'DELETE' }),
};

// Achievements
export const achievementsApi = {
  list: () => request<Achievement[]>('/achievements'),
};

// Profile
export const profileApi = {
  updateName: (name: string) =>
    request<{ id: string; email: string; name: string; avatar: string | null }>('/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
  uploadAvatar: (file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return uploadWithProgress(`${API}/profile/avatar`, formData, getToken(), onProgress) as Promise<{ id: string; email: string; name: string; avatar: string | null }>;
  },
};

// AI
export const aiApi = {
  generateRecipe: (mode: 'text' | 'youtube', input: string) =>
    request<Record<string, unknown>>('/ai/generate-recipe', {
      method: 'POST',
      body: JSON.stringify({ mode, input }),
    }),
};

// Notifications
export const notificationsApi = {
  list: () => request<AppNotification[]>('/notifications'),
  unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => request<AppNotification>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request<{ ok: boolean }>('/notifications/read-all', { method: 'PUT' }),
  delete: (id: string) => request(`/notifications/${id}`, { method: 'DELETE' }),
};

// Date Wishes
export const dateWishesApi = {
  list: () => request<DateWish[]>('/date-wishes'),
  create: (data: Partial<DateWish>) => request<DateWish>('/date-wishes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<DateWish>) => request<DateWish>(`/date-wishes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markDone: (id: string, linkedMomentId?: string | null, linkedFoodSpotId?: string | null) =>
    request<DateWish>(`/date-wishes/${id}/done`, { method: 'PUT', body: JSON.stringify({ linkedMomentId, linkedFoodSpotId }) }),
  delete: (id: string) => request(`/date-wishes/${id}`, { method: 'DELETE' }),
};

type PlanStopInput = {
  time: string;
  title: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  url?: string;
  tags?: string[];
  category?: string;
  notes?: string;
  order: number;
  wishId?: string;
};

// Date Plans
export const datePlansApi = {
  list: () => request<DatePlan[]>('/date-plans'),
  get: (id: string) => request<DatePlan>(`/date-plans/${id}`),
  create: (data: { title: string; date: string; notes?: string; stops?: PlanStopInput[] }) =>
    request<DatePlan>('/date-plans', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; date?: string; notes?: string; stops?: PlanStopInput[] }) =>
    request<DatePlan>(`/date-plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request<DatePlan>(`/date-plans/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  markStopDone: (planId: string, stopId: string) =>
    request<DatePlan>(`/date-plans/${planId}/stops/${stopId}/done`, { method: 'PUT' }),
  linkStopMoment: (planId: string, stopId: string, momentId: string | null) =>
    request(`/date-plans/${planId}/stops/${stopId}/moment`, { method: 'PUT', body: JSON.stringify({ momentId }) }),
  linkStopFoodSpot: (planId: string, stopId: string, foodSpotId: string | null) =>
    request(`/date-plans/${planId}/stops/${stopId}/foodspot`, { method: 'PUT', body: JSON.stringify({ foodSpotId }) }),
  addSpot: (planId: string, stopId: string, data: { title: string; address?: string; latitude?: number; longitude?: number; url?: string; notes?: string; order?: number }) =>
    request(`/date-plans/${planId}/stops/${stopId}/spots`, { method: 'POST', body: JSON.stringify(data) }),
  deleteSpot: (planId: string, stopId: string, spotId: string) =>
    request(`/date-plans/${planId}/stops/${stopId}/spots/${spotId}`, { method: 'DELETE' }),
  delete: (id: string) => request(`/date-plans/${id}`, { method: 'DELETE' }),
};

// Goals
export const goalsApi = {
  backlog: () => request<Goal[]>('/goals/backlog'),
  listBySprint: (sprintId: string) => request<Goal[]>(`/goals/sprint/${sprintId}`),
  create: (sprintId: string, data: Partial<Goal>) => request<Goal>(`/goals/sprint/${sprintId}`, { method: 'POST', body: JSON.stringify(data) }),
  createBacklog: (data: Partial<Goal>) => request<Goal>('/goals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Goal>) => request<Goal>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) => request<Goal>(`/goals/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assign: (id: string, sprintId: string | null) => request<Goal>(`/goals/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ sprintId }) }),
  reorder: (goals: { id: string; order: number; status?: string }[]) => request('/goals/reorder', { method: 'PATCH', body: JSON.stringify({ goals }) }),
  delete: (id: string) => request(`/goals/${id}`, { method: 'DELETE' }),
};
