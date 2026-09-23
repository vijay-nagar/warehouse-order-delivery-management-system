SET QUOTED_IDENTIFIER ON;

-- Picker should only have Picking permissions.
DELETE rp
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r
    ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p
    ON p.Id = rp.PermissionId
WHERE r.Name = 'Picker'
  AND p.Name LIKE 'DELIVERY_%';

DELETE rp
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r
    ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p
    ON p.Id = rp.PermissionId
WHERE r.Name = 'Picker'
  AND p.Name LIKE 'PACKING_%';

-- Packer should only have Packing permissions.
DELETE rp
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r
    ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p
    ON p.Id = rp.PermissionId
WHERE r.Name = 'Packer'
  AND p.Name LIKE 'PICKING_%';

DELETE rp
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r
    ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p
    ON p.Id = rp.PermissionId
WHERE r.Name = 'Packer'
  AND p.Name LIKE 'DELIVERY_%';

-- Delivery Boy should only have delivery execution/view permissions.
DELETE rp
FROM dbo.RolePermissions rp
INNER JOIN dbo.Roles r
    ON r.Id = rp.RoleId
INNER JOIN dbo.Permissions p
    ON p.Id = rp.PermissionId
WHERE r.Name = 'Delivery Boy'
  AND (p.Name LIKE 'PICKING_%' OR p.Name LIKE 'PACKING_%');
