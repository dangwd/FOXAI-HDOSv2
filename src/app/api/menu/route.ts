import { NextRequest, NextResponse } from "next/server";
import type { MenuGroup, MenuItem } from "@/types/menu";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.100.60:8443").replace(/\/+$/, "");
const ADMIN_BASE = API_BASE;

// ─── Old admin system DTOs ────────────────────────────────────────────────────

interface SidebarModuleDto {
  id:        string;
  slug:      string;
  label:     string;
  icon:      string | null;
  sortOrder: number;
}

interface SidebarGroupDto {
  id:        string;
  slug:      string;
  label:     string;
  icon:      string | null;
  sortOrder: number;
  modules:   SidebarModuleDto[];
}

// ─── DynamicFormService DTOs ──────────────────────────────────────────────────

interface FormsModuleDto {
  id:          string;
  code:        string;
  name:        string;
  description?: string;
  status:      string;
  formCount:   number;
  screenCount: number;
}

interface FormScreenDto {
  id:          string;
  code:        string;
  title:       string;
  status:      string;
  sortOrder:   number;
  description?: string;
}

function unwrap<T>(body: unknown): T {
  if (body !== null && typeof body === "object" && "success" in (body as object)) {
    return (body as { success: boolean; data: T }).data;
  }
  return body as T;
}

/** GET /api/menu — merges old admin modules + DynamicFormService screens */
export async function GET(req: NextRequest) {
  const auth    = req.headers.get("Authorization") ?? "";
  const headers = {
    Accept: "application/json",
    ...(auth ? { Authorization: auth } : {}),
  };

  const groups: MenuGroup[] = [];

  // ── 1. Old admin module groups ────────────────────────────────────────────
  try {
    const res = await fetch(`${ADMIN_BASE}/api/v1/modules`, {
      headers,
      cache: "no-store",
    });
    if (res.ok) {
      const sidebarGroups = (await res.json()) as SidebarGroupDto[];
      sidebarGroups
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .forEach((g) => {
          groups.push({
            id:    g.slug,
            label: g.label.toUpperCase(),
            items: g.modules
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((m): MenuItem => ({
                id:   m.slug,
                label: m.label,
                icon:  m.icon ?? "",
              })),
          });
        });
    }
  } catch {
    // continue with forms groups
  }

  // ── 2. DynamicFormService module groups ───────────────────────────────────
  try {
    const modRes = await fetch(`${API_BASE}/forms/modules`, {
      headers,
      cache: "no-store",
    });
    if (modRes.ok) {
      const rawModules = await modRes.json();
      const modules = unwrap<FormsModuleDto[]>(rawModules);
      const activeModules = modules.filter(
        (m) => m.status.toLowerCase() === "active",
      );

      // Fetch published screens for all active modules in parallel
      const screensResults = await Promise.all(
        activeModules.map(async (m) => {
          try {
            const r = await fetch(`${API_BASE}/forms/admin/screens/${m.code}`, {
              headers,
              cache: "no-store",
            });
            if (!r.ok) return { module: m, screens: [] as FormScreenDto[] };
            const raw = await r.json();
            const screens = unwrap<FormScreenDto[]>(raw);
            return { module: m, screens };
          } catch {
            return { module: m, screens: [] as FormScreenDto[] };
          }
        }),
      );

      for (const { module: m, screens } of screensResults) {
        const published = screens
          .filter((s) => s.status.toLowerCase() === "published")
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (published.length === 0) continue;

        groups.push({
          id:    m.code,
          label: m.name.toUpperCase(),
          items: published.map((s): MenuItem => ({
            id:    `${m.code}/${s.code}`,
            label: s.title,
            icon:  "",
            href:  `/client?module=${encodeURIComponent(m.code)}&screen=${encodeURIComponent(s.code)}`,
          })),
        });
      }
    }
  } catch {
    // DynamicFormService unavailable — ignore
  }

  return NextResponse.json({ groups });
}
