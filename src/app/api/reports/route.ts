import { NextRequest, NextResponse } from "next/server";
import type { MenuSummary } from "@/types/report";

const ADMIN_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.100.60:8443").replace(/\/+$/, "");

/** GET /api/reports — proxy GET /api/v1/reports/menus, server-side role filtering */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization") ?? "";

  try {
    const res = await fetch(`${ADMIN_BASE}/api/v1/reports/menus`, {
      headers: { Accept: "application/json", ...(auth ? { Authorization: auth } : {}) },
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json([], { status: res.status });

    const menus = (await res.json()) as MenuSummary[];
    return NextResponse.json(menus);
  } catch {
    return NextResponse.json([]);
  }
}
