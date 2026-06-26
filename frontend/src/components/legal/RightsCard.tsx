export function RightsCard({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rights-card">
      <div className="rights-card__title">{title}</div>
      <div className="rights-card__desc">{description}</div>
    </article>
  );
}

