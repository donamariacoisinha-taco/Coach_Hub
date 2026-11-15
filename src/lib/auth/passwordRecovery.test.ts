import { describe, expect, it } from 'vitest';
import {
  PASSWORD_RESET_URL,
  isPasswordRecoveryLocation,
  passwordResetRedirect,
  recoverySessionFromUrl,
} from './passwordRecovery';

describe('password recovery links', () => {
  it('sends the native app email to the public reset page', () => {
    expect(passwordResetRedirect({ native: true, origin: 'https://localhost' })).toBe(PASSWORD_RESET_URL);
  });

  it('keeps the website on its own origin', () => {
    expect(passwordResetRedirect({ native: false, origin: 'https://kyron.uno' })).toBe('https://kyron.uno/');
    expect(passwordResetRedirect({ native: false, origin: 'http://localhost:3000/' })).toBe('http://localhost:3000/');
  });

  it('recognizes the reset path and a recovery hash', () => {
    expect(isPasswordRecoveryLocation({ pathname: '/redefinir-senha', hash: '' })).toBe(true);
    expect(isPasswordRecoveryLocation({
      pathname: '/',
      hash: '#access_token=a&refresh_token=b&type=recovery',
    })).toBe(true);
    expect(isPasswordRecoveryLocation({ pathname: '/dashboard', hash: '' })).toBe(false);
  });

  it('reads the recovery session only when both tokens and the type are present', () => {
    expect(recoverySessionFromUrl('https://kyron.uno/redefinir-senha#access_token=a&refresh_token=b&type=recovery'))
      .toEqual({ access_token: 'a', refresh_token: 'b' });
    expect(recoverySessionFromUrl('https://kyron.uno/redefinir-senha#type=recovery')).toBeNull();
    expect(recoverySessionFromUrl('https://kyron.uno/redefinir-senha')).toBeNull();
  });
});
