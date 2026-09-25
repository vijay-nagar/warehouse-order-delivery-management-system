USE [WarehouseOrderDelivery];
GO

-- Discovered gap: INVENTORY_UPDATE is required by requirePermission() in
-- inventory-reservation.routes.ts and inventory-transaction.routes.ts, but
-- was never seeded anywhere, so those routes are unreachable by anyone
-- today, including Super Admin.
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'INVENTORY_UPDATE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('INVENTORY_UPDATE', 'Update inventory, reservations, and inventory transactions', 1);
GO

-- Picker: PICKING_* permissions were created by 2026-09-17/004_picking_permissions.sql
-- but never granted to any role.
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name = 'Picker'
  AND p.Name LIKE 'PICKING_%'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );
GO

-- Packer: PACKING_* was granted to RoleId IN (1,2,3,5) by
-- 2026-09-17/005_packing_permissions.sql, which excluded Packer (6).
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name = 'Packer'
  AND p.Name LIKE 'PACKING_%'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );
GO

-- Delivery Boy: DELIVERY_* was granted to RoleId IN (1,2,3,5) by
-- 2026-09-17/006_delivery_setup.sql, which excluded Delivery Boy (8).
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name = 'Delivery Boy'
  AND p.Name LIKE 'DELIVERY_%'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );
GO

-- Super Admin catch-up: the original blanket grant
-- (2026-09-16/003_seed_permissions.sql) ran before PICKING_*/PACKING_*/
-- DELIVERY_*/INVENTORY_UPDATE existed, so Super Admin never automatically
-- received them.
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name = 'Super Admin'
  AND p.IsActive = 1
  AND NOT EXISTS (
      SELECT 1 FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );
GO

-- INVENTORY_UPDATE also belongs to warehouse/inventory management roles.
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name IN ('Warehouse Manager', 'Inventory Manager')
  AND p.Name = 'INVENTORY_UPDATE'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );
GO
