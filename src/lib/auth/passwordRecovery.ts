export const PASSWORD_RESET_PATH = '/redefinir-senha';
export const PASSWORD_RESET_URL = `https://kyron.uno${PASSWORD_RESET_PATH}`;

export function passwordResetRedirect(options: { native: boolean; origin: string }): string {
  if (options.native) return PASSWORD_RESET_URL;
  const origin = options.origin.replace(/\/+$/, '');
  return `${origin}/`;
}

export function isPasswordRecoveryLocation(location: { pathname: string; hash: string }): boolean {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (path === PASSWORD_RESET_PATH) return true;
  return recoverySessionFromUrl(`${path}${location.hash}`) !== null;
}

export function recoverySessionFromUrl(url: string): { access_token: string; refresh_token: string } | null {
  const hashIndex = url.indexOf('#');
  if (hashIndex < 0) return null;
  const params = new URLSearchParams(url.slice(hashIndex + 1));
  if (params.get('type') !== 'recovery') return null;
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { access_token: accessToken, refresh_token: refreshToken };
}
