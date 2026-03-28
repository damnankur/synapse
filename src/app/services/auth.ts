import { apiRequest } from './api';
import type { User as AppUser } from '../types';

export type AuthUser = Pick<AppUser, 'id' | 'name' | 'role'> &
  Partial<Omit<AppUser, 'id' | 'name' | 'role'>> & {
    email: string;
  };

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  permissions: string[];
}

export interface CurrentUserResponse {
  user: AuthUser;
  permissions: string[];
}

interface AuthPayload {
  name?: string;
  email: string;
  password: string;
}

const ACCESS_TOKEN_KEY = 'synapse_access_token';
const REFRESH_TOKEN_KEY = 'synapse_refresh_token';
const SESSION_USER_KEY = 'synapse_session_user';
const PERMISSIONS_KEY = 'synapse_permissions';

export function getStoredAccessToken(): string {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
    ''
  );
}

export function clearStoredSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);

  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
  sessionStorage.removeItem(PERMISSIONS_KEY);
}

export function persistSession(session: AuthSession, persistInLocalStorage: boolean) {
  const primary = persistInLocalStorage ? localStorage : sessionStorage;
  const secondary = persistInLocalStorage ? sessionStorage : localStorage;

  primary.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  primary.setItem(REFRESH_TOKEN_KEY, session.refreshToken || '');
  primary.setItem(SESSION_USER_KEY, JSON.stringify(session.user || {}));
  primary.setItem(PERMISSIONS_KEY, JSON.stringify(session.permissions || []));

  secondary.removeItem(ACCESS_TOKEN_KEY);
  secondary.removeItem(REFRESH_TOKEN_KEY);
  secondary.removeItem(SESSION_USER_KEY);
  secondary.removeItem(PERMISSIONS_KEY);
}

export async function registerWithPassword(payload: AuthPayload): Promise<AuthSession> {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginWithPassword(payload: AuthPayload): Promise<AuthSession> {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCurrentUser(token?: string): Promise<CurrentUserResponse> {
  const authToken = token || getStoredAccessToken();
  if (!authToken) throw new Error('No access token available.');
  return apiRequest('/auth/me', { method: 'GET' }, authToken);
}
