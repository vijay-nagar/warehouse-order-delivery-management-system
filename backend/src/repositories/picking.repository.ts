import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import { PackingRepository } from "./packing.repository.js";
import { recordStatusChange } from "../services/order-status.service.js";
import { insertInventoryTransactionInTransaction } from "./inventory-transaction.repository.js";
import {
  getPaginationOffset,
  getTotalPages,
} from "../shared/pagination/pagination.js";
import type {
  PaginationRequest,
  PaginationResult,
} from "../shared/pagination/pagination.types.js";

export interface PickingTaskRow {
  Id: number;
  OrderId: number;
  PickerUserId: number | null;
  Status: string;
  AssignedAt: Date | null;
  StartedAt: Date | null;
  CompletedAt: Date | null;
  Notes: string;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface PickingTaskItemRow {
  Id: number;
  PickingTaskId: number;
  ProductId: number;
  RequiredQuantity: number;
  PickedQuantity: number;
  Status: string;
  BinId: number | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export class PickingRepository {
  async createTask(
    orderId: number,
    notes: string,
  ): Promise<number> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("Notes", sql.NVarChar(1000), notes)
      .query<{ Id: number }>(`
        INSERT INTO dbo.PickingTasks
        (
          OrderId,
          PickerUserId,
          Status,
          Notes,
          CreatedAt,
          UpdatedAt
        )
        OUTPUT INSERTED.Id
        VALUES
        (
          @OrderId,
          NULL,
          'PENDING',
          @Notes,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Failed to create picking task");
    }

    return row.Id;
  }

  async createItem(
    pickingTaskId: number,
    productId: number,
    requiredQuantity: number,
    binId: number | null = null,
  ): Promise<void> {
    const pool = await getDatabasePool();

    await pool
      .request()
      .input("PickingTaskId", sql.Int, pickingTaskId)
      .input("ProductId", sql.Int, productId)
      .input("RequiredQuantity", sql.Int, requiredQuantity)
      .input("BinId", sql.Int, binId)
      .query(`
        INSERT INTO dbo.PickingTaskItems
        (
          PickingTaskId,
          ProductId,
          RequiredQuantity,
          PickedQuantity,
          Status,
          BinId,
          CreatedAt,
          UpdatedAt
        )
        VALUES
        (
          @PickingTaskId,
          @ProductId,
          @RequiredQuantity,
          0,
          'PENDING',
          @BinId,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);
  }

  async createTaskInTransaction(
    transaction: sql.Transaction,
    orderId: number,
    notes: string,
  ): Promise<number> {
    const result = await new sql.Request(transaction)
      .input("OrderId", sql.Int, orderId)
      .input("Notes", sql.NVarChar(1000), notes)
      .query<{ Id: number }>(`
        INSERT INTO dbo.PickingTasks
        (
          OrderId,
          PickerUserId,
          Status,
          Notes,
          CreatedAt,
          UpdatedAt
        )
        OUTPUT INSERTED.Id
        VALUES
        (
          @OrderId,
          NULL,
          'PENDING',
          @Notes,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Failed to create picking task");
    }

    return row.Id;
  }

  async createItemInTransaction(
    transaction: sql.Transaction,
    pickingTaskId: number,
    productId: number,
    requiredQuantity: number,
    binId: number | null = null,
  ): Promise<void> {
    await new sql.Request(transaction)
      .input("PickingTaskId", sql.Int, pickingTaskId)
      .input("ProductId", sql.Int, productId)
      .input("RequiredQuantity", sql.Int, requiredQuantity)
      .input("BinId", sql.Int, binId)
      .query(`
        INSERT INTO dbo.PickingTaskItems
        (
          PickingTaskId,
          ProductId,
          RequiredQuantity,
          PickedQuantity,
          Status,
          BinId,
          CreatedAt,
          UpdatedAt
        )
        VALUES
        (
          @PickingTaskId,
          @ProductId,
          @RequiredQuantity,
          0,
          'PENDING',
          @BinId,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);
  }

  async getStatusSummary(): Promise<Record<string, number>> {
    const pool = await getDatabasePool();

    const result = await pool.request().query<{ Status: string; TotalCount: number }>(`
      SELECT
        Status,
        COUNT(*) AS TotalCount
      FROM dbo.PickingTasks
      GROUP BY Status;
    `);

    return result.recordset.reduce<Record<string, number>>((summary, row) => {
      summary[row.Status] = row.TotalCount;
      return summary;
    }, {});
  }

  async findAll(
    pagination: PaginationRequest,
    filters?: { status?: string },
  ): Promise<PaginationResult<PickingTaskRow>> {
    const pool = await getDatabasePool();
    const offset = getPaginationOffset(pagination.page, pagination.pageSize);

    const whereClause = filters?.status ? "WHERE Status = @Status" : "";

    const countRequest = pool.request();
    if (filters?.status) countRequest.input("Status", sql.NVarChar(20), filters.status);

    const countResult = await countRequest.query<{ TotalCount: number }>(`
      SELECT COUNT(*) AS TotalCount FROM dbo.PickingTasks ${whereClause};
    `);

    const totalCount = countResult.recordset[0]?.TotalCount ?? 0;
    const totalPages = getTotalPages(totalCount, pagination.pageSize);

    const listRequest = pool
      .request()
      .input("Offset", sql.Int, offset)
      .input("PageSize", sql.Int, pagination.pageSize);
    if (filters?.status) listRequest.input("Status", sql.NVarChar(20), filters.status);

    const result = await listRequest.query<PickingTaskRow>(`
      SELECT
        Id,
        OrderId,
        PickerUserId,
        Status,
        AssignedAt,
        StartedAt,
        CompletedAt,
        Notes,
        CreatedAt,
        UpdatedAt
      FROM dbo.PickingTasks
      ${whereClause}
      ORDER BY Id DESC
      OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    `);

    return {
      items: result.recordset,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount,
      totalPages,
    };
  }

  // Unpaginated by design: used only to check whether an order already has
  // an active picking task, which must scan every task for that order, not
  // just one page of the global list.
  async findByOrderId(orderId: number): Promise<PickingTaskRow[]> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .query<PickingTaskRow>(`
        SELECT
          Id,
          OrderId,
          PickerUserId,
          Status,
          AssignedAt,
          StartedAt,
          CompletedAt,
          Notes,
          CreatedAt,
          UpdatedAt
        FROM dbo.PickingTasks
        WHERE OrderId = @OrderId
        ORDER BY Id DESC;
      `);

    return result.recordset;
  }

  async findById(id: number): Promise<PickingTaskRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query<PickingTaskRow>(`
        SELECT
          Id,
          OrderId,
          PickerUserId,
          Status,
          AssignedAt,
          StartedAt,
          CompletedAt,
          Notes,
          CreatedAt,
          UpdatedAt
        FROM dbo.PickingTasks
        WHERE Id = @Id;
      `);

    return result.recordset[0] ?? null;
  }

  async findItems(taskId: number): Promise<PickingTaskItemRow[]> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("PickingTaskId", sql.Int, taskId)
      .query<PickingTaskItemRow>(`
        SELECT
          item.Id,
          item.PickingTaskId,
          item.ProductId,
          item.RequiredQuantity,
          item.PickedQuantity,
          item.Status,
          item.BinId,
          item.CreatedAt,
          item.UpdatedAt,
          w.Id AS WarehouseId,
          w.Name AS WarehouseName,
          z.Name AS ZoneName,
          s.Name AS ShelfName,
          b.Name AS BinName
        FROM dbo.PickingTaskItems item
        LEFT JOIN dbo.Bins b ON b.Id = item.BinId
        LEFT JOIN dbo.Shelves s ON s.Id = b.ShelfId
        LEFT JOIN dbo.Zones z ON z.Id = s.ZoneId
        LEFT JOIN dbo.Warehouses w ON w.Id = z.WarehouseId
        WHERE item.PickingTaskId = @PickingTaskId
        ORDER BY item.Id;
      `);

    return result.recordset;
  }

