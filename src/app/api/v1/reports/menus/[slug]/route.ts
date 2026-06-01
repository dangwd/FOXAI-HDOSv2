import { NextRequest, NextResponse } from "next/server";
import type { MenuDetail } from "@/types/report";

const ADMIN_BASE = (process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:17080").replace(/\/+$/, "");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = req.headers.get("Authorization") ?? "";

  try {
    const res = await fetch(`${ADMIN_BASE}/api/v1/reports/menus/${slug}`, {
      headers: { Accept: "application/json", ...(auth ? { Authorization: auth } : {}) },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: `Menu "${slug}" not found` }, { status: res.status });
    return NextResponse.json((await res.json()) as MenuDetail);
  } catch {
    return NextResponse.json({ error: "Không thể kết nối backend" }, { status: 502 });
  }
}
