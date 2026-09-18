USE [WarehouseOrderDelivery];
GO

IF OBJECT_ID('dbo.Deliveries', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Deliveries
    (
        Id INT IDENTITY(1,1) NOT NULL,
        OrderId INT NOT NULL,
        PackageId INT NOT NULL DEFAULT 0,
        DeliveryBoyUserId INT NOT NULL DEFAULT 0,
        Status NVARCHAR(40) NOT NULL DEFAULT 'PENDING',
        AssignedAt DATETIME2 NULL,
        PickedUpAt DATETIME2 NULL,
        OutForDeliveryAt DATETIME2 NULL,
        DeliveredAt DATETIME2 NULL,
        FailedAt DATETIME2 NULL,
        ReturnedAt DATETIME2 NULL,
        FailureReason NVARCHAR(500) NOT NULL DEFAULT '',
        ReturnReason NVARCHAR(500) NOT NULL DEFAULT '',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Deliveries PRIMARY KEY (Id)
    );
END;
GO

IF OBJECT_ID('dbo.DeliveryTracking', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DeliveryTracking
    (
        Id INT IDENTITY(1,1) NOT NULL,
        DeliveryId INT NOT NULL,
        Status NVARCHAR(40) NOT NULL DEFAULT 'PENDING',
        Latitude DECIMAL(10,7) NOT NULL DEFAULT 0,
        Longitude DECIMAL(10,7) NOT NULL DEFAULT 0,
        Remarks NVARCHAR(500) NOT NULL DEFAULT '',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_DeliveryTracking PRIMARY KEY (Id)
    );
END;
GO

IF OBJECT_ID('dbo.DeliveryAttempts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DeliveryAttempts
    (
        Id INT IDENTITY(1,1) NOT NULL,
        DeliveryId INT NOT NULL,
        AttemptNumber INT NOT NULL DEFAULT 1,
        Status NVARCHAR(30) NOT NULL DEFAULT 'FAILED',
        FailureReason NVARCHAR(500) NOT NULL DEFAULT '',
        AttemptedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_DeliveryAttempts PRIMARY KEY (Id)
    );
END;
GO

CREATE INDEX IX_Deliveries_OrderId
ON dbo.Deliveries(OrderId);

CREATE INDEX IX_Deliveries_DeliveryBoyUserId
ON dbo.Deliveries(DeliveryBoyUserId);

CREATE INDEX IX_Deliveries_Status
ON dbo.Deliveries(Status);

CREATE INDEX IX_DeliveryTracking_DeliveryId
ON dbo.DeliveryTracking(DeliveryId);

CREATE INDEX IX_DeliveryAttempts_DeliveryId
ON dbo.DeliveryAttempts(DeliveryId);
GO
