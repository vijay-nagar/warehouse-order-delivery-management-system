interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
}

export default function StatCard({
  title,
  value,
  description,
}: StatCardProps) {
  return (
    <article className="dashboard-stat-card">
      <div className="dashboard-stat-card-top">
        <span>{title}</span>
      </div>

      <strong>{value}</strong>

      <small>{description}</small>
    </article>
  );
}
