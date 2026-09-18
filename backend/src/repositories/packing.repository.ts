import sql from "mssql";
import { getDatabasePool } from "../config/database.js";

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

  async findAll(): Promise<PackingTaskRow[]> {
    const pool = await getDatabasePool();

    const result = await pool.request().query<PackingTaskRow>(`
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
      ORDER BY Id DESC;
    `);

    return result.recordset;
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
        WHERE Id = @Id;
      `);

    return result.recordset[0] ?? null;
  }

  async start(id: number): Promise<PackingTaskRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
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
        WHERE Id = @Id;
      `);

    return result.recordset[0] ?? null;
  }

  async complete(
    id: number,
    notes?: string,
  ): Promise<PackingTaskRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
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
        WHERE Id = @Id;
      `);

    return result.recordset[0] ?? null;
  }

  async createPackage(
    packingTaskId: number,
    orderId: number,
    packageNumber: number,
    trackingCode: string,
    weight: number | null,
  ): Promise<PackageRow> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("PackingTaskId", sql.Int, packingTaskId)
      .input("OrderId", sql.Int, orderId)
      .input("PackageNumber", sql.Int, packageNumber)
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

    await pool
      .request()
      .input("PackingTaskId", sql.Int, packingTaskId)
      .query(`
        UPDATE dbo.PackingTasks
        SET
          PackageCount = (
            SELECT COUNT(*)
            FROM dbo.Packages
            WHERE PackingTaskId = @PackingTaskId
          ),
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @PackingTaskId;
      `);

    return row;
  }

  async getPackageCount(packingTaskId: number): Promise<number> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("PackingTaskId", sql.Int, packingTaskId)
      .query<{ Count: number }>(`
        SELECT COUNT(*) AS Count
        FROM dbo.Packages
        WHERE PackingTaskId = @PackingTaskId;
      `);

    return result.recordset[0]?.Count ?? 0;
  }
}
