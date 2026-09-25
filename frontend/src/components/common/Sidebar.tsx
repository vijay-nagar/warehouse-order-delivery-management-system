import { NavLink } from "react-router-dom";
import { getStoredUser } from "../../features/auth/storage/authStorage";
import { hasRole } from "../../shared/permissions/access";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  label: string;
  path: string;
  roles?: string[];
}

const navigation: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/",
  },
  {
    label: "Picking",
    path: "/picking",
    roles: ["Super Admin", "Warehouse Manager"],
  },
  {
    label: "Packing",
    path: "/packing",
    roles: ["Super Admin", "Warehouse Manager"],
  },
  {
    label: "Delivery",
    path: "/delivery",
    roles: ["Super Admin", "Warehouse Manager"],
  },
  {
    label: "Orders",
    path: "/orders",
    roles: ["Super Admin"],
  },
  {
    label: "Warehouse",
    path: "/warehouses",
    roles: ["Super Admin"],
  },
  {
    label: "Zones",
    path: "/zones",
    roles: ["Super Admin"],
  },
  {
    label: "Shelves",
    path: "/shelves",
    roles: ["Super Admin"],
  },
  {
    label: "Bins",
    path: "/bins",
    roles: ["Super Admin"],
  },
  {
    label: "Inventory",
    path: "/inventory",
    roles: ["Super Admin"],
  },
  {
    label: "Customers",
    path: "/customers",
    roles: ["Super Admin"],
  },
  {
    label: "Products",
    path: "/products",
    roles: ["Super Admin"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    roles: ["Super Admin"],
  },
  {
    label: "Reports",
    path: "/reports",
    roles: ["Super Admin"],
  },
  {
    label: "System",
    path: "/system",
    roles: ["Super Admin"],
  },
];

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const user = getStoredUser();

  const isWarehouseManager = hasRole(user, "Warehouse Manager");

  const visibleNavigation = navigation.filter((item) => {
    if (isWarehouseManager) {
      return (
        item.path === "/" ||
        item.path === "/picking" ||
        item.path === "/packing" ||
        item.path === "/delivery"
      );
    }

    if (!item.roles) {
      return true;
    }

    return item.roles.some((role) => hasRole(user, role));
  });

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
          {visibleNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={
                isWarehouseManager && item.path === "/"
                  ? "/warehouse/dashboard"
                  : item.path
              }
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