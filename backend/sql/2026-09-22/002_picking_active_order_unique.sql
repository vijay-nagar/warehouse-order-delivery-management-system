USE [WarehouseOrderDelivery];
GO

SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_PickingTasks_Active_OrderId'
      AND object_id = OBJECT_ID('dbo.PickingTasks')
)
BEGIN
    CREATE UNIQUE INDEX UX_PickingTasks_Active_OrderId
    ON dbo.PickingTasks(OrderId)
    WHERE Status IN ('PENDING', 'ASSIGNED', 'PICKING');
END;
GO
