USE [WarehouseOrderDelivery];
GO

-- Bin-level inventory tracking: each Inventory row (unique per
-- WarehouseId+ProductId) can now record the single Bin it is physically
-- stored in. Nullable so existing rows created before Bins existed remain
-- valid ("unassigned" location) rather than being broken by this migration.
IF COL_LENGTH('dbo.Inventory', 'BinId') IS NULL
BEGIN
    ALTER TABLE dbo.Inventory
    ADD BinId INT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Inventory_Bins'
)
BEGIN
    ALTER TABLE dbo.Inventory
    ADD CONSTRAINT FK_Inventory_Bins
        FOREIGN KEY (BinId) REFERENCES dbo.Bins(Id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_Inventory_BinId'
)
BEGIN
    CREATE INDEX IX_Inventory_BinId
        ON dbo.Inventory(BinId);
END;
GO
