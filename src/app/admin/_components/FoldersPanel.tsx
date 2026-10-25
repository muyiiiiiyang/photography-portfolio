"use client";

import { useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { Button, Field, PanelHeader } from "./ui";
import { formatDate } from "@/lib/format";
import type { UploadSuccess } from "@/lib/admin/types";
import type { Folder, Photo, PortfolioData } from "@/lib/types";

interface FoldersPanelProps {
  portfolio: PortfolioData;
  setPortfolio: Dispatch<SetStateAction<PortfolioData>>;
  foldersIntro: string;
  onFoldersIntroChange: (value: string) => void;
  navFolderIds: string[];
  onNavFolderIdsChange: (folderIds: string[]) => void;
  onNotify: (message: string, tone?: "success" | "error" | "info") => void;
}

export function FoldersPanel({
  portfolio,
  setPortfolio,
  foldersIntro,
  onFoldersIntroChange,
  navFolderIds,
  onNavFolderIdsChange,
  onNotify,
}: FoldersPanelProps) {
  const [selectedId, setSelectedId] = useState(portfolio.folders[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [uploadAlbumId, setUploadAlbumId] = useState(
    portfolio.albums[0]?.id ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadInput = useRef<HTMLInputElement | null>(null);

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

  function childrenOf(parentId: string | undefined) {
    return portfolio.folders.filter((folder) =>
      parentId ? folder.parentId === parentId : !folder.parentId,
    );
  }

  function descendantIds(folderId: string): Set<string> {
    const result = new Set<string>();
    const walk = (parentId: string) => {
      for (const folder of portfolio.folders) {
        if (folder.parentId === parentId && !result.has(folder.id)) {
          result.add(folder.id);
          walk(folder.id);
        }
      }
    };
    walk(folderId);
    return result;
  }

  const blockedParentIds = selected
    ? new Set([selected.id, ...descendantIds(selected.id)])
    : new Set<string>();
  const parentOptions = portfolio.folders.filter(
    (folder) => !blockedParentIds.has(folder.id),
  );

  const topFolders = portfolio.folders.filter((folder) => !folder.parentId);
  const navSlots = Array.from(
    { length: 4 },
    (_, index) => navFolderIds[index] ?? "",
  );
  const effectiveUploadAlbumId =
    uploadAlbumId || portfolio.albums[0]?.id || "";

  function updateNavSlot(index: number, value: string) {
    const next = [...navSlots];
    const existing = next.indexOf(value);
    if (value && existing !== -1 && existing !== index) {
      next[existing] = next[index];
    }
    next[index] = value;
    onNavFolderIdsChange(next.filter(Boolean));
  }

  async function uploadToFolder(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !selected) return;
    const album =
      portfolio.albums.find((item) => item.id === effectiveUploadAlbumId) ??
      portfolio.albums[0];
    if (!album) {
      setUploadError("还没有相册，请先在「相册」中创建一个相册。");
      return;
    }

    const files = Array.from(fileList).slice(0, 24);
    const form = new FormData();
    for (const file of files) form.append("files", file);

    setUploading(true);
    setUploadError(null);
    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json().catch(() => ({}))) as Partial<
        UploadSuccess
      > & { error?: string };

      if (!response.ok) {
        setUploadError(payload.error ?? "上传失败，请检查文件后重试。");
        return;
      }

      const imported = payload.photos ?? [];
      if (imported.length === 0) {
        setUploadError(
          payload.errors?.[0]?.message ?? "没有可导入的照片。",
        );
        return;
      }

      setPortfolio((prev) => {
        const existing = prev.albumPhotos[album.id] ?? [];
        const existingIds = new Set(existing.map((photo) => photo.id));
        const newPhotos = imported.filter(
          (photo) => !existingIds.has(photo.id),
        );
        const folderCurrent = prev.folderPhotos[selected.id] ?? [];
        const folderIds = new Set(folderCurrent);
        for (const photo of newPhotos) folderIds.add(photo.id);

        return {
          ...prev,
          albums: prev.albums.map((item) =>
            item.id === album.id
              ? {
                  ...item,
                  coverPhotoId:
                    item.coverPhotoId ?? existing[0]?.id ?? newPhotos[0]?.id,
                }
              : item,
          ),
          albumPhotos: {
            ...prev.albumPhotos,
            [album.id]: [...existing, ...newPhotos],
          },
          folderPhotos: {
            ...prev.folderPhotos,
            [selected.id]: [...folderIds],
          },
        };
      });

      const warning =
        payload.warnings && payload.warnings.length > 0
          ? `，${payload.warnings.length} 条提醒`
          : "";
      onNotify(
        `已上传 ${imported.length} 张到「${album.title}」，并加入专题「${selected.title}」${warning}。保存至磁盘后生效。`,
        "success",
      );
    } catch {
      setUploadError("上传失败：无法连接本地服务。");
    } finally {
      setUploading(false);
      if (uploadInput.current) uploadInput.current.value = "";
    }
  }

  function patchFolder(patch: Partial<Folder>) {
    if (!selected) return;
    setPortfolio((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) =>
        folder.id === selected.id ? { ...folder, ...patch } : folder,
      ),
    }));
  }

  function addFolder(parentId?: string) {
    const id = `folder_${Date.now().toString(36)}`;
    const parent = parentId
      ? portfolio.folders.find((folder) => folder.id === parentId)
      : null;
    const folder: Folder = {
      id,
      slug: `new-series-${portfolio.folders.length + 1}`,
      title: parent ? "新子专题" : "新专题",
      subtitle: parent ? "NEW CHILD SERIES" : "NEW SERIES",
      description: "",
      parentId: parent?.id,
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
    const descendants = descendantIds(selected.id);
    const removeIds = new Set([selected.id, ...descendants]);
    if (
      !window.confirm(
        descendants.size > 0
          ? `删除专题「${selected.title}」及其 ${descendants.size} 个子专题？照片本身仍保留在各自相册中。`
          : `删除专题「${selected.title}」？照片本身仍保留在各自相册中。`,
      )
    ) {
      return;
    }

    const remaining = portfolio.folders.filter(
      (folder) => !removeIds.has(folder.id),
    );

    setPortfolio((prev) => {
      const folderPhotos = { ...prev.folderPhotos };
      for (const id of removeIds) delete folderPhotos[id];
      return {
        ...prev,
        folders: prev.folders.filter((folder) => !removeIds.has(folder.id)),
        folderPhotos,
      };
    });

    setSelectedId(remaining[0]?.id ?? "");
  }

  function renderRows(parentId: string | undefined, depth = 0): ReactNode {
    return childrenOf(parentId).map((folder) => {
      const count = (portfolio.folderPhotos[folder.id] ?? []).length;
      const active = selected?.id === folder.id;
      const childCount = childrenOf(folder.id).length;

      return (
        <div key={folder.id}>
          <button
            type="button"
            onClick={() => setSelectedId(folder.id)}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            className={`w-full border-l-2 py-2 pr-3 text-left transition-colors ${
              active
                ? "border-red bg-white"
                : "border-transparent hover:bg-white/60"
            }`}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[13px] font-medium">
                {depth > 0 ? <span className="text-ink/30">↳ </span> : null}
                {folder.title}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-ink/40">
                {count}
              </span>
            </span>
            <span className="mt-0.5 block truncate font-mono text-[9px] text-ink/35">
              /{folder.slug}
              {childCount > 0 ? ` · ${childCount} 子专题` : ""}
            </span>
          </button>
          {renderRows(folder.id, depth + 1)}
        </div>
      );
    });
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
        description="跨相册挑选照片，组成主题序列；支持在任意专题下继续创建子专题。"
        actions={
          <Button variant="solid" onClick={() => addFolder()}>
            + 新建专题
          </Button>
        }
      />

      <section className="mt-6 border border-ink/15 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-display text-lg">顶部导航专题</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
              顶部「专题」下拉只展示这四组顶级专题，最后固定为「更多专题」；留空则少展示一组。
            </p>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/35">
            {navFolderIds.length} / 4
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {navSlots.map((folderId, index) => (
            <Field
              key={`nav-folder-${index}`}
              label={`位置 ${String(index + 1).padStart(2, "0")}`}
            >
              <select
                className="field"
                value={folderId}
                onChange={(event) =>
                  updateNavSlot(index, event.target.value)
                }
              >
                <option value="">未选择</option>
                {topFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.title}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
      </section>

      <section className="mt-6 border border-ink/15 bg-white p-4 sm:p-5">
        <Field
          label="专题页引导语"
          hint="显示在专题索引页大标题右侧，支持换行。"
        >
          <textarea
            className="field min-h-20"
            rows={3}
            value={foldersIntro}
            onChange={(event) => onFoldersIntroChange(event.target.value)}
          />
        </Field>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="space-y-1">
          {portfolio.folders.length > 0 ? (
            renderRows(undefined)
          ) : (
            <p className="border border-dashed border-ink/20 px-3 py-6 text-center text-[11px] text-ink/40">
              还没有专题
            </p>
          )}
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => addFolder(selected.id)}
                  >
                    + 新建子专题
                  </Button>
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
                <Field label="上级专题" hint="留空则作为顶级专题。">
                  <select
                    className="field"
                    value={selected.parentId ?? ""}
                    onChange={(event) =>
                      patchFolder({
                        parentId: event.target.value || undefined,
                      })
                    }
                  >
                    <option value="">顶级专题</option>
                    {parentOptions.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.parentId ? "↳ " : ""}
                        {folder.title}
                      </option>
                    ))}
                  </select>
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg">上传照片到专题</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink/45">
                    照片会先存入选定相册，然后自动加入「{selected.title}」。
                    顶级专题和子专题都可以使用。
                  </p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/30">
                  Upload to series
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  className="field w-full sm:w-56"
                  value={effectiveUploadAlbumId}
                  onChange={(event) => setUploadAlbumId(event.target.value)}
                  aria-label="上传照片的归属相册"
                  disabled={portfolio.albums.length === 0 || uploading}
                >
                  {portfolio.albums.length === 0 ? (
                    <option value="">还没有相册</option>
                  ) : (
                    portfolio.albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        存入相册：{album.title}
                      </option>
                    ))
                  )}
                </select>
                <input
                  ref={uploadInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) =>
                    void uploadToFolder(event.target.files)
                  }
                />
                <Button
                  variant="accent"
                  disabled={uploading || portfolio.albums.length === 0}
                  onClick={() => uploadInput.current?.click()}
                >
                  {uploading ? "上传中…" : "上传照片 ↑"}
                </Button>
              </div>

              {portfolio.albums.length === 0 ? (
                <p className="mt-2 text-[11px] text-red">
                  还没有相册。请先在「相册」中创建相册，再上传到专题。
                </p>
              ) : null}
              {uploadError ? (
                <p
                  role="alert"
                  className="mt-2 border-l-2 border-red bg-red/5 px-2 py-1 text-[11px] text-red"
                >
                  {uploadError}
                </p>
              ) : null}
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
              先建一个顶级专题，例如「景观」「人像」「产品」，再进入其中创建子专题。
            </p>
            <Button
              variant="solid"
              className="mt-5"
              onClick={() => addFolder()}
            >
              + 新建专题
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
