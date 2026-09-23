USE [WarehouseOrderDelivery];
GO

SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_OrderInventoryReservations_Active_OrderItem'
      AND object_id = OBJECT_ID('dbo.OrderInventoryReservations')
)
BEGIN
    CREATE UNIQUE INDEX UX_OrderInventoryReservations_Active_OrderItem
    ON dbo.OrderInventoryReservations(OrderId, OrderItemId)
    WHERE Status = 'RESERVED';
END;
GO
