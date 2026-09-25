USE [WarehouseOrderDelivery];
GO

IF OBJECT_ID('dbo.InventoryTransactions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.InventoryTransactions
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        InventoryId INT NOT NULL,
        TransactionType NVARCHAR(20) NOT NULL,
        Quantity INT NOT NULL,
        PreviousQuantity INT NOT NULL,
        NewQuantity INT NOT NULL,
        Remarks NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT CK_InventoryTransactions_Type
            CHECK (TransactionType IN ('IN', 'OUT', 'ADJUSTMENT', 'RETURN_RECOVERY'))
    );

    CREATE INDEX IX_InventoryTransactions_InventoryId
        ON dbo.InventoryTransactions(InventoryId);
END;
GO
