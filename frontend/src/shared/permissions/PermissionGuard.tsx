import type { ReactNode } from "react";
import { getStoredUser } from "../../features/auth/storage/authStorage";
import { hasPermission, type Permission } from "./access";

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  return hasPermission(getStoredUser(), permission) ? children : fallback;
}

export const ProtectedAction = PermissionGuard;
