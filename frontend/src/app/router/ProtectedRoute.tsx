import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../../features/auth/hooks/useSession";

export default function ProtectedRoute() {
  const location = useLocation();
  const user = useSession();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
