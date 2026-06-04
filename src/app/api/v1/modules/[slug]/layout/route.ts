import type { ModuleLayout } from "@/infrastructure/http/adminApi";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.100.60:8443").replace(/\/+$/, "");

/** GET /api/v1/modules/[slug]/layout — proxy tới admin backend */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = req.headers.get("Authorization") ?? "";

  try {
    const res = await fetch(`${ADMIN_BASE}/api/v1/modules/${slug}/layout`, {
      headers: { Accept: "application/json", ...(auth ? { Authorization: auth } : {}) },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Module "${slug}" not found` },
        { status: res.status },
      );
    }

    const layout = (await res.json()) as ModuleLayout;
    return NextResponse.json(layout);
  } catch {
    return NextResponse.json(
      { error: `Không thể kết nối admin backend` },
      { status: 502 },
    );
  }
}
