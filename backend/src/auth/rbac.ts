import type { AdminRole } from '../db/schema.ts';

export type Permission = 'catalog:read' | 'catalog:write' | 'catalog:publish' | 'staff:manage' | 'audit:read' | 'reports:read' | 'orders:read' | 'orders:manage';

const grants: Record<AdminRole, ReadonlySet<Permission>> = {
  OWNER: new Set(['catalog:read', 'catalog:write', 'catalog:publish', 'staff:manage', 'audit:read', 'reports:read', 'orders:read', 'orders:manage']),
  CATALOG_MANAGER: new Set(['catalog:read', 'catalog:write']),
  ORDER_MANAGER: new Set(['catalog:read', 'orders:read', 'orders:manage']),
  SUPPORT: new Set(['catalog:read', 'orders:read']),
  ANALYST: new Set(['catalog:read', 'audit:read', 'reports:read']),
};

export function hasPermission(role: AdminRole, permission: Permission) { return grants[role].has(permission); }
