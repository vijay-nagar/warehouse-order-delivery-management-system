import sql from "mssql";
import { getDatabasePool } from "../config/database.js";
import { PickingRepository } from "./picking.repository.js";
import type {
  InventoryReservation,
  InventoryReservationStatus,
} from "../domain/inventory/reservation.types.js";

interface ReservationInput {
  orderId: number;
  orderItemId: number;
  productId: number;
  quantity: number;
}

export class InventoryReservationRepository {
  private readonly pickingRepository = new PickingRepository();

  async reserveOrderStock(
    reservations: ReservationInput[],
    warehouseId: number,
  ): Promise<InventoryReservation[]> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    try {
      if (reservations.length === 0) {
        throw new Error("No reservations provided.");
      }

      const orderId = reservations[0]!.orderId;

      await transaction.begin();

      const createdReservations: InventoryReservation[] = [];

      for (const reservation of reservations) {
        const inventoryRequest = new sql.Request(transaction);

        inventoryRequest.input(
          "warehouseId",
          sql.Int,
          warehouseId,
        );
        inventoryRequest.input(
          "productId",
          sql.Int,
          reservation.productId,
        );

        const inventoryResult = await inventoryRequest.query(`
          SELECT
            Id,
            ProductId,
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
          throw new Error(
            `Inventory ${inventory.Id} is inactive.`,
          );
        }

        if (
          inventory.AvailableQuantity <
          reservation.quantity
        ) {
          throw new Error(
            `Insufficient stock for product ${reservation.productId}. Available: ${inventory.AvailableQuantity}, requested: ${reservation.quantity}.`,
          );
        }

        const updateRequest = new sql.Request(transaction);

        updateRequest.input(
          "inventoryId",
          sql.Int,
          inventory.Id,
        );
        updateRequest.input(
          "quantity",
          sql.Int,
          reservation.quantity,
        );

        await updateRequest.query(`
          UPDATE dbo.Inventory
          SET
            AvailableQuantity = AvailableQuantity - @quantity,
            ReservedQuantity = ReservedQuantity + @quantity,
            UpdatedAt = SYSUTCDATETIME()
          WHERE Id = @inventoryId;
        `);

        const insertRequest = new sql.Request(transaction);

        insertRequest.input(
          "orderId",
          sql.Int,
          reservation.orderId,
        );
        insertRequest.input(
          "orderItemId",
          sql.Int,
          reservation.orderItemId,
        );
        insertRequest.input(
          "inventoryId",
          sql.Int,
          inventory.Id,
        );
        insertRequest.input(
          "productId",
          sql.Int,
          reservation.productId,
        );
        insertRequest.input(
          "quantity",
          sql.Int,
          reservation.quantity,
        );

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
        });
      }

      const pickingTaskId =
        await this.pickingRepository.createTaskInTransaction(
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
        );
      }

      const orderRequest = new sql.Request(transaction);

      orderRequest.input(
        "orderId",
        sql.Int,
        orderId,
      );

      const orderResult = await orderRequest.query(`
        UPDATE dbo.Orders
        SET
          Status = 'STOCK_RESERVED',
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @orderId
          AND Status = 'CREATED';
      `);

      if (orderResult.rowsAffected[0] !== 1) {
        throw new Error(
          `Order ${orderId} could not be moved to STOCK_RESERVED.`,
        );
      }

      await transaction.commit();

      return createdReservations;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Ignore rollback errors and preserve the original error.
      }

      throw error;
    }
  }
}
