"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { Button, Field, PanelHeader } from "./ui";
import { formatDate } from "@/lib/format";
import type { Folder, Photo, PortfolioData } from "@/lib/types";

interface FoldersPanelProps {
  portfolio: PortfolioData;
  setPortfolio: Dispatch<SetStateAction<PortfolioData>>;
}

export function FoldersPanel({ portfolio, setPortfolio }: FoldersPanelProps) {
  const [selectedId, setSelectedId] = useState(portfolio.folders[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const selected =
    portfolio.folders.find((folder) => folder.id === selectedId) ??
    portfolio.folders[0] ??
    null;
  const assignedIds = selected
    ? portfolio.folderPhotos[selected.id] ?? []
    : [];

  const photoById = new Map<string, Photo>();
  for (const album of portfolio.albums) {
    for (const photo of portfolio.albumPhotos[album.id] ?? []) {
      photoById.set(photo.id, photo);
    }
  }
  const assigned = assignedIds
    .map((id) => photoById.get(id))
    .filter((photo): photo is Photo => Boolean(photo));

  const needle = query.trim().toLowerCase();

  function patchFolder(patch: Partial<Folder>) {
    if (!selected) return;
    setPortfolio((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) =>
        folder.id === selected.id ? { ...folder, ...patch } : folder,
      ),
    }));
  }

  function addFolder() {
    const id = `folder_${Date.now().toString(36)}`;
    const folder: Folder = {
      id,
      slug: `new-series-${portfolio.folders.length + 1}`,
      title: "新专题",
      subtitle: "NEW SERIES",
      description: "",
      createdAt: new Date().toISOString(),
    };

    setPortfolio((prev) => ({
      ...prev,
      folders: [...prev.folders, folder],
      folderPhotos: { ...prev.folderPhotos, [id]: [] },
    }));
    setSelectedId(id);
  }

  function removeFolder() {
    if (!selected) return;
    if (
      !window.confirm(
        `删除专题「${selected.title}」？照片本身仍保留在各自相册中。`,
      )
    ) {
      return;
    }

    const remaining = portfolio.folders.filter(
      (folder) => folder.id !== selected.id,
    );

    setPortfolio((prev) => {
      const folderPhotos = { ...prev.folderPhotos };
      delete folderPhotos[selected.id];
      return {
        ...prev,
        folders: prev.folders.filter((folder) => folder.id !== selected.id),
        folderPhotos,
      };
    });

    setSelectedId(remaining[0]?.id ?? "");
  }

  function togglePhoto(photoId: string) {
    if (!selected) return;
    setPortfolio((prev) => {
      const current = prev.folderPhotos[selected.id] ?? [];
      const next = current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId];

      return {
        ...prev,
        folders: prev.folders.map((folder) =>
          folder.id === selected.id &&
          folder.coverPhotoId &&
          !next.includes(folder.coverPhotoId)
            ? { ...folder, coverPhotoId: next[0] }
            : folder,
        ),
        folderPhotos: { ...prev.folderPhotos, [selected.id]: next },
      };
    });
  }

  return (
    <div>
      <PanelHeader
        eyebrow="Series"
        title="专题"
        description="跨相册挑选照片，组成主题序列。照片本体只存一份，专题仅保存引用。"
        actions={
          <Button variant="solid" onClick={addFolder}>
            + 新建专题
          </Button>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="space-y-1">
          {portfolio.folders.map((folder) => {
            const count = (portfolio.folderPhotos[folder.id] ?? []).length;
            const active = selected?.id === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedId(folder.id)}
                className={`w-full border-l-2 px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-red bg-white"
                    : "border-transparent hover:bg-white/60"
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-medium">
                    {folder.title}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-ink/40">
                    {count}
                  </span>
                </span>
                <span className="mt-0.5 block truncate font-mono text-[9px] text-ink/35">
                  /{folder.slug}
                </span>
              </button>
            );
          })}

          {portfolio.folders.length === 0 ? (
            <p className="border border-dashed border-ink/20 px-3 py-6 text-center text-[11px] text-ink/40">
              还没有专题
            </p>
          ) : null}
        </aside>

        {selected ? (
          <div className="space-y-5">
            <div className="space-y-4 border border-ink/15 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 pb-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/35">
                    Series editor
                  </p>
                  <p className="mt-1 font-display text-xl">{selected.title}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/folders/${selected.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-ink/20 px-2.5 py-1.5 text-[10px] tracking-[0.08em] text-ink/60 transition-colors hover:border-ink hover:text-ink"
                  >
                    预览 ↗
                  </a>
                  <Button variant="danger" size="sm" onClick={removeFolder}>
                    删除
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="标题">
                  <input
                    className="field"
                    value={selected.title}
                    onChange={(event) =>
                      patchFolder({ title: event.target.value })
                    }
                  />
                </Field>
                <Field label="副标题 / EN">
                  <input
                    className="field"
                    value={selected.subtitle ?? ""}
                    onChange={(event) =>
                      patchFolder({ subtitle: event.target.value })
                    }
                  />
                </Field>
                <Field label="Slug" hint={`前台路径：/folders/${selected.slug}/`}>
                  <input
                    className="field font-mono"
                    value={selected.slug}
                    onChange={(event) =>
                      patchFolder({ slug: event.target.value })
                    }
                  />
                </Field>
                <Field label="封面">
                  <select
                    className="field"
                    value={selected.coverPhotoId ?? ""}
                    onChange={(event) =>
                      patchFolder({
                        coverPhotoId: event.target.value || undefined,
                      })
                    }
                  >
                    <option value="">自动（最近一张）</option>
                    {assigned.map((photo) => (
                      <option key={photo.id} value={photo.id}>
                        {photo.title ?? photo.fileName}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="描述">
                <textarea
                  className="field min-h-20"
                  rows={3}
                  value={selected.description ?? ""}
                  onChange={(event) =>
                    patchFolder({ description: event.target.value })
                  }
                  placeholder="这个专题的线索…"
                />
              </Field>
            </div>

            <div className="border border-ink/15 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
                <div>
                  <p className="font-display text-lg">选择照片</p>
                  <p className="mt-0.5 text-[11px] text-ink/45">
                    已选 {assigned.length} 张 · 点击缩略图加入或移出专题
                  </p>
                </div>
                <input
                  className="field w-44"
                  placeholder="搜索标题 / 标签"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              <div className="mt-4 max-h-[28rem] space-y-5 overflow-y-auto pr-1">
                {portfolio.albums.map((album) => {
                  const photos = (portfolio.albumPhotos[album.id] ?? []).filter(
                    (photo) => {
                      if (!needle) return true;
                      return (
                        (photo.title ?? "").toLowerCase().includes(needle) ||
                        photo.tags.some((tag) =>
                          tag.toLowerCase().includes(needle),
                        )
                      );
                    },
                  );
                  if (photos.length === 0) return null;

                  return (
                    <div key={album.id}>
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.24em] text-ink/35">
                        {album.title} / {photos.length}
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                        {photos.map((photo) => {
                          const active = assignedIds.includes(photo.id);
                          return (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => togglePhoto(photo.id)}
                              className={`group relative border p-0.5 transition-colors ${
                                active
                                  ? "border-red ring-1 ring-red"
                                  : "border-ink/15 hover:border-ink/50"
                              }`}
                              aria-pressed={active}
                              title={photo.title ?? photo.fileName}
                            >
                              <div className="relative aspect-square overflow-hidden bg-paper-2">
                                <img
                                  src={photo.thumb}
                                  alt={photo.title ?? "照片"}
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                                <span
                                  className={`absolute left-1 top-1 flex h-4 w-4 items-center justify-center border border-ink text-[9px] ${
                                    active
                                      ? "bg-ink text-paper"
                                      : "bg-white/85 text-transparent"
                                  }`}
                                >
                                  ✓
                                </span>
                              </div>
                              <span className="mt-0.5 block truncate px-0.5 text-[8px] text-ink/50">
                                {formatDate(photo.dateTaken)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {portfolio.albums.length === 0 ? (
                  <p className="py-8 text-center text-xs text-ink/40">
                    还没有照片，先到「照片」标签导入作品。
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-ink/20 bg-white/50 p-8 text-center">
            <p className="font-display text-xl">还没有专题</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-ink/45">
              专题把不同相册里的照片重新串成一条叙事线，例如「精选」或「构成研究」。
            </p>
            <Button variant="solid" className="mt-5" onClick={addFolder}>
              + 新建专题
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
