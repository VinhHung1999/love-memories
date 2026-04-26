import { apiClient } from '@/lib/apiClient';

// Sprint 66 — Daily Q&A typed wrappers around BE routes mounted at
// `/api/daily-questions` (backend/src/routes/index.ts L77).
//
// Response shapes mirror DailyQuestionService.getToday / getStreak / getHistory.
// `partnerAnswer` is null until the user has submitted their own answer
// (BE locks the reveal — see DailyQuestionService L60).

export type DailyQuestion = {
  id: string;
  text: string;
  textVi: string | null;
  category: string;
};

export type DailyQuestionToday = {
  question: DailyQuestion;
  myAnswer: string | null;
  partnerAnswer: string | null;
  partnerName: string | null;
};

export type DailyQuestionStreak = {
  currentStreak: number;
  longestStreak: number;
  lastAnsweredDate: string | null;
  completedToday: boolean;
};

export type DailyQuestionHistoryItem = {
  question: DailyQuestion;
  myAnswer: string | null;
  myAnsweredAt: string | null;
  partnerAnswer: string | null;
  partnerName: string | null;
};

export type DailyQuestionHistory = {
  items: DailyQuestionHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type DailyQuestionAnswerResponse = {
  id: string;
  questionId: string;
  coupleId: string;
  userId: string;
  answer: string;
  createdAt: string;
  question: DailyQuestion;
};

export function getDailyQuestionToday() {
  return apiClient.get<DailyQuestionToday>('/api/daily-questions/today');
}

export function getDailyQuestionStreak() {
  return apiClient.get<DailyQuestionStreak>('/api/daily-questions/streak');
}

export function getDailyQuestionHistory(page = 1, limit = 20) {
  return apiClient.get<DailyQuestionHistory>(
    `/api/daily-questions/history?page=${page}&limit=${limit}`,
  );
}

export function submitDailyQuestionAnswer(questionId: string, answer: string) {
  return apiClient.post<DailyQuestionAnswerResponse>(
    `/api/daily-questions/${questionId}/answer`,
    { answer },
  );
}
