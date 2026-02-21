import type { Moment, FoodSpot, MapPin, Sprint, Goal, TagMetadata, Recipe, CookingSession } from '../types';

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
  return res.json();
}

// Moments
export const momentsApi = {
  list: () => request<Moment[]>('/moments'),
  get: (id: string) => request<Moment>(`/moments/${id}`),
  create: (data: Partial<Moment>) => request<Moment>('/moments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Moment>) => request<Moment>(`/moments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/moments/${id}`, { method: 'DELETE' }),
  uploadPhotos: async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}/moments/${id}/photos`, { method: 'POST', headers, body: formData });
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  deletePhoto: (momentId: string, photoId: string) =>
    request(`/moments/${momentId}/photos/${photoId}`, { method: 'DELETE' }),
  uploadAudio: async (id: string, file: File, duration?: number) => {
    const formData = new FormData();
    formData.append('audio', file);
    if (duration != null) formData.append('duration', String(duration));
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}/moments/${id}/audio`, { method: 'POST', headers, body: formData });
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  deleteAudio: (momentId: string, audioId: string) =>
    request(`/moments/${momentId}/audio/${audioId}`, { method: 'DELETE' }),
};

// Food Spots
export const foodSpotsApi = {
  list: () => request<FoodSpot[]>('/foodspots'),
  get: (id: string) => request<FoodSpot>(`/foodspots/${id}`),
  create: (data: Partial<FoodSpot>) => request<FoodSpot>('/foodspots', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<FoodSpot>) => request<FoodSpot>(`/foodspots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/foodspots/${id}`, { method: 'DELETE' }),
  uploadPhotos: async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}/foodspots/${id}/photos`, { method: 'POST', headers, body: formData });
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
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
  uploadPhotos: async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}/recipes/${id}/photos`, { method: 'POST', headers, body: formData });
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
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
  uploadPhotos: async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}/cooking-sessions/${id}/photos`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  delete: (id: string) => request(`/cooking-sessions/${id}`, { method: 'DELETE' }),
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
