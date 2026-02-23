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

export interface MomentComment {
  id: string;
  momentId: string;
  author: string;
  content: string;
  createdAt: string;
  user?: { name: string; avatar: string | null } | null;
}

export interface MomentReaction {
  id: string;
  momentId: string;
  emoji: string;
  author: string;
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
  spotifyUrl: string | null;
  createdAt: string;
  updatedAt: string;
  photos: MomentPhoto[];
  audios: MomentAudio[];
  comments: MomentComment[];
  reactions: MomentReaction[];
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
  tagIcon: string | null;
  thumbnail: string | null;
}

export interface TagMetadata {
  id: string;
  name: string;
  icon: string;
  color: string | null;
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

export interface RecipePhoto {
  id: string;
  recipeId: string;
  filename: string;
  url: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  ingredientPrices: number[];
  steps: string[];
  stepDurations: number[];
  tags: string[];
  notes: string | null;
  tutorialUrl: string | null;
  cooked: boolean;
  foodSpotId: string | null;
  foodSpot: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  photos: RecipePhoto[];
}

export type CookingSessionStatus = 'selecting' | 'shopping' | 'cooking' | 'photo' | 'completed';

export interface CookingSessionRecipe {
  id: string;
  sessionId: string;
  recipeId: string;
  recipe: Recipe;
  order: number;
  completedAt: string | null;
}

export interface CookingSessionItem {
  id: string;
  sessionId: string;
  ingredient: string;
  price: number | null;
  checked: boolean;
  checkedAt: string | null;
}

export interface CookingSessionStep {
  id: string;
  sessionId: string;
  recipeId: string;
  stepIndex: number;
  content: string;
  durationSeconds: number | null;
  checked: boolean;
  checkedBy: string | null;
  checkedAt: string | null;
}

export interface CookingSessionPhoto {
  id: string;
  sessionId: string;
  filename: string;
  url: string;
  createdAt: string;
}

export interface CookingSession {
  id: string;
  status: CookingSessionStatus;
  startedAt: string | null;
  completedAt: string | null;
  totalTimeMs: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  recipes: CookingSessionRecipe[];
  items: CookingSessionItem[];
  steps: CookingSessionStep[];
  photos: CookingSessionPhoto[];
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

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

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
