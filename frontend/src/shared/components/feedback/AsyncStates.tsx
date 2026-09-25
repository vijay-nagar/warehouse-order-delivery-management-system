import type { ReactNode } from "react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <div className="module-state" role="status">{label}</div>;
}
export function EmptyState({ label }: { label: string }) {
  return <div className="module-state">{label}</div>;
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="module-alert module-alert-error" role="alert"><span>{message}</span>{onRetry ? <button type="button" onClick={onRetry}>Retry</button> : null}</div>;
}
export function StatusBadge({ children }: { children: ReactNode }) {
  return <span className="module-status">{children}</span>;
}
export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="module-page-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
