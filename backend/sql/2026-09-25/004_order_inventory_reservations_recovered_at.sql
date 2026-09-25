USE [WarehouseOrderDelivery];
GO

IF COL_LENGTH('dbo.OrderInventoryReservations', 'RecoveredAt') IS NULL
BEGIN
    ALTER TABLE dbo.OrderInventoryReservations
    ADD RecoveredAt DATETIME2 NULL;
END;
GO
