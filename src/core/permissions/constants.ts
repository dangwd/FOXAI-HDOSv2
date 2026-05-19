export const PERMISSIONS = {
  PATIENT:    { READ: 'patient:read',    WRITE: 'patient:write',    DELETE: 'patient:delete'    },
  BILLING:    { READ: 'billing:read',    WRITE: 'billing:write'                                 },
  DASHBOARD:  { EXECUTIVE: 'dashboard:executive',                   KPI: 'dashboard:kpi'        },
  LABORATORY: { READ: 'lab:read',        WRITE: 'lab:write',        CRITICAL: 'lab:critical'    },
  PHARMACY:   { READ: 'pharmacy:read',   DISPENSE: 'pharmacy:dispense'                          },
  QUEUE:      { READ: 'queue:read',      MANAGE: 'queue:manage'                                 },
  REPORTS:    { READ: 'reports:read',    EXPORT: 'reports:export'                               },
} as const;

export type PermissionKey =
  | 'patient:read'  | 'patient:write'       | 'patient:delete'
  | 'billing:read'  | 'billing:write'
  | 'dashboard:executive'                   | 'dashboard:kpi'
  | 'lab:read'      | 'lab:write'           | 'lab:critical'
  | 'pharmacy:read' | 'pharmacy:dispense'
  | 'queue:read'    | 'queue:manage'
  | 'reports:read'  | 'reports:export';

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS).flatMap(
  (group) => Object.values(group)
) as PermissionKey[];
