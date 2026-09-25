USE [WarehouseOrderDelivery];
GO

-- Inventory-transaction audit trail was previously reachable only for
-- manual Stock IN/OUT/ADJUSTMENT and returned-delivery recovery, and even
-- those only linked back to their cause via a free-text Remarks column. This
-- widens TransactionType to cover the reserve/release/pick-consume paths
-- (which previously mutated Inventory with no transaction record at all)
-- and adds real reference columns so a transaction can point back to the
-- order/item/picking-or-delivery entity and acting user that caused it.

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints cc
    JOIN sys.tables t ON t.object_id = cc.parent_object_id
    WHERE t.name = 'InventoryTransactions'
      AND cc.name = 'CK_InventoryTransactions_Type'
      AND cc.definition NOT LIKE '%RESERVE%'
)
BEGIN
    ALTER TABLE dbo.InventoryTransactions
        DROP CONSTRAINT CK_InventoryTransactions_Type;

    ALTER TABLE dbo.InventoryTransactions WITH CHECK ADD CONSTRAINT CK_InventoryTransactions_Type
        CHECK (TransactionType IN (
            'IN', 'OUT', 'ADJUSTMENT', 'RETURN_RECOVERY',
            'RESERVE', 'RELEASE', 'PICK_CONSUME'
        ));
END;
GO

IF COL_LENGTH('dbo.InventoryTransactions', 'OrderId') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryTransactions
    ADD OrderId INT NULL;
END;
GO

IF COL_LENGTH('dbo.InventoryTransactions', 'OrderItemId') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryTransactions
    ADD OrderItemId INT NULL;
END;
GO

-- Free-form entity kind the transaction is attributed to (e.g. 'PICKING_TASK',
-- 'PACKING_TASK', 'DELIVERY') plus ReferenceId (that entity's Id). Not a
-- foreign key since it can point at different tables depending on ReferenceType.
IF COL_LENGTH('dbo.InventoryTransactions', 'ReferenceType') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryTransactions
    ADD ReferenceType NVARCHAR(30) NULL;
END;
GO

IF COL_LENGTH('dbo.InventoryTransactions', 'ReferenceId') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryTransactions
    ADD ReferenceId INT NULL;
END;
GO

IF COL_LENGTH('dbo.InventoryTransactions', 'UserId') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryTransactions
    ADD UserId INT NULL;
END;
GO

IF COL_LENGTH('dbo.InventoryTransactions', 'BinId') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryTransactions
    ADD BinId INT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_InventoryTransactions_OrderId'
)
BEGIN
    CREATE INDEX IX_InventoryTransactions_OrderId
        ON dbo.InventoryTransactions(OrderId);
END;
GO
