"use client";

import { useState } from "react";

import { Button, Field, PanelHeader } from "./ui";
import type { GitStatus } from "@/lib/admin/types";

interface GitPanelProps {
  git: GitStatus;
  dirty: boolean;
  busy: boolean;
  onCommit: (message: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const TEMPLATES = [
  "content: 更新作品",
  "fix: 修正拍摄时间",
  "chore: 更新站点文案",
];

const CODE_STYLE: Record<string, string> = {
  M: "bg-yellow/25 text-ink",
  A: "bg-blue/15 text-blue",
  D: "bg-red/10 text-red",
  "??": "bg-ink/5 text-ink/50",
};

export function GitPanel({
  git,
  dirty,
  busy,
  onCommit,
  onRefresh,
}: GitPanelProps) {
  const [message, setMessage] = useState("content: 更新作品");
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div>
      <PanelHeader
        eyebrow="Version"
        title="版本快照"
        description="把当前 JSON 与图片一起提交到 Git，随时可以回滚。"
        actions={
          <Button onClick={() => void refresh()} disabled={refreshing}>
            {refreshing ? "刷新中…" : "刷新状态"}
          </Button>
        }
      />

      <div className="mt-6 space-y-5">
        <section className="border border-ink/15 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="label">Repository</p>
              <p className="font-mono text-sm">
                {git.isRepo ? "已连接" : "未初始化"}
              </p>
            </div>
            <div>
              <p className="label">Branch</p>
              <p className="font-mono text-sm">{git.branch ?? "—"}</p>
            </div>
            <div>
              <p className="label">HEAD</p>
              <p className="font-mono text-sm">{git.head ?? "—"}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-ink/10 pt-4">
            <span
              className={`h-2 w-2 rounded-full ${
                git.isRepo ? (git.clean ? "bg-blue" : "bg-red") : "bg-ink/30"
              }`}
            />
            <p className="text-xs text-ink/60">
              {git.isRepo
                ? git.clean
                  ? "工作区干净，没有待提交的更改。"
                  : `${git.changes.length} 个文件有变更。`
                : "当前目录不是 Git 仓库，无法创建版本快照。"}
            </p>
          </div>

          {git.error ? (
            <p className="mt-2 text-[11px] text-red">{git.error}</p>
          ) : null}

          {git.isRepo && git.changes.length > 0 ? (
            <ul className="mt-4 max-h-56 divide-y divide-ink/5 overflow-y-auto border border-ink/10">
              {git.changes.map((change) => (
                <li
                  key={`${change.code}-${change.path}`}
                  className="flex items-center gap-3 px-3 py-1.5 font-mono text-[10px]"
                >
                  <span
                    className={`flex h-5 w-7 shrink-0 items-center justify-center text-[9px] ${
                      CODE_STYLE[change.code] ?? "bg-ink/5 text-ink/50"
                    }`}
                  >
                    {change.code}
                  </span>
                  <span className="truncate text-ink/70">{change.path}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {git.isRepo ? (
          <section className="border border-ink bg-white p-5">
            <Field label="Commit message" hint="建议使用语义化前缀，例如 content: / fix: / feat:。">
              <input
                className="field font-mono"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={200}
              />
            </Field>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {TEMPLATES.map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => setMessage(template)}
                  className="border border-ink/15 px-2 py-1 text-[9px] text-ink/50 transition-colors hover:border-ink hover:text-ink"
                >
                  {template}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
              <p className="text-[11px] text-ink/45">
                {dirty
                  ? "有未保存的改动，提交前会先执行一次「保存至磁盘」。"
                  : "数据已落盘，可以直接提交。"}
              </p>
              <Button
                variant="solid"
                disabled={busy || !message.trim()}
                onClick={() => void onCommit(message)}
              >
                {busy ? "提交中…" : "提交快照 →"}
              </Button>
            </div>
          </section>
        ) : (
          <section className="border border-dashed border-ink/25 bg-white/60 p-5">
            <p className="font-display text-lg">初始化 Git 仓库</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/50">
              在项目根目录执行以下命令，之后就可以在后台直接创建快照。
            </p>
            <pre className="mt-3 overflow-x-auto bg-ink p-4 font-mono text-[10px] leading-relaxed text-paper/80">{`git init
git add -A
git commit -m "chore: initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main`}</pre>
          </section>
        )}

        <section className="border border-ink/15 bg-paper-2/60 p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/40">
            Deployment
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink/60">
            推送到 GitHub 后，Actions 会先物理删除
            <code className="font-mono"> src/app/admin</code>、
            <code className="font-mono"> src/app/api</code>、
            <code className="font-mono"> src/lib/admin</code>，再构建纯静态产物发布到
            Pages。公网永远看不到这个工作台。
          </p>
        </section>
      </div>
    </div>
  );
}
