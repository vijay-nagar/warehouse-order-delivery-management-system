import { request } from "./request";
import type { ResourceRow } from "../../types/api";
import type { LoginRequest, LoginResponse } from "../../types/auth";

type Id = number;
type Body = Record<string, unknown>;
type RowList = ResourceRow[];
type Row = ResourceRow;
const get = <T>(url: string, params?: Record<string, string>) => request<T>({ method: "GET", url, params });
const post = <T>(url: string, data?: unknown) => request<T>({ method: "POST", url, data });
const put = <T>(url: string, data: unknown) => request<T>({ method: "PUT", url, data });
const patch = <T>(url: string, data?: unknown) => request<T>({ method: "PATCH", url, data });
const remove = <T>(url: string) => request<T>({ method: "DELETE", url });

export const authApi = {
  login: (data: LoginRequest) => post<LoginResponse["data"]>("/api/auth/login", data),
  me: () => get<Row>("/api/auth/me"),
};

export const healthApi = {
  health: () => get<Row>("/health"),
  apiHealth: () => get<Row>("/api/health"),
};

export const customersApi = {
  create: (data: Body) => post<Row>("/api/customers", data),
  list: () => get<RowList>("/api/customers"),
  byId: (id: Id) => get<Row>(`/api/customers/${id}`),
  update: (id: Id, data: Body) => put<Row>(`/api/customers/${id}`, data),
  remove: (id: Id) => remove<Row>(`/api/customers/${id}`),
};

export const productsApi = {
  create: (data: Body) => post<Row>("/api/products", data),
  list: () => get<RowList>("/api/products"),
  byId: (id: Id) => get<Row>(`/api/products/${id}`),
  update: (id: Id, data: Body) => put<Row>(`/api/products/${id}`, data),
  remove: (id: Id) => remove<Row>(`/api/products/${id}`),
};

const warehouseResourceApi = (baseUrl: string) => ({
  create: (data: Body) => post<Row>(baseUrl, data),
  list: () => get<RowList>(baseUrl),
  byId: (id: Id) => get<Row>(`${baseUrl}/${id}`),
  update: (id: Id, data: Body) => put<Row>(`${baseUrl}/${id}`, data),
  updateStatus: (id: Id, isActive: boolean) => patch<Row>(`${baseUrl}/${id}/status`, { isActive }),
});
export const warehousesApi = warehouseResourceApi("/api/warehouses");
export const zonesApi = warehouseResourceApi("/api/zones");
export const shelvesApi = warehouseResourceApi("/api/shelves");
export const binsApi = warehouseResourceApi("/api/bins");

export const inventoryApi = {
  create: (data: Body) => post<Row>("/api/inventory", data),
  list: () => get<RowList>("/api/inventory"),
  byId: (id: Id) => get<Row>(`/api/inventory/${id}`),
  update: (id: Id, data: Body) => put<Row>(`/api/inventory/${id}`, data),
  updateStatus: (id: Id, isActive: boolean) => patch<Row>(`/api/inventory/${id}/status`, { isActive }),
  reserve: (orderId: Id) => post<RowList>(`/api/inventory/reservations/${orderId}`),
};
export const inventoryReservationApi = {
  reserve: (orderId: Id) => post<RowList>(`/api/inventory-reservation/${orderId}`),
};
export const inventoryTransactionsApi = {
  stockIn: (data: Body) => post<Row>("/api/inventory-transactions/stock-in", data),
  stockOut: (data: Body) => post<Row>("/api/inventory-transactions/stock-out", data),
  adjustment: (data: Body) => post<Row>("/api/inventory-transactions/adjustment", data),
  history: (inventoryId: Id) => get<RowList>(`/api/inventory-transactions/history/${inventoryId}`),
};

export const ordersApi = {
  create: (data: Body) => post<Row>("/api/orders", data),
  list: () => get<RowList>("/api/orders"),
  byId: (id: Id) => get<Row>(`/api/orders/${id}`),
  cancel: (id: Id) => post<Row>(`/api/orders/${id}/cancel`),
};
export const pickingApi = {
  create: (data: Body) => post<Row>("/api/picking", data),
  list: () => get<RowList>("/api/picking"),
  byId: (id: Id) => get<Row>(`/api/picking/${id}`),
  assign: (id: Id, data: Body) => post<Row>(`/api/picking/${id}/assign`, data),
  start: (id: Id) => post<Row>(`/api/picking/${id}/start`),
  complete: (id: Id, data: Body) => post<Row>(`/api/picking/${id}/complete`, data),
  updateItem: (id: Id, itemId: Id, data: Body) => patch<Row>(`/api/picking/${id}/items/${itemId}`, data),
};
export const packingApi = {
  create: (data: Body) => post<Row>("/api/packing", data),
  list: () => get<RowList>("/api/packing"),
  byId: (id: Id) => get<Row>(`/api/packing/${id}`),
  assign: (id: Id, data: Body) => post<Row>(`/api/packing/${id}/assign`, data),
  start: (id: Id) => post<Row>(`/api/packing/${id}/start`),
  createPackage: (id: Id, data: Body) => post<Row>(`/api/packing/${id}/packages`, data),
  complete: (id: Id, data: Body) => post<Row>(`/api/packing/${id}/complete`, data),
};
export const deliveryApi = {
  create: (data: Body) => post<Row>("/api/delivery", data),
  list: () => get<RowList>("/api/delivery"),
  myDeliveries: () => get<RowList>("/api/delivery/my-deliveries"),
  byId: (id: Id) => get<Row>(`/api/delivery/${id}`),
  assign: (id: Id, data: Body) => post<Row>(`/api/delivery/${id}/assign`, data),
  pickup: (id: Id) => post<Row>(`/api/delivery/${id}/pickup`),
  outForDelivery: (id: Id) => post<Row>(`/api/delivery/${id}/out-for-delivery`),
  addTracking: (id: Id, data: Body) => post<Row>(`/api/delivery/${id}/tracking`, data),
  deliver: (id: Id) => post<Row>(`/api/delivery/${id}/delivered`),
  fail: (id: Id, data: Body) => post<Row>(`/api/delivery/${id}/failed`, data),
  return: (id: Id, data: Body) => post<Row>(`/api/delivery/${id}/returned`, data),
};
export const notificationsApi = {
  mine: () => get<RowList>("/api/notifications/me"),
  unread: () => get<RowList>("/api/notifications/me/unread"),
  markRead: (id: Id) => patch<Row>(`/api/notifications/${id}/read`),
  create: (data: Body) => post<Row>("/api/notifications", data),
};
export const reportsApi = {
  orderSummary: (fromDate?: string, toDate?: string) => get<Row>("/api/reports/orders/summary", { ...(fromDate ? { fromDate } : {}), ...(toDate ? { toDate } : {}) }),
};
export const supportApi = {
  orders: () => get<RowList>("/api/support/orders"),
  orderById: (id: Id) => get<Row>(`/api/support/orders/${id}`),
  cancelOrder: (id: Id) => post<Row>(`/api/support/orders/${id}/cancel`),
  deliveries: () => get<RowList>("/api/support/deliveries"),
  deliveryTracking: (id: Id) => get<RowList>(`/api/support/deliveries/${id}/tracking`),
  deliveryById: (id: Id) => get<Row>(`/api/support/deliveries/${id}`),
  customers: () => get<RowList>("/api/support/customers"),
  customerById: (id: Id) => get<Row>(`/api/support/customers/${id}`),
  updateCustomer: (id: Id, data: Body) => patch<Row>(`/api/support/customers/${id}`, data),
};
