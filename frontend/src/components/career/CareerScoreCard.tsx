import React from 'react';
import type { Application, CandidateProfile } from '../../types';

function scoreToLabel(score: number) {
  if (score >= 90) return 'Highly Competitive';
  if (score >= 75) return 'Strong Fit';
  if (score >= 60) return 'Developing';
  return 'Needs Improvement';
}

function scoreToColorClass(score: number) {
  if (score >= 90) return 'career-score--excellent';
  if (score >= 75) return 'career-score--strong';
  if (score >= 60) return 'career-score--moderate';
  return 'career-score--weak';
}

function computeEmployabilityScore(profile: CandidateProfile, applications: Application[]) {
  // MVP heuristic until we wire a dedicated backend endpoint.
  // - skills + experience + profile completeness boost
  // - application velocity/positive stages boost
  const skillBoost = Math.min(30, (profile.skills?.length ?? 0) * 4);
  const expBoost = Math.min(30, (profile.experience?.length ?? 0) * 8);
  const completeness = [
    profile.headline,
    profile.location,
    profile.summary,
    profile.cvUrl,
    profile.certificates?.length ? '1' : '',
    profile.education?.length ? '1' : '',
    profile.experience?.length ? '1' : ''
  ].filter(Boolean).length;

  const completenessBoost = Math.min(25, completeness * 4);

  const stageWeight: Record<Application['status'], number> = {
    applied: 10,
    reviewing: 20,
    shortlisted: 45,
    interview: 60,
    offer: 75,
    hired: 90,
    rejected: 0
  };

  const stageScore = applications.reduce((acc, a) => acc + (stageWeight[a.status] ?? 0), 0);
  const stageBoost = Math.min(25, stageScore / Math.max(1, applications.length));

  const raw = 30 + skillBoost + expBoost + completenessBoost * 0.7 + stageBoost * 0.6;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return score;
}

export function CareerScoreCard({
  profile,
  applications
}: {
  profile?: CandidateProfile;
  applications: Application[];
}) {
  const safeProfile =
    profile ?? ({
      userId: '',
      headline: '',
      location: '',
      summary: '',
      cvUrl: '',
      certificates: [],
      skills: [],
      education: [],
      experience: []
    } satisfies CandidateProfile);

  const score = computeEmployabilityScore(safeProfile, applications);
  const label = scoreToLabel(score);

  return (
    <section className="panel panel--careerScore">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Career readiness score</p>
          <h3>Your employability signal</h3>
        </div>
        <div className="career-score-pill">
          <span className="career-score-pill__label">Score</span>
          <span className="career-score-pill__value">{score}%</span>
        </div>
      </div>

      <div className="career-score-row">
        <div className={`career-progress ${scoreToColorClass(score)}`}>
          <div className="career-progress__fill" style={{ width: `${score}%` }} />
        </div>
        <div className="career-score-meta">
          <div className="career-score-meta__label">{label}</div>
          <div className="career-score-meta__hint">Actionable insights below (skill gaps + recommendations).</div>
        </div>
      </div>
    </section>
  );
}

