import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import {
  getPaginationOffset,
  getTotalPages,
} from "../shared/pagination/pagination.js";
import type {
  CreateNotificationInput,
  Notification,
  NotificationType,
} from "../domain/notifications/notification.types.js";
import type {
  PaginationRequest,
  PaginationResult,
} from "../shared/pagination/pagination.types.js";

interface NotificationRow {
  Id: number;
  UserId: number;
  Type: string;
  Title: string;
  Message: string;
  IsRead: boolean;
  CreatedAt: Date;
}

const mapNotification = (row: NotificationRow): Notification => ({
  id: row.Id,
  userId: row.UserId,
  type: row.Type as NotificationType,
  title: row.Title,
  message: row.Message,
  isRead: row.IsRead,
  createdAt: row.CreatedAt,
});

export class NotificationRepository {
  async create(
    input: CreateNotificationInput,
  ): Promise<Notification> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("userId", sql.Int, input.userId)
      .input("type", sql.NVarChar(50), input.type)
      .input("title", sql.NVarChar(200), input.title)
      .input("message", sql.NVarChar(1000), input.message)
      .query<NotificationRow>(`
        INSERT INTO dbo.Notifications
        (
          UserId,
          Type,
          Title,
          Message,
          IsRead
        )
        OUTPUT
          INSERTED.Id,
          INSERTED.UserId,
          INSERTED.Type,
          INSERTED.Title,
          INSERTED.Message,
          INSERTED.IsRead,
          INSERTED.CreatedAt
        VALUES
        (
          @userId,
          @type,
          @title,
          @message,
          0
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Notification creation failed");
    }

    return mapNotification(row);
  }

  async findByUserId(
    userId: number,
    pagination: PaginationRequest,
  ): Promise<PaginationResult<Notification>> {
    const pool = await getDatabasePool();
    const offset = getPaginationOffset(pagination.page, pagination.pageSize);

    const countResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query<{ TotalCount: number }>(`
        SELECT COUNT(*) AS TotalCount FROM dbo.Notifications WHERE UserId = @userId;
      `);

    const totalCount = countResult.recordset[0]?.TotalCount ?? 0;
    const totalPages = getTotalPages(totalCount, pagination.pageSize);

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("Offset", sql.Int, offset)
      .input("PageSize", sql.Int, pagination.pageSize)
      .query<NotificationRow>(`
        SELECT
          Id,
          UserId,
          Type,
          Title,
          Message,
          IsRead,
          CreatedAt
        FROM dbo.Notifications
        WHERE UserId = @userId
        ORDER BY Id DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
      `);

    return {
      items: result.recordset.map(mapNotification),
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount,
      totalPages,
    };
  }

  async findUnreadByUserId(
    userId: number,
    pagination: PaginationRequest,
  ): Promise<PaginationResult<Notification>> {
    const pool = await getDatabasePool();
    const offset = getPaginationOffset(pagination.page, pagination.pageSize);

    const countResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query<{ TotalCount: number }>(`
        SELECT COUNT(*) AS TotalCount
        FROM dbo.Notifications
        WHERE UserId = @userId AND IsRead = 0;
      `);

    const totalCount = countResult.recordset[0]?.TotalCount ?? 0;
    const totalPages = getTotalPages(totalCount, pagination.pageSize);

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("Offset", sql.Int, offset)
      .input("PageSize", sql.Int, pagination.pageSize)
      .query<NotificationRow>(`
        SELECT
          Id,
          UserId,
          Type,
          Title,
          Message,
          IsRead,
          CreatedAt
        FROM dbo.Notifications
        WHERE UserId = @userId
          AND IsRead = 0
        ORDER BY Id DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
      `);

    return {
      items: result.recordset.map(mapNotification),
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount,
      totalPages,
    };
  }

  async markAsRead(
    notificationId: number,
    userId: number,
  ): Promise<Notification | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("notificationId", sql.Int, notificationId)
      .input("userId", sql.Int, userId)
      .query<NotificationRow>(`
        UPDATE dbo.Notifications
        SET IsRead = 1
        WHERE Id = @notificationId
          AND UserId = @userId;

        SELECT
          Id,
          UserId,
          Type,
          Title,
          Message,
          IsRead,
          CreatedAt
        FROM dbo.Notifications
        WHERE Id = @notificationId
          AND UserId = @userId;
      `);

    const row = result.recordset[0];

    return row ? mapNotification(row) : null;
  }
}
