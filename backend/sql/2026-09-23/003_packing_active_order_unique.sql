USE [WarehouseOrderDelivery];
GO

SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_PackingTasks_Active_OrderId'
      AND object_id = OBJECT_ID('dbo.PackingTasks')
)
BEGIN
    CREATE UNIQUE INDEX UX_PackingTasks_Active_OrderId
    ON dbo.PackingTasks (OrderId)
    WHERE Status IN ('PENDING', 'ASSIGNED', 'PACKING', 'PACKED');
END;
GO
