import { getSupabase, isSupabaseConfigured } from './supabase';

export interface PlaytestFeedbackInput {
  rating: number;
  difficulty: 'too_easy' | 'balanced' | 'too_hard';
  favoriteFeature: string;
  bugNotes: string;
  currentLevel: number;
}

export interface GameRunInput {
  completedLevel: number;
  result: 'level_complete' | 'win' | 'lose';
  stars: number;
  environment: number;
  satisfaction: number;
  money: number;
  durationSeconds: number;
}

const SESSION_KEY = 'starlight-mayor-session-id';

export function getPlaytestSessionId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID();
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
}

export async function submitPlaytestFeedback(input: PlaytestFeedbackInput) {
  if (!isSupabaseConfigured) return { saved: false as const, reason: 'offline' as const };
  const supabase = await getSupabase();
  if (!supabase) return { saved: false as const, reason: 'offline' as const };
  const { error } = await supabase.from('playtest_feedback').insert({
    session_id: getPlaytestSessionId(),
    rating: input.rating,
    difficulty: input.difficulty,
    favorite_feature: input.favoriteFeature.slice(0, 120),
    bug_notes: input.bugNotes.slice(0, 1000),
    current_level: input.currentLevel,
    client_version: '1.0.0',
  });
  if (error) throw error;
  return { saved: true as const };
}

export async function recordGameRun(input: GameRunInput) {
  if (!isSupabaseConfigured) return;
  const supabase = await getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('game_runs').insert({
    session_id: getPlaytestSessionId(),
    completed_level: input.completedLevel,
    result: input.result,
    stars: input.stars,
    environment: input.environment,
    satisfaction: input.satisfaction,
    money: input.money,
    duration_seconds: Math.max(0, Math.round(input.durationSeconds)),
    client_version: '1.0.0',
  });
  if (error) console.warn('Unable to record playtest run:', error.message);
}
