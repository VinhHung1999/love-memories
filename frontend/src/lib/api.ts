import type { Moment, FoodSpot, MapPin, Sprint, Goal } from '../types';

const API = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
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
    const res = await fetch(`${API}/moments/${id}/photos`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  deletePhoto: (momentId: string, photoId: string) =>
    request(`/moments/${momentId}/photos/${photoId}`, { method: 'DELETE' }),
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
    const res = await fetch(`${API}/foodspots/${id}/photos`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  deletePhoto: (foodSpotId: string, photoId: string) =>
    request(`/foodspots/${foodSpotId}/photos/${photoId}`, { method: 'DELETE' }),
};

// Map
export const mapApi = {
  pins: () => request<MapPin[]>('/map/pins'),
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
