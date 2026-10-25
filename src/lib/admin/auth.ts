import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "bok_studio";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function isAdminConfigured(): boolean {
  return adminPassword() !== null;
}

function adminPassword(): string | null {
  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  // 仅在本地开发环境提供兜底；生产环境绝不使用默认密码。
  if (process.env.NODE_ENV !== "production") return "admin123";
  return null;
}

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    adminPassword() ||
    "bok-hamm-local-dev-secret"
  );
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    // 长度不同也做一次比较，避免明显的时序特征。
    timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

export function verifyPassword(input: unknown): boolean {
  const expected = adminPassword();
  if (!expected || typeof input !== "string") return false;
  return safeEqual(input, expected);
}

export function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_TTL_SECONDS * 1000 }),
  ).toString("base64url");
  const signature = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");

  if (!safeEqual(signature, expected)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** API 守卫：未登录时直接返回 401 响应，业务代码里 `if (denied) return denied;` */
export async function guardAdmin(): Promise<NextResponse | null> {
  if (await isAuthenticated()) return null;
  return NextResponse.json(
    { error: "未登录或会话已过期，请重新登录。" },
    { status: 401 },
  );
}

export function allowLoginAttempt(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || record.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) return false;
  record.count += 1;
  return true;
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
