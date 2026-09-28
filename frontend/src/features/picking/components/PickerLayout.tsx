import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useSession } from "../../auth/hooks/useSession";
import { clearAuth } from "../../auth/storage/authStorage";
import { hasRole } from "../../../shared/permissions/access";
import "../picker.css";

const navigation = [
  { label: "Dashboard", path: "/picker/dashboard" },
  { label: "My Tasks", path: "/picker/tasks" },
  { label: "History", path: "/picker/history" },
];

export default function PickerLayout() {
  const user = useSession();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(user, "Picker")) {
    return <Navigate to="/" replace />;
  }

  const logout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="picker-app">
      <aside className="picker-sidebar">
        <div className="picker-brand">
          <div className="picker-brand-mark">W</div>
          <div>
            <strong>Warehouse OMS</strong>
            <span>Picker Operations</span>
          </div>
        </div>

        <nav className="picker-nav" aria-label="Picker navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/picker/dashboard"}
              className={({ isActive }) =>
                `picker-nav-item ${isActive ? "picker-nav-item-active" : ""}`
              }
            >
              <span className="picker-nav-dot" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="picker-sidebar-bottom">
          <div className="picker-user-mini">
            <div className="picker-avatar">
              {user.username?.charAt(0).toUpperCase() || "P"}
            </div>
            <div className="picker-user-copy">
              <strong>{user.username || "Picker"}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          <button
            type="button"
            className="picker-logout"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="picker-main">
        <header className="picker-header">
          <div>
            <span className="picker-header-label">PICKER WORKSPACE</span>
            <h1>Welcome back, {user.username || "Picker"}</h1>
          </div>

          <div className="picker-online">
            <span />
            Active
          </div>
        </header>

        <section className="picker-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
