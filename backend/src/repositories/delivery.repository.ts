import sql from "mssql";
import { getDatabasePool } from "../config/database.js";
import { recordStatusChange } from "../services/order-status.service.js";
import { isValidTransition } from "../domain/order/order-transitions.js";
import { insertInventoryTransactionInTransaction } from "./inventory-transaction.repository.js";
import type { OrderStatus } from "../domain/order/order-status.types.js";

export interface DeliveryRow {
  Id: number;
  OrderId: number;
  PackageId: number;
  DeliveryBoyUserId: number | null;
  Status: string;
  AssignedAt: Date | null;
  PickedUpAt: Date | null;
  OutForDeliveryAt: Date | null;
  DeliveredAt: Date | null;
  FailedAt: Date | null;
  ReturnedAt: Date | null;
  FailureReason: string | null;
  ReturnReason: string | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface PackageCheckRow {
  Id: number;
  OrderId: number;
  Status: string;
  PackingTaskId: number;
  PackingStatus: string;
}

export interface TrackingRow {
  Id: number;
  DeliveryId: number;
  Status: string;
  Latitude: number | null;
  Longitude: number | null;
  Remarks: string | null;
  CreatedAt: Date;
}

export interface DeliveryAttemptRow {
  Id: number;
  DeliveryId: number;
  AttemptNumber: number;
  Status: string;
  FailureReason: string | null;
  AttemptedAt: Date;
}

export class DeliveryRepository {
  async findPackage(packageId: number): Promise<PackageCheckRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("PackageId", sql.Int, packageId)
      .query<PackageCheckRow>(`
        SELECT
          p.Id,
          p.OrderId,
          p.Status,
          p.PackingTaskId,
          pt.Status AS PackingStatus
        FROM dbo.Packages p
        INNER JOIN dbo.PackingTasks pt
          ON pt.Id = p.PackingTaskId
        WHERE p.Id = @PackageId;
      `);

    return result.recordset[0] ?? null;
  }

  async findById(id: number): Promise<DeliveryRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query<DeliveryRow>(`
        SELECT
          Id,
          OrderId,
          PackageId,
          DeliveryBoyUserId,
          Status,
          AssignedAt,
          PickedUpAt,
          OutForDeliveryAt,
          DeliveredAt,
          FailedAt,
          ReturnedAt,
          FailureReason,
          ReturnReason,
          CreatedAt,
          UpdatedAt
        FROM dbo.Deliveries
        WHERE Id = @Id;
      `);

