USE [WarehouseOrderDelivery];
GO

-- Audit of existing indexes (2026-09-17/001_picking.sql, 002_packing.sql,
-- 003_delivery.sql) shows PickingTasks/PackingTasks/Deliveries already have
-- indexes on their assignee-user and Status columns, and 2026-09-25/003 and
-- /010 already index InventoryTransactions on InventoryId/OrderId. The one
-- gap for the newly-paginated list endpoints: Notifications has no index on
-- UserId at all (only a PK on Id), yet every notification list query now
-- filters WHERE UserId = @userId (optionally AND IsRead = 0).
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_Notifications_UserId_IsRead'
)
BEGIN
    CREATE INDEX IX_Notifications_UserId_IsRead
        ON dbo.Notifications(UserId, IsRead);
END;
GO
