import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import AdminLayout from "../../layouts/AdminLayout/AdminLayout";
import AuthLayout from "../../layouts/AuthLayout/AuthLayout";
import LoginPage from "../../features/auth/pages/LoginPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import OrdersPage from "../../features/orders/pages/OrdersPage";
import WarehousePage from "../../features/warehouse/pages/WarehousePage";
import InventoryPage from "../../features/inventory/pages/InventoryPage";
import PickingPage from "../../features/picking/pages/PickingPage";
import PackingPage from "../../features/packing/pages/PackingPage";
import DeliveryPage from "../../features/delivery/pages/DeliveryPage";
import CustomersPage from "../../features/customers/pages/CustomersPage";
import ProductsPage from "../../features/products/pages/ProductsPage";
import NotificationsPage from "../../features/notifications/pages/NotificationsPage";
import ReportsPage from "../../features/reports/pages/ReportsPage";
import SystemPage from "../../features/system/pages/SystemPage";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
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
            element: <DashboardPage />,
          },
          {
            path: "/orders",
            element: <OrdersPage />,
          },
          {
            path: "/warehouses",
            element: <WarehousePage />,
          },
          {
            path: "/inventory",
            element: <InventoryPage />,
          },
          {
            path: "/picking",
            element: <PickingPage />,
          },
          {
            path: "/packing",
            element: <PackingPage />,
          },
          {
            path: "/delivery",
            element: <DeliveryPage />,
          },
          {
            path: "/customers",
            element: <CustomersPage />,
          },
          {
            path: "/products",
            element: <ProductsPage />,
          },
          {
            path: "/notifications",
            element: <NotificationsPage />,
          },
          {
            path: "/reports",
            element: <ReportsPage />,
          },
          {
            path: "/system",
            element: <SystemPage />,
          },
        ],
      },
    ],
  },
]);
