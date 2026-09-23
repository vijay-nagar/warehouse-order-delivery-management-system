import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import AdminLayout from "../../layouts/AdminLayout/AdminLayout";
import AuthLayout from "../../layouts/AuthLayout/AuthLayout";
const LoginPage = lazy(() => import("../../features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("../../features/dashboard/pages/DashboardPage"));
const OrdersPage = lazy(() => import("../../features/orders/pages/OrdersPage"));
const WarehousePage = lazy(() => import("../../features/warehouse/pages/WarehousePage"));
const ZonesPage = lazy(() => import("../../features/warehouse/pages/ZonesPage"));
const ShelvesPage = lazy(() => import("../../features/warehouse/pages/ShelvesPage"));
const BinsPage = lazy(() => import("../../features/warehouse/pages/BinsPage"));
const InventoryPage = lazy(() => import("../../features/inventory/pages/InventoryPage"));
const PickingPage = lazy(() => import("../../features/picking/pages/PickingPage"));
const PackingPage = lazy(() => import("../../features/packing/pages/PackingPage"));
const DeliveryPage = lazy(() => import("../../features/delivery/pages/DeliveryPage"));
const CustomersPage = lazy(() => import("../../features/customers/pages/CustomersPage"));
const ProductsPage = lazy(() => import("../../features/products/pages/ProductsPage"));
const NotificationsPage = lazy(() => import("../../features/notifications/pages/NotificationsPage"));
const ReportsPage = lazy(() => import("../../features/reports/pages/ReportsPage"));
const SystemPage = lazy(() => import("../../features/system/pages/SystemPage"));

const load = (Page: React.ComponentType) => <Suspense fallback={<div className="module-state">Loading...</div>}><Page /></Suspense>;

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: load(LoginPage),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: "/",
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
          { path: "/zones", element: load(ZonesPage) },
          { path: "/shelves", element: load(ShelvesPage) },
          { path: "/bins", element: load(BinsPage) },
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
    ],
  },
]);
