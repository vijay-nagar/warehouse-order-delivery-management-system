USE WarehouseOrderDelivery;
GO

SET QUOTED_IDENTIFIER ON;

INSERT INTO dbo.Permissions (Name, Description, IsActive)
SELECT v.Name, v.Description, 1
FROM (VALUES
    ('AUTH_VIEW_PROFILE', 'View authenticated user profile'),
    ('ORDER_CREATE', 'Create a new customer order'),
    ('ORDER_VIEW', 'View orders'),
    ('ORDER_VIEW_DETAILS', 'View order details'),
    ('ORDER_CANCEL', 'Cancel an eligible order')
) AS v(Name, Description)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Permissions p
    WHERE p.Name = v.Name
);

-- Super Admin gets all active permissions
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT
    r.Id,
    p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name = 'Super Admin'
  AND p.IsActive = 1
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id
        AND rp.PermissionId = p.Id
  );

SELECT
    r.Name AS RoleName,
    p.Name AS PermissionName
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r
    ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p
    ON p.Id = rp.PermissionId
WHERE r.Name = 'Super Admin'
ORDER BY p.Id;
