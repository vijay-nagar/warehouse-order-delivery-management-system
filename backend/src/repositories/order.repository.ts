import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import type {
  CreateOrderInput,
  Order,
} from "../domain/order/order.types.js";

interface OrderRow {
  Id: number;
  OrderNumber: string;
  CustomerId: number;
  WarehouseId: number | null;
  Status: string;
  TotalAmount: number;
  ShippingAddressLine1: string;
  ShippingAddressLine2: string | null;
  ShippingCity: string;
  ShippingState: string;
  ShippingPostalCode: string;
  CreatedAt: Date;
  UpdatedAt: Date | null;
}

interface OrderItemRow {
  Id: number;
  OrderId: number;
  ProductId: number;
  Quantity: number;
  UnitPrice: number;
  TotalPrice: number;
  CreatedAt: Date;
}

export class OrderRepository {
  async create(input: CreateOrderInput): Promise<Order> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const customerResult = await transaction
        .request()
        .input("customerId", sql.Int, input.customerId)
        .query<{ Id: number }>(`
          SELECT Id
          FROM dbo.Customers
          WHERE Id = @customerId
            AND IsActive = 1;
        `);

      if (!customerResult.recordset[0]) {
        throw new Error(
          `Customer ${input.customerId} not found or inactive`,
        );
      }

      if (input.warehouseId !== undefined) {
        const warehouseResult = await transaction
          .request()
          .input("warehouseId", sql.Int, input.warehouseId)
          .query<{ Id: number }>(`
            SELECT Id
            FROM dbo.Warehouses
            WHERE Id = @warehouseId
              AND IsActive = 1;
          `);

        if (!warehouseResult.recordset[0]) {
          throw new Error(
            `Warehouse ${input.warehouseId} not found or inactive`,
          );
        }
      }

      const orderNumber = `ORD-${Date.now()}`;

      const orderResult = await transaction
        .request()
        .input("orderNumber", sql.NVarChar(100), orderNumber)
        .input("customerId", sql.Int, input.customerId)
        .input(
          "warehouseId",
          sql.Int,
          input.warehouseId ?? null,
        )
        .input("status", sql.NVarChar(50), "CREATED")
        .input("totalAmount", sql.Decimal(18, 2), 0)
        .input(
          "shippingAddressLine1",
          sql.NVarChar(500),
          input.shippingAddressLine1,
        )
        .input(
          "shippingAddressLine2",
          sql.NVarChar(500),
          input.shippingAddressLine2 ?? null,
        )
        .input(
          "shippingCity",
          sql.NVarChar(100),
          input.shippingCity,
        )
        .input(
          "shippingState",
          sql.NVarChar(100),
          input.shippingState,
        )
        .input(
          "shippingPostalCode",
          sql.NVarChar(20),
          input.shippingPostalCode,
        )
        .query<OrderRow>(`
          INSERT INTO dbo.Orders (
            OrderNumber,
            CustomerId,
            WarehouseId,
            Status,
            TotalAmount,
            ShippingAddressLine1,
            ShippingAddressLine2,
            ShippingCity,
            ShippingState,
            ShippingPostalCode
          )
          OUTPUT
            INSERTED.Id,
            INSERTED.OrderNumber,
            INSERTED.CustomerId,
            INSERTED.WarehouseId,
            INSERTED.Status,
            INSERTED.TotalAmount,
            INSERTED.ShippingAddressLine1,
            INSERTED.ShippingAddressLine2,
            INSERTED.ShippingCity,
            INSERTED.ShippingState,
            INSERTED.ShippingPostalCode,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt
          VALUES (
            @orderNumber,
            @customerId,
            @warehouseId,
            @status,
            @totalAmount,
            @shippingAddressLine1,
            @shippingAddressLine2,
            @shippingCity,
            @shippingState,
            @shippingPostalCode
          );
        `);

      const order = orderResult.recordset[0];

      if (!order) {
        throw new Error("Order creation failed");
      }

