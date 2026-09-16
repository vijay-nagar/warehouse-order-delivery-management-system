USE WarehouseOrderDelivery;
GO

SET QUOTED_IDENTIFIER ON;
GO

USE WarehouseOrderDelivery;
GO

/* =========================================================
   CUSTOMERS
   ========================================================= */

IF OBJECT_ID('dbo.Customers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Customers
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(150) NOT NULL,
        Phone NVARCHAR(20) NOT NULL,
        Email NVARCHAR(150) NULL,
        AddressLine1 NVARCHAR(250) NOT NULL,
        AddressLine2 NVARCHAR(250) NULL,
        City NVARCHAR(100) NOT NULL,
        State NVARCHAR(100) NOT NULL,
        PostalCode NVARCHAR(20) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL
    );
END
GO


/* =========================================================
   WAREHOUSES
   ========================================================= */

IF OBJECT_ID('dbo.Warehouses', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Warehouses
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(150) NOT NULL,
        Code NVARCHAR(50) NOT NULL,
        AddressLine1 NVARCHAR(250) NOT NULL,
        AddressLine2 NVARCHAR(250) NULL,
        City NVARCHAR(100) NOT NULL,
        State NVARCHAR(100) NOT NULL,
        PostalCode NVARCHAR(20) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL
    );

    CREATE UNIQUE INDEX UX_Warehouses_Code
        ON dbo.Warehouses(Code);
END
GO


/* =========================================================
   PRODUCTS
   ========================================================= */

IF OBJECT_ID('dbo.Products', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        SKU NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        Price DECIMAL(18,2) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL
    );

    CREATE UNIQUE INDEX UX_Products_SKU
        ON dbo.Products(SKU);
END
GO


/* =========================================================
   INVENTORY
   ========================================================= */

IF OBJECT_ID('dbo.Inventory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Inventory
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        WarehouseId INT NOT NULL,
        ProductId INT NOT NULL,
        AvailableQuantity INT NOT NULL DEFAULT 0,
        ReservedQuantity INT NOT NULL DEFAULT 0,
        ReorderLevel INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,

        CONSTRAINT CK_Inventory_AvailableQuantity
            CHECK (AvailableQuantity >= 0),

        CONSTRAINT CK_Inventory_ReservedQuantity
            CHECK (ReservedQuantity >= 0),

        CONSTRAINT CK_Inventory_ReorderLevel
            CHECK (ReorderLevel >= 0)
    );

    CREATE UNIQUE INDEX UX_Inventory_Warehouse_Product
        ON dbo.Inventory(WarehouseId, ProductId);
END
GO


/* =========================================================
   ORDERS
   ========================================================= */

IF OBJECT_ID('dbo.Orders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        OrderNumber NVARCHAR(50) NOT NULL,
        CustomerId INT NOT NULL,
        WarehouseId INT NULL,

        Status NVARCHAR(50) NOT NULL
            DEFAULT 'CREATED',

        TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,

        ShippingAddressLine1 NVARCHAR(250) NOT NULL,
        ShippingAddressLine2 NVARCHAR(250) NULL,
        ShippingCity NVARCHAR(100) NOT NULL,
        ShippingState NVARCHAR(100) NOT NULL,
        ShippingPostalCode NVARCHAR(20) NOT NULL,

        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL
    );

    CREATE UNIQUE INDEX UX_Orders_OrderNumber
        ON dbo.Orders(OrderNumber);
END
GO


/* =========================================================
   ORDER ITEMS
   ========================================================= */

IF OBJECT_ID('dbo.OrderItems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderItems
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        OrderId INT NOT NULL,
        ProductId INT NOT NULL,
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL,
        TotalPrice AS (Quantity * UnitPrice) PERSISTED,

        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT CK_OrderItems_Quantity
            CHECK (Quantity > 0),

        CONSTRAINT CK_OrderItems_UnitPrice
            CHECK (UnitPrice >= 0)
    );
END
GO


/* =========================================================
   VERIFICATION
   ========================================================= */

SELECT
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME IN
  (
      'Customers',
      'Warehouses',
      'Products',
      'Inventory',
      'Orders',
      'OrderItems'
  )
ORDER BY TABLE_NAME;
GO