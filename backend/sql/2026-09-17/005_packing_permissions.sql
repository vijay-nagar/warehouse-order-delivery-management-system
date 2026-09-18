USE [WarehouseOrderDelivery];

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PACKING_CREATE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('PACKING_CREATE', 'Create packing tasks', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PACKING_VIEW')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('PACKING_VIEW', 'View packing tasks', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PACKING_ASSIGN')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('PACKING_ASSIGN', 'Assign packing tasks', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PACKING_START')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('PACKING_START', 'Start packing tasks', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PACKING_CREATE_PACKAGE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('PACKING_CREATE_PACKAGE', 'Create packages', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'PACKING_COMPLETE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('PACKING_COMPLETE', 'Complete packing tasks', 1);

INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Id IN (1, 2, 3, 5)
  AND p.Name IN (
    'PACKING_CREATE',
    'PACKING_VIEW',
    'PACKING_ASSIGN',
    'PACKING_START',
    'PACKING_CREATE_PACKAGE',
    'PACKING_COMPLETE'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.RolePermissions rp
    WHERE rp.RoleId = r.Id
      AND rp.PermissionId = p.Id
  );
