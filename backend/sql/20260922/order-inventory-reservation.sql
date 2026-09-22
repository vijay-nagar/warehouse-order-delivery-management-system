IF OBJECT_ID(N'dbo.OrderInventoryReservations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderInventoryReservations
    (
        Id INT IDENTITY(1,1) NOT NULL,
        OrderId INT NOT NULL,
        OrderItemId INT NOT NULL,
        InventoryId INT NOT NULL,
        ProductId INT NOT NULL,
        Quantity INT NOT NULL CONSTRAINT DF_OrderInventoryReservations_Quantity DEFAULT (0),
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_OrderInventoryReservations_Status DEFAULT ('RESERVED'),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_OrderInventoryReservations_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2 NULL,

        CONSTRAINT PK_OrderInventoryReservations PRIMARY KEY (Id),
        CONSTRAINT CK_OrderInventoryReservations_Quantity CHECK (Quantity > 0),
        CONSTRAINT CK_OrderInventoryReservations_Status CHECK (Status IN ('RESERVED', 'RELEASED', 'CONSUMED'))
    );

    CREATE INDEX IX_OrderInventoryReservations_OrderId
        ON dbo.OrderInventoryReservations (OrderId);

    CREATE INDEX IX_OrderInventoryReservations_OrderItemId
        ON dbo.OrderInventoryReservations (OrderItemId);

    CREATE INDEX IX_OrderInventoryReservations_InventoryId
        ON dbo.OrderInventoryReservations (InventoryId);

    CREATE INDEX IX_OrderInventoryReservations_Status
        ON dbo.OrderInventoryReservations (Status);
END;
