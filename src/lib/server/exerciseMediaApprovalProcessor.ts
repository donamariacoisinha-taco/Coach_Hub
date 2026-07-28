import type { GoogleGenAI } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  clampMediaBatchLimit,
  extractGeneratedInlineImage,
  type ExerciseMediaQueueSummary,
} from './exerciseMediaProcessor';

const MAIN_MEDIA_BUCKET = 'exercise-images';
const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-image';
const MAIN_GROUPS = ['Peito', 'Costas', 'Ombros', 'Braços', 'Abdômen', 'Pernas'];

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

interface QueueJob {
  id: string;
  exercise_id: string;
  action: 'validate' | 'generate' | 'replace';
  status: string;
  priority: number;
  prompt: string;
  source_url: string | null;
  previous_url: string | null;
  attempt_count: number;
  is_pilot: boolean;
  policy_id: string | null;
}

interface ExerciseRecord {
  id: string;
  name: string;
  muscle_group: string | null;
  subgroup: string | null;
  equipment: string | null;
  image_url: string | null;
  technical_prompt: string | null;
  biomechanics: Record<string, unknown> | null;
}

export interface ExerciseMediaCandidateView {
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

export interface ExerciseMediaDashboard {
  policy: ExerciseMediaPolicy | null;
  summary: ExerciseMediaQueueSummary[];
  candidates: ExerciseMediaCandidateView[];
  pilot: {
    required: number;
    approved: number;
    awaitingApproval: number;
    unlocked: boolean;
  };
}

export interface ExerciseMediaCandidateBatchResult {
  stage: 'pilot' | 'batch';
  processed: number;
  generated: number;
  failed: number;
  candidates: ExerciseMediaCandidateView[];
}

function httpError(message: string, status: number): Error {
  const error = new Error(message);
  (error as any).status = status;
  return error;
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

export async function getApprovedExerciseMediaPolicy(
  client: SupabaseClient,
): Promise<ExerciseMediaPolicy> {
  const { data, error } = await client
    .from('exercise_media_policies')
    .select('id,name,version,status,criteria,prompt_template,aspect_ratio,image_size,target_width,target_height,require_manual_approval,pilot_required,pilot_approved,approved_at')
    .eq('status', 'approved')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError('Nenhuma política visual aprovada foi encontrada.', 409);
  return data as ExerciseMediaPolicy;
}

async function getQueueSummary(client: SupabaseClient): Promise<ExerciseMediaQueueSummary[]> {
  const { data, error } = await client
    .from('exercise_media_queue_summary')
    .select('*');
  if (error) throw error;
  return (data || []) as ExerciseMediaQueueSummary[];
}

async function listCandidateViews(
  client: SupabaseClient,
  policyId?: string,
): Promise<ExerciseMediaCandidateView[]> {
  let query = client
    .from('exercise_media_candidates')
    .select('id,queue_id,exercise_id,candidate_url,source_url,generated_prompt,is_pilot,status,review_notes,created_at,reviewed_at,policy_id')
    .order('created_at', { ascending: false })
    .limit(80);
  if (policyId) query = query.eq('policy_id', policyId);

  const { data: candidates, error } = await query;
  if (error) throw error;
  if (!candidates?.length) return [];

  const exerciseIds = Array.from(new Set(candidates.map((candidate: any) => candidate.exercise_id)));
  const { data: exercises, error: exercisesError } = await client
    .from('exercises')
    .select('id,name,muscle_group,image_url')
    .in('id', exerciseIds);
  if (exercisesError) throw exercisesError;

  const exerciseMap = new Map((exercises || []).map((exercise: any) => [exercise.id, exercise]));
  return candidates.map((candidate: any) => {
    const exercise = exerciseMap.get(candidate.exercise_id) as any;
    return {
      id: candidate.id,
      queueId: candidate.queue_id,
      exerciseId: candidate.exercise_id,
      exerciseName: exercise?.name || 'Exercício',
      muscleGroup: exercise?.muscle_group || 'Sem grupo',
      currentUrl: candidate.source_url || exercise?.image_url || null,
      candidateUrl: candidate.candidate_url,
      prompt: candidate.generated_prompt,
      isPilot: Boolean(candidate.is_pilot),
      status: candidate.status,
      reviewNotes: candidate.review_notes || null,
      createdAt: candidate.created_at,
      reviewedAt: candidate.reviewed_at || null,
    } as ExerciseMediaCandidateView;
  });
}

export async function getExerciseMediaApprovalDashboard(
  client: SupabaseClient,
): Promise<ExerciseMediaDashboard> {
  const policy = await getApprovedExerciseMediaPolicy(client).catch(() => null);
  const [summary, candidates] = await Promise.all([
    getQueueSummary(client),
    listCandidateViews(client, policy?.id),
  ]);

  const pilotCandidates = candidates.filter((candidate) => candidate.isPilot);
  const approved = pilotCandidates.filter((candidate) => candidate.status === 'approved').length;
  const awaitingApproval = pilotCandidates.filter((candidate) => candidate.status === 'pending').length;

  return {
    policy,
    summary,
    candidates,
    pilot: {
      required: policy?.pilot_required || 6,
      approved,
      awaitingApproval,
      unlocked: Boolean(policy?.pilot_approved),
    },
  };
}

async function validateRemoteImage(url: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-4095', Accept: 'image/*' },
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

export async function validateExerciseMediaUrls(
  client: SupabaseClient,
  limitValue?: unknown,
): Promise<{ processed: number; valid: number; replacementRequired: number; failed: number }> {
  const limit = clampMediaBatchLimit(limitValue);
  const { data: jobs, error } = await client
    .from('exercise_media_queue')
    .select('id,exercise_id,action,status,priority,prompt,source_url,previous_url,attempt_count,is_pilot,policy_id')
    .eq('media_type', 'main')
    .eq('action', 'validate')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .limit(limit);
  if (error) throw error;

  const result = { processed: 0, valid: 0, replacementRequired: 0, failed: 0 };
  for (const rawJob of jobs || []) {
    const job = rawJob as QueueJob;
    result.processed += 1;
    try {
      const validation = job.source_url
        ? await validateRemoteImage(job.source_url)
        : { valid: false, reason: 'URL ausente' };
      if (validation.valid) {
        await updateQueueJob(client, job.id, {
          status: 'completed',
          output_url: job.source_url,
          approval_status: 'not_required',
          confidence: 0.90,
          completed_at: new Date().toISOString(),
          last_error: null,
        });
        result.valid += 1;
      } else {
        await updateQueueJob(client, job.id, {
          action: 'replace',
          status: 'pending',
          approval_status: 'pending',
          previous_url: job.source_url,
          priority: Math.max(job.priority || 0, 125),
          last_error: validation.reason || 'Imagem inválida',
        });
        result.replacementRequired += 1;
      }
    } catch (error) {
      result.failed += 1;
      await updateQueueJob(client, job.id, {
        status: 'failed',
        last_error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return result;
}

async function getExercisesByIds(
  client: SupabaseClient,
  ids: string[],
): Promise<Map<string, ExerciseRecord>> {
  if (!ids.length) return new Map();
  const { data, error } = await client
    .from('exercises')
    .select('id,name,muscle_group,subgroup,equipment,image_url,technical_prompt,biomechanics')
    .in('id', ids);
  if (error) throw error;
  return new Map((data || []).map((exercise: any) => [exercise.id, exercise as ExerciseRecord]));
}

async function ensurePilotSelection(
  client: SupabaseClient,
  policy: ExerciseMediaPolicy,
): Promise<void> {
  const { data: existing, error: existingError } = await client
    .from('exercise_media_queue')
    .select('id')
    .eq('media_type', 'main')
    .eq('is_pilot', true)
    .eq('policy_id', policy.id)
    .limit(policy.pilot_required);
  if (existingError) throw existingError;
  if ((existing || []).length >= policy.pilot_required) return;

  const { data: jobs, error } = await client
    .from('exercise_media_queue')
    .select('id,exercise_id,action,status,priority,prompt,source_url,previous_url,attempt_count,is_pilot,policy_id')
    .eq('media_type', 'main')
    .in('action', ['generate', 'replace'])
    .in('status', ['pending', 'review'])
    .eq('policy_id', policy.id)
    .order('priority', { ascending: false })
    .limit(100);
  if (error) throw error;

  const typedJobs = (jobs || []) as QueueJob[];
  const exerciseMap = await getExercisesByIds(client, typedJobs.map((job) => job.exercise_id));
  const chosen: QueueJob[] = [];

  for (const group of MAIN_GROUPS) {
    const match = typedJobs.find((job) => {
      const exercise = exerciseMap.get(job.exercise_id);
      return exercise?.muscle_group === group && !chosen.some((item) => item.id === job.id);
    });
    if (match) chosen.push(match);
  }

  for (const job of typedJobs) {
    if (chosen.length >= policy.pilot_required) break;
    if (!chosen.some((item) => item.id === job.id)) chosen.push(job);
  }

  for (const job of chosen.slice(0, policy.pilot_required)) {
    await updateQueueJob(client, job.id, {
      is_pilot: true,
      status: 'pending',
      approval_status: 'pending',
      policy_id: policy.id,
    });
  }
}

function stringifyBiomechanics(value: Record<string, unknown> | null): string {
  if (!value) return 'não informado';
  try {
    return JSON.stringify(value);
  } catch {
    return 'não informado';
  }
}

export function buildOfficialExerciseImagePrompt(
  policy: ExerciseMediaPolicy,
  exercise: ExerciseRecord,
  jobPrompt: string,
): string {
  return [
    policy.prompt_template.trim(),
    `Exercício: ${exercise.name}.`,
    `Grupo muscular principal: ${exercise.muscle_group || 'não informado'}.`,
    `Subgrupo: ${exercise.subgroup || 'não informado'}.`,
    `Equipamento: ${exercise.equipment || 'não informado'}.`,
    `Biomecânica e músculos cadastrados: ${stringifyBiomechanics(exercise.biomechanics)}.`,
    `Instrução técnica complementar do banco: ${exercise.technical_prompt || jobPrompt || 'não informada'}.`,
    'A imagem deve manter a composição de referência do KYRON: posição inicial, posição final e, quando útil, quadro anatômico circular complementar.',
    'Os músculos principais devem estar em azul; os músculos secundários, em verde. Não colorir músculos não envolvidos.',
  ].join(' ');
}

async function generateInlineImage(
  ai: GoogleGenAI,
  prompt: string,
  policy: ExerciseMediaPolicy,
  imageModel: string,
) {
  const response = await (ai as any).models.generateContent({
    model: imageModel,
    contents: prompt,
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: policy.aspect_ratio,
        imageSize: policy.image_size,
      },
    },
  });
  return extractGeneratedInlineImage(response);
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  return 'png';
}

async function uploadCandidate(
  client: SupabaseClient,
  policy: ExerciseMediaPolicy,
  exerciseId: string,
  bytes: Uint8Array,
  mimeType: string,
): Promise<string> {
  const extension = extensionForMimeType(mimeType);
  const objectPath = `candidates/v${policy.version}/${exerciseId}/${Date.now()}.${extension}`;
  const { error } = await client.storage
    .from(MAIN_MEDIA_BUCKET)
    .upload(objectPath, bytes, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert: false,
    });
  if (error) throw error;
  const { data } = client.storage.from(MAIN_MEDIA_BUCKET).getPublicUrl(objectPath);
  if (!data?.publicUrl) throw new Error('A candidata foi enviada, mas a URL pública não foi criada.');
  return data.publicUrl;
}

async function getGenerationJobs(
  client: SupabaseClient,
  policy: ExerciseMediaPolicy,
  stage: 'pilot' | 'batch',
  limit: number,
): Promise<QueueJob[]> {
  if (stage === 'pilot') await ensurePilotSelection(client, policy);
  if (stage === 'batch' && !policy.pilot_approved) {
    throw httpError('O lote completo está bloqueado até a aprovação das seis imagens piloto.', 409);
  }

  let query = client
    .from('exercise_media_queue')
    .select('id,exercise_id,action,status,priority,prompt,source_url,previous_url,attempt_count,is_pilot,policy_id')
    .eq('media_type', 'main')
    .in('action', ['generate', 'replace'])
    .eq('status', 'pending')
    .eq('policy_id', policy.id)
    .eq('is_pilot', stage === 'pilot')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as QueueJob[];
}

export async function generateExerciseMediaCandidates(params: {
  client: SupabaseClient;
  ai: GoogleGenAI;
  userId: string;
  stage: 'pilot' | 'batch';
  limit?: unknown;
  imageModel?: string;
}): Promise<ExerciseMediaCandidateBatchResult> {
  const policy = await getApprovedExerciseMediaPolicy(params.client);
  const limit = params.stage === 'pilot'
    ? policy.pilot_required
    : clampMediaBatchLimit(params.limit);
  const imageModel = params.imageModel?.trim() || DEFAULT_IMAGE_MODEL;
  const jobs = await getGenerationJobs(params.client, policy, params.stage, limit);
  const exerciseMap = await getExercisesByIds(params.client, jobs.map((job) => job.exercise_id));

  const result: ExerciseMediaCandidateBatchResult = {
    stage: params.stage,
    processed: 0,
    generated: 0,
    failed: 0,
    candidates: [],
  };

  for (const job of jobs) {
    result.processed += 1;
    try {
      const { data: claimed, error: claimError } = await params.client
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
      if (claimError) throw claimError;
      if (!claimed?.id) continue;

      const exercise = exerciseMap.get(job.exercise_id);
      if (!exercise) throw new Error('Exercício não encontrado para geração.');
      const prompt = buildOfficialExerciseImagePrompt(policy, exercise, job.prompt);
      const image = await generateInlineImage(params.ai, prompt, policy, imageModel);
      const candidateUrl = await uploadCandidate(
        params.client,
        policy,
        job.exercise_id,
        image.bytes,
        image.mimeType,
      );

      const { data: candidate, error: candidateError } = await params.client
        .from('exercise_media_candidates')
        .insert({
          queue_id: job.id,
          exercise_id: job.exercise_id,
          policy_id: policy.id,
          candidate_url: candidateUrl,
          source_url: job.source_url || exercise.image_url,
          generated_prompt: prompt,
          is_pilot: params.stage === 'pilot',
          status: 'pending',
          generation_model: imageModel,
          generation_metadata: {
            aspect_ratio: policy.aspect_ratio,
            image_size: policy.image_size,
            target_display: `${policy.target_width}x${policy.target_height}`,
            mime_type: image.mimeType,
          },
          created_by: params.userId,
        })
        .select('id')
        .single();
      if (candidateError) throw candidateError;

      await updateQueueJob(params.client, job.id, {
        status: 'awaiting_approval',
        approval_status: 'pending',
        active_candidate_id: candidate.id,
        generated_prompt: prompt,
        generated_at: new Date().toISOString(),
        claimed_at: null,
        previous_url: job.source_url || exercise.image_url,
        output_url: candidateUrl,
        last_error: null,
      });
      result.generated += 1;
    } catch (error) {
      result.failed += 1;
      await updateQueueJob(params.client, job.id, {
        status: (job.attempt_count || 0) + 1 >= 3 ? 'review' : 'failed',
        claimed_at: null,
        last_error: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
      });
    }
  }

  result.candidates = (await listCandidateViews(params.client, policy.id))
    .filter((candidate) => candidate.status === 'pending');
  return result;
}

export async function reviewExerciseMediaCandidate(params: {
  client: SupabaseClient;
  candidateId: string;
  userId: string;
  decision: 'approve' | 'reject';
  notes?: string | null;
}): Promise<{ candidateId: string; decision: 'approve' | 'reject'; pilotUnlocked: boolean }> {
  const { data: candidate, error } = await params.client
    .from('exercise_media_candidates')
    .select('id,queue_id,exercise_id,policy_id,candidate_url,source_url,is_pilot,status')
    .eq('id', params.candidateId)
    .maybeSingle();
  if (error) throw error;
  if (!candidate) throw httpError('Imagem candidata não encontrada.', 404);
  if (candidate.status !== 'pending') throw httpError('Esta candidata já foi revisada.', 409);

  const now = new Date().toISOString();
  let pilotUnlocked = false;

  if (params.decision === 'approve') {
    const { error: exerciseError } = await params.client
      .from('exercises')
      .update({
        image_url: candidate.candidate_url,
        quality_score: 92,
        quality_status: 'premium',
        last_review_at: now,
      })
      .eq('id', candidate.exercise_id);
    if (exerciseError) throw exerciseError;

    const { error: candidateError } = await params.client
      .from('exercise_media_candidates')
      .update({
        status: 'approved',
        reviewed_by: params.userId,
        reviewed_at: now,
        review_notes: params.notes || null,
        updated_at: now,
      })
      .eq('id', candidate.id);
    if (candidateError) throw candidateError;

    await updateQueueJob(params.client, candidate.queue_id, {
      status: 'completed',
      approval_status: 'approved',
      source_url: candidate.candidate_url,
      output_url: candidate.candidate_url,
      approved_by: params.userId,
      approved_at: now,
      completed_at: now,
      review_notes: params.notes || null,
      confidence: 0.95,
      active_candidate_id: candidate.id,
      last_error: null,
    });

    if (candidate.is_pilot) {
      const { count, error: countError } = await params.client
        .from('exercise_media_candidates')
        .select('id', { count: 'exact', head: true })
        .eq('policy_id', candidate.policy_id)
        .eq('is_pilot', true)
        .eq('status', 'approved');
      if (countError) throw countError;

      const { data: policy, error: policyError } = await params.client
        .from('exercise_media_policies')
        .select('pilot_required')
        .eq('id', candidate.policy_id)
        .single();
      if (policyError) throw policyError;

      if ((count || 0) >= Number(policy.pilot_required || 6)) {
        const { error: unlockError } = await params.client
          .from('exercise_media_policies')
          .update({ pilot_approved: true, updated_at: now })
          .eq('id', candidate.policy_id);
        if (unlockError) throw unlockError;
        pilotUnlocked = true;
      }
    }
  } else {
    const { error: candidateError } = await params.client
      .from('exercise_media_candidates')
      .update({
        status: 'rejected',
        reviewed_by: params.userId,
        reviewed_at: now,
        review_notes: params.notes || 'Reprovada pelo administrador.',
        updated_at: now,
      })
      .eq('id', candidate.id);
    if (candidateError) throw candidateError;

    await updateQueueJob(params.client, candidate.queue_id, {
      status: 'review',
      approval_status: 'rejected',
      review_notes: params.notes || 'Reprovada pelo administrador.',
      active_candidate_id: null,
      claimed_at: null,
    });
  }

  return { candidateId: candidate.id, decision: params.decision, pilotUnlocked };
}

export async function regenerateExerciseMediaCandidate(params: {
  client: SupabaseClient;
  candidateId: string;
  notes?: string | null;
}): Promise<{ requeued: boolean }> {
  const { data: candidate, error } = await params.client
    .from('exercise_media_candidates')
    .select('id,queue_id,status')
    .eq('id', params.candidateId)
    .maybeSingle();
  if (error) throw error;
  if (!candidate) throw httpError('Imagem candidata não encontrada.', 404);

  if (candidate.status === 'pending') {
    const now = new Date().toISOString();
    const { error: supersedeError } = await params.client
      .from('exercise_media_candidates')
      .update({
        status: 'superseded',
        review_notes: params.notes || 'Nova geração solicitada.',
        reviewed_at: now,
        updated_at: now,
      })
      .eq('id', candidate.id);
    if (supersedeError) throw supersedeError;
  }

  await updateQueueJob(params.client, candidate.queue_id, {
    status: 'pending',
    approval_status: 'pending',
    active_candidate_id: null,
    claimed_at: null,
    review_notes: params.notes || 'Nova geração solicitada.',
    last_error: null,
  });
  return { requeued: true };
}
