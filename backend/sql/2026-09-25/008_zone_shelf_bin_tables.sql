USE [WarehouseOrderDelivery];
GO

-- Zones/Shelves/Bins have had full repository/service/controller/route code
-- (zone.repository.ts, shelf.repository.ts, bin.repository.ts, and their
-- routes) since an earlier session, but no checked-in migration ever created
-- the underlying tables. On a fresh database those routes fail. This creates
-- them now, matching the columns the existing TypeScript types already
-- expect (Zone/Shelf/Bin in backend/src/domain/warehouse/*.types.ts).

/* =========================================================
   ZONES  (Warehouse -> Zone)
   ========================================================= */

IF OBJECT_ID('dbo.Zones', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Zones
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        WarehouseId INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Code NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,

        CONSTRAINT FK_Zones_Warehouses
            FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(Id)
    );

    CREATE UNIQUE INDEX UX_Zones_Warehouse_Code
        ON dbo.Zones(WarehouseId, Code);

    CREATE INDEX IX_Zones_WarehouseId
        ON dbo.Zones(WarehouseId);
END
GO

/* =========================================================
   SHELVES  (Zone -> Shelf)
   ========================================================= */

IF OBJECT_ID('dbo.Shelves', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Shelves
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ZoneId INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Code NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,

        CONSTRAINT FK_Shelves_Zones
            FOREIGN KEY (ZoneId) REFERENCES dbo.Zones(Id)
    );

    CREATE UNIQUE INDEX UX_Shelves_Zone_Code
        ON dbo.Shelves(ZoneId, Code);

    CREATE INDEX IX_Shelves_ZoneId
        ON dbo.Shelves(ZoneId);
END
GO

/* =========================================================
   BINS  (Shelf -> Bin)
   ========================================================= */

IF OBJECT_ID('dbo.Bins', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Bins
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ShelfId INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Code NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,

        CONSTRAINT FK_Bins_Shelves
            FOREIGN KEY (ShelfId) REFERENCES dbo.Shelves(Id)
    );

    CREATE UNIQUE INDEX UX_Bins_Shelf_Code
        ON dbo.Bins(ShelfId, Code);

    CREATE INDEX IX_Bins_ShelfId
        ON dbo.Bins(ShelfId);
END
GO

/* =========================================================
   VERIFICATION
   ========================================================= */

SELECT
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME IN ('Zones', 'Shelves', 'Bins')
ORDER BY TABLE_NAME;
GO
