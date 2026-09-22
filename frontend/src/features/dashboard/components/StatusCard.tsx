interface StatusCardProps {
  title: string;
  value: number;
  description: string;
}

export default function StatusCard({
  title,
  value,
  description,
}: StatusCardProps) {
  return (
    <div className="dashboard-status-card">
      <div className="dashboard-status-card-top">
        <span>{title}</span>
        <strong>{value.toLocaleString()}</strong>
      </div>

      <p>{description}</p>
    </div>
  );
}
