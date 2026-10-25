import { NextResponse } from "next/server";

import { guardAdmin } from "@/lib/admin/auth";
import { commitAll, getGitStatus } from "@/lib/admin/git";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  return NextResponse.json({ git: await getGitStatus() });
}

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as
    | { message?: unknown }
    | null;

  try {
    const result = await commitAll(
      typeof body?.message === "string" ? body.message : "",
    );
    return NextResponse.json({ result, git: await getGitStatus() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "提交失败。" },
      { status: 400 },
    );
  }
}
