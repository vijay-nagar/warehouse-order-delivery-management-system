USE [WarehouseOrderDelivery];

-- DeliveryBoy is assigned later, so this must allow NULL.
ALTER TABLE dbo.Deliveries
ALTER COLUMN DeliveryBoyUserId INT NULL;

-- Delivery permissions
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'DELIVERY_CREATE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('DELIVERY_CREATE', 'Create delivery', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'DELIVERY_VIEW')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('DELIVERY_VIEW', 'View deliveries', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'DELIVERY_ASSIGN')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('DELIVERY_ASSIGN', 'Assign delivery boy', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'DELIVERY_PICKUP')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('DELIVERY_PICKUP', 'Pickup delivery', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'DELIVERY_OUT_FOR_DELIVERY')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('DELIVERY_OUT_FOR_DELIVERY', 'Mark delivery out for delivery', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'DELIVERY_TRACKING')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('DELIVERY_TRACKING', 'Update delivery tracking', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'DELIVERY_COMPLETE')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('DELIVERY_COMPLETE', 'Complete delivery', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'DELIVERY_FAIL')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('DELIVERY_FAIL', 'Mark delivery failed', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Name = 'DELIVERY_RETURN')
    INSERT INTO dbo.Permissions (Name, Description, IsActive)
    VALUES ('DELIVERY_RETURN', 'Return delivery', 1);

-- Map permissions to currently existing operational roles.
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Id IN (1, 2, 3, 5)
  AND p.Name IN (
    'DELIVERY_CREATE',
    'DELIVERY_VIEW',
    'DELIVERY_ASSIGN',
    'DELIVERY_PICKUP',
    'DELIVERY_OUT_FOR_DELIVERY',
    'DELIVERY_TRACKING',
    'DELIVERY_COMPLETE',
    'DELIVERY_FAIL',
    'DELIVERY_RETURN'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.RolePermissions rp
    WHERE rp.RoleId = r.Id
      AND rp.PermissionId = p.Id
  );
