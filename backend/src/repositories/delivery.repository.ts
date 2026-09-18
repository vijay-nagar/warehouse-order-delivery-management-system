import sql from "mssql";
import { getDatabasePool } from "../config/database.js";

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
        WHERE Id = @Id;
      `);

    return result.recordset[0] ?? null;
  }

  async pickup(id: number): Promise<DeliveryRow | null> {
    return this.updateStatus(id, "PICKED_UP", "PickedUpAt");
  }

  async outForDelivery(id: number): Promise<DeliveryRow | null> {
    return this.updateStatus(id, "OUT_FOR_DELIVERY", "OutForDeliveryAt");
  }

  async deliver(id: number): Promise<DeliveryRow | null> {
    return this.updateStatus(id, "DELIVERED", "DeliveredAt");
  }

  async fail(
    id: number,
    reason: string,
  ): Promise<DeliveryRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
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
        WHERE Id = @Id;
      `);

    const row = result.recordset[0] ?? null;

    if (row) {
      const attemptResult = await pool
        .request()
        .input("DeliveryId", sql.Int, id)
        .query<{ AttemptNumber: number }>(`
          SELECT ISNULL(MAX(AttemptNumber), 0) + 1 AS AttemptNumber
          FROM dbo.DeliveryAttempts
          WHERE DeliveryId = @DeliveryId;
        `);

      const attemptNumber =
        attemptResult.recordset[0]?.AttemptNumber ?? 1;

      await pool
        .request()
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
    }

    return row;
  }

  async returnDelivery(
    id: number,
    reason: string,
  ): Promise<DeliveryRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
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
        WHERE Id = @Id;
      `);

    return result.recordset[0] ?? null;
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
  
  private async updateStatus(
    id: number,
    status: string,
    timestampColumn:
      | "PickedUpAt"
      | "OutForDeliveryAt"
      | "DeliveredAt",
  ): Promise<DeliveryRow | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query<DeliveryRow>(`
        UPDATE dbo.Deliveries
        SET
          Status = '${status}',
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
        WHERE Id = @Id;
      `);

    return result.recordset[0] ?? null;
  }
}
