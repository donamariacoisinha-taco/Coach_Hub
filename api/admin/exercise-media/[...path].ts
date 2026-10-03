import { GoogleGenAI } from '@google/genai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  assertActiveAdmin,
  clampMediaBatchLimit,
} from '../../../src/lib/server/exerciseMediaProcessor';
import {
  generateExerciseMediaCandidates,
  getExerciseMediaApprovalDashboard,
  regenerateExerciseMediaCandidate,
  reviewExerciseMediaCandidate,
  validateExerciseMediaUrls,
} from '../../../src/lib/server/exerciseMediaApprovalProcessor';
import { retryFailedExerciseMediaApprovalJobs } from '../../../src/lib/server/retryExerciseMediaApprovalJobs';

type VercelRequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponseLike = {
  status: (statusCode: number) => VercelResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function readEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value?.trim()) return value.trim();
  }
  return '';
}

function getHeader(req: VercelRequestLike, name: string): string {
  const value = req.headers[name] || req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function getBearerToken(req: VercelRequestLike): string {
  const authorization = getHeader(req, 'authorization');
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function getPathParts(req: VercelRequestLike): string[] {
  const raw = req.query.path;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.length > 0) return [raw];
  return [];
}

function getBody(req: VercelRequestLike): Record<string, unknown> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') return req.body as Record<string, unknown>;
  return {};
}

function sendError(res: VercelResponseLike, error: unknown): void {
  const status = Number((error as { status?: number })?.status) || 500;
  const message = error instanceof Error ? error.message : String(error);
  console.error('[ExerciseMediaApproval]', message);
  res.status(status).json({ error: message });
}

async function getAdminClient(req: VercelRequestLike): Promise<{
  client: SupabaseClient;
  userId: string;
}> {
  const supabaseUrl = readEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const supabaseAnonKey = readEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('As variáveis do Supabase não estão configuradas no servidor.');
  }

  const token = getBearerToken(req);
  if (!token) {
    const error = new Error('Token administrativo ausente.');
    (error as { status?: number }).status = 401;
    throw error;
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    const authError = new Error('Sessão administrativa inválida ou expirada.');
    (authError as { status?: number }).status = 401;
    throw authError;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  await assertActiveAdmin(client, data.user.id);
  return { client, userId: data.user.id };
}

function getAI(): GoogleGenAI {
  const apiKey = readEnv('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Configure a variável no ambiente da Vercel.');
  }
  return new GoogleGenAI({ apiKey });
}

export default async function handler(
  req: VercelRequestLike,
  res: VercelResponseLike,
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const method = (req.method || 'GET').toUpperCase();
    const parts = getPathParts(req);
    const route = parts.join('/');
    const body = getBody(req);
    const { client, userId } = await getAdminClient(req);

    if (method === 'GET' && route === 'status') {
      res.status(200).json(await getExerciseMediaApprovalDashboard(client));
      return;
    }

    if (method === 'POST' && route === 'validate') {
      res.status(200).json(await validateExerciseMediaUrls(client, body.limit));
      return;
    }

    if (method === 'POST' && route === 'generate-pilot') {
      res.status(200).json(await generateExerciseMediaCandidates({
        client,
        ai: getAI(),
        userId,
        stage: 'pilot',
        imageModel: readEnv('GEMINI_IMAGE_MODEL') || undefined,
      }));
      return;
    }

    if (method === 'POST' && route === 'generate-batch') {
      res.status(200).json(await generateExerciseMediaCandidates({
        client,
        ai: getAI(),
        userId,
        stage: 'batch',
        limit: clampMediaBatchLimit(body.limit),
        imageModel: readEnv('GEMINI_IMAGE_MODEL') || undefined,
      }));
      return;
    }

    if (method === 'POST' && route === 'retry-failed') {
      res.status(200).json(await retryFailedExerciseMediaApprovalJobs(client));
      return;
    }

    if (method === 'POST' && parts[0] === 'candidates' && parts[2] === 'review') {
      const decision = body.decision;
      if (decision !== 'approve' && decision !== 'reject') {
        const error = new Error('Decisão inválida. Use approve ou reject.');
        (error as { status?: number }).status = 400;
        throw error;
      }
      res.status(200).json(await reviewExerciseMediaCandidate({
        client,
        candidateId: parts[1] || '',
        userId,
        decision,
        notes: typeof body.notes === 'string' ? body.notes : null,
      }));
      return;
    }

    if (method === 'POST' && parts[0] === 'candidates' && parts[2] === 'regenerate') {
      res.status(200).json(await regenerateExerciseMediaCandidate({
        client,
        candidateId: parts[1] || '',
        notes: typeof body.notes === 'string' ? body.notes : null,
      }));
      return;
    }

    res.status(404).json({ error: 'Rota de mídia administrativa não encontrada.' });
  } catch (error) {
    sendError(res, error);
  }
}
