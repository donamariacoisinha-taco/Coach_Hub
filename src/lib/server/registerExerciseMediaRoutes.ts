import type { Express, RequestHandler } from 'express';
import type { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import {
  assertActiveAdmin,
  clampMediaBatchLimit,
  getExerciseMediaQueueSummary,
  processExerciseMediaBatch,
  retryFailedExerciseMediaJobs,
  type ExerciseMediaProcessMode,
} from './exerciseMediaProcessor';

interface AuthenticatedRequestLike {
  headers: { authorization?: string };
  user?: { id: string; email?: string | null };
  body?: Record<string, unknown>;
}

interface RegisterExerciseMediaRoutesOptions {
  app: Express;
  requireAuth: RequestHandler;
  rateLimit: RequestHandler;
  getAI: () => GoogleGenAI;
  supabaseUrl: string;
  supabaseAnonKey: string;
  imageModel?: string;
}

function getBearerToken(authorization?: string): string {
  if (!authorization) return '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function resolveMode(value: unknown): ExerciseMediaProcessMode {
  return value === 'validate' || value === 'generate' || value === 'both'
    ? value
    : 'both';
}

function createAuthenticatedClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  token: string,
) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('As variáveis do Supabase não estão configuradas no servidor.');
  }
  if (!token) throw new Error('Token administrativo ausente.');

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function sendRouteError(res: any, error: unknown): void {
  const status = Number((error as any)?.status) || 500;
  const message = error instanceof Error ? error.message : String(error);
  console.error('[ExerciseMediaAutomation]', message);
  res.status(status).json({ error: message });
}

export function registerExerciseMediaRoutes(
  options: RegisterExerciseMediaRoutesOptions,
): void {
  const {
    app,
    requireAuth,
    rateLimit,
    getAI,
    supabaseUrl,
    supabaseAnonKey,
    imageModel,
  } = options;

  app.use('/api/admin/exercise-media', requireAuth, rateLimit);

  app.get('/api/admin/exercise-media/status', async (req: any, res) => {
    try {
      const typedReq = req as AuthenticatedRequestLike;
      const token = getBearerToken(typedReq.headers.authorization);
      const client = createAuthenticatedClient(supabaseUrl, supabaseAnonKey, token);
      await assertActiveAdmin(client, typedReq.user?.id || '');
      const summary = await getExerciseMediaQueueSummary(client);
      res.json({ summary });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/exercise-media/process', async (req: any, res) => {
    try {
      const typedReq = req as AuthenticatedRequestLike;
      const token = getBearerToken(typedReq.headers.authorization);
      const client = createAuthenticatedClient(supabaseUrl, supabaseAnonKey, token);
      await assertActiveAdmin(client, typedReq.user?.id || '');

      const mode = resolveMode(typedReq.body?.mode);
      const limit = clampMediaBatchLimit(typedReq.body?.limit);
      const result = await processExerciseMediaBatch({
        client,
        ai: getAI(),
        mode,
        limit,
        imageModel,
      });
      res.json(result);
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/exercise-media/retry-failed', async (req: any, res) => {
    try {
      const typedReq = req as AuthenticatedRequestLike;
      const token = getBearerToken(typedReq.headers.authorization);
      const client = createAuthenticatedClient(supabaseUrl, supabaseAnonKey, token);
      await assertActiveAdmin(client, typedReq.user?.id || '');
      const requeued = await retryFailedExerciseMediaJobs(client);
      res.json({ requeued });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
}