    return result.recordset[0] ?? null;
  }

  async findByOrderId(orderId: number): Promise<DeliveryRow[]> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .query<DeliveryRow>(`
        SELECT
          Id,
          OrderId,
          PackageId,
          DeliveryBoyUserId,
          Status,
          AssignedAt,
          PickedUpAt,
          OutForDeliveryAt,
          DeliveredAt,
          FailedAt,
          ReturnedAt,
          FailureReason,
          ReturnReason,
          CreatedAt,
          UpdatedAt
        FROM dbo.Deliveries
        WHERE OrderId = @OrderId
        ORDER BY Id DESC;
      `);

    return result.recordset;
  }

  async findAll(): Promise<DeliveryRow[]> {
    const pool = await getDatabasePool();

    const result = await pool.request().query<DeliveryRow>(`
      SELECT
        Id,
        OrderId,
        PackageId,
        DeliveryBoyUserId,
        Status,
        AssignedAt,
        PickedUpAt,
        OutForDeliveryAt,
        DeliveredAt,
        FailedAt,
        ReturnedAt,
        FailureReason,
        ReturnReason,
        CreatedAt,
        UpdatedAt
      FROM dbo.Deliveries
      ORDER BY Id DESC;
    `);

    return result.recordset;
  }

    async findByDeliveryBoyUserId(
    deliveryBoyUserId: number,
  ): Promise<DeliveryRow[]> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("DeliveryBoyUserId", sql.Int, deliveryBoyUserId)
      .query<DeliveryRow>(`
        SELECT
          Id,
          OrderId,
          PackageId,
          DeliveryBoyUserId,
          Status,
          AssignedAt,
          PickedUpAt,
          OutForDeliveryAt,
          DeliveredAt,
          FailedAt,
          ReturnedAt,
          FailureReason,
          ReturnReason,
          CreatedAt,
          UpdatedAt
        FROM dbo.Deliveries
        WHERE DeliveryBoyUserId = @DeliveryBoyUserId
        ORDER BY Id DESC;
      `);

    return result.recordset;
  }

  async create(
    orderId: number,
    packageId: number,
  ): Promise<DeliveryRow> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("PackageId", sql.Int, packageId)
      .query<DeliveryRow>(`
        INSERT INTO dbo.Deliveries
        (
          OrderId,
          PackageId,
          DeliveryBoyUserId,
          Status,
          CreatedAt,
          UpdatedAt
        )
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderId,
          INSERTED.PackageId,
          INSERTED.DeliveryBoyUserId,
          INSERTED.Status,
          INSERTED.AssignedAt,
          INSERTED.PickedUpAt,
          INSERTED.OutForDeliveryAt,
          INSERTED.DeliveredAt,
          INSERTED.FailedAt,
          INSERTED.ReturnedAt,
          INSERTED.FailureReason,
          INSERTED.ReturnReason,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        VALUES
        (
          @OrderId,
          @PackageId,
          NULL,
          'PENDING',
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Failed to create delivery");
    }

    return row;
  }

  async assign(
    id: number,
    deliveryBoyUserId: number,
  ): Promise<DeliveryRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("DeliveryBoyUserId", sql.Int, deliveryBoyUserId)
      .query<DeliveryRow>(`
        UPDATE dbo.Deliveries
        SET
          DeliveryBoyUserId = @DeliveryBoyUserId,
          Status = 'ASSIGNED',
          AssignedAt = SYSUTCDATETIME(),
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderId,
          INSERTED.PackageId,
          INSERTED.DeliveryBoyUserId,
          INSERTED.Status,
          INSERTED.AssignedAt,
          INSERTED.PickedUpAt,
          INSERTED.OutForDeliveryAt,
          INSERTED.DeliveredAt,
          INSERTED.FailedAt,
          INSERTED.ReturnedAt,
          INSERTED.FailureReason,
          INSERTED.ReturnReason,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @Id
          AND Status = 'PENDING';
      `);

    return result.recordset[0] ?? null;
  }

  async pickup(id: number): Promise<DeliveryRow | null> {
    return this.updateStatus(id, "PICKED_UP", "PickedUpAt");
  }

  async outForDelivery(
    id: number,
    actorUserId: number | null = null,
  ): Promise<DeliveryRow | null> {
    return this.updateStatus(id, "OUT_FOR_DELIVERY", "OutForDeliveryAt", actorUserId);
  }

  async deliver(
    id: number,
    actorUserId: number | null = null,
  ): Promise<DeliveryRow | null> {
    return this.updateStatus(id, "DELIVERED", "DeliveredAt", actorUserId);
  }

  async fail(
    id: number,
    reason: string,
    actorUserId: number | null = null,
  ): Promise<DeliveryRow | null> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const result = await new sql.Request(transaction)
        .input("Id", sql.Int, id)
        .input("FailureReason", sql.NVarChar(1000), reason || "")
        .query<DeliveryRow>(`
          UPDATE dbo.Deliveries
          SET
            Status = 'FAILED',
            FailureReason = @FailureReason,
            FailedAt = SYSUTCDATETIME(),
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.Id,
            INSERTED.OrderId,
            INSERTED.PackageId,
            INSERTED.DeliveryBoyUserId,
            INSERTED.Status,
            INSERTED.AssignedAt,
            INSERTED.PickedUpAt,
            INSERTED.OutForDeliveryAt,
            INSERTED.DeliveredAt,
            INSERTED.FailedAt,
            INSERTED.ReturnedAt,
            INSERTED.FailureReason,
            INSERTED.ReturnReason,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt
          WHERE Id = @Id
            AND Status = 'OUT_FOR_DELIVERY';
        `);

      const row = result.recordset[0];

      if (!row) {
        await transaction.rollback();
        return null;
      }

      const attemptResult = await new sql.Request(transaction)
        .input("DeliveryId", sql.Int, id)
        .query<{ AttemptNumber: number }>(`
          SELECT ISNULL(MAX(AttemptNumber), 0) + 1 AS AttemptNumber
          FROM dbo.DeliveryAttempts WITH (UPDLOCK, HOLDLOCK)
          WHERE DeliveryId = @DeliveryId;
        `);

      const attemptNumber =
        attemptResult.recordset[0]?.AttemptNumber ?? 1;

      await new sql.Request(transaction)
        .input("DeliveryId", sql.Int, id)
        .input("AttemptNumber", sql.Int, attemptNumber)
        .input("Status", sql.NVarChar(50), "FAILED")
        .input("FailureReason", sql.NVarChar(1000), reason || "")
        .query(`
          INSERT INTO dbo.DeliveryAttempts
          (
            DeliveryId,
            AttemptNumber,
            Status,
            FailureReason,
            AttemptedAt
          )
          VALUES
          (
            @DeliveryId,
            @AttemptNumber,
            @Status,
            @FailureReason,
            SYSUTCDATETIME()
          );
        `);

      await this.resolveOrderStatusAfterDeliveryChange(
        transaction,
        row.OrderId,
        actorUserId,
      );

      await transaction.commit();

      return row;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async returnDelivery(
    id: number,
    reason: string,
    actorUserId: number | null = null,
  ): Promise<DeliveryRow | null> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const result = await new sql.Request(transaction)
        .input("Id", sql.Int, id)
        .input("ReturnReason", sql.NVarChar(1000), reason || "")
        .query<DeliveryRow>(`
          UPDATE dbo.Deliveries
          SET
            Status = 'RETURNED',
            ReturnReason = @ReturnReason,
            ReturnedAt = SYSUTCDATETIME(),
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.Id,
            INSERTED.OrderId,
            INSERTED.PackageId,
            INSERTED.DeliveryBoyUserId,
            INSERTED.Status,
            INSERTED.AssignedAt,
            INSERTED.PickedUpAt,
            INSERTED.OutForDeliveryAt,
            INSERTED.DeliveredAt,
            INSERTED.FailedAt,
            INSERTED.ReturnedAt,
            INSERTED.FailureReason,
            INSERTED.ReturnReason,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt
          WHERE Id = @Id
            AND Status = 'FAILED';
        `);

      const row = result.recordset[0];

      if (!row) {
        await transaction.rollback();
        return null;
      }

      const recoveredProducts = await this.recoverStockForOrder(
        transaction,
        row.OrderId,
        id,
        actorUserId,
      );

      await this.resolveOrderStatusAfterDeliveryChange(
        transaction,
        row.OrderId,
        actorUserId,
      );

      await transaction.commit();

      if (recoveredProducts.length > 0) {
        console.log(
          `[DELIVERY] Recovered stock for order ${row.OrderId} (delivery ${id}):`,
          recoveredProducts,
        );
      }

      return row;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Recovers inventory for a returned order. Scoped to the order's picking
   * task (not per-package: Packages has no item-level breakdown in this
   * schema), so this is precise for single-package orders and an
   * order-level approximation for multi-package orders. Idempotent via
   * OrderInventoryReservations.RecoveredAt — safe to call more than once
   * for the same order (e.g. a retried request), since it only ever acts
   * on CONSUMED reservations that have not yet been recovered.
   *
   * Assumption: recovery is always full-quantity and unconditional. There is
   * no damaged/lost/inspection outcome anywhere in the schema (DeliveryStatus
   * has no such states), so every RETURNED delivery recovers its full
   * consumed quantity back to Available. If damaged/lost tracking is ever
   * needed, it requires new delivery-outcome states, not a change here.
   */
  private async recoverStockForOrder(
    transaction: sql.Transaction,
    orderId: number,
    deliveryId: number,
    actorUserId: number | null = null,
  ): Promise<Array<{ productId: number; quantity: number }>> {
    const reservationsResult = await new sql.Request(transaction)
      .input("OrderId", sql.Int, orderId)
      .query<{
        Id: number;
        OrderItemId: number;
        InventoryId: number;
        ProductId: number;
        Quantity: number;
      }>(`
        SELECT Id, OrderItemId, InventoryId, ProductId, Quantity
        FROM dbo.OrderInventoryReservations WITH (UPDLOCK, ROWLOCK)
        WHERE OrderId = @OrderId
          AND Status = 'CONSUMED'
          AND RecoveredAt IS NULL;
      `);

    const recovered: Array<{ productId: number; quantity: number }> = [];

    for (const reservation of reservationsResult.recordset) {
      const inventoryResult = await new sql.Request(transaction)
        .input("InventoryId", sql.Int, reservation.InventoryId)
        .query<{ AvailableQuantity: number; BinId: number | null }>(`
          SELECT AvailableQuantity, BinId
          FROM dbo.Inventory WITH (UPDLOCK, ROWLOCK)
          WHERE Id = @InventoryId;
        `);

      const previousQuantity = inventoryResult.recordset[0]?.AvailableQuantity;
      const binId = inventoryResult.recordset[0]?.BinId ?? null;

      if (previousQuantity === undefined) {
        continue;
      }

      const newQuantity = previousQuantity + reservation.Quantity;

      await new sql.Request(transaction)
        .input("InventoryId", sql.Int, reservation.InventoryId)
        .input("Quantity", sql.Int, reservation.Quantity)
        .query(`
          UPDATE dbo.Inventory
          SET
            AvailableQuantity = AvailableQuantity + @Quantity,
            UpdatedAt = SYSUTCDATETIME()
          WHERE Id = @InventoryId;
        `);

      const markedResult = await new sql.Request(transaction)
        .input("Id", sql.Int, reservation.Id)
        .query(`
          UPDATE dbo.OrderInventoryReservations
          SET
            RecoveredAt = SYSUTCDATETIME(),
            UpdatedAt = SYSUTCDATETIME()
          WHERE Id = @Id
            AND Status = 'CONSUMED'
            AND RecoveredAt IS NULL;
        `);

      if (markedResult.rowsAffected[0] !== 1) {
        // Another concurrent recovery already claimed this reservation;
        // do not double-credit inventory.
        continue;
      }

      await insertInventoryTransactionInTransaction(transaction, {
        inventoryId: reservation.InventoryId,
        transactionType: "RETURN_RECOVERY",
        quantity: reservation.Quantity,
        previousQuantity,
        newQuantity,
        orderId,
        orderItemId: reservation.OrderItemId,
        referenceType: "DELIVERY",
        referenceId: deliveryId,
        userId: actorUserId,
        binId,
        remarks: `Return recovery for DeliveryId=${deliveryId}, OrderId=${orderId}`,
      });

      recovered.push({ productId: reservation.ProductId, quantity: reservation.Quantity });
    }

    return recovered;
  }

  /**
   * Centralized multi-package order-status resolver (P0-10). Locks
   * sibling Deliveries rows for the order and decides, from their
   * aggregate state, what (if anything) the parent Order's status should
   * become. Never throws on a "not ready yet" state — it simply returns
   * null (no-op) so a sibling package's own valid status write is never
   * rolled back just because the order isn't ready to transition yet.
   * A genuinely mixed terminal outcome (e.g. some delivered, some
   * returned) has no target status in the declared enum and is
   * deliberately left unresolved rather than invented.
   */
  private async resolveOrderStatusAfterDeliveryChange(
    transaction: sql.Transaction,
    orderId: number,
    actorUserId: number | null,
  ): Promise<OrderStatus | null> {
    const siblingsResult = await new sql.Request(transaction)
      .input("OrderId", sql.Int, orderId)
      .query<{ Status: string }>(`
        SELECT Status
        FROM dbo.Deliveries WITH (UPDLOCK, HOLDLOCK)
        WHERE OrderId = @OrderId;
      `);

    const statuses = siblingsResult.recordset.map((row) => row.Status);
    const total = statuses.length;

    if (total === 0) {
      return null;
    }

    const delivered = statuses.filter((status) => status === "DELIVERED").length;
    const returned = statuses.filter((status) => status === "RETURNED").length;
    const failed = statuses.filter((status) => status === "FAILED").length;

    let target: OrderStatus | null = null;

    if (delivered === total) {
      target = "DELIVERED";
    } else if (returned === total) {
      target = "RETURNED";
    } else if (failed + returned === total && failed > 0) {
      target = "FAILED";
    } else if (delivered === 0) {
      // Nothing delivered yet: the order is still actively in flight
      // (some mix of ASSIGNED/PICKED_UP/OUT_FOR_DELIVERY/FAILED siblings).
      target = "OUT_FOR_DELIVERY";
    }
    // Otherwise: a genuinely mixed outcome (some delivered, some not yet
    // terminal or returned) — leave Orders.Status unchanged.

    if (!target) {
      return null;
    }

    const orderResult = await new sql.Request(transaction)
      .input("OrderId2", sql.Int, orderId)
      .query<{ Status: string }>(`
        SELECT Status FROM dbo.Orders WHERE Id = @OrderId2;
      `);

    const current = orderResult.recordset[0]?.Status as OrderStatus | undefined;

    if (!current || current === target || !isValidTransition(current, target)) {
      return null;
    }

    await recordStatusChange({
      transaction,
      orderId,
      fromStatus: current,
      toStatus: target,
      changedBy: actorUserId,
      reason: "Resolved from delivery/package aggregation",
    });

    return target;
  }

  async addTracking(
    deliveryId: number,
    status: string,
    latitude: number | null,
    longitude: number | null,
    remarks: string | null,
  ): Promise<TrackingRow> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("DeliveryId", sql.Int, deliveryId)
      .input("Status", sql.NVarChar(50), status)
      .input("Latitude", sql.Decimal(10, 7), latitude)
      .input("Longitude", sql.Decimal(10, 7), longitude)
      .input("Remarks", sql.NVarChar(500), remarks)
      .query<TrackingRow>(`
        INSERT INTO dbo.DeliveryTracking
        (
          DeliveryId,
          Status,
          Latitude,
          Longitude,
          Remarks,
          CreatedAt
        )
        OUTPUT
          INSERTED.Id,
          INSERTED.DeliveryId,
          INSERTED.Status,
          INSERTED.Latitude,
          INSERTED.Longitude,
          INSERTED.Remarks,
          INSERTED.CreatedAt
        VALUES
        (
          @DeliveryId,
          @Status,
          @Latitude,
          @Longitude,
          @Remarks,
          SYSUTCDATETIME()
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Failed to create delivery tracking record");
    }

    return row;
  }

  async getTrackingByDeliveryId(
    deliveryId: number,
  ): Promise<TrackingRow[]> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("DeliveryId", sql.Int, deliveryId)
      .query<TrackingRow>(`
        SELECT
          Id,
          DeliveryId,
          Status,
          Latitude,
          Longitude,
          Remarks,
          CreatedAt
        FROM dbo.DeliveryTracking
        WHERE DeliveryId = @DeliveryId
        ORDER BY CreatedAt ASC;
      `);

    return result.recordset;
  }

  async getAttemptsByDeliveryId(
    deliveryId: number,
  ): Promise<DeliveryAttemptRow[]> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("DeliveryId", sql.Int, deliveryId)
      .query<DeliveryAttemptRow>(`
        SELECT
          Id,
          DeliveryId,
          AttemptNumber,
          Status,
          FailureReason,
          AttemptedAt
        FROM dbo.DeliveryAttempts
        WHERE DeliveryId = @DeliveryId
        ORDER BY AttemptNumber ASC;
      `);

    return result.recordset;
  }

  private async updateStatus(
    id: number,
    status: string,
    timestampColumn:
      | "PickedUpAt"
      | "OutForDeliveryAt"
      | "DeliveredAt",
    actorUserId: number | null = null,
  ): Promise<DeliveryRow | null> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const expectedDeliveryStatus =
        status === "PICKED_UP"
          ? "ASSIGNED"
          : status === "OUT_FOR_DELIVERY"
            ? "PICKED_UP"
            : status === "DELIVERED"
              ? "OUT_FOR_DELIVERY"
              : undefined;

      const result = await new sql.Request(transaction)
        .input("Id", sql.Int, id)
        .input("Status", sql.NVarChar(40), status)
        .input(
          "ExpectedDeliveryStatus",
          sql.NVarChar(50),
          expectedDeliveryStatus ?? "",
        )
        .query<DeliveryRow>(`
          UPDATE dbo.Deliveries
          SET
            Status = @Status,
            ${timestampColumn} = SYSUTCDATETIME(),
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.Id,
            INSERTED.OrderId,
            INSERTED.PackageId,
            INSERTED.DeliveryBoyUserId,
            INSERTED.Status,
            INSERTED.AssignedAt,
            INSERTED.PickedUpAt,
            INSERTED.OutForDeliveryAt,
            INSERTED.DeliveredAt,
            INSERTED.FailedAt,
            INSERTED.ReturnedAt,
            INSERTED.FailureReason,
            INSERTED.ReturnReason,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt
          WHERE Id = @Id
            AND (
              @ExpectedDeliveryStatus = ''
              OR Status = @ExpectedDeliveryStatus
            );
        `);

      const row = result.recordset[0];

      if (!row) {
        await transaction.rollback();
        return null;
      }

      if (status === "OUT_FOR_DELIVERY" || status === "DELIVERED") {
        await this.resolveOrderStatusAfterDeliveryChange(
          transaction,
          row.OrderId,
          actorUserId,
        );
      }

      await transaction.commit();

      return row;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
