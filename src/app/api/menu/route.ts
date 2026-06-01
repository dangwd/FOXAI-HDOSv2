import { NextRequest, NextResponse } from "next/server";
import type { MenuGroup, MenuItem } from "@/types/menu";
import type { AdminModule } from "@/infrastructure/http/adminApi";

const ADMIN_BASE = (process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:17080").replace(/\/+$/, "");

const GROUP_META: Record<string, { id: string; label: string; order: number }> = {
  "dieu-hanh": { id: "dieu-hanh", label: "ĐIỀU HÀNH", order: 0 },
  "lam-sang":  { id: "lam-sang",  label: "LÂM SÀNG",  order: 1 },
  "quan-tri":  { id: "quan-tri",  label: "QUẢN TRỊ",   order: 2 },
};

/** GET /api/menu — lấy danh sách module từ admin API, nhóm theo group */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization") ?? "";

  try {
    const res = await fetch(`${ADMIN_BASE}/api/v1/admin/modules`, {
      headers: { Accept: "application/json", ...(auth ? { Authorization: auth } : {}) },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ groups: [] }, { status: res.status });
    }

    const modules = (await res.json()) as AdminModule[];

    const visible = modules
      .filter((m) => m.isActive !== false && m.isVisible !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const grouped = new Map<string, AdminModule[]>();
    for (const m of visible) {
      const key = m.group ?? "other";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }

    const groups: MenuGroup[] = [...grouped.entries()]
      .sort(([a], [b]) => (GROUP_META[a]?.order ?? 99) - (GROUP_META[b]?.order ?? 99))
      .map(([key, items]): MenuGroup => ({
        id: GROUP_META[key]?.id ?? key,
        label: GROUP_META[key]?.label ?? key.toUpperCase(),
        items: items.map((m): MenuItem => ({
          id: m.slug,
          label: m.label,
          icon: m.icon,
        })),
      }));

    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ groups: [] });
  }
}
