import { describe, expect, it } from 'vitest';
import {
  MAX_PROMPT_CHARACTERS,
  MAX_SYSTEM_INSTRUCTION_CHARACTERS,
  getBearerTokenFromHeader,
  resolveAllowedModel,
  sanitizePromptValue,
  shouldAllowDevAuthBypass,
} from './aiSecurity';

describe('AI security helpers', () => {
  it('extracts a valid bearer token case-insensitively', () => {
    expect(getBearerTokenFromHeader('Bearer token-123')).toBe('token-123');
    expect(getBearerTokenFromHeader('bearer token-456')).toBe('token-456');
  });

  it('rejects missing or malformed authorization headers', () => {
    expect(getBearerTokenFromHeader()).toBeNull();
    expect(getBearerTokenFromHeader('Basic abc')).toBeNull();
    expect(getBearerTokenFromHeader('Bearer')).toBeNull();
    expect(getBearerTokenFromHeader('Bearer one two')).toBeNull();
  });

  it('enforces prompt and system instruction limits', () => {
    expect(sanitizePromptValue('ok', 'prompt')).toBe('ok');
    expect(sanitizePromptValue(null, 'prompt')).toBe('');

    expect(() => sanitizePromptValue('x'.repeat(MAX_PROMPT_CHARACTERS + 1), 'prompt'))
      .toThrow(/prompt is too large/i);
    expect(() => sanitizePromptValue(
      'x'.repeat(MAX_SYSTEM_INSTRUCTION_CHARACTERS + 1),
      'systemInstruction',
      MAX_SYSTEM_INSTRUCTION_CHARACTERS,
    )).toThrow(/systemInstruction is too large/i);
  });

  it('allows only the approved Gemini model and its supported alias', () => {
    expect(resolveAllowedModel(undefined)).toBe('gemini-3.5-flash');
    expect(resolveAllowedModel('gemini-3.5-flash')).toBe('gemini-3.5-flash');
    expect(resolveAllowedModel('gemini-3-flash-preview')).toBe('gemini-3.5-flash');
    expect(() => resolveAllowedModel('gemini-pro')).toThrow(/not allowed/i);
  });

  it('never enables the development auth bypass implicitly', () => {
    expect(shouldAllowDevAuthBypass('development', undefined)).toBe(false);
    expect(shouldAllowDevAuthBypass('test', 'false')).toBe(false);
    expect(shouldAllowDevAuthBypass('production', 'true')).toBe(false);
    expect(shouldAllowDevAuthBypass('development', 'true')).toBe(true);
  });
});
