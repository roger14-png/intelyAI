import React, { useMemo } from 'react';
import type { Application, Job } from '../../types';

function jobMatchColor(score: number) {
  if (score >= 90) return 'match-pill match-pill--excellent';
  if (score >= 75) return 'match-pill match-pill--strong';
  if (score >= 60) return 'match-pill match-pill--moderate';
  return 'match-pill match-pill--weak';
}

export function JobRecommendations({
  jobs,
  applications
}: {
  jobs: Job[];
  applications: Application[];
}) {
  const appliedJobIds = useMemo(() => new Set(applications.map((a) => a.jobId)), [applications]);

  const ranked = useMemo(() => {
    // MVP heuristic: prefer open jobs and slightly prefer those with more skill overlap.
    const skillsToWatch = new Set<string>();
    for (const a of applications) {
      if (a.job?.skills) for (const s of a.job.skills) skillsToWatch.add(s.toLowerCase());
    }

    return jobs
      .filter((j) => j.status === 'open')
      .map((job) => {
        let overlap = 0;
        for (const s of job.skills) if (skillsToWatch.has(s.toLowerCase())) overlap++;
        const base = 55;
        const score = Math.max(40, Math.min(99, base + overlap * 10 + (job.skills.length ? Math.min(10, job.skills.length) : 0)));
        return { job, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [applications, jobs]);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Recommended opportunities</p>
          <h3>Ranked by suitability</h3>
        </div>
      </div>

      <div className="recommendation-list">
        {ranked.length ? (
          ranked.map(({ job, score }) => {
            const alreadyApplied = appliedJobIds.has(job.id);
            return (
              <div className="recommendation-row" key={job.id}>
                <div>
                  <div className="recommendation-row__title">{job.title}</div>
                  <div className="recommendation-row__meta">{job.company} · {job.location}</div>
                  <div className="recommendation-row__tags">
                    {job.skills.slice(0, 5).map((s) => (
                      <span key={s} className="tag">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="recommendation-row__right">
                  <div className={jobMatchColor(score)}>
                    <span className="match-pill__label">Match</span>
                    <span className="match-pill__value">{score}%</span>
                  </div>
                  <div className="recommendation-row__actions">
                    <button className="secondary-button" type="button" disabled={alreadyApplied}>
                      {alreadyApplied ? 'Applied' : 'View job'}
                    </button>
                    <button className="primary-button" type="button" disabled>
                      Generate Application
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="muted">No open opportunities yet.</div>
        )}
      </div>

      <div className="career-legend">
        <div className="career-legend__item"><span className="legend-dot legend-dot--excellent" /> 90%+ Excellent</div>
        <div className="career-legend__item"><span className="legend-dot legend-dot--strong" /> 75%-89% Strong</div>
        <div className="career-legend__item"><span className="legend-dot legend-dot--moderate" /> 60%-74% Moderate</div>
        <div className="career-legend__item"><span className="legend-dot legend-dot--weak" /> Below 60% Weak</div>
      </div>
    </section>
  );
}

