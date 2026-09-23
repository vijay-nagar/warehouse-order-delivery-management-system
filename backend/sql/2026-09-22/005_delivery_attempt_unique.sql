USE [WarehouseOrderDelivery];
GO

SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_DeliveryAttempts_DeliveryId_AttemptNumber'
      AND object_id = OBJECT_ID('dbo.DeliveryAttempts')
)
BEGIN
    CREATE UNIQUE INDEX UX_DeliveryAttempts_DeliveryId_AttemptNumber
    ON dbo.DeliveryAttempts(DeliveryId, AttemptNumber);
END;
GO
