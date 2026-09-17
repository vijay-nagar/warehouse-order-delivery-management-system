export interface OrderStatusReport {
  status: string;
  orderCount: number;
  totalAmount: number;
}

export interface TopProductReport {
  productId: number;
  productName: string;
  sku: string;
  quantitySold: number;
  salesAmount: number;
}

export interface OrderSummaryReport {
  fromDate: string | null;
  toDate: string | null;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  statusBreakdown: OrderStatusReport[];
  topProducts: TopProductReport[];
}
