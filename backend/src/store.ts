import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Application, CandidateProfile, DbState, EmailAccount, EmailLog, Job, Role, User } from './types.js';

const dataFile = path.resolve(process.cwd(), 'data', 'db.json');
export const uploadsDir = path.resolve(process.cwd(), 'uploads');

const demoPassword = 'Passw0rd!';

const now = () => new Date().toISOString();

async function seedUsers(): Promise<User[]> {
  const people = [
    { fullName: 'Amina Recruiter', email: 'recruiter@intelyhire.dev', role: 'recruiter' as Role },
    { fullName: 'Olivia Admin', email: 'admin@intelyhire.dev', role: 'admin' as Role },
    { fullName: 'Noah Founder', email: 'founder@intelyhire.dev', role: 'founder' as Role }
  ];

  return Promise.all(
    people.map(async (person) => ({
      id: crypto.randomUUID(),
      fullName: person.fullName,
      email: person.email,
      passwordHash: await bcrypt.hash(demoPassword, 10),
      role: person.role,
      verified: true,
      createdAt: now(),
      updatedAt: now()
    }))
  );
}

async function createDefaultState(): Promise<DbState> {
  return {
    users: await seedUsers(),
    candidateProfiles: [],
    jobs: [
      {
        id: crypto.randomUUID(),
        title: 'Full Stack Developer',
        company: 'IntelyHire',
        location: 'Remote',
        employmentType: 'Full-time',
        description: 'Build the candidate portal, recruiter workflow, and hiring dashboard.',
        skills: ['TypeScript', 'React', 'Node.js'],
        status: 'open',
        createdBy: 'system',
        createdAt: now(),
        updatedAt: now()
      }
    ],
    applications: [],
    emailAccounts: [],
    emailLogs: [],
    aiInterviewSessions: [],
    applicationDrafts: []
  };
}



export async function loadState(): Promise<DbState> {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await mkdir(uploadsDir, { recursive: true });


  try {
    const raw = await readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DbState>;
    const normalized = {
      users: parsed.users ?? [],
      candidateProfiles: parsed.candidateProfiles ?? [],
      jobs: parsed.jobs ?? [],
      applications: parsed.applications ?? [],
      emailAccounts: parsed.emailAccounts ?? [],
      emailLogs: parsed.emailLogs ?? [],
      aiInterviewSessions: parsed.aiInterviewSessions ?? [],
      applicationDrafts: (parsed as any).applicationDrafts ?? []
    };


    if (
      normalized.users.length === 0 &&
      normalized.candidateProfiles.length === 0 &&
      normalized.jobs.length === 0 &&
      normalized.applications.length === 0 &&
      normalized.emailAccounts.length === 0 &&
      normalized.emailLogs.length === 0
    ) {
      const seeded = await createDefaultState();
      await saveState(seeded);
      return seeded;
    }

    return normalized;
  } catch {
    const state = await createDefaultState();
    await saveState(state);
    return state;
  }
}

export async function saveState(state: DbState): Promise<void> {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

export function createEmptyCandidateProfile(userId: string): CandidateProfile {
  return {
    userId,
    headline: '',
    location: '',
    summary: '',
    cvUrl: '',
    certificates: [],
    skills: [],
    education: [],
    experience: []
  };
}

export function createApplicationHistoryEntry(status: Application['status'], changedBy: string, notes: string) {
  return {
    id: crypto.randomUUID(),
    status,
    changedBy,
    notes,
    createdAt: now()
  };
}

export function createEmailLog(entry: {
  applicationId?: string | null;
  recipientUserId?: string | null;
  recipientEmail: string;
  provider: EmailAccount['provider'] | 'system';
  direction: EmailLog['direction'];
  subject: string;
  body: string;
  status?: EmailLog['status'];
}): EmailLog {
  return {
    id: crypto.randomUUID(),
    applicationId: entry.applicationId ?? null,
    recipientUserId: entry.recipientUserId ?? null,
    recipientEmail: entry.recipientEmail,
    provider: entry.provider,
    direction: entry.direction,
    status: entry.status ?? 'queued',
    subject: entry.subject,
    body: entry.body,
    createdAt: now()
  };
}