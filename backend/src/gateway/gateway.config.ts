export interface GatewayRouteConfig {
  prefix: string;
  service: string;
  protected: boolean;
  description: string;
}

export const gatewayRoutes = {
  auth: {
    prefix: "/api/auth",
    service: "auth",
    protected: false,
    description: "Authentication and current-user APIs",
  },

  customers: {
    prefix: "/api/customers",
    service: "customers",
    protected: true,
    description: "Customer management APIs",
  },

  products: {
    prefix: "/api/products",
    service: "products",
    protected: true,
    description: "Product management APIs",
  },

  orders: {
    prefix: "/api/orders",
    service: "orders",
    protected: true,
    description: "Order management APIs",
  },

  warehouses: {
    prefix: "/api/warehouses",
    service: "warehouse",
    protected: true,
    description: "Warehouse management APIs",
  },

  zones: {
    prefix: "/api/zones",
    service: "warehouse",
    protected: true,
    description: "Warehouse zone APIs",
  },

  shelves: {
    prefix: "/api/shelves",
    service: "warehouse",
    protected: true,
    description: "Warehouse shelf APIs",
  },

  bins: {
    prefix: "/api/bins",
    service: "warehouse",
    protected: true,
    description: "Warehouse bin APIs",
  },

  inventory: {
    prefix: "/api/inventory",
    service: "inventory",
    protected: true,
    description: "Inventory APIs",
  },

  inventoryReservation: {
    prefix: "/api/inventory-reservation",
    service: "inventory",
    protected: true,
    description: "Inventory reservation APIs",
  },

  inventoryTransactions: {
    prefix: "/api/inventory-transactions",
    service: "inventory",
    protected: true,
    description: "Inventory transaction APIs",
  },

  picking: {
    prefix: "/api/picking",
    service: "picking",
    protected: true,
    description: "Picking operation APIs",
  },

  packing: {
    prefix: "/api/packing",
    service: "packing",
    protected: true,
    description: "Packing operation APIs",
  },

  delivery: {
    prefix: "/api/delivery",
    service: "delivery",
    protected: true,
    description: "Delivery management APIs",
  },

  notifications: {
    prefix: "/api/notifications",
    service: "notification",
    protected: true,
    description: "Notification APIs",
  },

  reports: {
    prefix: "/api/reports",
    service: "reporting",
    protected: true,
    description: "Reporting APIs",
  },
} satisfies Record<string, GatewayRouteConfig>;