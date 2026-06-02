import { NextRequest, NextResponse } from "next/server";
import type { MenuGroup, MenuItem } from "@/types/menu";

const ADMIN_BASE = (process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:17080").replace(/\/+$/, "");

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

/** GET /api/menu — proxy to public sidebar endpoint, returns role-filtered nested groups */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization") ?? "";

  try {
    const res = await fetch(`${ADMIN_BASE}/api/v1/modules`, {
      headers: { Accept: "application/json", ...(auth ? { Authorization: auth } : {}) },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ groups: [] }, { status: res.status });
    }

    const sidebarGroups = (await res.json()) as SidebarGroupDto[];

    const groups: MenuGroup[] = sidebarGroups
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((g): MenuGroup => ({
        id:    g.slug,
        label: g.label.toUpperCase(),
        items: g.modules
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((m): MenuItem => ({
            id:    m.slug,
            label: m.label,
            icon:  m.icon ?? "",
          })),
      }));

    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ groups: [] });
  }
}
