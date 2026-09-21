export const gatewayRoutes = {
  auth: {
    prefix: "/api/auth",
    service: "auth",
  },
  orders: {
    prefix: "/api/orders",
    service: "orders",
  },
  inventory: {
    prefix: "/api/inventory",
    service: "inventory",
  },
  warehouses: {
    prefix: "/api/warehouses",
    service: "warehouse",
  },
  picking: {
    prefix: "/api/picking",
    service: "picking",
  },
  packing: {
    prefix: "/api/packing",
    service: "packing",
  },
  delivery: {
    prefix: "/api/delivery",
    service: "delivery",
  },
} as const;
