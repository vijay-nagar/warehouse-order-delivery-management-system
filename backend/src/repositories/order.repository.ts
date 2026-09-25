import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import type {
  CreateOrderInput,
  Order,
} from "../domain/order/order.types.js";
import { recordInitialStatus, recordStatusChange } from "../services/order-status.service.js";
import {
  selectWarehouseForOrder,
  type WarehouseAllocationShortfall,
} from "./warehouse-allocation.repository.js";
import { InventoryReservationRepository } from "./inventory-reservation.repository.js";
import {
  getPaginationOffset,
  getTotalPages,
} from "../shared/pagination/pagination.js";
import type {
  PaginationRequest,
  PaginationResult,
} from "../shared/pagination/pagination.types.js";

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

export interface CreateOrderResult {
  order: Order;
  shortfalls: WarehouseAllocationShortfall[];
}

export class OrderRepository {
  private readonly reservationRepository = new InventoryReservationRepository();

  async create(
    input: CreateOrderInput,
    actorUserId: number | null = null,
  ): Promise<CreateOrderResult> {
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

      await recordInitialStatus({
        transaction,
        orderId: order.Id,
        status: "CREATED",
        changedBy: actorUserId,
        reason: "Order created",
      });

      const insertedItems: Array<{ Id: number; ProductId: number; Quantity: number }> = [];

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

        const itemResult = await transaction
          .request()
          .input("orderId", sql.Int, order.Id)
          .input("productId", sql.Int, item.productId)
          .input("quantity", sql.Int, item.quantity)
          .input("unitPrice", sql.Decimal(18, 2), product.Price)
          .query<{ Id: number }>(`
            INSERT INTO dbo.OrderItems (
              OrderId,
              ProductId,
              Quantity,
              UnitPrice
            )
            OUTPUT INSERTED.Id
            VALUES (
              @orderId,
              @productId,
              @quantity,
              @unitPrice
            );
          `);

        const insertedItem = itemResult.recordset[0];

        if (!insertedItem) {
          throw new Error(
            `Failed to insert order item for product ${item.productId}`,
          );
        }

        insertedItems.push({
          Id: insertedItem.Id,
          ProductId: item.productId,
          Quantity: item.quantity,
        });
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

      await transaction
        .request()
        .input("orderId", sql.Int, order.Id)
        .input("totalAmount", sql.Decimal(18, 2), totalAmount)
        .query(`
          UPDATE dbo.Orders
          SET
            TotalAmount = @totalAmount,
            UpdatedAt = SYSUTCDATETIME()
          WHERE Id = @orderId;
        `);

      // Warehouse allocation + stock reservation, atomically within this
      // same transaction (P0-1: order creation must not result in "order
      // created but no warehouse" / "warehouse selected but no inventory
      // validation" / "inventory reserved but no pick task").
      let finalWarehouseId = order.WarehouseId;
      let shortfalls: WarehouseAllocationShortfall[] = [];

      if (!finalWarehouseId) {
        const allocation = await selectWarehouseForOrder(
          transaction,
          insertedItems.map((item) => ({
            productId: item.ProductId,
            quantity: item.Quantity,
          })),
        );

        shortfalls = allocation.shortfalls;

        if (allocation.warehouseId) {
          finalWarehouseId = allocation.warehouseId;

          await transaction
            .request()
            .input("orderId", sql.Int, order.Id)
            .input("warehouseId", sql.Int, finalWarehouseId)
            .query(`
              UPDATE dbo.Orders
              SET WarehouseId = @warehouseId, UpdatedAt = SYSUTCDATETIME()
              WHERE Id = @orderId;
            `);
        }
      }

      if (finalWarehouseId) {
        try {
          const reservationInputs = insertedItems.map((item) => ({
            orderId: order.Id,
            orderItemId: item.Id,
            productId: item.ProductId,
            quantity: item.Quantity,
          }));

          await this.reservationRepository.reserveOrderStockInTransaction(
            transaction,
            reservationInputs,
            finalWarehouseId,
            actorUserId,
          );
        } catch (reservationError) {
          // Stock became insufficient between the allocation scan and the
          // reservation lock (rare race), or the client-supplied
          // warehouseId cannot cover the order. Do not fail the whole
          // request — fall through to OUT_OF_STOCK instead, per P0-3 (no
          // partial reservation, but the order must still land in a
          // defined next-action state, not an opaque 500).
          console.error(
            `[ORDER] Reservation failed for order ${order.Id}, moving to OUT_OF_STOCK:`,
            reservationError,
          );

          await recordStatusChange({
            transaction,
            orderId: order.Id,
            fromStatus: "CREATED",
            toStatus: "OUT_OF_STOCK",
            changedBy: actorUserId,
            reason:
              reservationError instanceof Error
                ? reservationError.message
                : "Insufficient stock at reservation time",
          });
        }
      } else {
        await recordStatusChange({
          transaction,
          orderId: order.Id,
          fromStatus: "CREATED",
          toStatus: "OUT_OF_STOCK",
          changedBy: actorUserId,
          reason: "No active warehouse has sufficient stock for all items",
        });
      }

      const finalResult = await transaction
        .request()
        .input("orderId", sql.Int, order.Id)
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
          WHERE Id = @orderId;
        `);

      const finalOrder = finalResult.recordset[0];

      if (!finalOrder) {
        throw new Error("Failed to read back created order");
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
        order: {
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
        },
        shortfalls,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(
    pagination: PaginationRequest,
  ): Promise<PaginationResult<Order>> {
    const pool = await getDatabasePool();
    const offset = getPaginationOffset(pagination.page, pagination.pageSize);

    const countResult = await pool.request().query<{ TotalCount: number }>(`
      SELECT COUNT(*) AS TotalCount
      FROM dbo.Orders;
    `);

    const totalCount = countResult.recordset[0]?.TotalCount ?? 0;
    const totalPages = getTotalPages(totalCount, pagination.pageSize);

    const ordersResult = await pool
      .request()
      .input("offset", sql.Int, offset)
      .input("pageSize", sql.Int, pagination.pageSize)
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
        ORDER BY CreatedAt DESC, Id DESC
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY;
      `);

    const orders = ordersResult.recordset;

    if (orders.length === 0) {
      return {
        items: [],
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalCount,
        totalPages,
      };
    }

    const orderIds = orders.map((order) => order.Id);

    const itemsResult = await pool
      .request()
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
        WHERE OrderId IN (${orderIds.join(",")})
        ORDER BY OrderId, Id;
      `);

    const itemsByOrderId = new Map<number, OrderItemRow[]>();

    for (const item of itemsResult.recordset) {
      const existing = itemsByOrderId.get(item.OrderId);

      if (existing) {
        existing.push(item);
      } else {
        itemsByOrderId.set(item.OrderId, [item]);
      }
    }

    const mappedOrders: Order[] = orders.map((order) => {
      const orderItems = itemsByOrderId.get(order.Id) ?? [];

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
        items: orderItems.map((item) => ({
          id: item.Id,
          orderId: item.OrderId,
          productId: item.ProductId,
          quantity: item.Quantity,
          unitPrice: item.UnitPrice,
          totalPrice: item.TotalPrice,
        })),
      };
    });

    return {
      items: mappedOrders,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount,
      totalPages,
    };
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
}
