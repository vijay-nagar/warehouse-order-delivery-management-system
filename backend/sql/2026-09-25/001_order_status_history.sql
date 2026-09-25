USE [WarehouseOrderDelivery];
GO

IF OBJECT_ID('dbo.OrderStatusHistory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderStatusHistory
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        OrderId INT NOT NULL,
        FromStatus NVARCHAR(50) NULL,
        ToStatus NVARCHAR(50) NOT NULL,
        ChangedBy INT NULL,
        Reason NVARCHAR(500) NULL,
        ChangedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_OrderStatusHistory_OrderId
        ON dbo.OrderStatusHistory(OrderId);
END;
GO