  async assign(
    id: number,
    pickerUserId: number,
  ): Promise<PickingTaskRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("PickerUserId", sql.Int, pickerUserId)
      .query<PickingTaskRow>(`
        UPDATE dbo.PickingTasks
        SET
          PickerUserId = @PickerUserId,
          Status = 'ASSIGNED',
          AssignedAt = SYSUTCDATETIME(),
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderId,
          INSERTED.PickerUserId,
          INSERTED.Status,
          INSERTED.AssignedAt,
          INSERTED.StartedAt,
          INSERTED.CompletedAt,
          INSERTED.Notes,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @Id
          AND Status = 'PENDING';

      `);

    return result.recordset[0] ?? null;
  }

  async start(
    id: number,
    actorUserId: number | null = null,
  ): Promise<PickingTaskRow | null> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const taskResult = await new sql.Request(transaction)
        .input("Id", sql.Int, id)
        .query<PickingTaskRow>(`
          UPDATE dbo.PickingTasks
          SET
            Status = 'PICKING',
            StartedAt = SYSUTCDATETIME(),
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.Id,
            INSERTED.OrderId,
            INSERTED.PickerUserId,
            INSERTED.Status,
            INSERTED.AssignedAt,
            INSERTED.StartedAt,
            INSERTED.CompletedAt,
            INSERTED.Notes,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt
          WHERE Id = @Id
            AND Status = 'ASSIGNED';

        `);

      const task = taskResult.recordset[0];

      if (!task) {
        await transaction.rollback();
        return null;
      }

      await recordStatusChange({
        transaction,
        orderId: task.OrderId,
        fromStatus: "STOCK_RESERVED",
        toStatus: "PICKING",
        changedBy: actorUserId,
        reason: "Picking started",
      });

      await transaction.commit();

      return task;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateItem(
    taskId: number,
    itemId: number,
    pickedQuantity: number,
  ) {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("TaskId", sql.Int, taskId)
      .input("ItemId", sql.Int, itemId)
      .input("PickedQuantity", sql.Int, pickedQuantity)
      .query(`
        UPDATE item
        SET
          PickedQuantity = @PickedQuantity,
          Status =
            CASE
              WHEN @PickedQuantity = RequiredQuantity THEN 'PICKED'
              WHEN @PickedQuantity > 0 THEN 'PARTIAL'
              ELSE 'PENDING'
            END,
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.PickingTaskId,
          INSERTED.ProductId,
          INSERTED.RequiredQuantity,
          INSERTED.PickedQuantity,
          INSERTED.Status,
          INSERTED.BinId,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        FROM dbo.PickingTaskItems AS item
        INNER JOIN dbo.PickingTasks AS task
          ON task.Id = item.PickingTaskId
        WHERE item.Id = @ItemId
          AND item.PickingTaskId = @TaskId
          AND task.Status = 'PICKING'
          AND @PickedQuantity <= item.RequiredQuantity;
      `);

    return result.recordset[0] ?? null;
  }

  async complete(
    id: number,
    notes?: string,
    actorUserId: number | null = null,
  ): Promise<PickingTaskRow | null> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const request = new sql.Request(transaction)
        .input("Id", sql.Int, id);

      if (notes !== undefined) {
        request.input("Notes", sql.NVarChar(1000), notes);
      }

      const result = await request.query<PickingTaskRow>(`
        UPDATE dbo.PickingTasks
        SET
          Status = 'PICKED',
          CompletedAt = SYSUTCDATETIME(),
          UpdatedAt = SYSUTCDATETIME()
          ${notes !== undefined ? ", Notes = @Notes" : ""}
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderId,
          INSERTED.PickerUserId,
          INSERTED.Status,
          INSERTED.AssignedAt,
          INSERTED.StartedAt,
          INSERTED.CompletedAt,
          INSERTED.Notes,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @Id
          AND Status = 'PICKING';
      `);

      const task = result.recordset[0];

      if (!task) {
        await transaction.rollback();
        return null;
      }

      const reservationRequest = new sql.Request(transaction)
        .input("OrderId", sql.Int, task.OrderId);

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
            ReservedQuantity = ReservedQuantity - @Quantity,
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.BinId,
            DELETED.ReservedQuantity AS PreviousReservedQuantity,
            INSERTED.ReservedQuantity AS NewReservedQuantity
          WHERE Id = @InventoryId
            AND ReservedQuantity >= @Quantity;
        `);

        if (inventoryResult.rowsAffected[0] !== 1) {
          throw new Error(
            `Inventory ${reservation.InventoryId} cannot consume reserved quantity ${reservation.Quantity}.`,
          );
        }

        const consumedInventory = inventoryResult.recordset[0];

        await insertInventoryTransactionInTransaction(transaction, {
          inventoryId: reservation.InventoryId,
          transactionType: "PICK_CONSUME",
          quantity: reservation.Quantity,
          previousQuantity: consumedInventory.PreviousReservedQuantity,
          newQuantity: consumedInventory.NewReservedQuantity,
          orderId: task.OrderId,
          referenceType: "PICKING_TASK",
          referenceId: task.Id,
          userId: actorUserId,
          binId: consumedInventory.BinId,
        });

        const consumeRequest = new sql.Request(transaction)
          .input("ReservationId", sql.Int, reservation.Id);

        const consumeResult = await consumeRequest.query(`
          UPDATE dbo.OrderInventoryReservations
          SET
            Status = 'CONSUMED',
            UpdatedAt = SYSUTCDATETIME()
          WHERE Id = @ReservationId
            AND Status = 'RESERVED';
        `);

        if (consumeResult.rowsAffected[0] !== 1) {
          throw new Error(
            `Reservation ${reservation.Id} could not be marked as CONSUMED.`,
          );
        }
      }

      await recordStatusChange({
        transaction,
        orderId: task.OrderId,
        fromStatus: "PICKING",
        toStatus: "PICKED",
        changedBy: actorUserId,
        reason: "Picking completed",
      });

      const packingRepository = new PackingRepository();

      await packingRepository.createTaskInTransaction(
        transaction,
        task.OrderId,
        task.Id,
        "Automatically created after picking completion",
      );

      await transaction.commit();

      return task;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
