interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon?: string;
  color?: "blue" | "green" | "orange" | "purple" | "red";
}

export default function StatCard({
  title,
  value,
  description,
  icon = "📊",
  color = "blue",
}: StatCardProps) {
  return (
    <article className={`dashboard-stat-card stat-card-${color}`}>
      <div className="dashboard-stat-card-top">
        <div className="stat-card-icon">{icon}</div>

        <span>{title}</span>
      </div>

      <strong>{value}</strong>

      <small>{description}</small>
    </article>
  );
}