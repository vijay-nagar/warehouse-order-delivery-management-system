export interface GatewayServiceTarget {
  name: string;
  baseUrl: string;
}

export const gatewayServiceTargets: Record<
  string,
  GatewayServiceTarget
> = {
  auth: {
    name: "auth",
    baseUrl:
      process.env.AUTH_SERVICE_URL ??
      "local://auth",
  },

  customers: {
    name: "customers",
    baseUrl:
      process.env.CUSTOMER_SERVICE_URL ??
      "local://customers",
  },

  products: {
    name: "products",
    baseUrl:
      process.env.PRODUCT_SERVICE_URL ??
      "local://products",
  },

  orders: {
    name: "orders",
    baseUrl:
      process.env.ORDER_SERVICE_URL ??
      "local://orders",
  },

  inventory: {
    name: "inventory",
    baseUrl:
      process.env.INVENTORY_SERVICE_URL ??
      "local://inventory",
  },

  warehouse: {
    name: "warehouse",
    baseUrl:
      process.env.WAREHOUSE_SERVICE_URL ??
      "local://warehouse",
  },

  picking: {
    name: "picking",
    baseUrl:
      process.env.PICKING_SERVICE_URL ??
      "local://picking",
  },

  packing: {
    name: "packing",
    baseUrl:
      process.env.PACKING_SERVICE_URL ??
      "local://packing",
  },

  delivery: {
    name: "delivery",
    baseUrl:
      process.env.DELIVERY_SERVICE_URL ??
      "local://delivery",
  },

  notification: {
    name: "notification",
    baseUrl:
      process.env.NOTIFICATION_SERVICE_URL ??
      "local://notification",
  },

  reporting: {
    name: "reporting",
    baseUrl:
      process.env.REPORTING_SERVICE_URL ??
      "local://reporting",
  },
};

export const getGatewayTarget = (
  service: string,
): GatewayServiceTarget | undefined => {
  return gatewayServiceTargets[service];
};