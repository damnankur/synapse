import type { PlatformProfile, User } from '../types';
import { apiRequest } from './api';
import { getStoredAccessToken } from './auth';

export interface CurrentUserResponse {
  user: User;
  permissions?: string[];
}

export interface PlatformProfileResponse {
  profile: PlatformProfile;
}

export async function getCurrentUserProfile(token?: string): Promise<CurrentUserResponse> {
  const accessToken = token || getStoredAccessToken();
  if (!accessToken) throw new Error('No access token available.');

  return apiRequest('/users/me', { method: 'GET' }, accessToken);
}

export async function updateCurrentUserProfile(
  payload: Partial<User>,
  token?: string
): Promise<CurrentUserResponse> {
  const accessToken = token || getStoredAccessToken();
  if (!accessToken) throw new Error('No access token available.');

  return apiRequest(
    '/users/me',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    accessToken
  );
}

export async function fetchPlatformProfile(
  userId: string,
  projectId?: string,
  token?: string
): Promise<PlatformProfileResponse> {
  const accessToken = token || getStoredAccessToken();
  if (!accessToken) throw new Error('No access token available.');

  const encodedUserId = encodeURIComponent(userId);
  const query = new URLSearchParams();
  if (projectId) query.set('projectId', projectId);

  return apiRequest(
    `/users/${encodedUserId}/platform-profile${query.toString() ? `?${query.toString()}` : ''}`,
    { method: 'GET' },
    accessToken
  );
}
