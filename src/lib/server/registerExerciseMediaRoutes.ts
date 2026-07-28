import type { Express, RequestHandler } from 'express';
import type { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import {
  assertActiveAdmin,
  clampMediaBatchLimit,
} from './exerciseMediaProcessor';
import {
  generateExerciseMediaCandidates,
  getExerciseMediaApprovalDashboard,
  regenerateExerciseMediaCandidate,
  reviewExerciseMediaCandidate,
  validateExerciseMediaUrls,
} from './exerciseMediaApprovalProcessor';
import { retryFailedExerciseMediaApprovalJobs } from './retryExerciseMediaApprovalJobs';

interface AuthenticatedRequestLike {
  headers: { authorization?: string };
  user?: { id: string; email?: string | null };
  body?: Record<string, unknown>;
  params?: Record<string, string>;
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
  console.error('[ExerciseMediaApproval]', message);
  res.status(status).json({ error: message });
}

async function getAdminContext(
  req: AuthenticatedRequestLike,
  supabaseUrl: string,
  supabaseAnonKey: string,
) {
  const token = getBearerToken(req.headers.authorization);
  const client = createAuthenticatedClient(supabaseUrl, supabaseAnonKey, token);
  const userId = req.user?.id || '';
  await assertActiveAdmin(client, userId);
  return { client, userId };
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
      const { client } = await getAdminContext(req, supabaseUrl, supabaseAnonKey);
      const dashboard = await getExerciseMediaApprovalDashboard(client);
      res.json(dashboard);
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/exercise-media/validate', async (req: any, res) => {
    try {
      const typedReq = req as AuthenticatedRequestLike;
      const { client } = await getAdminContext(typedReq, supabaseUrl, supabaseAnonKey);
      const result = await validateExerciseMediaUrls(client, typedReq.body?.limit);
      res.json(result);
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/exercise-media/generate-pilot', async (req: any, res) => {
    try {
      const typedReq = req as AuthenticatedRequestLike;
      const { client, userId } = await getAdminContext(typedReq, supabaseUrl, supabaseAnonKey);
      const result = await generateExerciseMediaCandidates({
        client,
        ai: getAI(),
        userId,
        stage: 'pilot',
        imageModel,
      });
      res.json(result);
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/exercise-media/generate-batch', async (req: any, res) => {
    try {
      const typedReq = req as AuthenticatedRequestLike;
      const { client, userId } = await getAdminContext(typedReq, supabaseUrl, supabaseAnonKey);
      const result = await generateExerciseMediaCandidates({
        client,
        ai: getAI(),
        userId,
        stage: 'batch',
        limit: clampMediaBatchLimit(typedReq.body?.limit),
        imageModel,
      });
      res.json(result);
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/exercise-media/candidates/:candidateId/review', async (req: any, res) => {
    try {
      const typedReq = req as AuthenticatedRequestLike;
      const { client, userId } = await getAdminContext(typedReq, supabaseUrl, supabaseAnonKey);
      const decision = typedReq.body?.decision;
      if (decision !== 'approve' && decision !== 'reject') {
        const error = new Error('Decisão inválida. Use approve ou reject.');
        (error as any).status = 400;
        throw error;
      }
      const result = await reviewExerciseMediaCandidate({
        client,
        candidateId: typedReq.params?.candidateId || '',
        userId,
        decision,
        notes: typeof typedReq.body?.notes === 'string' ? typedReq.body.notes : null,
      });
      res.json(result);
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/exercise-media/candidates/:candidateId/regenerate', async (req: any, res) => {
    try {
      const typedReq = req as AuthenticatedRequestLike;
      const { client } = await getAdminContext(typedReq, supabaseUrl, supabaseAnonKey);
      const result = await regenerateExerciseMediaCandidate({
        client,
        candidateId: typedReq.params?.candidateId || '',
        notes: typeof typedReq.body?.notes === 'string' ? typedReq.body.notes : null,
      });
      res.json(result);
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/exercise-media/process', async (_req, res) => {
    res.status(409).json({
      error: 'O fluxo automático legado foi bloqueado. Use validação, lote piloto e aprovação de candidatas.',
    });
  });

  app.post('/api/admin/exercise-media/retry-failed', async (req: any, res) => {
    try {
      const typedReq = req as AuthenticatedRequestLike;
      const { client } = await getAdminContext(typedReq, supabaseUrl, supabaseAnonKey);
      const requeued = await retryFailedExerciseMediaApprovalJobs(client);
      res.json({ requeued });
    } catch (error) {
      sendRouteError(res, error);
    }
  });
}
