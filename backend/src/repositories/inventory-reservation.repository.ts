import sql from "mssql";
import { getDatabasePool } from "../config/database.js";
import { PickingRepository } from "./picking.repository.js";
import { recordStatusChange } from "../services/order-status.service.js";
import { insertInventoryTransactionInTransaction } from "./inventory-transaction.repository.js";
import {
  selectWarehouseForOrder,
  type WarehouseAllocationShortfall,
} from "./warehouse-allocation.repository.js";
import type {
  InventoryReservation,
  InventoryReservationStatus,
} from "../domain/inventory/reservation.types.js";
import type { OrderStatus } from "../domain/order/order-status.types.js";

interface ReservationInput {
  orderId: number;
  orderItemId: number;
  productId: number;
  quantity: number;
}

export class InventoryReservationRepository {
  private readonly pickingRepository = new PickingRepository();

  /**
   * Transaction-scoped reservation primitive: locks/decrements Inventory,
   * inserts OrderInventoryReservations rows, auto-creates the picking task,
   * and moves the order CREATED -> STOCK_RESERVED, all within the caller's
   * existing transaction. The caller owns begin/commit/rollback. This is
   * what lets order creation reserve stock atomically in the same
   * transaction as the order/items insert, while `reserveOrderStock` below
   * (the standalone manual-retry endpoint) reuses the identical logic in
   * its own transaction.
   */
  async reserveOrderStockInTransaction(
    transaction: sql.Transaction,
    reservations: ReservationInput[],
    warehouseId: number,
    actorUserId: number | null,
    fromStatus: OrderStatus = "CREATED",
  ): Promise<InventoryReservation[]> {
    if (reservations.length === 0) {
      throw new Error("No reservations provided.");
    }

    const orderId = reservations[0]!.orderId;

    const createdReservations: InventoryReservation[] = [];

    for (const reservation of reservations) {
      const inventoryRequest = new sql.Request(transaction);

      inventoryRequest.input("warehouseId", sql.Int, warehouseId);
      inventoryRequest.input("productId", sql.Int, reservation.productId);

      const inventoryResult = await inventoryRequest.query(`
        SELECT
          Id,
          ProductId,
          BinId,
          AvailableQuantity,
          ReservedQuantity,
          IsActive
        FROM dbo.Inventory WITH (UPDLOCK, ROWLOCK)
        WHERE WarehouseId = @warehouseId
          AND ProductId = @productId;
      `);

      if (inventoryResult.recordset.length === 0) {
        throw new Error(
          `No active inventory found for product ${reservation.productId} in warehouse ${warehouseId}.`,
        );
      }

      const inventory = inventoryResult.recordset[0];

      if (!inventory.IsActive) {
        throw new Error(`Inventory ${inventory.Id} is inactive.`);
      }

      if (inventory.AvailableQuantity < reservation.quantity) {
        throw new Error(
          `Insufficient stock for product ${reservation.productId}. Available: ${inventory.AvailableQuantity}, requested: ${reservation.quantity}.`,
        );
      }

      const updateRequest = new sql.Request(transaction);

      updateRequest.input("inventoryId", sql.Int, inventory.Id);
      updateRequest.input("quantity", sql.Int, reservation.quantity);

      await updateRequest.query(`
        UPDATE dbo.Inventory
        SET
          AvailableQuantity = AvailableQuantity - @quantity,
          ReservedQuantity = ReservedQuantity + @quantity,
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @inventoryId;
      `);

      await insertInventoryTransactionInTransaction(transaction, {
        inventoryId: inventory.Id,
        transactionType: "RESERVE",
        quantity: reservation.quantity,
        previousQuantity: inventory.AvailableQuantity,
        newQuantity: inventory.AvailableQuantity - reservation.quantity,
        orderId: reservation.orderId,
        orderItemId: reservation.orderItemId,
        referenceType: "ORDER",
        referenceId: reservation.orderId,
        userId: actorUserId,
        binId: inventory.BinId,
      });

      const insertRequest = new sql.Request(transaction);

      insertRequest.input("orderId", sql.Int, reservation.orderId);
      insertRequest.input("orderItemId", sql.Int, reservation.orderItemId);
      insertRequest.input("inventoryId", sql.Int, inventory.Id);
      insertRequest.input("productId", sql.Int, reservation.productId);
      insertRequest.input("quantity", sql.Int, reservation.quantity);

      const insertResult = await insertRequest.query(`
        INSERT INTO dbo.OrderInventoryReservations
        (
          OrderId,
          OrderItemId,
          InventoryId,
          ProductId,
          Quantity,
          Status
        )
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderId,
          INSERTED.OrderItemId,
          INSERTED.InventoryId,
          INSERTED.ProductId,
          INSERTED.Quantity,
          INSERTED.Status,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        VALUES
        (
          @orderId,
          @orderItemId,
          @inventoryId,
          @productId,
          @quantity,
          'RESERVED'
        );
      `);

      const row = insertResult.recordset[0];

      createdReservations.push({
        id: row.Id,
        orderId: row.OrderId,
        orderItemId: row.OrderItemId,
        inventoryId: row.InventoryId,
        productId: row.ProductId,
        quantity: row.Quantity,
        status: row.Status as InventoryReservationStatus,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
        binId: inventory.BinId as number | null,
      });
    }

    const pickingTaskId = await this.pickingRepository.createTaskInTransaction(
      transaction,
      orderId,
      "Auto-generated after stock reservation",
    );

    for (const reservation of createdReservations) {
      await this.pickingRepository.createItemInTransaction(
        transaction,
        pickingTaskId,
        reservation.productId,
        reservation.quantity,
        reservation.binId,
      );
    }

    await recordStatusChange({
      transaction,
      orderId,
      fromStatus,
      toStatus: "STOCK_RESERVED",
      changedBy: actorUserId,
      reason: "Stock reserved",
    });

    return createdReservations;
  }

