import sql from "mssql";
import { getDatabasePool } from "../config/database.js";
import { recordStatusChange } from "../services/order-status.service.js";
import {
  getPaginationOffset,
  getTotalPages,
} from "../shared/pagination/pagination.js";
import type {
  PaginationRequest,
  PaginationResult,
} from "../shared/pagination/pagination.types.js";

export interface PackingTaskRow {
  Id: number;
  OrderId: number;
  PickingTaskId: number;
  PackerUserId: number | null;
  Status: string;
  PackageCount: number;
  AssignedAt: Date | null;
  StartedAt: Date | null;
  CompletedAt: Date | null;
  Notes: string;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface PackageRow {
  Id: number;
  PackingTaskId: number;
  OrderId: number;
  PackageNumber: number;
  TrackingCode: string;
  Weight: number | null;
  Status: string;
  PackedAt: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export class PackingRepository {
  async createTask(
    orderId: number,
    pickingTaskId: number,
    notes: string,
  ): Promise<PackingTaskRow> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("PickingTaskId", sql.Int, pickingTaskId)
      .input("Notes", sql.NVarChar(1000), notes)
      .query<PackingTaskRow>(`
        INSERT INTO dbo.PackingTasks
        (
          OrderId,
          PickingTaskId,
          PackerUserId,
          Status,
          PackageCount,
          Notes,
          CreatedAt,
          UpdatedAt
        )
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderId,
          INSERTED.PickingTaskId,
          INSERTED.PackerUserId,
          INSERTED.Status,
          INSERTED.PackageCount,
          INSERTED.AssignedAt,
          INSERTED.StartedAt,
          INSERTED.CompletedAt,
          INSERTED.Notes,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        VALUES
        (
          @OrderId,
          @PickingTaskId,
          NULL,
          'PENDING',
          0,
          @Notes,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Failed to create packing task");
    }

    return row;
  }

  async createTaskInTransaction(
    transaction: sql.Transaction,
    orderId: number,
    pickingTaskId: number,
    notes: string,
  ): Promise<PackingTaskRow> {
    const result = await new sql.Request(transaction)
      .input("OrderId", sql.Int, orderId)
      .input("PickingTaskId", sql.Int, pickingTaskId)
      .input("Notes", sql.NVarChar(1000), notes)
      .query<PackingTaskRow>(`
        INSERT INTO dbo.PackingTasks
        (
          OrderId,
          PickingTaskId,
          PackerUserId,
          Status,
          PackageCount,
          Notes,
          CreatedAt,
          UpdatedAt
        )
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderId,
          INSERTED.PickingTaskId,
          INSERTED.PackerUserId,
          INSERTED.Status,
          INSERTED.PackageCount,
          INSERTED.AssignedAt,
          INSERTED.StartedAt,
          INSERTED.CompletedAt,
          INSERTED.Notes,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        VALUES
        (
          @OrderId,
          @PickingTaskId,
          NULL,
          'PENDING',
          0,
          @Notes,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Failed to create packing task in transaction");
    }

    return row;
  }

  async findAll(
    pagination: PaginationRequest,
    filters?: { status?: string; packerUserId?: number },
  ): Promise<PaginationResult<PackingTaskRow>> {
    const pool = await getDatabasePool();
    const offset = getPaginationOffset(pagination.page, pagination.pageSize);

    const conditions: string[] = [];
    if (filters?.status) conditions.push("Status = @Status");
    if (filters?.packerUserId) conditions.push("PackerUserId = @PackerUserId");
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRequest = pool.request();
    if (filters?.status) countRequest.input("Status", sql.NVarChar(20), filters.status);
    if (filters?.packerUserId) countRequest.input("PackerUserId", sql.Int, filters.packerUserId);

    const countResult = await countRequest.query<{ TotalCount: number }>(`
      SELECT COUNT(*) AS TotalCount FROM dbo.PackingTasks ${whereClause};
    `);

    const totalCount = countResult.recordset[0]?.TotalCount ?? 0;
    const totalPages = getTotalPages(totalCount, pagination.pageSize);

    const listRequest = pool
      .request()
      .input("Offset", sql.Int, offset)
      .input("PageSize", sql.Int, pagination.pageSize);
    if (filters?.status) listRequest.input("Status", sql.NVarChar(20), filters.status);
    if (filters?.packerUserId) listRequest.input("PackerUserId", sql.Int, filters.packerUserId);

    const result = await listRequest.query<PackingTaskRow>(`
      SELECT
        Id,
        OrderId,
        PickingTaskId,
        PackerUserId,
        Status,
        PackageCount,
        AssignedAt,
        StartedAt,
        CompletedAt,
        Notes,
        CreatedAt,
        UpdatedAt
      FROM dbo.PackingTasks
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

  async findById(id: number): Promise<PackingTaskRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query<PackingTaskRow>(`
        SELECT
          Id,
          OrderId,
          PickingTaskId,
          PackerUserId,
          Status,
          PackageCount,
          AssignedAt,
          StartedAt,
          CompletedAt,
          Notes,
          CreatedAt,
          UpdatedAt
        FROM dbo.PackingTasks
        WHERE Id = @Id;
      `);

    return result.recordset[0] ?? null;
  }

  async assign(
    id: number,
    packerUserId: number,
  ): Promise<PackingTaskRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("PackerUserId", sql.Int, packerUserId)
      .query<PackingTaskRow>(`
        UPDATE dbo.PackingTasks
        SET
          PackerUserId = @PackerUserId,
          Status = 'ASSIGNED',
          AssignedAt = SYSUTCDATETIME(),
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderId,
          INSERTED.PickingTaskId,
          INSERTED.PackerUserId,
          INSERTED.Status,
          INSERTED.PackageCount,
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

  async reassign(
    id: number,
    packerUserId: number,
  ): Promise<PackingTaskRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("PackerUserId", sql.Int, packerUserId)
      .query<PackingTaskRow>(`
        UPDATE dbo.PackingTasks
        SET
          PackerUserId = @PackerUserId,
          AssignedAt = SYSUTCDATETIME(),
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.OrderId,
          INSERTED.PickingTaskId,
          INSERTED.PackerUserId,
          INSERTED.Status,
          INSERTED.PackageCount,
          INSERTED.AssignedAt,
          INSERTED.StartedAt,
          INSERTED.CompletedAt,
          INSERTED.Notes,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @Id
          AND Status = 'ASSIGNED';
      `);

    return result.recordset[0] ?? null;
  }

  async start(
    id: number,
    actorUserId: number | null = null,
  ): Promise<PackingTaskRow | null> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const result = await new sql.Request(transaction)
        .input("Id", sql.Int, id)
        .query<PackingTaskRow>(`
          UPDATE dbo.PackingTasks
          SET
            Status = 'PACKING',
            StartedAt = SYSUTCDATETIME(),
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.Id,
            INSERTED.OrderId,
            INSERTED.PickingTaskId,
            INSERTED.PackerUserId,
            INSERTED.Status,
            INSERTED.PackageCount,
            INSERTED.AssignedAt,
            INSERTED.StartedAt,
            INSERTED.CompletedAt,
            INSERTED.Notes,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt
          WHERE Id = @Id
            AND Status = 'ASSIGNED';
        `);

      const task = result.recordset[0];

      if (!task) {
        await transaction.rollback();
        return null;
      }

      await recordStatusChange({
        transaction,
        orderId: task.OrderId,
        fromStatus: "PICKED",
        toStatus: "PACKING",
        changedBy: actorUserId,
        reason: "Packing started",
      });

      await transaction.commit();

      return task;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async complete(
    id: number,
    notes?: string,
    actorUserId: number | null = null,
  ): Promise<PackingTaskRow | null> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const result = await new sql.Request(transaction)
        .input("Id", sql.Int, id)
        .input("Notes", sql.NVarChar(1000), notes ?? null)
        .query<PackingTaskRow>(`
          UPDATE dbo.PackingTasks
          SET
            Status = 'PACKED',
            CompletedAt = SYSUTCDATETIME(),
            Notes = COALESCE(@Notes, Notes),
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.Id,
            INSERTED.OrderId,
            INSERTED.PickingTaskId,
            INSERTED.PackerUserId,
            INSERTED.Status,
            INSERTED.PackageCount,
            INSERTED.AssignedAt,
            INSERTED.StartedAt,
            INSERTED.CompletedAt,
            INSERTED.Notes,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt
          WHERE Id = @Id
            AND Status = 'PACKING';
        `);

      const task = result.recordset[0];

      if (!task) {
        await transaction.rollback();
        return null;
      }

      await new sql.Request(transaction)
        .input("PackingTaskId", sql.Int, id)
        .query(`
          UPDATE dbo.Packages
          SET
            Status = 'PACKED',
            PackedAt = SYSUTCDATETIME(),
            UpdatedAt = SYSUTCDATETIME()
          WHERE PackingTaskId = @PackingTaskId
            AND Status = 'CREATED';
        `);

      await recordStatusChange({
        transaction,
        orderId: task.OrderId,
        fromStatus: "PACKING",
        toStatus: "PACKED",
        changedBy: actorUserId,
        reason: "Packing completed",
      });

      await transaction.commit();

      return task;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createPackage(
    packingTaskId: number,
    orderId: number,
    packageNumber: number,
    trackingCode: string,
    weight: number | null,
  ): Promise<PackageRow> {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const taskResult = await new sql.Request(transaction)
        .input("PackingTaskId", sql.Int, packingTaskId)
        .query<{ OrderId: number; Status: string }>(`
          SELECT
            OrderId,
            Status
          FROM dbo.PackingTasks WITH (UPDLOCK, HOLDLOCK)
          WHERE Id = @PackingTaskId;
        `);

      const task = taskResult.recordset[0];

      if (!task) {
        throw new Error("Packing task not found");
      }

      if (task.Status !== "PACKING") {
        throw new Error("Packing task must be in PACKING status");
      }

      if (task.OrderId !== orderId) {
        throw new Error("Packing task does not belong to the order");
      }

      const numberResult = await new sql.Request(transaction)
        .input("PackingTaskId", sql.Int, packingTaskId)
        .query<{ NextPackageNumber: number }>(`
          SELECT
            ISNULL(MAX(PackageNumber), 0) + 1 AS NextPackageNumber
          FROM dbo.Packages WITH (UPDLOCK, HOLDLOCK)
          WHERE PackingTaskId = @PackingTaskId;
        `);

      const nextPackageNumber =
        numberResult.recordset[0]?.NextPackageNumber ?? 1;

      const finalPackageNumber =
        packageNumber === nextPackageNumber
          ? packageNumber
          : nextPackageNumber;

      const result = await new sql.Request(transaction)
        .input("PackingTaskId", sql.Int, packingTaskId)
        .input("OrderId", sql.Int, orderId)
        .input("PackageNumber", sql.Int, finalPackageNumber)
        .input("TrackingCode", sql.NVarChar(100), trackingCode)
        .input("Weight", sql.Decimal(18, 2), weight)
        .query<PackageRow>(`
          INSERT INTO dbo.Packages
          (
            PackingTaskId,
            OrderId,
            PackageNumber,
            TrackingCode,
            Weight,
            Status,
            PackedAt,
            CreatedAt,
            UpdatedAt
          )
          OUTPUT
            INSERTED.Id,
            INSERTED.PackingTaskId,
            INSERTED.OrderId,
            INSERTED.PackageNumber,
            INSERTED.TrackingCode,
            INSERTED.Weight,
            INSERTED.Status,
            INSERTED.PackedAt,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt
          VALUES
          (
            @PackingTaskId,
            @OrderId,
            @PackageNumber,
            @TrackingCode,
            @Weight,
            'CREATED',
            NULL,
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
          );
        `);

      const row = result.recordset[0];

      if (!row) {
        throw new Error("Failed to create package");
      }

      const countResult = await new sql.Request(transaction)
        .input("PackingTaskId", sql.Int, packingTaskId)
        .query<{ PackageCount: number }>(`
          SELECT COUNT(*) AS PackageCount
          FROM dbo.Packages
          WHERE PackingTaskId = @PackingTaskId;
        `);

      const packageCount =
        countResult.recordset[0]?.PackageCount ?? 0;

      await new sql.Request(transaction)
        .input("PackingTaskId", sql.Int, packingTaskId)
        .input("PackageCount", sql.Int, packageCount)
        .query(`
          UPDATE dbo.PackingTasks
          SET
            PackageCount = @PackageCount,
            UpdatedAt = SYSUTCDATETIME()
          WHERE Id = @PackingTaskId
            AND Status = 'PACKING';
        `);

      await transaction.commit();

      return row;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getPackageCount(packingTaskId: number): Promise<number> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("PackingTaskId", sql.Int, packingTaskId)
      .query<{ PackageCount: number }>(`
        SELECT COUNT(*) AS PackageCount
        FROM dbo.Packages
        WHERE PackingTaskId = @PackingTaskId;
      `);

    return result.recordset[0]?.PackageCount ?? 0;
  }

}
