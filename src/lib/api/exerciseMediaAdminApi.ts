import { supabase } from './supabase';

export interface ExerciseMediaQueueSummaryRow {
  status: string;
  media_type: string;
  action: string;
  jobs: number;
  without_source: number;
  max_priority: number | null;
}

export interface ExerciseMediaPolicy {
  id: string;
  name: string;
  version: number;
  status: 'draft' | 'approved' | 'retired';
  criteria: Record<string, unknown>;
  prompt_template: string;
  aspect_ratio: string;
  image_size: string;
  target_width: number;
  target_height: number;
  require_manual_approval: boolean;
  pilot_required: number;
  pilot_approved: boolean;
  approved_at: string | null;
}

export interface ExerciseMediaCandidate {
  id: string;
  queueId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  currentUrl: string | null;
  candidateUrl: string;
  prompt: string;
  isPilot: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  reviewNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ExerciseMediaDashboardResponse {
  policy: ExerciseMediaPolicy | null;
  summary: ExerciseMediaQueueSummaryRow[];
  candidates: ExerciseMediaCandidate[];
  pilot: {
    required: number;
    approved: number;
    awaitingApproval: number;
    unlocked: boolean;
  };
}

export interface ExerciseMediaCandidateBatchResponse {
  stage: 'pilot' | 'batch';
  processed: number;
  generated: number;
  failed: number;
  candidates: ExerciseMediaCandidate[];
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
  async getDashboard(): Promise<ExerciseMediaDashboardResponse> {
    return requestJson('/api/admin/exercise-media/status');
  },

  async validateUrls(limit = 5): Promise<{
    processed: number;
    valid: number;
    replacementRequired: number;
    failed: number;
  }> {
    return requestJson('/api/admin/exercise-media/validate', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
  },

  async generatePilot(): Promise<ExerciseMediaCandidateBatchResponse> {
    return requestJson('/api/admin/exercise-media/generate-pilot', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async generateBatch(limit = 5): Promise<ExerciseMediaCandidateBatchResponse> {
    return requestJson('/api/admin/exercise-media/generate-batch', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
  },

  async reviewCandidate(
    candidateId: string,
    decision: 'approve' | 'reject',
    notes?: string,
  ): Promise<{ candidateId: string; decision: 'approve' | 'reject'; pilotUnlocked: boolean }> {
    return requestJson(`/api/admin/exercise-media/candidates/${candidateId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes: notes || null }),
    });
  },

  async regenerateCandidate(candidateId: string, notes?: string): Promise<{ requeued: boolean }> {
    return requestJson(`/api/admin/exercise-media/candidates/${candidateId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || null }),
    });
  },

  async retryFailed(): Promise<{ requeued: number }> {
    return requestJson('/api/admin/exercise-media/retry-failed', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};
