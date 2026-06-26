export type Role = 'candidate' | 'recruiter' | 'admin' | 'founder';
export type ApplicationStatus = 'applied' | 'reviewing' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected';
export type JobStatus = 'open' | 'closed';
export type EmailProvider = 'google' | 'microsoft' | 'smtp';
export type EmailDirection = 'outbound' | 'inbound';
export type EmailDeliveryStatus = 'queued' | 'sent';

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfile {
  userId: string;
  headline: string;
  location: string;
  summary: string;
  cvUrl: string;
  certificates: string[];
  skills: string[];
  education: Array<{ id: string; school: string; degree: string; year: string }>;
  experience: Array<{ id: string; title: string; company: string; years: string; description: string }>;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  description: string;
  skills: string[];
  status: JobStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Job Intelligence (MVP fields)
  verified?: boolean;
  jobTrustScore?: number;
}


export interface ApplicationHistoryEntry {
  id: string;
  status: ApplicationStatus;
  changedBy: string;
  notes: string;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  coverLetter: string;
  createdAt: string;
  updatedAt: string;
  history: ApplicationHistoryEntry[];
}

export interface EmailAccount {
  id: string;
  userId: string;
  provider: EmailProvider;
  emailAddress: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  applicationId?: string | null;
  recipientUserId?: string | null;
  recipientEmail: string;
  provider: EmailProvider | 'system';
  direction: EmailDirection;
  status: EmailDeliveryStatus;
  subject: string;
  body: string;
  createdAt: string;
}

export interface AiInterviewSession {
  id: string;
  applicationId: string;
  interviewerUserId?: string | null;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  questions: Array<{ id: string; prompt: string; maxScore: number }>;
  answers: Array<{ id: string; questionId: string; answer: string; score: number; feedback: string; createdAt: string }>;
}

export type ApplicationDraftStatus = 'generated' | 'user_edited' | 'approved' | 'rejected' | 'sent';

export interface ApplicationDraft {
  id: string;
  jobId: string;
  candidateId: string;
  matchScore: number;
  trustScore: number;
  aiRecommendation: string;
  aiReasons: string[];

  resumeVariantLabel: string;
  resumeCvUrl: string;

  emailTo: string;
  emailSubject: string;
  emailBody: string;
  coverLetterText: string;

  status: ApplicationDraftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRunDraft {
  draftId: string;
  jobId: string;
}

export type AgentRunStatus = 'prepared' | 'approved' | 'rejected';
export type AgentRunMode = 'prepare_only';

export interface AgentRun {
  id: string;
  candidateId: string;
  status: AgentRunStatus;
  mode: AgentRunMode;
  runDrafts: AgentRunDraft[];
  createdAt: string;
  updatedAt: string;
}

export interface DbState {
  users: User[];
  candidateProfiles: CandidateProfile[];
  jobs: Job[];
  applications: Application[];
  emailAccounts: EmailAccount[];
  emailLogs: EmailLog[];
  aiInterviewSessions: AiInterviewSession[];
  applicationDrafts: ApplicationDraft[];
  agentRuns?: AgentRun[];
}



export interface RequestUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

