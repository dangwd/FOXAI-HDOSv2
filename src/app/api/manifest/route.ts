import { NextResponse } from "next/server";
import { MANIFEST } from "@/components/registry";

/**
 * GET /api/manifest
 * Backend gọi endpoint này để biết FE hỗ trợ component nào, prop schema ra sao.
 * Từ đó backend build screen config chính xác theo những gì FE có thể render.
 */
export async function GET() {
  return NextResponse.json(MANIFEST);
}
