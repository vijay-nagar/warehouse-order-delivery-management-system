USE [WarehouseOrderDelivery];
GO

IF OBJECT_ID('dbo.PackingTasks', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PackingTasks
    (
        Id INT IDENTITY(1,1) NOT NULL,
        OrderId INT NOT NULL,
        PickingTaskId INT NOT NULL DEFAULT 0,
        PackerUserId INT NOT NULL DEFAULT 0,
        Status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
        PackageCount INT NOT NULL DEFAULT 1,
        AssignedAt DATETIME2 NULL,
        StartedAt DATETIME2 NULL,
        CompletedAt DATETIME2 NULL,
        Notes NVARCHAR(500) NOT NULL DEFAULT '',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_PackingTasks PRIMARY KEY (Id)
    );
END;
GO

IF OBJECT_ID('dbo.Packages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Packages
    (
        Id INT IDENTITY(1,1) NOT NULL,
        PackingTaskId INT NOT NULL,
        OrderId INT NOT NULL,
        PackageNumber INT NOT NULL DEFAULT 1,
        TrackingCode NVARCHAR(100) NOT NULL DEFAULT '',
        Weight DECIMAL(10,2) NOT NULL DEFAULT 0,
        Status NVARCHAR(30) NOT NULL DEFAULT 'CREATED',
        PackedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Packages PRIMARY KEY (Id)
    );
END;
GO

CREATE INDEX IX_PackingTasks_OrderId
ON dbo.PackingTasks(OrderId);

CREATE INDEX IX_PackingTasks_PackerUserId
ON dbo.PackingTasks(PackerUserId);

CREATE INDEX IX_PackingTasks_Status
ON dbo.PackingTasks(Status);

CREATE INDEX IX_Packages_OrderId
ON dbo.Packages(OrderId);

CREATE INDEX IX_Packages_TrackingCode
ON dbo.Packages(TrackingCode);
GO