      for (const item of input.items) {
        const productResult = await transaction
          .request()
          .input("productId", sql.Int, item.productId)
          .query<{ Price: number }>(`
            SELECT Price
            FROM dbo.Products
            WHERE Id = @productId
              AND IsActive = 1;
          `);

        const product = productResult.recordset[0];

        if (!product) {
          throw new Error(
            `Product ${item.productId} not found or inactive`,
          );
        }

        await transaction
          .request()
          .input("orderId", sql.Int, order.Id)
          .input("productId", sql.Int, item.productId)
          .input("quantity", sql.Int, item.quantity)
          .input("unitPrice", sql.Decimal(18, 2), product.Price)
          .query(`
            INSERT INTO dbo.OrderItems (
              OrderId,
              ProductId,
              Quantity,
              UnitPrice
            )
            VALUES (
              @orderId,
              @productId,
              @quantity,
              @unitPrice
            );
          `);
      }

      const totalResult = await transaction
        .request()
        .input("orderId", sql.Int, order.Id)
        .query<{ TotalAmount: number }>(`
          SELECT COALESCE(SUM(TotalPrice), 0) AS TotalAmount
          FROM dbo.OrderItems
          WHERE OrderId = @orderId;
        `);

      const totalAmount =
        totalResult.recordset[0]?.TotalAmount ?? 0;

      const updatedResult = await transaction
        .request()
        .input("orderId", sql.Int, order.Id)
        .input("totalAmount", sql.Decimal(18, 2), totalAmount)
        .query<OrderRow>(`
          UPDATE dbo.Orders
          SET
            TotalAmount = @totalAmount,
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.Id,
            INSERTED.OrderNumber,
            INSERTED.CustomerId,
            INSERTED.WarehouseId,
            INSERTED.Status,
            INSERTED.TotalAmount,
            INSERTED.ShippingAddressLine1,
            INSERTED.ShippingAddressLine2,
            INSERTED.ShippingCity,
            INSERTED.ShippingState,
            INSERTED.ShippingPostalCode,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt
          WHERE Id = @orderId;
        `);

      const finalOrder = updatedResult.recordset[0];

      if (!finalOrder) {
        throw new Error("Failed to update order total");
      }

      const itemsResult = await transaction
        .request()
        .input("orderId", sql.Int, order.Id)
        .query<OrderItemRow>(`
          SELECT
            Id,
            OrderId,
            ProductId,
            Quantity,
            UnitPrice,
            TotalPrice,
            CreatedAt
          FROM dbo.OrderItems
          WHERE OrderId = @orderId
          ORDER BY Id;
        `);

      await transaction.commit();

