export const MAX_PROMPT_CHARACTERS = 20_000;
export const MAX_SYSTEM_INSTRUCTION_CHARACTERS = 10_000;

const ALLOWED_AI_MODELS = new Set(['gemini-3.5-flash']);

export const getBearerTokenFromHeader = (authorization?: string | null): string | null => {
  if (!authorization) return null;

  const [scheme, token, ...extraParts] = authorization.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token || extraParts.length > 0) return null;

  return token;
};

export const sanitizePromptValue = (
  value: unknown,
  fieldName: string,
  maxLength = MAX_PROMPT_CHARACTERS,
): string => {
  if (typeof value !== 'string') return '';
  if (value.length > maxLength) {
    throw new Error(`${fieldName} is too large. Maximum allowed length is ${maxLength} characters.`);
  }
  return value;
};

export const resolveAllowedModel = (requestedModel: unknown): string => {
  const model = typeof requestedModel === 'string' && requestedModel.trim()
    ? requestedModel.trim()
    : 'gemini-3.5-flash';

  const normalizedModel = model === 'gemini-3-flash-preview'
    ? 'gemini-3.5-flash'
    : model;

  if (!ALLOWED_AI_MODELS.has(normalizedModel)) {
    throw new Error(`Model ${normalizedModel} is not allowed for this endpoint.`);
  }

  return normalizedModel;
};

export const shouldAllowDevAuthBypass = (
  nodeEnv: string | undefined,
  explicitFlag: string | undefined,
): boolean => nodeEnv !== 'production' && explicitFlag === 'true';
