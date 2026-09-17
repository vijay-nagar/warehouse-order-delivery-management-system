USE [WarehouseOrderDelivery];
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'Notifications'
      AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.Notifications
    (
        Id INT IDENTITY(1,1) NOT NULL,
        UserId INT NOT NULL
            CONSTRAINT DF_Notifications_UserId DEFAULT (0),

        Type NVARCHAR(50) NOT NULL
            CONSTRAINT DF_Notifications_Type DEFAULT ('INFO'),

        Title NVARCHAR(200) NOT NULL
            CONSTRAINT DF_Notifications_Title DEFAULT (''),

        Message NVARCHAR(1000) NOT NULL
            CONSTRAINT DF_Notifications_Message DEFAULT (''),

        IsRead BIT NOT NULL
            CONSTRAINT DF_Notifications_IsRead DEFAULT (0),

        CreatedAt DATETIME2 NOT NULL
            CONSTRAINT DF_Notifications_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Notifications PRIMARY KEY (Id)
    );
END;
GO
