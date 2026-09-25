import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import AdminLayout from "../layouts/AdminLayout";
import AuthLayout from "../layouts/AuthLayout";
import WarehouseManagerLayout from "../layouts/WarehouseManagerLayout";

import DeliveryBoyLayout from "../../features/delivery/components/delivery-boy/DeliveryBoyLayout";
import { getStoredUser } from "../../features/auth/storage/authStorage";
import { hasRole } from "../../shared/permissions/access";

// ==========================================
// AUTH
// ==========================================

const LoginPage = lazy(
  () => import("../../features/auth/pages/LoginPage"),
);

// ==========================================
// ADMIN PAGES
// ==========================================

const DashboardPage = lazy(
  () => import("../../features/dashboard/pages/DashboardPage"),
);

const OrdersPage = lazy(
  () => import("../../features/orders/pages/OrdersPage"),
);

const WarehousePage = lazy(
  () => import("../../features/warehouse/pages/WarehousePage"),
);

const ZonesPage = lazy(
  () => import("../../features/warehouse/pages/ZonesPage"),
);

const ShelvesPage = lazy(
  () => import("../../features/warehouse/pages/ShelvesPage"),
);

const BinsPage = lazy(
  () => import("../../features/warehouse/pages/BinsPage"),
);

const InventoryPage = lazy(
  () => import("../../features/inventory/pages/InventoryPage"),
);

const PickingPage = lazy(
  () => import("../../features/picking/pages/PickingPage"),
);

const PackingPage = lazy(
  () => import("../../features/packing/pages/PackingPage"),
);

const DeliveryPage = lazy(
  () => import("../../features/delivery/pages/DeliveryPage"),
);

const CustomersPage = lazy(
  () => import("../../features/customers/pages/CustomersPage"),
);

const ProductsPage = lazy(
  () => import("../../features/products/pages/ProductsPage"),
);

const NotificationsPage = lazy(
  () =>
    import("../../features/notifications/pages/NotificationsPage"),
);

const ReportsPage = lazy(
  () => import("../../features/reports/pages/ReportsPage"),
);

const SystemPage = lazy(
  () => import("../../features/system/pages/SystemPage"),
);

// ==========================================
// WAREHOUSE MANAGER
// ==========================================

const WarehouseManagerDashboardPage = lazy(
  () =>
    import(
      "../../features/dashboard/pages/WarehouseManagerDashboardPage"
    ),
);

// ==========================================
// DELIVERY BOY PAGES
// ==========================================

const DeliveryBoyDashboardPage = lazy(
  () =>
    import(
      "../../features/delivery/pages/DeliveryBoyDashboardPage"
    ),
);

const MyDeliveriesPage = lazy(
  () =>
    import(
      "../../features/delivery/pages/delivery-boy/MyDeliveriesPage"
    ),
);

const DeliveryRoutePage = lazy(
  () =>
    import(
      "../../features/delivery/pages/delivery-boy/DeliveryRoutePage"
    ),
);

const DeliveryNotificationsPage = lazy(
  () =>
    import(
      "../../features/delivery/pages/delivery-boy/DeliveryNotificationsPage"
    ),
);

const DeliveryProfilePage = lazy(
  () =>
    import(
      "../../features/delivery/pages/delivery-boy/DeliveryProfilePage"
    ),
);

// ==========================================
// LAZY PAGE LOADER
// ==========================================

const load = (Page: React.ComponentType) => (
  <Suspense
    fallback={
      <div className="module-state">
        Loading...
      </div>
    }
  >
    <Page />
  </Suspense>
);

// ==========================================
// WORKSPACE REDIRECT
// ==========================================

function WorkspaceRedirect() {
  const user = getStoredUser();

  if (hasRole(user, "Warehouse Manager")) {
    return <Navigate to="/warehouse/dashboard" replace />;
  }

  if (hasRole(user, "Delivery Boy")) {
    return <Navigate to="/delivery-boy" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
}

// ==========================================
// ROUTER
// ==========================================

export const router = createBrowserRouter([
  // ========================================
  // AUTH
  // ========================================

  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: load(LoginPage),
      },
    ],
  },

  // ========================================
  // PROTECTED APPLICATION
  // ========================================

  {
    element: <ProtectedRoute />,

    children: [
      // ======================================
      // ROOT WORKSPACE REDIRECT
      // ======================================

      {
        path: "/",
        element: <WorkspaceRedirect />,
      },

      // ======================================
      // ADMIN APPLICATION
      // ======================================

      {
        element: <AdminLayout />,

        children: [
          {
            path: "/admin/dashboard",
            element: load(DashboardPage),
          },

          {
            path: "/orders",
            element: load(OrdersPage),
          },

          {
            path: "/warehouses",
            element: load(WarehousePage),
          },

          {
            path: "/zones",
            element: load(ZonesPage),
          },

          {
            path: "/shelves",
            element: load(ShelvesPage),
          },

          {
            path: "/bins",
            element: load(BinsPage),
          },

          {
            path: "/inventory",
            element: load(InventoryPage),
          },

          {
            path: "/picking",
            element: load(PickingPage),
          },

          {
            path: "/packing",
            element: load(PackingPage),
          },

          {
            path: "/delivery",
            element: load(DeliveryPage),
          },

          {
            path: "/customers",
            element: load(CustomersPage),
          },

          {
            path: "/products",
            element: load(ProductsPage),
          },

          {
            path: "/notifications",
            element: load(NotificationsPage),
          },

          {
            path: "/reports",
            element: load(ReportsPage),
          },

          {
            path: "/system",
            element: load(SystemPage),
          },
        ],
      },

      // ======================================
      // WAREHOUSE MANAGER APPLICATION
      // ======================================

      {
        element: <WarehouseManagerLayout />,

        children: [
          {
            path: "/warehouse/dashboard",
            element: load(WarehouseManagerDashboardPage),
          },

          {
            path: "/warehouse/picking",
            element: load(PickingPage),
          },

          {
            path: "/warehouse/packing",
            element: load(PackingPage),
          },

          {
            path: "/warehouse/delivery",
            element: load(DeliveryPage),
          },
        ],
      },

      // ======================================
      // DELIVERY BOY APPLICATION
      // ======================================

      {
        element: <DeliveryBoyLayout />,

        children: [
          {
            path: "/delivery-boy",
            element: load(DeliveryBoyDashboardPage),
          },

          {
            path: "/delivery-boy/deliveries",
            element: load(MyDeliveriesPage),
          },

          {
            path: "/delivery-boy/route",
            element: load(DeliveryRoutePage),
          },

          {
            path: "/delivery-boy/notifications",
            element: load(
              DeliveryNotificationsPage,
            ),
          },

          {
            path: "/delivery-boy/profile",
            element: load(DeliveryProfilePage),
          },
        ],
      },
    ],
  },
]);