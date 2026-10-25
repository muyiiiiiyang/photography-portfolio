"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Images,
  Layers,
  LogOut,
  Save,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AlbumsPanel } from "./AlbumsPanel";
import { GitPanel } from "./GitPanel";
import { PhotosPanel } from "./PhotosPanel";
import { SettingsPanel } from "./SettingsPanel";
import type { AdminSnapshot } from "@/lib/admin/types";
import type { PortfolioData, SiteConfig } from "@/lib/types";

type Tab = "albums" | "photos" | "settings" | "git";

type Tone = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

const TABS: {
  id: Tab;
  label: string;
  icon: typeof Images;
}[] = [
  { id: "albums", label: "相册", icon: Layers },
  { id: "photos", label: "照片", icon: Images },
  { id: "settings", label: "站点设置", icon: Settings },
  { id: "git", label: "版本快照", icon: GitBranch },
];

const TOAST_STYLE: Record<Tone, string> = {
  success: "border-ink bg-white text-ink",
  info: "border-ink bg-yellow text-ink",
  error: "border-red bg-red text-paper",
};

export function Studio({ initial }: { initial: AdminSnapshot }) {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioData>(initial.portfolio);
  const [config, setConfig] = useState<SiteConfig>(initial.config);
  const [git, setGit] = useState(initial.git);
  const [baseline, setBaseline] = useState({
    portfolio: JSON.stringify(initial.portfolio),
    config: JSON.stringify(initial.config),
  });
  const [tab, setTab] = useState<Tab>("albums");
  const [photoAlbumId, setPhotoAlbumId] = useState(
    initial.portfolio.albums[0]?.id ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const notify = useCallback((message: string, tone: Tone = "info") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const openPhotoUpload = useCallback((albumId: string) => {
    setPhotoAlbumId(albumId);
    setTab("photos");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const dirty = useMemo(
    () =>
      JSON.stringify(portfolio) !== baseline.portfolio ||
      JSON.stringify(config) !== baseline.config,
    [portfolio, config, baseline],
  );

  const totalPhotos = useMemo(
    () =>
      Object.values(portfolio.albumPhotos).reduce(
        (sum, list) => sum + list.length,
        0,
      ),
    [portfolio],
  );

  const saveAll = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio, config }),
      });
      const payload = (await response.json().catch(() => ({}))) as Partial<
        AdminSnapshot
      > & { error?: string };

      if (!response.ok || !payload.portfolio || !payload.config) {
        notify(payload.error ?? "保存失败，请查看终端日志。", "error");
        return false;
      }

      setPortfolio(payload.portfolio);
      setConfig(payload.config);
      if (payload.git) setGit(payload.git);
      setBaseline({
        portfolio: JSON.stringify(payload.portfolio),
        config: JSON.stringify(payload.config),
      });
      notify("已保存至磁盘。现在可以提交 Git 快照。", "success");
      return true;
    } catch {
      notify("保存失败：无法连接本地服务。", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }, [portfolio, config, notify]);

  const refreshGit = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/git");
      if (!response.ok) return;
      const payload = (await response.json()) as { git?: AdminSnapshot["git"] };
      if (payload.git) setGit(payload.git);
    } catch {
      // 静默失败即可，用户可再次点击刷新。
    }
  }, []);

  const handleCommit = useCallback(
    async (message: string) => {
      if (committing) return;
      setCommitting(true);
      try {
        if (dirty) {
          const saved = await saveAll();
          if (!saved) return;
        }

        const response = await fetch("/api/admin/git", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          git?: AdminSnapshot["git"];
          result?: { committed?: boolean; hash?: string; reason?: string };
        };

        if (!response.ok) {
          notify(payload.error ?? "提交失败。", "error");
          return;
        }

        if (payload.git) setGit(payload.git);

        if (payload.result?.committed) {
          notify(`快照已创建：${payload.result.hash ?? ""}`, "success");
        } else {
          notify(payload.result?.reason ?? "没有需要提交的更改。", "info");
        }
      } catch {
        notify("提交失败：无法连接本地服务。", "error");
      } finally {
        setCommitting(false);
      }
    },
    [committing, dirty, notify, saveAll],
  );

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.replace("/admin/login");
    router.refresh();
  }

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty && !saving) void saveAll();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dirty, saving, saveAll]);

  const counts: Record<Tab, number | string> = {
    albums: portfolio.albums.length,
    photos: totalPhotos,
    settings: "—",
    git: git.isRepo ? (git.clean ? "✓" : git.changes.length) : "!",
  };

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 border-b border-ink bg-ink text-paper">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link
            href="/admin"
            className="flex items-baseline gap-1.5 font-display text-[15px] tracking-[-0.01em]"
          >
            Bok_Hamm
            <span className="text-[11px] tracking-[0.18em] text-yellow">
              Studio
            </span>
          </Link>

          <span
            className={`hidden border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] sm:inline-flex ${
              dirty
                ? "border-yellow/50 bg-yellow/10 text-yellow"
                : "border-paper/15 text-paper/40"
            }`}
          >
            {dirty ? "Unsaved" : "Synced"}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden border border-paper/20 px-2.5 py-1.5 text-[10px] tracking-[0.08em] text-paper/65 transition-colors hover:border-paper hover:text-paper sm:inline-flex"
            >
              预览网站 ↗
            </Link>
            <button
              type="button"
              onClick={() => void saveAll()}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-1.5 bg-paper px-3 py-1.5 text-[10px] font-medium tracking-[0.08em] text-ink transition-colors hover:bg-yellow disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Save size={13} strokeWidth={1.7} />
              {saving ? "保存中…" : "保存至磁盘"}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              title="退出登录"
              aria-label="退出登录"
              className="flex h-8 w-8 items-center justify-center border border-paper/20 text-paper/60 transition-colors hover:border-paper hover:text-paper"
            >
              <LogOut size={14} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[212px_1fr] lg:gap-8 lg:py-8">
        <aside>
          <nav
            aria-label="工作台导航"
            className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5"
          >
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex shrink-0 items-center gap-2.5 border-b-2 px-3 py-2 text-left text-[12px] transition-colors lg:border-b-0 lg:border-l-2 ${
                    active
                      ? "border-red bg-white text-ink"
                      : "border-transparent text-ink/55 hover:bg-white/50 hover:text-ink"
                  }`}
                >
                  <Icon size={14} strokeWidth={1.6} />
                  <span>{item.label}</span>
                  <span className="ml-auto hidden font-mono text-[9px] text-ink/35 sm:inline">
                    {counts[item.id]}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 hidden border-t border-ink/15 pt-4 lg:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-ink/35">
              Local only
            </p>
            <p className="mt-2 text-[10px] leading-relaxed text-ink/40">
              所有写操作只落在本机。公网构建会先物理删除
              admin / api 目录，再导出静态站。
            </p>
            <p className="mt-3 font-mono text-[9px] text-ink/30">
              ⌘/Ctrl + S 保存
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          {tab === "albums" ? (
            <AlbumsPanel
              portfolio={portfolio}
              setPortfolio={setPortfolio}
              onUploadPhotos={openPhotoUpload}
            />
          ) : null}
          {tab === "photos" ? (
            <PhotosPanel
              portfolio={portfolio}
              setPortfolio={setPortfolio}
              onNotify={notify}
              albumId={photoAlbumId}
              onAlbumChange={setPhotoAlbumId}
            />
          ) : null}
          {tab === "settings" ? (
            <SettingsPanel
              config={config}
              setConfig={setConfig}
              albums={portfolio.albums}
            />
          ) : null}
          {tab === "git" ? (
            <GitPanel
              git={git}
              dirty={dirty}
              busy={committing || saving}
              onCommit={handleCommit}
              onRefresh={refreshGit}
            />
          ) : null}
        </section>
      </div>

      {toast ? (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-[95] flex max-w-sm items-start gap-3 border px-4 py-3 text-[11px] leading-relaxed shadow-[5px_5px_0_0_var(--color-ink)] ${
            TOAST_STYLE[toast.tone]
          }`}
        >
          <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full bg-current" />
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 shrink-0 text-[12px] opacity-50 hover:opacity-100"
            aria-label="关闭提示"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
