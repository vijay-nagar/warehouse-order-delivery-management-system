import sql from "mssql";

import { getDatabasePool } from "../config/database.js";

export interface UserRecord {
  id: number;
  username: string;
  email: string | null;
  passwordHash: string;
  roles: string[];
}

interface UserQueryRow {
  Id: number;
  Username: string;
  Email: string | null;
  PasswordHash: string;
  RoleName: string | null;
}

export class UserRepository {
  async findByUsername(username: string): Promise<UserRecord | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("username", sql.NVarChar(100), username)
      .query<UserQueryRow>(`
        SELECT
          u.Id,
          u.Username,
          u.Email,
          u.PasswordHash,
          r.Name AS RoleName
        FROM dbo.Users u
        LEFT JOIN dbo.UserRoles ur
          ON ur.UserId = u.Id
        LEFT JOIN dbo.Roles r
          ON r.Id = ur.RoleId
        WHERE u.Username = @username
          AND u.IsActive = 1
        ORDER BY r.Id;
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const firstRow = result.recordset[0];

    if (!firstRow) {
      return null;
    }

    const roles = result.recordset
      .map((row: UserQueryRow) => row.RoleName)
      .filter((role: string | null): role is string => role !== null);

    return {
      id: firstRow.Id,
      username: firstRow.Username,
      email: firstRow.Email,
      passwordHash: firstRow.PasswordHash,
      roles,
    };
  }

    async hasPermission(
    userId: number,
    permissionName: string,
  ): Promise<boolean> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("permissionName", sql.NVarChar(100), permissionName)
      .query<{ HasPermission: number }>(`
        SELECT TOP 1
          1 AS HasPermission
        FROM dbo.UserRoles ur
        INNER JOIN dbo.RolePermissions rp
          ON rp.RoleId = ur.RoleId
        INNER JOIN dbo.Permissions p
          ON p.Id = rp.PermissionId
        INNER JOIN dbo.Roles r
          ON r.Id = ur.RoleId
        WHERE ur.UserId = @userId
          AND p.Name = @permissionName
          AND p.IsActive = 1
          AND r.IsActive = 1;
      `);

    return result.recordset.length > 0;
  }

}
