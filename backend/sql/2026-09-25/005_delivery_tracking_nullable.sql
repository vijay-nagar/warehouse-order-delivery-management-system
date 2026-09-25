USE [WarehouseOrderDelivery];
GO

IF OBJECT_ID('dbo.DeliveryTracking', 'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.DeliveryTracking ALTER COLUMN Latitude DECIMAL(10,7) NULL;
    ALTER TABLE dbo.DeliveryTracking ALTER COLUMN Longitude DECIMAL(10,7) NULL;
    ALTER TABLE dbo.DeliveryTracking ALTER COLUMN Remarks NVARCHAR(500) NULL;
END;
GO
