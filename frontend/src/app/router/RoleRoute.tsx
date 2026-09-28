import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../../features/auth/hooks/useSession";
import { hasRole } from "../../shared/permissions/access";

interface RoleRouteProps {
  allow: string[];
}

// Route-level authorization gate: hides manager-only or worker-only pages
// from roles that shouldn't reach them by direct URL navigation. The
// backend is still the real enforcement boundary (every mutating request
// is re-checked there); this only keeps the UI honest about who a page is
// for.
export default function RoleRoute({ allow }: RoleRouteProps) {
  const user = useSession();

  if (!allow.some((role) => hasRole(user, role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
