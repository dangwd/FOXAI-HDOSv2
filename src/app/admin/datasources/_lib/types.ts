// Domain types cho DataMatchingService — SourceProfile CRUD

export interface SourceProfile {
  id: string;
  sourceSystem: string;
  recordType: string;
  displayName: string;
  businessKeyField: string;
  /** { tênFieldGốc: tênCanonical } */
  mappings: Record<string, string>;
}

export interface MappingRow {
  sourceField: string;
  canonicalField: string;
}

export interface ProfileFormValues {
  sourceSystem: string;
  recordType: string;
  displayName: string;
  businessKeyField: string;
  mappings: MappingRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Record<string,string> → mảng row để dùng trong Form.List */
export function mappingsToRows(m: Record<string, string>): MappingRow[] {
  return Object.entries(m).map(([sourceField, canonicalField]) => ({
    sourceField,
    canonicalField,
  }));
}

/** Mảng row → Record<string,string> cho API; bỏ qua row rỗng */
export function rowsToMappings(rows: MappingRow[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const r of rows) {
    const src = r?.sourceField?.trim();
    const can = r?.canonicalField?.trim();
    if (src && can) result[src] = can;
  }
  return result;
}

export const EMPTY_MAPPING_ROW: MappingRow = { sourceField: "", canonicalField: "" };

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.100.60:8443"
).replace(/\/+$/, "");

// ─── Source Schema ────────────────────────────────────────────────────────────

export interface SourceSchemaField {
  key:         string;
  type:        string;
  label:       string | null;
  sourceField: string;
}

export interface SourceSchema {
  namespace:        string;
  businessKeyField: string;
  fields:           SourceSchemaField[];
}
