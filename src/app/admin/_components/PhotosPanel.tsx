"use client";

import { useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { Button, Field, PanelHeader } from "./ui";
import { formatDate } from "@/lib/format";
import { uniqueTags } from "@/lib/photos";
import type { Photo, PortfolioData } from "@/lib/types";
import type { UploadSuccess } from "@/lib/admin/types";

const ALL_ALBUMS = "__all__";

interface PhotosPanelProps {
  portfolio: PortfolioData;
  setPortfolio: Dispatch<SetStateAction<PortfolioData>>;
  onNotify: (message: string, tone?: "success" | "error" | "info") => void;
  albumId?: string;
  onAlbumChange?: (albumId: string) => void;
}

function toDateTimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function PhotosPanel({
  portfolio,
  setPortfolio,
  onNotify,
  albumId,
  onAlbumChange,
}: PhotosPanelProps) {
  const [localAlbumId, setLocalAlbumId] = useState(
    portfolio.albums[0]?.id ?? "",
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tagText, setTagText] = useState("");
  const [batchTag, setBatchTag] = useState("");
  const [targetAlbumId, setTargetAlbumId] = useState("");
  const [targetFolderId, setTargetFolderId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragPhotoId, setDragPhotoId] = useState<string | null>(null);
  const [dragOverPhotoId, setDragOverPhotoId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeAlbumId = albumId ?? localAlbumId;
  const isAll = activeAlbumId === ALL_ALBUMS;
  const album = isAll
    ? null
    : (portfolio.albums.find((item) => item.id === activeAlbumId) ??
      portfolio.albums[0] ??
      null);

  const allEntries = useMemo(() => {
    const entries = portfolio.albums.flatMap((item) =>
      (portfolio.albumPhotos[item.id] ?? []).map((photo) => ({
        photo,
        albumId: item.id,
        albumTitle: item.title,
      })),
    );
    return entries.sort(
      (a, b) => Date.parse(b.photo.dateTaken) - Date.parse(a.photo.dateTaken),
    );
  }, [portfolio]);

  const albumTitleByPhoto = useMemo(
    () => new Map(allEntries.map((entry) => [entry.photo.id, entry.albumTitle])),
    [allEntries],
  );

  const folderOptions = useMemo(() => {
    const result: { id: string; label: string; depth: number }[] = [];
    const walk = (parentId: string | undefined, depth: number) => {
      for (const folder of portfolio.folders) {
        if (
          (parentId && folder.parentId === parentId) ||
          (!parentId && !folder.parentId)
        ) {
          result.push({
            id: folder.id,
            label: `${depth > 0 ? "↳ " : ""}${folder.title}`,
            depth,
          });
          walk(folder.id, depth + 1);
        }
      }
    };
    walk(undefined, 0);
    return result;
  }, [portfolio.folders]);

  const photos = isAll
    ? allEntries.map((entry) => entry.photo)
    : album
      ? portfolio.albumPhotos[album.id] ?? []
      : [];
  const editing = photos.find((photo) => photo.id === editingId) ?? null;
  const effectiveTargetAlbumId =
    targetAlbumId || portfolio.albums[0]?.id || "";
  const effectiveTargetFolderId =
    targetFolderId || folderOptions[0]?.id || "";

  function switchAlbum(nextId: string) {
    setLocalAlbumId(nextId);
    onAlbumChange?.(nextId);
    setSelected(new Set());
    setEditingId(null);
    setDragPhotoId(null);
    setDragOverPhotoId(null);
  }

  function reorderAlbumPhoto(fromId: string, toId: string | null) {
    if (!album || isAll) return;
    setPortfolio((prev) => {
      const list = prev.albumPhotos[album.id] ?? [];
      const fromIndex = list.findIndex((photo) => photo.id === fromId);
      if (fromIndex === -1) return prev;
      const next = [...list];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      const targetIndex = toId
        ? next.findIndex((photo) => photo.id === toId)
        : next.length;
      next.splice(targetIndex === -1 ? next.length : targetIndex, 0, moved);
      if (next.every((photo, index) => photo.id === list[index]?.id)) {
        return prev;
      }
      return {
        ...prev,
        albumPhotos: { ...prev.albumPhotos, [album.id]: next },
      };
    });
  }

  function resetDrag() {
    setDragPhotoId(null);
    setDragOverPhotoId(null);
  }

  function ownerAlbumId(photoId: string): string | undefined {
    return Object.entries(portfolio.albumPhotos).find(([, list]) =>
      list.some((photo) => photo.id === photoId),
    )?.[0];
  }

  function addPhotos(targetAlbumId: string, incoming: Photo[]) {
    setPortfolio((prev) => {
      const merged = [
        ...(prev.albumPhotos[targetAlbumId] ?? []),
        ...incoming,
      ];
      return {
        ...prev,
        albums: prev.albums.map((item) =>
          item.id === targetAlbumId
            ? { ...item, coverPhotoId: item.coverPhotoId ?? merged[0]?.id }
            : item,
        ),
        albumPhotos: { ...prev.albumPhotos, [targetAlbumId]: merged },
      };
    });
  }

  function updatePhoto(id: string, patch: Partial<Photo>) {
    const albumId = ownerAlbumId(id);
    if (!albumId) return;
    setPortfolio((prev) => {
      const updated = (prev.albumPhotos[albumId] ?? []).map((photo) =>
        photo.id === id ? { ...photo, ...patch } : photo,
      );
      return {
        ...prev,
        albumPhotos: {
          ...prev.albumPhotos,
          [albumId]: updated,
        },
      };
    });
  }

  function togglePhoto(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openEditor(photo: Photo) {
    setEditingId(photo.id);
    setTagText(photo.tags.join(", "));
  }

  function commitTags() {
    if (!editing) return;
    updatePhoto(editing.id, {
      tags: uniqueTags(tagText.split(/[,，]/)),
    });
  }

  function applyBatchTag(mode: "add" | "remove") {
    const tag = batchTag.trim();
    if (!tag || selected.size === 0) return;

    setPortfolio((prev) => {
      const albumPhotos = Object.fromEntries(
        Object.entries(prev.albumPhotos).map(([albumKey, list]) => [
          albumKey,
          list.map((photo) => {
            if (!selected.has(photo.id)) return photo;
            const tags =
              mode === "add"
                ? uniqueTags([...photo.tags, tag])
                : photo.tags.filter(
                    (item) => item.toLowerCase() !== tag.toLowerCase(),
                  );
            return { ...photo, tags };
          }),
        ]),
      );

      return { ...prev, albumPhotos };
    });

    setBatchTag("");
    onNotify(
      mode === "add"
        ? `已为 ${selected.size} 张照片加上「${tag}」`
        : `已从 ${selected.size} 张照片移除「${tag}」`,
      "success",
    );
  }

  function removePhotos(ids: Set<string>) {
    if (ids.size === 0) return;

    setPortfolio((prev) => {
      const albumPhotos = Object.fromEntries(
        Object.entries(prev.albumPhotos).map(([albumKey, list]) => [
          albumKey,
          list.filter((photo) => !ids.has(photo.id)),
        ]),
      );
      const folderPhotos = Object.fromEntries(
        Object.entries(prev.folderPhotos).map(([folderId, list]) => [
          folderId,
          list.filter((id) => !ids.has(id)),
        ]),
      );
      const albums = prev.albums.map((item) => {
        const remaining = albumPhotos[item.id] ?? [];
        return item.coverPhotoId && ids.has(item.coverPhotoId)
          ? { ...item, coverPhotoId: remaining[0]?.id }
          : item;
      });

      return { ...prev, albums, albumPhotos, folderPhotos };
    });

    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
    setEditingId((prev) => (prev && ids.has(prev) ? null : prev));
  }

  function deleteSelected() {
    if (selected.size === 0) return;
    const count = selected.size;
    if (
      !window.confirm(
        `删除选中的 ${count} 张照片？保存至磁盘后会一并清理图片文件。`,
      )
    ) {
      return;
    }

    removePhotos(selected);
    onNotify(`已有 ${count} 张照片移出草稿，保存后生效。`, "info");
  }

  function moveSelectedToAlbum() {
    const target = portfolio.albums.find(
      (item) => item.id === effectiveTargetAlbumId,
    );
    if (!target || selected.size === 0) return;

    setPortfolio((prev) => {
      const moving = new Set(selected);
      const moved: Photo[] = [];
      const albumPhotos: Record<string, Photo[]> = {};

      for (const item of prev.albums) {
        const keep: Photo[] = [];
        for (const photo of prev.albumPhotos[item.id] ?? []) {
          if (moving.has(photo.id)) moved.push(photo);
          else keep.push(photo);
        }
        albumPhotos[item.id] = keep;
      }

      albumPhotos[target.id] = [
        ...(albumPhotos[target.id] ?? []),
        ...moved,
      ];

      const albums = prev.albums.map((item) => {
        const list = albumPhotos[item.id] ?? [];
        const keepCover =
          item.coverPhotoId && list.some((photo) => photo.id === item.coverPhotoId);
        return {
          ...item,
          coverPhotoId: keepCover ? item.coverPhotoId : list[0]?.id,
        };
      });

      return { ...prev, albums, albumPhotos };
    });

    onNotify(
      `已将 ${selected.size} 张照片移动到「${target.title}」，保存后生效。`,
      "success",
    );
    setSelected(new Set());
    setEditingId(null);
  }

  function addSelectedToFolder() {
    const folder = portfolio.folders.find(
      (item) => item.id === effectiveTargetFolderId,
    );
    if (!folder || selected.size === 0) return;

    setPortfolio((prev) => {
      const current = new Set(prev.folderPhotos[folder.id] ?? []);
      for (const id of selected) current.add(id);

      const dateById = new Map<string, string>();
      for (const list of Object.values(prev.albumPhotos)) {
        for (const photo of list) dateById.set(photo.id, photo.dateTaken);
      }

      const ordered = [...current].sort(
        (a, b) => Date.parse(dateById.get(b) ?? "") - Date.parse(dateById.get(a) ?? ""),
      );

      return {
        ...prev,
        folderPhotos: { ...prev.folderPhotos, [folder.id]: ordered },
      };
    });

    onNotify(
      `已将 ${selected.size} 张照片加入「${folder.title}」，保存后生效。`,
      "success",
    );
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (!album) {
      onNotify(
        "「全部照片」用于筛选与分类；请在上方选择具体相册后再上传。",
        "error",
      );
      return;
    }

    const files = Array.from(fileList).slice(0, 24);
    const form = new FormData();
    for (const file of files) form.append("files", file);

    setUploading(true);
    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json().catch(() => ({}))) as Partial<
        UploadSuccess
      > & { error?: string };

      if (!response.ok) {
        onNotify(payload.error ?? "上传失败，请检查文件后重试。", "error");
        return;
      }

      const imported = payload.photos ?? [];
      if (imported.length > 0) {
        addPhotos(album.id, imported);
      }

      const gpsCount = imported.filter((photo) => photo.gps).length;
      const gpsNote =
        gpsCount > 0 ? `，其中 ${gpsCount} 张已读取 GPS` : "，未读取到 GPS";

      if (payload.errors && payload.errors.length > 0) {
        onNotify(
          `${payload.errors.length} 张处理失败：${payload.errors[0].message}`,
          "error",
        );
      } else if (payload.warnings && payload.warnings.length > 0) {
        onNotify(
          `已导入 ${imported.length} 张${gpsNote}，有 ${payload.warnings.length} 条提醒（多为缺少拍摄时间），请检查。`,
          "info",
        );
      } else {
        onNotify(
          `已导入 ${imported.length} 张${gpsNote}。点击「保存至磁盘」写入数据。`,
          "success",
        );
      }
    } catch {
      onNotify("上传失败：无法连接本地服务。", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (portfolio.albums.length === 0) {
    return (
      <div>
        <PanelHeader
          eyebrow="Photos"
          title="照片"
          description="先创建相册，再导入照片。"
        />
        <p className="mt-8 border border-dashed border-ink/25 bg-white/50 px-6 py-16 text-center text-xs text-ink/45">
          还没有相册。切换到「相册」标签，新建一个相册吧。
        </p>
      </div>
    );
  }

  return (
    <div>
      <PanelHeader
        eyebrow="Photos"
        title="照片"
        description={
          isAll
            ? `全部照片：${allEntries.length} 张。可选中照片移动到作品集，或加入任意专题 / 子专题。`
            : `当前相册：${album?.title ?? "未选择"}。拖拽上传后由 Sharp 自动压制成 WebP，并读取 EXIF 拍摄时间。`
        }
        actions={
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">
              {photos.length} frames
            </span>
            <select
              className="field w-56"
              value={isAll ? ALL_ALBUMS : album?.id ?? ""}
              onChange={(event) => switchAlbum(event.target.value)}
              aria-label="选择相册或全部照片"
            >
              <option value={ALL_ALBUMS}>
                全部照片（{allEntries.length}）
              </option>
              {portfolio.albums.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}（{(portfolio.albumPhotos[item.id] ?? []).length}）
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="mt-6 space-y-5">
        {album ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void handleFiles(event.dataTransfer.files);
            }}
            className={`border-2 border-dashed px-6 py-8 text-center transition-colors ${
              dragging
                ? "border-red bg-red/5"
                : "border-ink/20 bg-white/50 hover:border-ink/40"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <p className="font-display text-lg">
              {uploading
                ? "正在压制 WebP 并读取 EXIF…"
                : `拖拽照片到「${album.title}」`}
            </p>
            <p className="mt-1 text-[11px] text-ink/45">
              JPG / PNG / WebP / HEIC · 单张 ≤ 60MB · 一次最多 24 张
            </p>
            <Button
              variant="accent"
              className="mt-4"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "处理中…" : "选择照片"}
            </Button>
          </div>
        ) : (
          <div className="border border-dashed border-ink/25 bg-white/50 px-6 py-5 text-center">
            <p className="font-display text-lg">全部照片视图</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
              这里适合跨相册查看与分类。选中照片后可移动到作品集或加入专题；
              上传请在上方选择具体相册。
            </p>
          </div>
        )}

        {album && photos.length > 1 ? (
          <p className="border-l-2 border-yellow bg-yellow/10 px-3 py-2 text-[11px] leading-relaxed text-ink/55">
            拖动任意照片卡片调整「{album.title}」的前台顺序；松手后顺序只存入草稿，
            点击右上角「保存至磁盘」后生效。前台默认显示手动顺序，也可切换拍摄时间排序。
          </p>
        ) : null}

        {selected.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border border-ink bg-white p-2.5">
            <span className="px-1 text-[11px]">
              已选 <strong>{selected.size}</strong> 张
            </span>
            <input
              className="field w-36"
              placeholder="标签名"
              value={batchTag}
              onChange={(event) => setBatchTag(event.target.value)}
            />
            <Button size="sm" onClick={() => applyBatchTag("add")}>
              + 加标签
            </Button>
            <Button size="sm" onClick={() => applyBatchTag("remove")}>
              − 移除标签
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="ml-auto"
              onClick={deleteSelected}
            >
              删除所选
            </Button>
            <Button size="sm" onClick={() => setSelected(new Set())}>
              取消选择
            </Button>
            <Button
              size="sm"
              onClick={() => setSelected(new Set(photos.map((p) => p.id)))}
            >
              全选
            </Button>
          </div>
        ) : null}

        {selected.size > 0 ? (
          <div className="space-y-2 border border-ink bg-white p-2.5">
            <p className="px-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">
              分类已选照片 / {selected.size}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="field w-52"
                value={effectiveTargetAlbumId}
                onChange={(event) => setTargetAlbumId(event.target.value)}
                aria-label="目标作品集"
              >
                {portfolio.albums.map((item) => (
                  <option key={item.id} value={item.id}>
                    移动到：{item.title}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={moveSelectedToAlbum}
                disabled={!effectiveTargetAlbumId}
              >
                移入作品集
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="field w-52"
                value={effectiveTargetFolderId}
                onChange={(event) => setTargetFolderId(event.target.value)}
                aria-label="目标专题"
              >
                {folderOptions.length === 0 ? (
                  <option value="">还没有专题</option>
                ) : (
                  folderOptions.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      加入：{folder.label}
                    </option>
                  ))
                )}
              </select>
              <Button
                size="sm"
                onClick={addSelectedToFolder}
                disabled={!effectiveTargetFolderId}
              >
                加入专题
              </Button>
            </div>
          </div>
        ) : null}

        {editing ? (
          <div className="border border-ink bg-white p-5">
            <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-ink/35">
                  Edit frame
                </p>
                <p className="mt-1 font-display text-lg">
                  {editing.title ?? editing.fileName}
                </p>
                <p className="mt-0.5 font-mono text-[9px] text-ink/35">
                  {editing.fileName} · {editing.width}×{editing.height}
                </p>
              </div>
              <Button size="sm" onClick={() => setEditingId(null)}>
                关闭
              </Button>
            </div>

            {editing.dateTakenSource === "fallback" ? (
              <p className="mt-3 border-l-2 border-red bg-red/5 px-3 py-2 text-[11px] text-red">
                缺少 EXIF 拍摄时间，当前显示的是导入时间。请手动校正，排序才会正确。
              </p>
            ) : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="标题">
                <input
                  className="field"
                  value={editing.title ?? ""}
                  onChange={(event) =>
                    updatePhoto(editing.id, { title: event.target.value })
                  }
                />
              </Field>
              <Field label="拍摄时间" hint="排序唯一依据，保存为 UTC ISO 字符串。">
                <input
                  type="datetime-local"
                  className="field font-mono"
                  value={toDateTimeLocal(editing.dateTaken)}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) return;
                    const date = new Date(value);
                    if (Number.isNaN(date.getTime())) return;
                    updatePhoto(editing.id, {
                      dateTaken: date.toISOString(),
                      dateTakenSource: "manual",
                    });
                  }}
                />
              </Field>
              <Field label="标签" hint="用中英文逗号分隔，失焦后生效。">
                <input
                  className="field"
                  value={tagText}
                  onChange={(event) => setTagText(event.target.value)}
                  onBlur={commitTags}
                />
              </Field>
              <Field label="说明 / Caption" hint="支持换行，前台灯箱按原样显示。">
                <textarea
                  className="field min-h-20"
                  rows={3}
                  value={editing.caption ?? ""}
                  onChange={(event) =>
                    updatePhoto(editing.id, { caption: event.target.value })
                  }
                />
              </Field>
              <Field label="相机">
                <input
                  className="field"
                  value={editing.camera ?? ""}
                  onChange={(event) =>
                    updatePhoto(editing.id, { camera: event.target.value })
                  }
                />
              </Field>
              <Field label="镜头">
                <input
                  className="field"
                  value={editing.lens ?? ""}
                  onChange={(event) =>
                    updatePhoto(editing.id, { lens: event.target.value })
                  }
                />
              </Field>
              <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                <Field label="焦距">
                  <input
                    className="field"
                    value={editing.focalLength ?? ""}
                    onChange={(event) =>
                      updatePhoto(editing.id, {
                        focalLength: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="光圈">
                  <input
                    className="field"
                    value={editing.aperture ?? ""}
                    onChange={(event) =>
                      updatePhoto(editing.id, { aperture: event.target.value })
                    }
                  />
                </Field>
                <Field label="快门">
                  <input
                    className="field"
                    value={editing.shutterSpeed ?? ""}
                    onChange={(event) =>
                      updatePhoto(editing.id, {
                        shutterSpeed: event.target.value,
                      })
                    }
                  />
                </Field>
              </div>
              <Field label="ISO">
                <input
                  className="field font-mono"
                  inputMode="numeric"
                  value={editing.iso ?? ""}
                  onChange={(event) =>
                    updatePhoto(editing.id, {
                      iso:
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value),
                    })
                  }
                />
              </Field>
              <Field label="GPS（上传时自动读取）">
                {editing.gps ? (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${editing.gps.lat}&mlon=${editing.gps.lng}#map=14/${editing.gps.lat}/${editing.gps.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="field flex items-center justify-between gap-2 font-mono text-ink/70 transition-colors hover:border-ink hover:text-ink"
                  >
                    <span>
                      {editing.gps.lat.toFixed(5)},{" "}
                      {editing.gps.lng.toFixed(5)}
                    </span>
                    <span aria-hidden className="text-[10px] text-ink/40">
                      地图 ↗
                    </span>
                  </a>
                ) : (
                  <p className="field font-mono text-ink/40">未读取到</p>
                )}
              </Field>
            </div>

            <div className="mt-4 flex justify-end border-t border-ink/10 pt-3">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (
                    !window.confirm(
                      "删除这张照片？保存至磁盘后会一并清理图片文件。",
                    )
                  ) {
                    return;
                  }
                  removePhotos(new Set([editing.id]));
                  onNotify("已从草稿移除，保存后生效。", "info");
                }}
              >
                删除这张
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo) => {
            const active = selected.has(photo.id);
            const reorderable = Boolean(album) && !isAll && photos.length > 1;
            const dropTarget =
              dragOverPhotoId === photo.id && dragPhotoId !== photo.id;
            return (
              <div
                key={photo.id}
                draggable={reorderable}
                onDragStart={(event) => {
                  if (!reorderable) return;
                  setDragPhotoId(photo.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", photo.id);
                }}
                onDragOver={(event) => {
                  if (!dragPhotoId || dragPhotoId === photo.id) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverPhotoId(photo.id);
                }}
                onDragLeave={() =>
                  setDragOverPhotoId((current) =>
                    current === photo.id ? null : current,
                  )
                }
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (dragPhotoId && dragPhotoId !== photo.id) {
                    reorderAlbumPhoto(dragPhotoId, photo.id);
                  }
                  resetDrag();
                }}
                onDragEnd={resetDrag}
                title={reorderable ? "拖动照片调整顺序" : undefined}
                className={`group relative border bg-white p-1.5 transition-colors ${
                  active
                    ? "border-red ring-1 ring-red"
                    : "border-ink/15 hover:border-ink/40"
                } ${reorderable ? "cursor-grab active:cursor-grabbing" : ""} ${
                  dragPhotoId === photo.id ? "opacity-40" : ""
                } ${dropTarget ? "border-dashed border-red bg-red/5" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => togglePhoto(photo.id)}
                  className="block w-full text-left"
                  aria-pressed={active}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                    <img
                      src={photo.thumb}
                      alt={photo.title ?? "照片"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center border border-ink text-[9px] ${
                        active ? "bg-ink text-paper" : "bg-white/90"
                      }`}
                    >
                      {active ? "✓" : ""}
                    </span>
                    {photo.dateTakenSource === "fallback" ? (
                      <span className="absolute right-1.5 top-1.5 bg-red px-1 py-0.5 font-mono text-[8px] tracking-[0.08em] text-white">
                        NO DATE
                      </span>
                    ) : null}
                    {photo.gps ? (
                      <span className="absolute bottom-1.5 left-1.5 bg-ink/85 px-1 py-0.5 font-mono text-[8px] tracking-[0.08em] text-white">
                        GPS
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between gap-2 px-0.5">
                    <span className="min-w-0 truncate text-[10px] text-ink/70">
                      {isAll ? (
                        <span className="mr-1.5 font-mono text-[8px] uppercase tracking-[0.08em] text-ink/35">
                          {albumTitleByPhoto.get(photo.id)}
                        </span>
                      ) : null}
                      {photo.title ?? "Untitled"}
                    </span>
                    <span className="shrink-0 font-mono text-[8px] text-ink/35">
                      {formatDate(photo.dateTaken)}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  draggable={false}
                  onClick={() => openEditor(photo)}
                  aria-label={`编辑照片：${photo.title ?? photo.fileName}`}
                  className="absolute right-1.5 top-1.5 flex h-8 items-center border border-ink bg-white px-2.5 text-[10px] tracking-[0.06em] shadow-[2px_2px_0_0_rgba(20,18,16,0.12)] transition-colors hover:bg-ink hover:text-paper"
                >
                  编辑
                </button>
              </div>
            );
          })}
        </div>

        {album && photos.length > 1 ? (
          <div
            onDragOver={(event) => {
              if (!dragPhotoId) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragPhotoId) reorderAlbumPhoto(dragPhotoId, null);
              resetDrag();
            }}
            className={`border border-dashed px-4 py-3 text-center font-mono text-[9px] uppercase tracking-[0.18em] transition-colors ${
              dragPhotoId
                ? "border-red bg-red/5 text-red"
                : "border-ink/15 text-ink/35"
            }`}
          >
            拖到这里移到相册末尾
          </div>
        ) : null}

        {photos.length === 0 ? (
          <p className="border border-dashed border-ink/20 px-6 py-12 text-center text-xs text-ink/40">
            {isAll
              ? "还没有照片，先到具体相册上传作品。"
              : "这个相册还没有照片。拖拽上传第一批作品吧。"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
