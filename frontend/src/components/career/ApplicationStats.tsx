import React from 'react';
import type { Application } from '../../types';

function countByStatus(applications: Application[]) {
  const map: Record<Application['status'], number> = {
    applied: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    offer: 0,
    hired: 0,
    rejected: 0
  };

  for (const a of applications) map[a.status] = (map[a.status] ?? 0) + 1;
  return map;
}

export function ApplicationStats({ applications }: { applications: Application[] }) {
  const counts = countByStatus(applications);

  const topRow = [
    { label: 'Applications', value: applications.length },
    { label: 'Interviews', value: counts.interview + (counts.offer > 0 ? 1 : 0) },
    { label: 'Offers', value: counts.offer },
    { label: 'Hired', value: counts.hired }
  ];

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Application pipeline</p>
          <h3>Progress you can feel</h3>
        </div>
      </div>

      <div className="stats-grid stats-grid--career">
        {topRow.map((s) => (
          <div key={s.label} className="stat-card">
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

