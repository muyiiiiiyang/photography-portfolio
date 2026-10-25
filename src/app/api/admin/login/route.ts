import { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  allowLoginAttempt,
  clearLoginAttempts,
  clientKey,
  createSessionToken,
  isAdminConfigured,
  verifyPassword,
} from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "服务器未配置 ADMIN_PASSWORD，管理后台已禁用。" },
      { status: 500 },
    );
  }

  const key = clientKey(request);
  if (!allowLoginAttempt(key)) {
    return NextResponse.json(
      { error: "尝试次数过多，请 5 分钟后再试。" },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { password?: unknown }
    | null;

  if (!verifyPassword(body?.password)) {
    return NextResponse.json({ error: "密码不正确。" }, { status: 401 });
  }

  clearLoginAttempts(key);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
