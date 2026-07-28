import type { GoogleGenAI } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ExerciseMediaProcessMode = 'validate' | 'generate' | 'both';

export interface ExerciseMediaQueueJob {
  id: string;
  exercise_id: string;
  variant_id: string | null;
  media_type: 'main' | 'variant';
  action: 'validate' | 'generate' | 'replace';
  status: 'pending' | 'deferred' | 'processing' | 'completed' | 'failed' | 'review';
  priority: number;
  prompt: string;
  source_url: string | null;
  output_url: string | null;
  attempt_count: number;
}

export interface ExerciseMediaQueueSummary {
  status: string;
  media_type: string;
  action: string;
  jobs: number;
  without_source: number;
  max_priority: number | null;
}

export interface ExerciseMediaBatchResult {
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

interface InlineImage {
  bytes: Uint8Array;
  mimeType: string;
}

const MAIN_MEDIA_BUCKET = 'exercise-images';
const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-image';
const MAX_BATCH_LIMIT = 5;

export function clampMediaBatchLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 3;
  return Math.max(1, Math.min(MAX_BATCH_LIMIT, Math.floor(parsed)));
}

export function extractGeneratedInlineImage(response: unknown): InlineImage {
  const candidateResponse = response as any;
  const candidates = Array.isArray(candidateResponse?.candidates)
    ? candidateResponse.candidates
    : [];

  const candidateParts = candidates.flatMap((candidate: any) => {
    const contentParts = candidate?.content?.parts;
    return Array.isArray(contentParts) ? contentParts : [];
  });

  const directParts = Array.isArray(candidateResponse?.parts)
    ? candidateResponse.parts
    : [];

  const parts = [...candidateParts, ...directParts];
  for (const part of parts) {
    const inlineData = part?.inlineData || part?.inline_data;
    const data = inlineData?.data;
    if (typeof data !== 'string' || data.length === 0) continue;

    const mimeType = inlineData?.mimeType || inlineData?.mime_type || 'image/png';
    return {
      bytes: Uint8Array.from(Buffer.from(data, 'base64')),
      mimeType,
    };
  }

  throw new Error('O modelo não retornou uma imagem utilizável.');
}

export async function assertActiveAdmin(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await client
    .from('user_access')
    .select('role,status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data?.role !== 'admin' || data?.status !== 'active') {
    const err = new Error('Somente um administrador ativo pode processar a biblioteca de exercícios.');
    (err as any).status = 403;
    throw err;
  }
}

export async function getExerciseMediaQueueSummary(
  client: SupabaseClient,
): Promise<ExerciseMediaQueueSummary[]> {
  const { data, error } = await client
    .from('exercise_media_queue_summary')
    .select('*');

  if (error) throw error;
  return (data || []) as ExerciseMediaQueueSummary[];
}

async function updateQueueJob(
  client: SupabaseClient,
  jobId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await client
    .from('exercise_media_queue')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) throw error;
}

async function claimQueueJob(
  client: SupabaseClient,
  job: ExerciseMediaQueueJob,
): Promise<boolean> {
  const { data, error } = await client
    .from('exercise_media_queue')
    .update({
      status: 'processing',
      claimed_at: new Date().toISOString(),
      attempt_count: (job.attempt_count || 0) + 1,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

async function validateRemoteImage(url: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-2047', Accept: 'image/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok && response.status !== 206) {
      return { valid: false, reason: `HTTP ${response.status}` };
    }
    if (!contentType.toLowerCase().startsWith('image/')) {
      return { valid: false, reason: `Tipo de conteúdo inválido: ${contentType || 'desconhecido'}` };
    }
    return { valid: true };
  } catch (error: any) {
    return { valid: false, reason: error?.message || 'Falha ao acessar a imagem' };
  }
}

function buildSafeExerciseImagePrompt(prompt: string): string {
  return [
    prompt.trim(),
    'Crie uma única imagem quadrada 1:1, técnica e didática.',
    'Mostre uma pessoa adulta com roupa esportiva completa executando o exercício com biomecânica correta.',
    'Use fundo neutro claro, enquadramento limpo, equipamento completo e anatomia proporcional.',
    'Destaque discretamente os músculos-alvo sem transparência corporal explícita.',
    'Não inclua texto, números, marcas, logotipos, molduras ou elementos decorativos.',
  ].join(' ');
}

async function generateExerciseImage(
  ai: GoogleGenAI,
  prompt: string,
  imageModel: string,
): Promise<InlineImage> {
  const response = await (ai as any).models.generateContent({
    model: imageModel,
    contents: buildSafeExerciseImagePrompt(prompt),
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '1:1' },
    },
  });

  return extractGeneratedInlineImage(response);
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  return 'png';
}

