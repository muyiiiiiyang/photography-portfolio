import { NextResponse } from "next/server";

import { guardAdmin } from "@/lib/admin/auth";
import {
  getAdminSnapshot,
  savePortfolio,
  saveSiteConfig,
} from "@/lib/admin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;

  try {
    return NextResponse.json(await getAdminSnapshot());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "读取数据失败。" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as
    | { portfolio?: unknown; config?: unknown }
    | null;

  if (!body || (!body.portfolio && !body.config)) {
    return NextResponse.json(
      { error: "请求体需要包含 portfolio 或 config。" },
      { status: 400 },
    );
  }

  try {
    if (body.portfolio) {
      await savePortfolio(body.portfolio);
    }
    if (body.config) {
      await saveSiteConfig(body.config);
    }

    return NextResponse.json(await getAdminSnapshot());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存失败。" },
      { status: 500 },
    );
  }
}
