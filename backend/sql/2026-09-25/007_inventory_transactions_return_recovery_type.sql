USE [WarehouseOrderDelivery];
GO

-- InventoryTransactions already existed in some deployed databases (created
-- out-of-band, not by any checked-in script prior to this folder — see
-- 003_inventory_transactions.sql's guard comment) with a narrower
-- CK_InventoryTransactions_Type that only allowed IN/OUT/ADJUSTMENT. Widen
-- it to also allow RETURN_RECOVERY (used by delivery return stock
-- recovery), without assuming which shape is currently deployed.
IF EXISTS (
    SELECT 1
    FROM sys.check_constraints cc
    JOIN sys.tables t ON t.object_id = cc.parent_object_id
    WHERE t.name = 'InventoryTransactions'
      AND cc.name = 'CK_InventoryTransactions_Type'
      AND cc.definition NOT LIKE '%RETURN_RECOVERY%'
)
BEGIN
    ALTER TABLE dbo.InventoryTransactions
        DROP CONSTRAINT CK_InventoryTransactions_Type;

    ALTER TABLE dbo.InventoryTransactions WITH CHECK ADD CONSTRAINT CK_InventoryTransactions_Type
        CHECK (TransactionType IN ('IN', 'OUT', 'ADJUSTMENT', 'RETURN_RECOVERY'));
END;
GO