async function uploadExerciseImage(
  client: SupabaseClient,
  exerciseId: string,
  image: InlineImage,
): Promise<string> {
  const extension = extensionForMimeType(image.mimeType);
  const objectPath = `audited/${exerciseId}/${Date.now()}.${extension}`;

  const { error } = await client.storage
    .from(MAIN_MEDIA_BUCKET)
    .upload(objectPath, image.bytes, {
      contentType: image.mimeType,
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) throw error;

  const { data } = client.storage.from(MAIN_MEDIA_BUCKET).getPublicUrl(objectPath);
  if (!data?.publicUrl) throw new Error('O upload foi concluído, mas a URL pública não foi gerada.');
  return data.publicUrl;
}

async function completeGeneratedJob(
  client: SupabaseClient,
  job: ExerciseMediaQueueJob,
  outputUrl: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error: exerciseError } = await client
    .from('exercises')
    .update({
      image_url: outputUrl,
      quality_score: 92,
      quality_status: 'premium',
      last_review_at: now,
    })
    .eq('id', job.exercise_id);

  if (exerciseError) throw exerciseError;

  await updateQueueJob(client, job.id, {
    status: 'completed',
    output_url: outputUrl,
    source_url: outputUrl,
    confidence: 0.95,
    completed_at: now,
    last_error: null,
  });
}

async function failJob(
  client: SupabaseClient,
  job: ExerciseMediaQueueJob,
  error: unknown,
): Promise<'failed' | 'review'> {
  const message = error instanceof Error ? error.message : String(error);
  const attempts = (job.attempt_count || 0) + 1;
  const status = attempts >= 3 ? 'review' : 'failed';
  await updateQueueJob(client, job.id, {
    status,
    claimed_at: null,
    last_error: message.slice(0, 1000),
  });
  return status;
}

async function getPendingJobs(
  client: SupabaseClient,
  mode: ExerciseMediaProcessMode,
  limit: number,
): Promise<ExerciseMediaQueueJob[]> {
  let query = client
    .from('exercise_media_queue')
    .select('id,exercise_id,variant_id,media_type,action,status,priority,prompt,source_url,output_url,attempt_count')
    .eq('media_type', 'main')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (mode === 'validate') query = query.eq('action', 'validate');
  if (mode === 'generate') query = query.in('action', ['generate', 'replace']);
  if (mode === 'both') query = query.in('action', ['validate', 'generate', 'replace']);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ExerciseMediaQueueJob[];
}

export async function retryFailedExerciseMediaJobs(
  client: SupabaseClient,
): Promise<number> {
  const { data, error } = await client
    .from('exercise_media_queue')
    .update({ status: 'pending', claimed_at: null, last_error: null, updated_at: new Date().toISOString() })
    .eq('media_type', 'main')
    .in('status', ['failed', 'review'])
    .lt('attempt_count', 5)
    .select('id');

  if (error) throw error;
  return data?.length || 0;
}

export async function processExerciseMediaBatch(params: {
  client: SupabaseClient;
  ai: GoogleGenAI;
  mode: ExerciseMediaProcessMode;
  limit?: number;
  imageModel?: string;
}): Promise<ExerciseMediaBatchResult> {
  const limit = clampMediaBatchLimit(params.limit);
  const imageModel = params.imageModel?.trim() || DEFAULT_IMAGE_MODEL;
  const jobs = await getPendingJobs(params.client, params.mode, limit);

  const result: ExerciseMediaBatchResult = {
    requestedMode: params.mode,
    processed: 0,
    validated: 0,
    generated: 0,
    replaced: 0,
    failed: 0,
    jobs: [],
  };

  for (const job of jobs) {
    const claimed = await claimQueueJob(params.client, job);
    if (!claimed) continue;
    result.processed += 1;

    try {
      if (job.action === 'validate') {
        const validation = job.source_url
          ? await validateRemoteImage(job.source_url)
          : { valid: false, reason: 'URL ausente' };

        if (validation.valid) {
          await updateQueueJob(params.client, job.id, {
            status: 'completed',
            output_url: job.source_url,
            confidence: 0.90,
            completed_at: new Date().toISOString(),
            claimed_at: null,
            last_error: null,
          });
          result.validated += 1;
          result.jobs.push({
            id: job.id,
            exerciseId: job.exercise_id,
            action: job.action,
            status: 'completed',
            outputUrl: job.source_url || undefined,
          });
          continue;
        }

        await updateQueueJob(params.client, job.id, {
          action: 'replace',
          status: 'pending',
          priority: Math.max(job.priority || 0, 125),
          claimed_at: null,
          last_error: validation.reason || 'Imagem inválida',
        });
        result.jobs.push({
          id: job.id,
          exerciseId: job.exercise_id,
          action: job.action,
          status: 'requeued',
          error: validation.reason,
        });
        continue;
      }

      const image = await generateExerciseImage(params.ai, job.prompt, imageModel);
      const outputUrl = await uploadExerciseImage(params.client, job.exercise_id, image);
      await completeGeneratedJob(params.client, job, outputUrl);

      if (job.action === 'replace') result.replaced += 1;
      else result.generated += 1;

      result.jobs.push({
        id: job.id,
        exerciseId: job.exercise_id,
        action: job.action,
        status: 'completed',
        outputUrl,
      });
    } catch (error) {
      result.failed += 1;
      const status = await failJob(params.client, job, error);
      result.jobs.push({
        id: job.id,
        exerciseId: job.exercise_id,
        action: job.action,
        status,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}
