
import { UserProfile } from '../../types';

/**
 * Checks if a user has administrative privileges.
 * Supports both the requested 'role' field and a fallback to 'is_admin' boolean.
 */
export const isAdmin = (profile: UserProfile | null | undefined): boolean => {
  if (!profile) return false;
  return profile.role === 'admin' || profile.is_admin === true;
};
