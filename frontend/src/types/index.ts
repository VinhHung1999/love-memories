export interface MomentPhoto {
  id: string;
  momentId: string;
  filename: string;
  url: string;
  createdAt: string;
}

export interface MomentAudio {
  id: string;
  momentId: string;
  filename: string;
  url: string;
  duration: number | null;
  createdAt: string;
}

export interface Moment {
  id: string;
  title: string;
  caption: string | null;
  date: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  photos: MomentPhoto[];
  audios: MomentAudio[];
}

export interface FoodSpotPhoto {
  id: string;
  foodSpotId: string;
  filename: string;
  url: string;
  createdAt: string;
}

export interface FoodSpot {
  id: string;
  name: string;
  description: string | null;
  rating: number;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  tags: string[];
  priceRange: number;
  createdAt: string;
  updatedAt: string;
  photos: FoodSpotPhoto[];
}

export interface MapPin {
  id: string;
  type: 'moment' | 'foodspot';
  title: string;
  latitude: number;
  longitude: number;
  location: string | null;
  date?: string;
  rating?: number;
  tags: string[];
  thumbnail: string | null;
}

export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type GoalStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type GoalPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  priority: GoalPriority;
  assignee: string | null;
  dueDate: string | null;
  order: number;
  sprintId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
  goals: Goal[];
}
