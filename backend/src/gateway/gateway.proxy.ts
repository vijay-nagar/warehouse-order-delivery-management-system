export interface GatewayServiceTarget {
  name: string;
  baseUrl: string;
}

export const gatewayServiceTargets: Record<string, GatewayServiceTarget> = {
  auth: {
    name: "auth",
    baseUrl: process.env.AUTH_SERVICE_URL ?? "internal://auth",
  },
  orders: {
    name: "orders",
    baseUrl: process.env.ORDER_SERVICE_URL ?? "internal://orders",
  },
  inventory: {
    name: "inventory",
    baseUrl: process.env.INVENTORY_SERVICE_URL ?? "internal://inventory",
  },
  warehouse: {
    name: "warehouse",
    baseUrl: process.env.WAREHOUSE_SERVICE_URL ?? "internal://warehouse",
  },
  picking: {
    name: "picking",
    baseUrl: process.env.PICKING_SERVICE_URL ?? "internal://picking",
  },
  packing: {
    name: "packing",
    baseUrl: process.env.PACKING_SERVICE_URL ?? "internal://packing",
  },
  delivery: {
    name: "delivery",
    baseUrl: process.env.DELIVERY_SERVICE_URL ?? "internal://delivery",
  },
};

export const getGatewayTarget = (service: string) => {
  return gatewayServiceTargets[service];
};
