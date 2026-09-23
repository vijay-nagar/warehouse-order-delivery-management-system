import { NavLink } from "react-router-dom";
import { getStoredUser } from "../../services/storage/authStorage";
import { hasRole } from "../../permissions/access";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation: Array<{ label: string; path: string; roles?: string[] }> = [
  { label: "Dashboard", path: "/" },
  { label: "Orders", path: "/orders" },
  { label: "Warehouse", path: "/warehouses" },
  { label: "Zones", path: "/zones" },
  { label: "Shelves", path: "/shelves" },
  { label: "Bins", path: "/bins" },
  { label: "Inventory", path: "/inventory" },
  { label: "Picking", path: "/picking" },
  { label: "Packing", path: "/packing" },
  { label: "Delivery", path: "/delivery" },
  { label: "Customers", path: "/customers" },
  { label: "Products", path: "/products" },
  { label: "Notifications", path: "/notifications" },
  { label: "Reports", path: "/reports" },
  { label: "System", path: "/system" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = getStoredUser();
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">W</span>

          <div className="sidebar-brand-text">
            <strong>Warehouse OMS</strong>
            <small>Order & Delivery</small>
          </div>

          <button
            type="button"
            className="sidebar-close"
            aria-label="Close navigation"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.filter((item) => !item.roles || item.roles.some((role) => hasRole(user, role))).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
