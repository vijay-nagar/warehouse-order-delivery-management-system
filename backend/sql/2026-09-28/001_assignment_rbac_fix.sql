USE [WarehouseOrderDelivery];
GO

/* =========================================================
   ROOT CAUSE
   ---------------------------------------------------------
   The picking/packing/delivery ASSIGN routes required the
   caller to hold the *worker's own role* (requireRoles("Picker"),
   requireRoles("Packer"), requireRoles("Delivery Boy")) instead of
   a manager role. That has been fixed in code (see
   backend/src/routes/{picking,packing,delivery}.routes.ts).

   This migration fixes the matching permission grants so the
   permission model agrees with the corrected role checks:
     - Workers (Picker/Packer/Delivery Boy) lose the *_ASSIGN
       permission — assigning/reassigning is a manager action.
     - Warehouse Manager gains PICKING_VIEW/PICKING_ASSIGN (never
       granted before) and PACKING_ASSIGN/DELIVERY_ASSIGN (kept).
     - Warehouse Staff loses PACKING_ASSIGN/DELIVERY_ASSIGN — per
       the task instructions, Warehouse Staff must not silently
       gain manager-only assignment powers.
     - Delivery Manager (RoleId 7) had ZERO permissions ever
       granted anywhere; it is seeded here with DELIVERY_VIEW and
       DELIVERY_ASSIGN so the role is actually usable.
   ========================================================= */

-- Picker must not be able to assign/reassign picking tasks.
DELETE rp
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p ON p.Id = rp.PermissionId
WHERE r.Name = 'Picker'
  AND p.Name = 'PICKING_ASSIGN';
GO

-- Packer must not be able to assign/reassign packing tasks.
DELETE rp
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p ON p.Id = rp.PermissionId
WHERE r.Name = 'Packer'
  AND p.Name = 'PACKING_ASSIGN';
GO

-- Delivery Boy must not be able to assign/reassign deliveries.
DELETE rp
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p ON p.Id = rp.PermissionId
WHERE r.Name = 'Delivery Boy'
  AND p.Name = 'DELIVERY_ASSIGN';
GO

-- Warehouse Staff is an operational worker role, not a manager;
-- it must not hold assignment powers either.
DELETE rp
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p ON p.Id = rp.PermissionId
WHERE r.Name = 'Warehouse Staff'
  AND p.Name IN ('PACKING_ASSIGN', 'DELIVERY_ASSIGN');
GO

-- Warehouse Manager: grant PICKING_VIEW/PICKING_ASSIGN, which were
-- never seeded for this role in any prior migration.
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name = 'Warehouse Manager'
  AND p.Name IN ('PICKING_VIEW', 'PICKING_ASSIGN')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );
GO

-- Warehouse Manager: ensure it also still holds PACKING_ASSIGN /
-- DELIVERY_ASSIGN (previously granted via the 2026-09-17 blanket
-- RoleId IN (1,2,3,5) inserts; re-asserted here so this migration
-- is a complete, self-contained statement of intent).
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name = 'Warehouse Manager'
  AND p.Name IN ('PACKING_VIEW', 'PACKING_ASSIGN', 'DELIVERY_VIEW', 'DELIVERY_ASSIGN')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );
GO

-- Delivery Manager (RoleId 7): previously had NO permissions at all
-- in any migration. Seed the minimum required for its manager
-- responsibilities: view the delivery queue, assign/reassign
-- Delivery Boys.
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name = 'Delivery Manager'
  AND p.Name IN ('DELIVERY_VIEW', 'DELIVERY_ASSIGN')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );
GO

-- Super Admin catch-up, in case any permission above was added or
-- renamed after the last blanket grant.
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

-- Discovered live-DB drift (not present in any prior committed
-- migration file): Warehouse Staff held ALL PICKING_* permissions,
-- including PICKING_ASSIGN. Warehouse Staff is an operational
-- worker role, not a manager, so assignment power is revoked here
-- for consistency with the PACKING_ASSIGN/DELIVERY_ASSIGN revokes
-- above.
DELETE rp
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p ON p.Id = rp.PermissionId
WHERE r.Name = 'Warehouse Staff'
  AND p.Name = 'PICKING_ASSIGN';
GO

/* =========================================================
   VERIFICATION
   ========================================================= */
SELECT r.Name AS RoleName, p.Name AS PermissionName
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p ON p.Id = rp.PermissionId
WHERE p.Name LIKE 'PICKING_%'
   OR p.Name LIKE 'PACKING_%'
   OR p.Name LIKE 'DELIVERY_%'
ORDER BY r.Name, p.Name;
GO