      return {
        id: finalOrder.Id,
        orderNumber: finalOrder.OrderNumber,
        customerId: finalOrder.CustomerId,
        warehouseId: finalOrder.WarehouseId,
        status: finalOrder.Status as Order["status"],
        totalAmount: finalOrder.TotalAmount,
        shippingAddressLine1: finalOrder.ShippingAddressLine1,
        shippingAddressLine2: finalOrder.ShippingAddressLine2,
        shippingCity: finalOrder.ShippingCity,
        shippingState: finalOrder.ShippingState,
        shippingPostalCode: finalOrder.ShippingPostalCode,
        createdAt: finalOrder.CreatedAt,
        updatedAt: finalOrder.UpdatedAt,
        items: itemsResult.recordset.map((item) => ({
          id: item.Id,
          orderId: item.OrderId,
          productId: item.ProductId,
          quantity: item.Quantity,
          unitPrice: item.UnitPrice,
          totalPrice: item.TotalPrice,
        })),
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

    async findAll(): Promise<Order[]> {
    const pool = await getDatabasePool();

    const ordersResult = await pool.request().query<OrderRow>(`
      SELECT
        Id,
        OrderNumber,
        CustomerId,
        WarehouseId,
        Status,
        TotalAmount,
        ShippingAddressLine1,
        ShippingAddressLine2,
        ShippingCity,
        ShippingState,
        ShippingPostalCode,
        CreatedAt,
        UpdatedAt
      FROM dbo.Orders
      ORDER BY CreatedAt DESC;
    `);

    const orders = ordersResult.recordset;

    if (orders.length === 0) {
      return [];
    }

    const itemsResult = await pool.request().query<OrderItemRow>(`
      SELECT
        Id,
        OrderId,
        ProductId,
        Quantity,
        UnitPrice,
        TotalPrice,
        CreatedAt
      FROM dbo.OrderItems
      ORDER BY OrderId, Id;
    `);

    return orders.map((order) => ({
      id: order.Id,
      orderNumber: order.OrderNumber,
      customerId: order.CustomerId,
      warehouseId: order.WarehouseId,
      status: order.Status as Order["status"],
      totalAmount: order.TotalAmount,
      shippingAddressLine1: order.ShippingAddressLine1,
      shippingAddressLine2: order.ShippingAddressLine2,
      shippingCity: order.ShippingCity,
      shippingState: order.ShippingState,
      shippingPostalCode: order.ShippingPostalCode,
      createdAt: order.CreatedAt,
      updatedAt: order.UpdatedAt,
      items: itemsResult.recordset
        .filter((item) => item.OrderId === order.Id)
        .map((item) => ({
          id: item.Id,
          orderId: item.OrderId,
          productId: item.ProductId,
          quantity: item.Quantity,
          unitPrice: item.UnitPrice,
          totalPrice: item.TotalPrice,
        })),
    }));
  }

  async findById(id: number): Promise<Order | null> {
    const pool = await getDatabasePool();

    const orderResult = await pool
      .request()
      .input("id", sql.Int, id)
      .query<OrderRow>(`
        SELECT
          Id,
          OrderNumber,
          CustomerId,
          WarehouseId,
          Status,
          TotalAmount,
          ShippingAddressLine1,
          ShippingAddressLine2,
          ShippingCity,
          ShippingState,
          ShippingPostalCode,
          CreatedAt,
          UpdatedAt
        FROM dbo.Orders
        WHERE Id = @id;
      `);

    const order = orderResult.recordset[0];

    if (!order) {
      return null;
    }

    const itemsResult = await pool
      .request()
      .input("orderId", sql.Int, id)
      .query<OrderItemRow>(`
        SELECT
          Id,
          OrderId,
          ProductId,
          Quantity,
          UnitPrice,
          TotalPrice,
          CreatedAt
        FROM dbo.OrderItems
        WHERE OrderId = @orderId
        ORDER BY Id;
      `);

    return {
      id: order.Id,
      orderNumber: order.OrderNumber,
      customerId: order.CustomerId,
      warehouseId: order.WarehouseId,
      status: order.Status as Order["status"],
      totalAmount: order.TotalAmount,
      shippingAddressLine1: order.ShippingAddressLine1,
      shippingAddressLine2: order.ShippingAddressLine2,
      shippingCity: order.ShippingCity,
      shippingState: order.ShippingState,
      shippingPostalCode: order.ShippingPostalCode,
      createdAt: order.CreatedAt,
      updatedAt: order.UpdatedAt,
      items: itemsResult.recordset.map((item) => ({
        id: item.Id,
        orderId: item.OrderId,
        productId: item.ProductId,
        quantity: item.Quantity,
        unitPrice: item.UnitPrice,
        totalPrice: item.TotalPrice,
      })),
    };
  }

  async updateStatus(
    id: number,
    status: Order["status"],
  ): Promise<Order | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("status", sql.NVarChar(50), status)
      .query<OrderRow>(`
        UPDATE dbo.Orders
        SET
          Status = @status,
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderNumber,
          INSERTED.CustomerId,
          INSERTED.WarehouseId,
          INSERTED.Status,
          INSERTED.TotalAmount,
          INSERTED.ShippingAddressLine1,
          INSERTED.ShippingAddressLine2,
          INSERTED.ShippingCity,
          INSERTED.ShippingState,
          INSERTED.ShippingPostalCode,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @id;
      `);

    const order = result.recordset[0];

    if (!order) {
      return null;
    }

    return this.findById(order.Id);
  }

  async cancel(id: number): Promise<Order | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query<OrderRow>(`
        UPDATE dbo.Orders
        SET
          Status = 'CANCELLED',
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderNumber,
          INSERTED.CustomerId,
          INSERTED.WarehouseId,
          INSERTED.Status,
          INSERTED.TotalAmount,
          INSERTED.ShippingAddressLine1,
          INSERTED.ShippingAddressLine2,
          INSERTED.ShippingCity,
          INSERTED.ShippingState,
          INSERTED.ShippingPostalCode,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @id
          AND Status = 'CREATED';
      `);

    const order = result.recordset[0];

    if (!order) {
      return null;
    }

    return this.findById(order.Id);
  }
}
