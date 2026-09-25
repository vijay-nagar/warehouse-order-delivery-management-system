import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSession } from "../../../auth/hooks/useSession";
import { clearAuth } from "../../../auth/storage/authStorage";

const navigation = [
  { label: "Dashboard", path: "/delivery-boy" },
  { label: "My Deliveries", path: "/delivery-boy/deliveries" },
  { label: "Route", path: "/delivery-boy/route" },
  { label: "Notifications", path: "/delivery-boy/notifications" },
  { label: "Profile", path: "/delivery-boy/profile" },
];

export default function DeliveryBoyLayout() {
  const user = useSession();
  const navigate = useNavigate();

  const logout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="delivery-boy-app">
      <aside className="delivery-boy-sidebar">
        <div className="delivery-boy-brand">
          <div className="delivery-boy-brand-icon">W</div>

          <div>
            <strong>Warehouse OMS</strong>
            <span>Delivery Partner</span>
          </div>
        </div>

        <nav className="delivery-boy-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/delivery-boy"}
              className={({ isActive }) =>
                `delivery-boy-nav-item ${
                  isActive ? "delivery-boy-nav-item-active" : ""
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="delivery-boy-sidebar-bottom">
          <div className="delivery-boy-user-mini">
            <div className="delivery-boy-avatar">
              {user?.username?.charAt(0).toUpperCase() || "D"}
            </div>

            <div>
              <strong>{user?.username || "Delivery Partner"}</strong>
              <span>Delivery Boy</span>
            </div>
          </div>

          <button
            type="button"
            className="delivery-boy-logout"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="delivery-boy-main">
        <header className="delivery-boy-header">
          <div>
            <span className="delivery-boy-header-label">
              Delivery Partner
            </span>

            <h1>Welcome back, {user?.username || "Delivery Partner"}</h1>
          </div>

          <div className="delivery-boy-online">
            <span />
            Online
          </div>
        </header>

        <section className="delivery-boy-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}