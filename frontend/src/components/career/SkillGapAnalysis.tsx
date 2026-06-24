import React from 'react';
import type { CandidateProfile } from '../../types';

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function SkillGapAnalysis({ profile }: { profile: CandidateProfile }) {
  const technical = ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'AWS', 'CI/CD'];
  const strengths = unique(profile.skills ?? []);

  const strengthPresent = (name: string) => strengths.some((s) => s.toLowerCase().includes(name.toLowerCase()));
  const gaps = technical.filter((t) => !strengthPresent(t));

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Skill gap analysis</p>
          <h3>What to learn next</h3>
        </div>
      </div>

      <div className="career-grid-2">
        <div className="career-card">
          <div className="career-card__title">Strengths</div>
          <div className="pill-row">
            {(strengths.length ? strengths.slice(0, 8) : ['Add skills to get insights']).map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>

        <div className="career-card">
          <div className="career-card__title">Skill gaps</div>
          <div className="pill-row">
            {(gaps.length ? gaps.slice(0, 6) : ['No gaps detected in this MVP heuristic']).map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="career-reco-list">
        <div className="career-reco-list__title">AI recommendations</div>
        <ul className="career-reco-list__items">
          {gaps.slice(0, 2).map((g) => (
            <li key={g}>Complete {g} practitioner path</li>
          ))}
          {gaps.length < 2 ? (
            <li>Build a portfolio project aligned to your target roles</li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