  async reserveOrderStock(
    reservations: ReservationInput[],
    warehouseId: number,
    actorUserId: number | null = null,
    fromStatus: OrderStatus = "CREATED",
  ): Promise<InventoryReservation[]> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const result = await this.reserveOrderStockInTransaction(
        transaction,
        reservations,
        warehouseId,
        actorUserId,
        fromStatus,
      );

      await transaction.commit();

      return result;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Ignore rollback errors and preserve the original error.
      }

      throw error;
    }
  }

  /**
   * Manual re-trigger path for an order stuck at CREATED (warehouse
   * allocation/reservation never ran or failed) or OUT_OF_STOCK (stock has
   * since been replenished). Re-runs warehouse allocation if the order has
   * no warehouseId yet, then reserves stock. Never partially reserves: on
   * failure the order is left at (or moved to) OUT_OF_STOCK rather than an
   * ambiguous state.
   */
  async retryReservationForOrder(
    orderId: number,
    actorUserId: number | null,
  ): Promise<{
    reservations: InventoryReservation[];
    warehouseId: number | null;
    shortfalls: WarehouseAllocationShortfall[];
  }> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const orderResult = await new sql.Request(transaction)
        .input("OrderId", sql.Int, orderId)
        .query<{ WarehouseId: number | null; Status: string }>(`
          SELECT WarehouseId, Status
          FROM dbo.Orders WITH (UPDLOCK, ROWLOCK)
          WHERE Id = @OrderId;
        `);

      const orderRow = orderResult.recordset[0];

      if (!orderRow) {
        throw new Error(`Order ${orderId} not found.`);
      }

      const currentStatus = orderRow.Status as OrderStatus;

      if (currentStatus !== "CREATED" && currentStatus !== "OUT_OF_STOCK") {
        throw new Error(
          `Order ${orderId} cannot be reserved from status ${currentStatus}.`,
        );
      }

      const itemsResult = await new sql.Request(transaction)
        .input("OrderId2", sql.Int, orderId)
        .query<{ Id: number; ProductId: number; Quantity: number }>(`
          SELECT Id, ProductId, Quantity
          FROM dbo.OrderItems
          WHERE OrderId = @OrderId2
          ORDER BY Id;
        `);

      if (itemsResult.recordset.length === 0) {
        throw new Error(`Order ${orderId} has no items.`);
      }

      let warehouseId = orderRow.WarehouseId;
      let shortfalls: WarehouseAllocationShortfall[] = [];

      if (!warehouseId) {
        const allocation = await selectWarehouseForOrder(
          transaction,
          itemsResult.recordset.map((item) => ({
            productId: item.ProductId,
            quantity: item.Quantity,
          })),
        );

        shortfalls = allocation.shortfalls;

        if (allocation.warehouseId) {
          warehouseId = allocation.warehouseId;

          await new sql.Request(transaction)
            .input("OrderId3", sql.Int, orderId)
            .input("WarehouseId", sql.Int, warehouseId)
            .query(`
              UPDATE dbo.Orders
              SET WarehouseId = @WarehouseId, UpdatedAt = SYSUTCDATETIME()
              WHERE Id = @OrderId3;
            `);
        }
      }

      if (!warehouseId) {
        if (currentStatus !== "OUT_OF_STOCK") {
          await recordStatusChange({
            transaction,
            orderId,
            fromStatus: currentStatus,
            toStatus: "OUT_OF_STOCK",
            changedBy: actorUserId,
            reason: "No active warehouse has sufficient stock for all items",
          });
        }

        await transaction.commit();

        return { reservations: [], warehouseId: null, shortfalls };
      }

      try {
        const reservations = await this.reserveOrderStockInTransaction(
          transaction,
          itemsResult.recordset.map((item) => ({
            orderId,
            orderItemId: item.Id,
            productId: item.ProductId,
            quantity: item.Quantity,
          })),
          warehouseId,
          actorUserId,
          currentStatus,
        );

        await transaction.commit();

        return { reservations, warehouseId, shortfalls: [] };
      } catch (reservationError) {
        if (currentStatus !== "OUT_OF_STOCK") {
          await recordStatusChange({
            transaction,
            orderId,
            fromStatus: currentStatus,
            toStatus: "OUT_OF_STOCK",
            changedBy: actorUserId,
            reason:
              reservationError instanceof Error
                ? reservationError.message
                : "Insufficient stock at reservation time",
          });

          await transaction.commit();

          return { reservations: [], warehouseId, shortfalls: [] };
        }

        throw reservationError;
      }
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Ignore rollback errors and preserve the original error.
      }

      throw error;
    }
  }

  async cancelOrderWithReservationRelease(
    orderId: number,
    actorUserId: number | null = null,
  ): Promise<boolean> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const orderResult = await new sql.Request(transaction)
        .input("OrderId", sql.Int, orderId)
        .query<{ Status: string }>(`
          SELECT Status
          FROM dbo.Orders WITH (UPDLOCK, ROWLOCK)
          WHERE Id = @OrderId;
        `);

      const orderRow = orderResult.recordset[0];

      if (!orderRow) {
        throw new Error(`Order ${orderId} not found.`);
      }

      const currentStatus = orderRow.Status as OrderStatus;

      const reservationRequest = new sql.Request(transaction)
        .input("OrderId", sql.Int, orderId);

      const reservationResult = await reservationRequest.query(`
        SELECT
          Id,
          InventoryId,
          Quantity
        FROM dbo.OrderInventoryReservations WITH (UPDLOCK, ROWLOCK)
        WHERE OrderId = @OrderId
          AND Status = 'RESERVED';
      `);

      for (const reservation of reservationResult.recordset) {
        const inventoryRequest = new sql.Request(transaction)
          .input("InventoryId", sql.Int, reservation.InventoryId)
          .input("Quantity", sql.Int, reservation.Quantity);

        const inventoryResult = await inventoryRequest.query(`
          UPDATE dbo.Inventory
          SET
            AvailableQuantity = AvailableQuantity + @Quantity,
            ReservedQuantity = ReservedQuantity - @Quantity,
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.BinId,
            DELETED.AvailableQuantity AS PreviousAvailableQuantity,
            INSERTED.AvailableQuantity AS NewAvailableQuantity
          WHERE Id = @InventoryId
            AND ReservedQuantity >= @Quantity;
        `);

        if (inventoryResult.rowsAffected[0] !== 1) {
          throw new Error(
            `Inventory ${reservation.InventoryId} cannot release quantity ${reservation.Quantity}.`,
          );
        }

        const releasedInventory = inventoryResult.recordset[0];

        await insertInventoryTransactionInTransaction(transaction, {
          inventoryId: reservation.InventoryId,
          transactionType: "RELEASE",
          quantity: reservation.Quantity,
          previousQuantity: releasedInventory.PreviousAvailableQuantity,
          newQuantity: releasedInventory.NewAvailableQuantity,
          orderId,
          referenceType: "ORDER",
          referenceId: orderId,
          userId: actorUserId,
          binId: releasedInventory.BinId,
          remarks: "Order cancelled",
        });

        const reservationUpdate = new sql.Request(transaction)
          .input("ReservationId", sql.Int, reservation.Id);

        const reservationUpdateResult = await reservationUpdate.query(`
          UPDATE dbo.OrderInventoryReservations
          SET
            Status = 'RELEASED',
            UpdatedAt = SYSUTCDATETIME()
          WHERE Id = @ReservationId
            AND Status = 'RESERVED';
        `);

        if (reservationUpdateResult.rowsAffected[0] !== 1) {
          throw new Error(
            `Reservation ${reservation.Id} could not be released.`,
          );
        }
      }

      await recordStatusChange({
        transaction,
        orderId,
        fromStatus: currentStatus,
        toStatus: "CANCELLED",
        changedBy: actorUserId,
        reason: "Order cancelled",
      });

      await transaction.commit();

      return true;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Preserve original error.
      }

      throw error;
    }
  }

  async releaseOrderReservations(
    orderId: number,
  ): Promise<InventoryReservation[]> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const selectRequest = new sql.Request(transaction);
      selectRequest.input("orderId", sql.Int, orderId);

      const result = await selectRequest.query(`
        SELECT
          r.Id,
          r.OrderId,
          r.OrderItemId,
          r.InventoryId,
          r.ProductId,
          r.Quantity,
          r.Status,
          r.CreatedAt,
          r.UpdatedAt
        FROM dbo.OrderInventoryReservations r WITH (UPDLOCK, ROWLOCK)
        WHERE r.OrderId = @orderId
          AND r.Status = 'RESERVED';
      `);

      const reservations = result.recordset;

      for (const reservation of reservations) {
        const inventoryRequest = new sql.Request(transaction);

        inventoryRequest.input("inventoryId", sql.Int, reservation.InventoryId);
        inventoryRequest.input("quantity", sql.Int, reservation.Quantity);

        const inventoryResult = await inventoryRequest.query(`
          UPDATE dbo.Inventory
          SET
            AvailableQuantity = AvailableQuantity + @quantity,
            ReservedQuantity = ReservedQuantity - @quantity,
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.Id,
            INSERTED.BinId,
            DELETED.AvailableQuantity AS PreviousAvailableQuantity,
            INSERTED.AvailableQuantity AS NewAvailableQuantity
          WHERE Id = @inventoryId
            AND ReservedQuantity >= @quantity;
        `);

        if (inventoryResult.rowsAffected[0] !== 1) {
          throw new Error(
            `Inventory ${reservation.InventoryId} cannot release quantity ${reservation.Quantity}.`,
          );
        }

        const releasedInventory = inventoryResult.recordset[0];

        await insertInventoryTransactionInTransaction(transaction, {
          inventoryId: reservation.InventoryId,
          transactionType: "RELEASE",
          quantity: reservation.Quantity,
          previousQuantity: releasedInventory.PreviousAvailableQuantity,
          newQuantity: releasedInventory.NewAvailableQuantity,
          orderId: reservation.OrderId,
          orderItemId: reservation.OrderItemId,
          referenceType: "ORDER",
          referenceId: reservation.OrderId,
          binId: releasedInventory.BinId,
        });

        const updateReservationRequest = new sql.Request(transaction);

        updateReservationRequest.input("id", sql.Int, reservation.Id);

        await updateReservationRequest.query(`
          UPDATE dbo.OrderInventoryReservations
          SET
            Status = 'RELEASED',
            UpdatedAt = SYSUTCDATETIME()
          WHERE Id = @id
            AND Status = 'RESERVED';
        `);
      }

      await transaction.commit();

      return reservations.map((row) => ({
        id: row.Id,
        orderId: row.OrderId,
        orderItemId: row.OrderItemId,
        inventoryId: row.InventoryId,
        productId: row.ProductId,
        quantity: row.Quantity,
        status: "RELEASED" as InventoryReservationStatus,
        createdAt: row.CreatedAt,
        updatedAt: new Date(),
      }));
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Preserve original error.
      }

      throw error;
    }
  }

  async consumeOrderReservations(
    orderId: number,
  ): Promise<InventoryReservation[]> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const selectRequest = new sql.Request(transaction);
      selectRequest.input("orderId", sql.Int, orderId);

      const result = await selectRequest.query(`
        SELECT
          r.Id,
          r.OrderId,
          r.OrderItemId,
          r.InventoryId,
          r.ProductId,
          r.Quantity,
          r.Status,
          r.CreatedAt,
          r.UpdatedAt
        FROM dbo.OrderInventoryReservations r WITH (UPDLOCK, ROWLOCK)
        WHERE r.OrderId = @orderId
          AND r.Status = 'RESERVED';
      `);

      const reservations = result.recordset;

      for (const reservation of reservations) {
        const inventoryRequest = new sql.Request(transaction);

        inventoryRequest.input("inventoryId", sql.Int, reservation.InventoryId);
        inventoryRequest.input("quantity", sql.Int, reservation.Quantity);

        const inventoryResult = await inventoryRequest.query(`
          UPDATE dbo.Inventory
          SET
            ReservedQuantity = ReservedQuantity - @quantity,
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.Id,
            INSERTED.BinId,
            DELETED.ReservedQuantity AS PreviousReservedQuantity,
            INSERTED.ReservedQuantity AS NewReservedQuantity
          WHERE Id = @inventoryId
            AND ReservedQuantity >= @quantity;
        `);

        if (inventoryResult.rowsAffected[0] !== 1) {
          throw new Error(
            `Inventory ${reservation.InventoryId} cannot consume quantity ${reservation.Quantity}.`,
          );
        }

        const consumedInventory = inventoryResult.recordset[0];

        await insertInventoryTransactionInTransaction(transaction, {
          inventoryId: reservation.InventoryId,
          transactionType: "PICK_CONSUME",
          quantity: reservation.Quantity,
          previousQuantity: consumedInventory.PreviousReservedQuantity,
          newQuantity: consumedInventory.NewReservedQuantity,
          orderId: reservation.OrderId,
          orderItemId: reservation.OrderItemId,
          referenceType: "ORDER",
          referenceId: reservation.OrderId,
          binId: consumedInventory.BinId,
        });

        const updateReservationRequest = new sql.Request(transaction);

        updateReservationRequest.input("id", sql.Int, reservation.Id);

        await updateReservationRequest.query(`
          UPDATE dbo.OrderInventoryReservations
          SET
            Status = 'CONSUMED',
            UpdatedAt = SYSUTCDATETIME()
          WHERE Id = @id
            AND Status = 'RESERVED';
        `);
      }

      await transaction.commit();

      return reservations.map((row) => ({
        id: row.Id,
        orderId: row.OrderId,
        orderItemId: row.OrderItemId,
        inventoryId: row.InventoryId,
        productId: row.ProductId,
        quantity: row.Quantity,
        status: "CONSUMED" as InventoryReservationStatus,
        createdAt: row.CreatedAt,
        updatedAt: new Date(),
      }));
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Preserve original error.
      }

      throw error;
    }
  }
}
