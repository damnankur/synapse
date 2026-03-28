import type { ActiveProject, ArchivedProject, PendingApplication, Project } from '../types';
import { apiRequest } from './api';
import { getStoredAccessToken, type AuthUser } from './auth';

export interface ProjectListParams {
  q?: string;
  domain?: string;
  page?: number;
  limit?: number;
}

export interface ProjectListResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateProjectPayload {
  title: string;
  domain: string;
  requiredRoles: string[];
  description: string;
  tags: string[];
}

export interface CreateProjectResponse {
  project: Project;
  user: AuthUser;
  tokenDelta: number;
}

export interface ActiveProjectsResponse {
  projects: ActiveProject[];
}

export interface ArchiveProjectsResponse {
  projects: ArchivedProject[];
}

export interface PendingApplicationsResponse {
  applications: PendingApplication[];
}

export interface ApplyToProjectResponse {
  applicationId: string;
  project: Project;
  user: AuthUser;
  tokenDelta: number;
  status: string;
}

export async function fetchProjects(params: ProjectListParams): Promise<ProjectListResponse> {
  const query = new URLSearchParams();

  if (params.q) query.set('q', params.q);
  if (params.domain && params.domain !== 'All') query.set('domain', params.domain);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  return apiRequest(`/projects?${query.toString()}`, { method: 'GET' });
}

export async function createProject(payload: CreateProjectPayload): Promise<CreateProjectResponse> {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest(
    '/projects',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function fetchActiveProjects(): Promise<ActiveProjectsResponse> {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest('/projects/active', { method: 'GET' }, token);
}

export async function fetchArchivedProjects(): Promise<ArchiveProjectsResponse> {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest('/projects/archive', { method: 'GET' }, token);
}

export async function fetchPendingApplications(): Promise<PendingApplicationsResponse> {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest('/projects/applications/pending', { method: 'GET' }, token);
}

export async function applyToProject(projectId: string): Promise<ApplyToProjectResponse> {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest(`/projects/${projectId}/apply`, { method: 'POST' }, token);
}

export async function submitRoleCompletion(projectId: string, applicationId: string, note = '') {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest(
    `/projects/${projectId}/applications/${applicationId}/submit`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
    token
  );
}

export async function approveRoleCompletion(projectId: string, applicationId: string, note = '') {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest(
    `/projects/${projectId}/applications/${applicationId}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
    token
  );
}

export async function reviewProjectApplication(
  projectId: string,
  applicationId: string,
  action: 'accept' | 'reject',
  payload: { note?: string; assignedRole?: string } = {}
) {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest(
    `/projects/${projectId}/applications/${applicationId}/review`,
    {
      method: 'POST',
      body: JSON.stringify({ action, ...payload }),
    },
    token
  );
}

export async function resetRoleSubmission(projectId: string, applicationId: string, note = '') {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest(
    `/projects/${projectId}/applications/${applicationId}/reset`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
    token
  );
}

export async function removeProjectContributor(projectId: string, applicationId: string, note = '') {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest(
    `/projects/${projectId}/applications/${applicationId}/remove`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
    token
  );
}

export async function leaveProject(projectId: string, note = '') {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest(
    `/projects/${projectId}/leave`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
    token
  );
}

export async function completeOwnedProject(projectId: string, note = '') {
  const token = getStoredAccessToken();
  if (!token) throw new Error('No access token available.');

  return apiRequest(
    `/projects/${projectId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
    token
  );
}
