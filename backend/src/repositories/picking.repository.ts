import sql from "mssql";

import { getDatabasePool } from "../config/database.js";

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
  ): Promise<void> {
    const pool = await getDatabasePool();

    await pool
      .request()
      .input("PickingTaskId", sql.Int, pickingTaskId)
      .input("ProductId", sql.Int, productId)
      .input("RequiredQuantity", sql.Int, requiredQuantity)
      .query(`
        INSERT INTO dbo.PickingTaskItems
        (
          PickingTaskId,
          ProductId,
          RequiredQuantity,
          PickedQuantity,
          Status,
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
  ): Promise<void> {
    await new sql.Request(transaction)
      .input("PickingTaskId", sql.Int, pickingTaskId)
      .input("ProductId", sql.Int, productId)
      .input("RequiredQuantity", sql.Int, requiredQuantity)
      .query(`
        INSERT INTO dbo.PickingTaskItems
        (
          PickingTaskId,
          ProductId,
          RequiredQuantity,
          PickedQuantity,
          Status,
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
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);
  }

  async findAll(): Promise<PickingTaskRow[]> {
    const pool = await getDatabasePool();

    const result = await pool.request().query<PickingTaskRow>(`
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
          Id,
          PickingTaskId,
          ProductId,
          RequiredQuantity,
          PickedQuantity,
          Status,
          CreatedAt,
          UpdatedAt
        FROM dbo.PickingTaskItems
        WHERE PickingTaskId = @PickingTaskId
        ORDER BY Id;
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
        WHERE Id = @Id;

      `);

    return result.recordset[0] ?? null;
  }

  async start(id: number): Promise<PickingTaskRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
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
        WHERE Id = @Id;

      `);

    return result.recordset[0] ?? null;
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
        UPDATE dbo.PickingTaskItems
        SET
          PickedQuantity = @PickedQuantity,
          Status =
            CASE
              WHEN @PickedQuantity >= RequiredQuantity THEN 'PICKED'
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
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @ItemId
          AND PickingTaskId = @TaskId;
      `);

    return result.recordset[0] ?? null;
  }

  async complete(
    id: number,
    notes?: string,
  ): Promise<PickingTaskRow | null> {
    const pool = await getDatabasePool();

    const request = pool
      .request()
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
      WHERE Id = @Id;
    `);

    return result.recordset[0] ?? null;
  }
}
