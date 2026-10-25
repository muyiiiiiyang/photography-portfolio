import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "../_components/LoginForm";
import { isAuthenticated } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "登录",
};

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <main className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-yellow"
        />
        <div
          aria-hidden
          className="absolute bottom-24 left-10 h-40 w-10 bg-blue"
        />
        <div
          aria-hidden
          className="absolute bottom-40 right-16 h-4 w-4 bg-red"
        />

        <p className="relative font-display text-[17px] font-semibold tracking-[-0.01em]">
          BOK_HAMM<span className="text-red">.</span>
        </p>

        <div className="relative">
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-paper/40">
            Local studio / 本地工作台
          </p>
          <p className="mt-4 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-[-0.04em]">
            Make it
            <br />
            <span className="text-yellow">precise.</span>
          </p>
          <p className="mt-6 max-w-sm text-xs leading-relaxed text-paper/50">
            上传、压制、排序、归档、提交快照。所有写操作只发生在这台机器上，
            公网部署产物中不存在这个目录。
          </p>
        </div>

        <p className="relative font-mono text-[9px] uppercase tracking-[0.24em] text-paper/30">
          127.0.0.1 — admin only
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-ink/40">
            Studio access
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-[-0.03em]">
            登录工作台
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/55">
            输入本地管理密码，进入作品集的内容后台。
          </p>

          <LoginForm />

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-ink/40 transition-colors hover:text-ink"
          >
            <span aria-hidden>←</span> 返回网站
          </Link>
        </div>
      </section>
    </main>
  );
}
