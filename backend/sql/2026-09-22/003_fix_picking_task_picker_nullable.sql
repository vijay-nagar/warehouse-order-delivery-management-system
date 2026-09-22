USE [WarehouseOrderDelivery];
GO

IF OBJECT_ID('dbo.PickingTasks', 'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.PickingTasks
    ALTER COLUMN PickerUserId INT NULL;
END;
GO
