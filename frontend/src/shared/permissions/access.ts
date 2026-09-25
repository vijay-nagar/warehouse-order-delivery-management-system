import type { AuthUser } from "../../features/auth/types";

export type Permission =
  | "AUTH_VIEW_PROFILE" | "ORDER_CREATE" | "ORDER_VIEW" | "ORDER_VIEW_DETAILS" | "ORDER_CANCEL"
  | "CUSTOMER_CREATE" | "CUSTOMER_VIEW" | "CUSTOMER_UPDATE" | "CUSTOMER_DELETE"
  | "PRODUCT_CREATE" | "PRODUCT_VIEW" | "PRODUCT_UPDATE" | "PRODUCT_DELETE"
  | "WAREHOUSE_CREATE" | "WAREHOUSE_VIEW" | "WAREHOUSE_UPDATE" | "WAREHOUSE_STATUS_UPDATE"
  | "INVENTORY_CREATE" | "INVENTORY_VIEW" | "INVENTORY_UPDATE" | "INVENTORY_STATUS_UPDATE"
  | "PICKING_CREATE" | "PICKING_VIEW" | "PICKING_ASSIGN" | "PICKING_START" | "PICKING_COMPLETE" | "PICKING_UPDATE_ITEM"
  | "PACKING_CREATE" | "PACKING_VIEW" | "PACKING_ASSIGN" | "PACKING_START" | "PACKING_CREATE_PACKAGE" | "PACKING_COMPLETE"
  | "DELIVERY_CREATE" | "DELIVERY_VIEW" | "DELIVERY_ASSIGN" | "DELIVERY_PICKUP" | "DELIVERY_OUT_FOR_DELIVERY" | "DELIVERY_TRACKING" | "DELIVERY_COMPLETE" | "DELIVERY_FAIL" | "DELIVERY_RETURN";

export const hasRole = (user: AuthUser | null, role: string): boolean =>
  Boolean(user?.roles.includes(role));

// The verified backend login/profile contracts do not expose effective permissions.
// No role-to-permission assumptions are made in the client.
export const hasPermission = (_user: AuthUser | null, _permission: Permission): boolean => false;
