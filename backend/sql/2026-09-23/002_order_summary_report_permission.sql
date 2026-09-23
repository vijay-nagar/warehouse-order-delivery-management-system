SET QUOTED_IDENTIFIER ON;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.Permissions
    WHERE Name = 'REPORT_ORDER_SUMMARY'
)
BEGIN
    INSERT INTO dbo.Permissions
    (
        Name,
        Description,
        IsActive
    )
    VALUES
    (
        'REPORT_ORDER_SUMMARY',
        'View order summary report',
        1
    );
END;

-- Super Admin gets the report permission.
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM dbo.Roles r
CROSS JOIN dbo.Permissions p
WHERE r.Name = 'Super Admin'
  AND p.Name = 'REPORT_ORDER_SUMMARY'
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.RolePermissions rp
      WHERE rp.RoleId = r.Id
        AND rp.PermissionId = p.Id
  );
