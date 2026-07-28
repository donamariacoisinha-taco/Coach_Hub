import { supabase } from './supabase';

export type ExerciseMediaProcessMode = 'validate' | 'generate' | 'both';

export interface ExerciseMediaQueueSummaryRow {
  status: string;
  media_type: string;
  action: string;
  jobs: number;
  without_source: number;
  max_priority: number | null;
}

export interface ExerciseMediaBatchResponse {
  requestedMode: ExerciseMediaProcessMode;
  processed: number;
  validated: number;
  generated: number;
  replaced: number;
  failed: number;
  jobs: Array<{
    id: string;
    exerciseId: string;
    action: string;
    status: 'completed' | 'failed' | 'review' | 'requeued';
    outputUrl?: string;
    error?: string;
  }>;
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('Sessão administrativa não encontrada. Entre novamente.');
  return token;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Falha HTTP ${response.status}`);
  }
  return payload as T;
}

export const exerciseMediaAdminApi = {
  async getStatus(): Promise<{ summary: ExerciseMediaQueueSummaryRow[] }> {
    return requestJson('/api/admin/exercise-media/status');
  },

  async processBatch(
    mode: ExerciseMediaProcessMode = 'both',
    limit = 3,
  ): Promise<ExerciseMediaBatchResponse> {
    return requestJson('/api/admin/exercise-media/process', {
      method: 'POST',
      body: JSON.stringify({ mode, limit }),
    });
  },

  async retryFailed(): Promise<{ requeued: number }> {
    return requestJson('/api/admin/exercise-media/retry-failed', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};
