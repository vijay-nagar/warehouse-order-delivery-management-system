USE [WarehouseOrderDelivery];
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PICKING_CREATE')
BEGIN
    INSERT INTO dbo.Permissions (Name, IsActive)
    VALUES ('PICKING_CREATE', 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PICKING_VIEW')
BEGIN
    INSERT INTO dbo.Permissions (Name, IsActive)
    VALUES ('PICKING_VIEW', 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PICKING_ASSIGN')
BEGIN
    INSERT INTO dbo.Permissions (Name, IsActive)
    VALUES ('PICKING_ASSIGN', 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PICKING_START')
BEGIN
    INSERT INTO dbo.Permissions (Name, IsActive)
    VALUES ('PICKING_START', 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PICKING_COMPLETE')
BEGIN
    INSERT INTO dbo.Permissions (Name, IsActive)
    VALUES ('PICKING_COMPLETE', 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PICKING_UPDATE_ITEM')
BEGIN
    INSERT INTO dbo.Permissions (Name, IsActive)
    VALUES ('PICKING_UPDATE_ITEM', 1);
END;
GO
