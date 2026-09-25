USE [WarehouseOrderDelivery];
GO

-- Bin-based picking: each picking task item records the Bin it was sourced
-- from (copied from the Inventory row's BinId at reservation/task-creation
-- time), so the picker UI can show the exact Warehouse/Zone/Shelf/Bin to
-- pick from, and completion can reject a mismatched bin. Nullable because
-- the source Inventory row may not have a Bin assigned yet.
IF COL_LENGTH('dbo.PickingTaskItems', 'BinId') IS NULL
BEGIN
    ALTER TABLE dbo.PickingTaskItems
    ADD BinId INT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_PickingTaskItems_Bins'
)
BEGIN
    ALTER TABLE dbo.PickingTaskItems
    ADD CONSTRAINT FK_PickingTaskItems_Bins
        FOREIGN KEY (BinId) REFERENCES dbo.Bins(Id);
END;
GO
