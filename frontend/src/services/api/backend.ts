import { request } from "../../shared/api/request";
import type { ResourceRow } from "../../shared/types/api";

export { authApi } from "../../features/auth/api/authApi";
export { customersApi } from "../../features/customers/api/customersApi";
export { deliveryApi } from "../../features/delivery/api/deliveryApi";
export { inventoryApi, inventoryReservationApi, inventoryTransactionsApi } from "../../features/inventory/api/inventoryApi";
export { notificationsApi } from "../../features/notifications/api/notificationsApi";
export { ordersApi } from "../../features/orders/api/ordersApi";
export { packingApi } from "../../features/packing/api/packingApi";
export { pickingApi } from "../../features/picking/api/pickingApi";
export { productsApi } from "../../features/products/api/productsApi";
export { reportsApi } from "../../features/reports/api/reportsApi";
export { healthApi } from "../../features/system/api/healthApi";
export { binsApi, shelvesApi, warehousesApi, zonesApi } from "../../features/warehouse/api/warehouseApi";

type Body = Record<string, unknown>;
const get = <T>(url: string) => request<T>({ method: "GET", url });
const post = <T>(url: string) => request<T>({ method: "POST", url });
const patch = <T>(url: string, data: unknown) => request<T>({ method: "PATCH", url, data });

// No support feature page exists. Retain this verified API export as a compatibility boundary.
export const supportApi = {
  orders: () => get<ResourceRow[]>("/api/support/orders"),
  orderById: (id: number) => get<ResourceRow>(`/api/support/orders/${id}`),
  cancelOrder: (id: number) => post<ResourceRow>(`/api/support/orders/${id}/cancel`),
  deliveries: () => get<ResourceRow[]>("/api/support/deliveries"),
  deliveryTracking: (id: number) => get<ResourceRow[]>(`/api/support/deliveries/${id}/tracking`),
  deliveryById: (id: number) => get<ResourceRow>(`/api/support/deliveries/${id}`),
  customers: () => get<ResourceRow[]>("/api/support/customers"),
  customerById: (id: number) => get<ResourceRow>(`/api/support/customers/${id}`),
  updateCustomer: (id: number, data: Body) => patch<ResourceRow>(`/api/support/customers/${id}`, data),
};
