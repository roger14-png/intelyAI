import type React from 'react';

export function TrustCard({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <article className="trust-card">
      <div className="trust-card__title">{title}</div>
      {description ? <div className="trust-card__desc">{description}</div> : null}
    </article>
  );
}

