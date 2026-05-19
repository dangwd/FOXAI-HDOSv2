import { ALL_PERMISSIONS } from '@/core/permissions/constants';
import type { PermissionKey } from '@/core/permissions/constants';

const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  admin: ALL_PERMISSIONS,
  doctor: [
    'patient:read', 'patient:write',
    'dashboard:executive', 'dashboard:kpi',
    'lab:read', 'lab:critical',
    'queue:read',
    'reports:read',
  ],
  nurse: [
    'patient:read',
    'queue:read', 'queue:manage',
    'dashboard:kpi',
    'lab:read',
  ],
  operator: [
    'patient:read',
    'queue:read', 'queue:manage',
    'dashboard:kpi', 'dashboard:executive',
    'reports:read',
  ],
  pharmacist: [
    'pharmacy:read', 'pharmacy:dispense',
    'patient:read',
  ],
};

export function resolvePermissions(roles: string[]): Set<PermissionKey> {
  const perms = new Set<PermissionKey>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) {
      perms.add(perm);
    }
  }
  return perms;
}
