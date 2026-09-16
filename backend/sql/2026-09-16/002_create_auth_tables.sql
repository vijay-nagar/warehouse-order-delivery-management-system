SET QUOTED_IDENTIFIER ON;
GO

USE WarehouseOrderDelivery;
GO

/* =========================================================
   USERS
   ========================================================= */

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,

        Username NVARCHAR(100) NOT NULL,
        Email NVARCHAR(150) NULL,
        PasswordHash NVARCHAR(255) NOT NULL,

        IsActive BIT NOT NULL DEFAULT 1,

        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL
    );

    CREATE UNIQUE INDEX UX_Users_Username
        ON dbo.Users(Username);

    CREATE UNIQUE INDEX UX_Users_Email
        ON dbo.Users(Email)
        WHERE Email IS NOT NULL;
END
GO


/* =========================================================
   ROLES
   ========================================================= */

IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,

        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(250) NULL,

        IsActive BIT NOT NULL DEFAULT 1,

        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL
    );

    CREATE UNIQUE INDEX UX_Roles_Name
        ON dbo.Roles(Name);
END
GO


/* =========================================================
   PERMISSIONS
   ========================================================= */

IF OBJECT_ID('dbo.Permissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Permissions
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,

        Name NVARCHAR(150) NOT NULL,
        Description NVARCHAR(250) NULL,

        IsActive BIT NOT NULL DEFAULT 1,

        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL
    );

    CREATE UNIQUE INDEX UX_Permissions_Name
        ON dbo.Permissions(Name);
END
GO


/* =========================================================
   USER ROLES
   ========================================================= */

IF OBJECT_ID('dbo.UserRoles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserRoles
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,

        UserId INT NOT NULL,
        RoleId INT NOT NULL,

        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE INDEX UX_UserRoles_User_Role
        ON dbo.UserRoles(UserId, RoleId);
END
GO


/* =========================================================
   ROLE PERMISSIONS
   ========================================================= */

IF OBJECT_ID('dbo.RolePermissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RolePermissions
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,

        RoleId INT NOT NULL,
        PermissionId INT NOT NULL,

        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE INDEX UX_RolePermissions_Role_Permission
        ON dbo.RolePermissions(RoleId, PermissionId);
END
GO


/* =========================================================
   DEFAULT ROLES
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = 'Super Admin')
    INSERT INTO dbo.Roles (Name, Description)
    VALUES ('Super Admin', 'Full system access');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = 'Warehouse Manager')
    INSERT INTO dbo.Roles (Name, Description)
    VALUES ('Warehouse Manager', 'Manages warehouse operations');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = 'Warehouse Staff')
    INSERT INTO dbo.Roles (Name, Description)
    VALUES ('Warehouse Staff', 'Performs warehouse operations');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = 'Inventory Manager')
    INSERT INTO dbo.Roles (Name, Description)
    VALUES ('Inventory Manager', 'Manages inventory');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = 'Picker')
    INSERT INTO dbo.Roles (Name, Description)
    VALUES ('Picker', 'Performs order picking');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = 'Packer')
    INSERT INTO dbo.Roles (Name, Description)
    VALUES ('Packer', 'Performs order packing');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = 'Delivery Manager')
    INSERT INTO dbo.Roles (Name, Description)
    VALUES ('Delivery Manager', 'Manages delivery operations');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = 'Delivery Boy')
    INSERT INTO dbo.Roles (Name, Description)
    VALUES ('Delivery Boy', 'Performs customer deliveries');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = 'Support Staff')
    INSERT INTO dbo.Roles (Name, Description)
    VALUES ('Support Staff', 'Handles customer support');


/* =========================================================
   VERIFICATION
   ========================================================= */

SELECT name
FROM sys.tables
WHERE name IN
(
    'Users',
    'Roles',
    'Permissions',
    'UserRoles',
    'RolePermissions'
)
ORDER BY name;
GO

SELECT Id, Name
FROM dbo.Roles
ORDER BY Id;
GO