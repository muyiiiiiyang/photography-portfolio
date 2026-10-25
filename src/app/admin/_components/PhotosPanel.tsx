"use client";

import { useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { Button, Field, PanelHeader } from "./ui";
import { formatDate } from "@/lib/format";
import { sortPhotosByTakenDateDesc, uniqueTags } from "@/lib/photos";
import type { Photo, PortfolioData } from "@/lib/types";
import type { UploadSuccess } from "@/lib/admin/types";

interface PhotosPanelProps {
  portfolio: PortfolioData;
  setPortfolio: Dispatch<SetStateAction<PortfolioData>>;
  onNotify: (message: string, tone?: "success" | "error" | "info") => void;
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
}: PhotosPanelProps) {
  const [albumId, setAlbumId] = useState(portfolio.albums[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tagText, setTagText] = useState("");
  const [batchTag, setBatchTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const album =
    portfolio.albums.find((item) => item.id === albumId) ??
    portfolio.albums[0] ??
    null;
  const photos = album ? portfolio.albumPhotos[album.id] ?? [] : [];
  const editing = photos.find((photo) => photo.id === editingId) ?? null;

  function switchAlbum(nextId: string) {
    setAlbumId(nextId);
    setSelected(new Set());
    setEditingId(null);
  }

  function addPhotos(targetAlbumId: string, incoming: Photo[]) {
    setPortfolio((prev) => {
      const merged = sortPhotosByTakenDateDesc([
        ...(prev.albumPhotos[targetAlbumId] ?? []),
        ...incoming,
      ]);
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
    if (!album) return;
    setPortfolio((prev) => {
      const updated = (prev.albumPhotos[album.id] ?? []).map((photo) =>
        photo.id === id ? { ...photo, ...patch } : photo,
      );
      return {
        ...prev,
        albumPhotos: {
          ...prev.albumPhotos,
          [album.id]: sortPhotosByTakenDateDesc(updated),
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
    if (!tag || !album || selected.size === 0) return;

    setPortfolio((prev) => {
      const next = (prev.albumPhotos[album.id] ?? []).map((photo) => {
        if (!selected.has(photo.id)) return photo;
        const tags =
          mode === "add"
            ? uniqueTags([...photo.tags, tag])
            : photo.tags.filter(
                (item) => item.toLowerCase() !== tag.toLowerCase(),
              );
        return { ...photo, tags };
      });

      return {
        ...prev,
        albumPhotos: { ...prev.albumPhotos, [album.id]: next },
      };
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
    if (!album || ids.size === 0) return;

    setPortfolio((prev) => {
      const remaining = (prev.albumPhotos[album.id] ?? []).filter(
        (photo) => !ids.has(photo.id),
      );
      const folderPhotos = Object.fromEntries(
        Object.entries(prev.folderPhotos).map(([folderId, list]) => [
          folderId,
          list.filter((id) => !ids.has(id)),
        ]),
      );

      return {
        ...prev,
        albums: prev.albums.map((item) =>
          item.id === album.id &&
          item.coverPhotoId &&
          ids.has(item.coverPhotoId)
            ? { ...item, coverPhotoId: remaining[0]?.id }
            : item,
        ),
        albumPhotos: { ...prev.albumPhotos, [album.id]: remaining },
        folderPhotos,
      };
    });

    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
    setEditingId((prev) => (prev && ids.has(prev) ? null : prev));
  }

  function deleteSelected() {
    if (!album || selected.size === 0) return;
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

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (!album) {
      onNotify("请先在「相册」里创建一个相册。", "error");
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

      if (payload.errors && payload.errors.length > 0) {
        onNotify(
          `${payload.errors.length} 张处理失败：${payload.errors[0].message}`,
          "error",
        );
      } else if (payload.warnings && payload.warnings.length > 0) {
        onNotify(
          `已导入 ${imported.length} 张，有 ${payload.warnings.length} 条提醒（多为缺少拍摄时间），请检查。`,
          "info",
        );
      } else {
        onNotify(
          `已导入 ${imported.length} 张。点击「保存至磁盘」写入数据。`,
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
        description="拖拽上传后由 Sharp 自动压制成 WebP，并读取 EXIF 拍摄时间。"
        actions={
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">
              {photos.length} frames
            </span>
            <select
              className="field w-52"
              value={album?.id ?? ""}
              onChange={(event) => switchAlbum(event.target.value)}
              aria-label="选择相册"
            >
              {portfolio.albums.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="mt-6 space-y-5">
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
            {uploading ? "正在压制 WebP 并读取 EXIF…" : "拖拽照片到这里"}
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

        {selected.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border border-ink bg-[#fffdf7] p-2.5">
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
              <Field label="说明 / Caption">
                <input
                  className="field"
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
              <Field label="GPS">
                <p className="field font-mono text-ink/55">
                  {editing.gps
                    ? `${editing.gps.lat.toFixed(4)}, ${editing.gps.lng.toFixed(4)}`
                    : "—"}
                </p>
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
            return (
              <div
                key={photo.id}
                className={`group relative border bg-white p-1.5 transition-colors ${
                  active
                    ? "border-red ring-1 ring-red"
                    : "border-ink/15 hover:border-ink/40"
                }`}
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
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between gap-2 px-0.5">
                    <span className="truncate text-[10px] text-ink/70">
                      {photo.title ?? "Untitled"}
                    </span>
                    <span className="shrink-0 font-mono text-[8px] text-ink/35">
                      {formatDate(photo.dateTaken)}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => openEditor(photo)}
                  className="absolute right-1.5 top-1.5 border border-ink bg-white/90 px-1.5 py-0.5 text-[8px] tracking-[0.08em] opacity-0 transition-opacity group-hover:opacity-100"
                >
                  编辑
                </button>
              </div>
            );
          })}
        </div>

        {photos.length === 0 ? (
          <p className="border border-dashed border-ink/20 px-6 py-12 text-center text-xs text-ink/40">
            这个相册还没有照片。拖拽上传第一批作品吧。
          </p>
        ) : null}
      </div>
    </div>
  );
}
