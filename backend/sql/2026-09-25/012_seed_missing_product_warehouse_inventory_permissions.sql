USE [WarehouseOrderDelivery];
GO

-- Discovered gap (same class as INVENTORY_UPDATE, fixed in
-- 006_rbac_domain_permission_fix.sql): PRODUCT_CREATE/VIEW/UPDATE/DELETE,
-- WAREHOUSE_CREATE/VIEW/UPDATE/STATUS_UPDATE (also used by zone/shelf/bin
-- routes, which reuse the WAREHOUSE_* permission names), and
-- INVENTORY_CREATE/VIEW/STATUS_UPDATE are required by requirePermission()
-- in product.routes.ts, warehouse.routes.ts, zone.routes.ts, shelf.routes.ts,
-- bin.routes.ts, and inventory.routes.ts, but were never seeded anywhere —
-- those routes are unreachable by anyone today, including Super Admin.

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PRODUCT_CREATE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('PRODUCT_CREATE', 'Create products', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PRODUCT_VIEW')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('PRODUCT_VIEW', 'View products', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PRODUCT_UPDATE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('PRODUCT_UPDATE', 'Update products', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PRODUCT_DELETE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('PRODUCT_DELETE', 'Delete products', 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'WAREHOUSE_CREATE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('WAREHOUSE_CREATE', 'Create warehouses, zones, shelves, and bins', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'WAREHOUSE_VIEW')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('WAREHOUSE_VIEW', 'View warehouses, zones, shelves, and bins', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'WAREHOUSE_UPDATE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('WAREHOUSE_UPDATE', 'Update warehouses, zones, shelves, and bins', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'WAREHOUSE_STATUS_UPDATE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('WAREHOUSE_STATUS_UPDATE', 'Activate/deactivate warehouses, zones, shelves, and bins', 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'INVENTORY_CREATE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('INVENTORY_CREATE', 'Create inventory records', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'INVENTORY_VIEW')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('INVENTORY_VIEW', 'View inventory records', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'INVENTORY_STATUS_UPDATE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('INVENTORY_STATUS_UPDATE', 'Activate/deactivate inventory records', 1);
GO

-- Product/warehouse/inventory management: Super Admin, Warehouse Manager,
-- Inventory Manager.
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name IN ('Super Admin', 'Warehouse Manager', 'Inventory Manager')
  AND p.Name IN (
      'PRODUCT_CREATE', 'PRODUCT_VIEW', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
      'WAREHOUSE_CREATE', 'WAREHOUSE_VIEW', 'WAREHOUSE_UPDATE', 'WAREHOUSE_STATUS_UPDATE',
      'INVENTORY_CREATE', 'INVENTORY_VIEW', 'INVENTORY_STATUS_UPDATE'
  )
  AND NOT EXISTS (
      SELECT 1 FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );
GO

-- View-only access for Warehouse Staff, matching the read access it already
-- has for other warehouse-adjacent domains (packing/delivery view perms
-- were originally granted to RoleId 3 = Warehouse Staff in the pre-fix seed
-- files).
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name = 'Warehouse Staff'
  AND p.Name IN ('PRODUCT_VIEW', 'WAREHOUSE_VIEW', 'INVENTORY_VIEW')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );
GO
