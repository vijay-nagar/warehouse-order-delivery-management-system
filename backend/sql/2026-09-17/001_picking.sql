USE [WarehouseOrderDelivery];
GO

IF OBJECT_ID('dbo.PickingTasks', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PickingTasks
    (
        Id INT IDENTITY(1,1) NOT NULL,
        OrderId INT NOT NULL,
        PickerUserId INT NOT NULL DEFAULT 0,
        Status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
        AssignedAt DATETIME2 NULL,
        StartedAt DATETIME2 NULL,
        CompletedAt DATETIME2 NULL,
        Notes NVARCHAR(500) NOT NULL DEFAULT '',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_PickingTasks PRIMARY KEY (Id)
    );
END;
GO

IF OBJECT_ID('dbo.PickingTaskItems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PickingTaskItems
    (
        Id INT IDENTITY(1,1) NOT NULL,
        PickingTaskId INT NOT NULL,
        ProductId INT NOT NULL,
        RequiredQuantity INT NOT NULL DEFAULT 0,
        PickedQuantity INT NOT NULL DEFAULT 0,
        Status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_PickingTaskItems PRIMARY KEY (Id)
    );
END;
GO

CREATE INDEX IX_PickingTasks_OrderId
ON dbo.PickingTasks(OrderId);

CREATE INDEX IX_PickingTasks_PickerUserId
ON dbo.PickingTasks(PickerUserId);

CREATE INDEX IX_PickingTasks_Status
ON dbo.PickingTasks(Status);

CREATE INDEX IX_PickingTaskItems_PickingTaskId
ON dbo.PickingTaskItems(PickingTaskId);
GO
