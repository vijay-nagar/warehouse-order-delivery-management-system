USE [WarehouseOrderDelivery];
GO

SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_Packages_PackingTask_PackageNumber'
      AND object_id = OBJECT_ID('dbo.Packages')
)
BEGIN
    CREATE UNIQUE INDEX UX_Packages_PackingTask_PackageNumber
    ON dbo.Packages(PackingTaskId, PackageNumber);
END;
GO
