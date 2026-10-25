"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "登录失败，请重试。");
        setLoading(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("网络错误，无法连接本地服务。");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="label">Password / 访问密码</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          autoFocus
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field"
          placeholder="••••••••"
        />
      </label>

      {error ? (
        <p
          role="alert"
          className="border-l-2 border-red bg-red/5 px-3 py-2 text-xs text-red"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || password.length === 0}
        className="flex w-full items-center justify-center gap-3 border border-ink bg-ink px-4 py-3 text-[11px] tracking-[0.18em] text-paper transition-colors hover:bg-red disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "验证中…" : "进入工作台"}
        <span aria-hidden>→</span>
      </button>

      <p className="text-[10px] leading-relaxed text-ink/40">
        密码来自项目根目录 <code className="font-mono">.env.local</code> 中的
        <code className="font-mono"> ADMIN_PASSWORD</code>。
      </p>
    </form>
  );
}
