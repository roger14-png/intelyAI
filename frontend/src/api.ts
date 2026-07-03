import type { Application, ApplicationDraft, CandidateProfile, Job, Summary, SubscriptionPlan, User } from './types';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const tokenKey = 'intelyhire-token';

export function getToken(): string | null {
  return localStorage.getItem(tokenKey);
}

export function setToken(token: string): void {
  localStorage.setItem(tokenKey, token);
}

export function clearToken(): void {
  localStorage.removeItem(tokenKey);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function login(payload: { email: string; password: string }) {
  return request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function register(payload: { fullName: string; email: string; password: string; role: 'candidate' | 'recruiter' | 'admin' | 'founder'; plan?: SubscriptionPlan }) {
  return request<{ token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function me() {
  return request<{ user: User }>('/auth/me');
}

export async function summary() {
  return request<Summary>('/dashboard/summary');
}

export async function profile() {
  return request<{ profile: CandidateProfile }>('/candidate/profile');
}

export async function saveProfile(profileData: CandidateProfile) {
  return request<{ profile: CandidateProfile }>('/candidate/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
}

export async function uploadCv(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${baseUrl}/candidate/profile/cv`, {
    method: 'POST',
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : undefined,
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error ?? 'Upload failed');
  }

  return response.json() as Promise<{ fileUrl: string; profile: CandidateProfile }>;
}

export async function jobs() {
  return request<{ jobs: Job[] }>('/jobs');
}

export async function createJob(payload: Pick<Job, 'title' | 'company' | 'location' | 'employmentType' | 'description' | 'skills' | 'qualifications' | 'merits'>) {
  return request<{ job: Job }>('/jobs', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function toggleJobStatus(jobId: string, status: 'open' | 'closed') {
  return request<{ job: Job }>(`/jobs/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function applyToJob(jobId: string, coverLetter = '') {
  return request<{ application: Application }>(`/jobs/${jobId}/apply`, {
    method: 'POST',
    body: JSON.stringify({ coverLetter })
  });
}

export async function applications() {
  return request<{ applications: Application[] }>('/applications');
}

export async function updateApplicationStatus(applicationId: string, status: Application['status'], notes = '') {
  return request<{ application: Application }>(`/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes })
  });
}

export async function matchScore(jobId: string, candidateId?: string) {
  return request<{ candidate: string; job: string; score: number; missing_skills: string[]; reasons: string[]; recommendation: string }>(
    `/ai/match?jobId=${encodeURIComponent(jobId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ candidateId })
    }
  );
}

export async function trustScore(jobId?: string, candidateId?: string) {
  return request<{ candidate: string; job: string | null; trust_score: number; level: string; risks: string[] }>('/ai/trust', {
    method: 'POST',
    body: JSON.stringify({ jobId, candidateId })
  });
}

export async function startInterview(applicationId: string) {
  return request<{ sessionId: string; questions: Array<{ id: string; prompt: string; maxScore: number }> }>(
    '/ai/interview/start',
    {
      method: 'POST',
      body: JSON.stringify({ applicationId })
    }
  );
}

export async function answerInterview(payload: { sessionId: string; questionId: string; answer: string }) {
  return request<{ score: number; feedback: string; sessionStatus: string }>('/ai/interview/answer', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function autoApply(payload?: { jobIds?: string[]; limit?: number }) {
  return request<{ appliedCount: number; appliedApplications: any[] }>('/ai/auto-apply/run', {
    method: 'POST',
    body: JSON.stringify({ ...(payload ?? {}), confirm: true })
  });
}

// -----------------------------
// Human Approval Mode APIs
// -----------------------------

export async function applicationDrafts() {
  return request<{ drafts: ApplicationDraft[] }>('/application-packages');
}

export async function generateApplicationPackage(jobId: string) {
  return request<{ draft: ApplicationDraft }>('/ai/application-packages/generate', {
    method: 'POST',
    body: JSON.stringify({ jobId })
  });
}

export async function updateApplicationPackageDraft(
  draftId: string,
  payload: { emailSubject?: string; emailBody?: string; coverLetterText?: string }
) {
  return request<{ draft: ApplicationDraft }>(`/application-packages/${draftId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function approveApplicationPackageDraft(draftId: string) {
  return request<{ application: Application; draft: ApplicationDraft }>(`/application-packages/${draftId}/approve`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function rejectApplicationPackageDraft(draftId: string) {
  return request<{ draft: ApplicationDraft }>(`/application-packages/${draftId}/reject`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

