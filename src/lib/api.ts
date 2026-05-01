// ============================================================
// API Client — study-en
// Base URL: https://d1-template.trann46698.workers.dev/api
// ============================================================

export const API_BASE = 'https://d1-template.trann46698.workers.dev/api';

// ─── Generic fetch helpers ────────────────────────────────
async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json() as { success: boolean; data: T; error?: string };
  if (!json.success) throw new Error(json.error || 'API error');
  return json.data;
}

export const apiGet = <T = unknown>(path: string) => apiFetch<T>(path);
export const apiPost = <T = unknown>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = <T = unknown>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = <T = unknown>(path: string) =>
  apiFetch<T>(path, { method: 'DELETE' });

// ─── User ID management ───────────────────────────────────
const UID_KEY = 'studyen-uid';

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(UID_KEY);
}

export function setStoredUserId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(UID_KEY, id);
}

// ─── User ─────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  username: string;
  email: string | null;
  xp: number;
  level: number;
  streak: number;
  coins: number;
  language: string;
  app_mode: string;
  target_languages?: string;
  created_at: string;
}

export const createOrGetUser = (username: string, language = 'en', app_mode = 'adult', target_languages = 'en') =>
  apiPost<ApiUser>('/users', { username, language, app_mode, target_languages });

export const getUser = (userId: string) =>
  apiGet<ApiUser>(`/users/${userId}`);

export const updateUser = (userId: string, data: Partial<{ username: string; language: string; app_mode: string; streak: number; coins: number; target_languages: string }>) =>
  apiPut<ApiUser>(`/users/${userId}`, data);

// ─── Game State ───────────────────────────────────────────
export interface ApiGameState {
  user_id: string;
  pet: object;
  avatar: object;
  world: object;
  mystery_box: object;
  updated_at: string;
}

export const getGameState = (userId: string) =>
  apiGet<ApiGameState>(`/game-state/${userId}`);

export const updateGameState = (userId: string, data: { pet?: object; avatar?: object; world?: object; mystery_box?: object }) =>
  apiPut<ApiGameState>(`/game-state/${userId}`, data);

// ─── Vocabulary ───────────────────────────────────────────
export interface ApiVocab {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  phonetic: string | null;
  emoji: string | null;
  category: string;
  difficulty: number;
  created_by: string | null;
  created_at: string;
  // User progress (when userId provided)
  status?: 'new' | 'learning' | 'known' | 'unknown';
  times_seen?: number;
  learned_at?: string | null;
}

export const getVocab = (userId?: string, params?: { category?: string; limit?: number; offset?: number; language?: string }) => {
  const q = new URLSearchParams();
  if (userId) q.set('userId', userId);
  if (params?.category) q.set('category', params.category);
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  if (params?.language) q.set('language', params.language);
  return apiGet<ApiVocab[]>(`/vocab?${q}`);
};

export const addVocab = (data: { word: string; meaning: string; example?: string; phonetic?: string; emoji?: string; category?: string; created_by?: string }) =>
  apiPost<ApiVocab>('/vocab', data);

export const updateVocabProgress = (userId: string, vocabId: string, status: 'new' | 'learning' | 'known' | 'unknown') =>
  apiPut('/vocab/progress', { user_id: userId, vocab_id: vocabId, status });

// ─── Quiz ─────────────────────────────────────────────────
export interface ApiQuiz {
  id: string;
  title: string;
  type: string;
  question: string;
  answer: string;
  options: string | null;
  hint: string | null;
  vocab_id: string | null;
  difficulty: number;
}

export interface ApiQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string | null;
  score: number;
  max_score: number;
  time_spent: number | null;
  completed_at: string;
  xp_earned?: number;
}

export const getQuizzes = (params?: { type?: string; difficulty?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.type) q.set('type', params.type);
  if (params?.difficulty) q.set('difficulty', String(params.difficulty));
  if (params?.limit) q.set('limit', String(params.limit));
  return apiGet<ApiQuiz[]>(`/quiz?${q}`);
};

export const submitQuizAttempt = (userId: string, score: number, maxScore = 100, quizId?: string, timeSent?: number) =>
  apiPost<ApiQuizAttempt>('/quiz/attempt', { user_id: userId, quiz_id: quizId, score, max_score: maxScore, time_spent: timeSent });

export const getQuizAttempts = (userId: string, limit = 20) =>
  apiGet<ApiQuizAttempt[]>(`/quiz/attempts?userId=${userId}&limit=${limit}`);

// ─── Rewards ──────────────────────────────────────────────
export interface ApiReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  value: number;
  required_xp: number;
  required_level: number;
  claimed?: number;
  claimed_at?: string;
}

export const getRewards = (userId?: string) => {
  const q = userId ? `?userId=${userId}` : '';
  return apiGet<ApiReward[]>(`/rewards${q}`);
};

export const claimReward = (userId: string, rewardId: string) =>
  apiPost('/rewards/claim', { user_id: userId, reward_id: rewardId });

// ─── Stats ────────────────────────────────────────────────
export const getStats = (userId: string) =>
  apiGet(`/stats/${userId}`);

// ─── Activity ─────────────────────────────────────────────
export const getActivity = (userId: string, limit = 20) =>
  apiGet(`/activity/${userId}?limit=${limit}`);
