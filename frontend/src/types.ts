export type Role = 'candidate' | 'recruiter' | 'admin' | 'founder';
export type ApplicationStatus = 'applied' | 'reviewing' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected';
export type JobStatus = 'open' | 'closed';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  verified: boolean;
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
  applicantCount?: number;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  coverLetter: string;
  createdAt: string;
  updatedAt: string;
  history: Array<{ id: string; status: ApplicationStatus; changedBy: string; notes: string; createdAt: string }>;
  job?: Job | null;
  candidate?: User | null;
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

export interface Summary {
  userRole: Role;
  counts: {
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
    openJobs: number;
    myApplications: number;
    recruiterJobs: number;
    recruiterApplications: number;
  };
  statusCounts: Record<string, number>;
  recentApplications: Application[];
}
