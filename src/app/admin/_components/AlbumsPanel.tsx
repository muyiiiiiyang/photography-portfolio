"use client";

import { useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { Button, Field, PanelHeader } from "./ui";
import { MapPicker } from "./MapPicker";
import { formatDate } from "@/lib/format";
import type { UploadSuccess } from "@/lib/admin/types";
import type { Album, Photo, PortfolioData } from "@/lib/types";

interface AlbumsPanelProps {
  portfolio: PortfolioData;
  setPortfolio: Dispatch<SetStateAction<PortfolioData>>;
  navAlbumIds: string[];
  onNavAlbumIdsChange: (albumIds: string[]) => void;
  worksIntro: string;
  onWorksIntroChange: (value: string) => void;
  onNotify: (message: string, tone?: "success" | "error" | "info") => void;
}

export function AlbumsPanel({
  portfolio,
  setPortfolio,
  navAlbumIds,
  onNavAlbumIdsChange,
  worksIntro,
  onWorksIntroChange,
  onNotify,
}: AlbumsPanelProps) {
  const [selectedId, setSelectedId] = useState(portfolio.albums[0]?.id ?? "");
  const [dragPhotoId, setDragPhotoId] = useState<string | null>(null);
  const [dragOverPhotoId, setDragOverPhotoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [readTitle, setReadTitle] = useState(false);
  const uploadInput = useRef<HTMLInputElement | null>(null);
  const selected =
    portfolio.albums.find((album) => album.id === selectedId) ??
    portfolio.albums[0] ??
    null;

  const photos = selected ? portfolio.albumPhotos[selected.id] ?? [] : [];

  const configuredNavIds =
    navAlbumIds.length > 0
      ? navAlbumIds
      : portfolio.albums.slice(0, 4).map((album) => album.id);
  const navSlots = Array.from(
    { length: 4 },
    (_, index) => configuredNavIds[index] ?? "",
  );

  function updateNavSlot(index: number, value: string) {
    const next = [...navSlots];
    const existing = next.indexOf(value);
    if (value && existing !== -1 && existing !== index) {
      next[existing] = next[index];
    }
    next[index] = value;
    onNavAlbumIdsChange(next.filter(Boolean));
  }

  function reorderAlbumPhotos(fromId: string, toId: string | null) {
    if (!selected) return;
    setPortfolio((prev) => {
      const list = prev.albumPhotos[selected.id] ?? [];
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
        albumPhotos: { ...prev.albumPhotos, [selected.id]: next },
      };
    });
  }

  function resetDrag() {
    setDragPhotoId(null);
    setDragOverPhotoId(null);
  }

  async function uploadToAlbum(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !selected) return;
    const files = Array.from(fileList).slice(0, 24);
    const form = new FormData();
    for (const file of files) form.append("files", file);
    form.append("readTitle", readTitle ? "1" : "0");

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
        setUploadError(payload.errors?.[0]?.message ?? "没有可导入的照片。");
        return;
      }

      setPortfolio((prev) => {
        const existing = prev.albumPhotos[selected.id] ?? [];
        const existingIds = new Set(existing.map((photo) => photo.id));
        const added: Photo[] = imported.filter(
          (photo) => !existingIds.has(photo.id),
        );
        const merged = [...existing, ...added];
        return {
          ...prev,
          albums: prev.albums.map((album) =>
            album.id === selected.id
              ? {
                  ...album,
                  coverPhotoId: album.coverPhotoId ?? merged[0]?.id,
                }
              : album,
          ),
          albumPhotos: { ...prev.albumPhotos, [selected.id]: merged },
        };
      });

      const warning =
        payload.warnings && payload.warnings.length > 0
          ? `，${payload.warnings.length} 条提醒`
          : "";
      onNotify(
        `已上传 ${imported.length} 张到「${selected.title}」${warning}。保存至磁盘后生效。`,
        "success",
      );
    } catch {
      setUploadError("上传失败：无法连接本地服务。");
    } finally {
      setUploading(false);
      if (uploadInput.current) uploadInput.current.value = "";
    }
  }

  function patchAlbum(patch: Partial<Album>) {
    if (!selected) return;
    setPortfolio((prev) => ({
      ...prev,
      albums: prev.albums.map((album) =>
        album.id === selected.id ? { ...album, ...patch } : album,
      ),
    }));
  }

  function addAlbum() {
    const id = `album_${Date.now().toString(36)}`;
    const album: Album = {
      id,
      slug: `new-series-${portfolio.albums.length + 1}`,
      title: "新相册",
      subtitle: "NEW SERIES",
      description: "",
      location: { name: "" },
      createdAt: new Date().toISOString(),
    };

    setPortfolio((prev) => ({
      ...prev,
      albums: [...prev.albums, album],
      albumPhotos: { ...prev.albumPhotos, [id]: [] },
    }));
    setSelectedId(id);
  }

  function removeAlbum() {
    if (!selected) return;
    if (
      !window.confirm(
        `删除相册「${selected.title}」？保存后，未再被引用的图片文件会被清理。`,
      )
    ) {
      return;
    }

    const remaining = portfolio.albums.filter(
      (album) => album.id !== selected.id,
    );

    setPortfolio((prev) => {
      const albumPhotos = { ...prev.albumPhotos };
      const removedIds = new Set(
        (albumPhotos[selected.id] ?? []).map((photo) => photo.id),
      );
      delete albumPhotos[selected.id];

      const folderPhotos = Object.fromEntries(
        Object.entries(prev.folderPhotos).map(([folderId, ids]) => [
          folderId,
          ids.filter((id) => !removedIds.has(id)),
        ]),
      );

      return {
        ...prev,
        albums: prev.albums.filter((album) => album.id !== selected.id),
        albumPhotos,
        folderPhotos,
      };
    });

    setSelectedId(remaining[0]?.id ?? "");
  }

  return (
    <div>
      <PanelHeader
        eyebrow="Albums"
        title="相册"
        description="一个相册对应一组作品。slug 是前台路由，发布后请避免随意修改。"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {selected ? (
              <Button
                variant="accent"
                onClick={() => uploadInput.current?.click()}
              >
                上传照片 ↑
              </Button>
            ) : null}
            <Button variant="solid" onClick={addAlbum}>
              + 新建相册
            </Button>
          </div>
        }
      />

      <section className="mt-6 border border-ink/15 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-display text-lg">顶部导航作品集</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
              顶部「作品集」下拉只展示这四组，最后固定为「更多作品集」；留空则少展示一组。
            </p>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/35">
            {configuredNavIds.length} / 4
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {navSlots.map((albumId, index) => (
            <Field
              key={`nav-album-${index}`}
              label={`位置 ${String(index + 1).padStart(2, "0")}`}
            >
              <select
                className="field"
                value={albumId}
                onChange={(event) =>
                  updateNavSlot(index, event.target.value)
                }
              >
                <option value="">未选择</option>
                {portfolio.albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
      </section>

      <section className="mt-4 border border-ink/15 bg-white p-4 sm:p-5">
        <Field
          label="作品集页引导语"
          hint="显示在作品集索引页大标题右侧，支持换行。"
        >
          <textarea
            className="field min-h-20"
            rows={3}
            value={worksIntro}
            onChange={(event) => onWorksIntroChange(event.target.value)}
          />
        </Field>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="space-y-1">
          {portfolio.albums.map((album) => {
            const count = (portfolio.albumPhotos[album.id] ?? []).length;
            const active = selected?.id === album.id;
            return (
              <button
                key={album.id}
                type="button"
                onClick={() => setSelectedId(album.id)}
                className={`w-full border-l-2 px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-red bg-white"
                    : "border-transparent hover:bg-white/60"
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-medium">
                    {album.title}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-ink/40">
                    {count}
                  </span>
                </span>
                <span className="mt-0.5 block truncate font-mono text-[9px] text-ink/35">
                  /{album.slug}
                </span>
              </button>
            );
          })}

          {portfolio.albums.length === 0 ? (
            <p className="border border-dashed border-ink/20 px-3 py-6 text-center text-[11px] text-ink/40">
              还没有相册
            </p>
          ) : null}
        </aside>

        {selected ? (
          <div className="space-y-5 border border-ink/15 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 pb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/35">
                  Album editor
                </p>
                <p className="mt-1 font-display text-xl">{selected.title}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => uploadInput.current?.click()}
                >
                  上传照片 ↑
                </Button>
                <a
                  href={`/albums/${selected.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-ink/20 px-2.5 py-1.5 text-[10px] tracking-[0.08em] text-ink/60 transition-colors hover:border-ink hover:text-ink"
                >
                  预览 ↗
                </a>
                <Button variant="danger" size="sm" onClick={removeAlbum}>
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
                    patchAlbum({ title: event.target.value })
                  }
                />
              </Field>
              <Field label="副标题 / EN">
                <input
                  className="field"
                  value={selected.subtitle ?? ""}
                  onChange={(event) =>
                    patchAlbum({ subtitle: event.target.value })
                  }
                />
              </Field>
              <Field
                label="Slug"
                hint={`前台路径：/albums/${selected.slug}/`}
              >
                <input
                  className="field font-mono"
                  value={selected.slug}
                  onChange={(event) =>
                    patchAlbum({ slug: event.target.value })
                  }
                />
              </Field>
              <Field label="封面照片">
                <select
                  className="field"
                  value={selected.coverPhotoId ?? ""}
                  onChange={(event) =>
                    patchAlbum({
                      coverPhotoId: event.target.value || undefined,
                    })
                  }
                >
                  <option value="">自动（最新一张）</option>
                  {photos.map((photo) => (
                    <option key={photo.id} value={photo.id}>
                      {photo.title ?? photo.fileName}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="描述">
              <textarea
                className="field min-h-24"
                rows={4}
                value={selected.description ?? ""}
                onChange={(event) =>
                  patchAlbum({ description: event.target.value })
                }
                placeholder="这组作品的一句话说明…"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-[1.4fr_0.8fr_0.8fr]">
              <Field label="地点名称">
                <input
                  className="field"
                  value={selected.location?.name ?? ""}
                  onChange={(event) =>
                    patchAlbum({
                      location: {
                        ...selected.location,
                        name: event.target.value,
                      },
                    })
                  }
                  placeholder="上海"
                />
              </Field>
              <Field label="纬度">
                <input
                  className="field font-mono"
                  inputMode="decimal"
                  value={selected.location?.lat ?? ""}
                  onChange={(event) =>
                    patchAlbum({
                      location: {
                        ...selected.location,
                        lat:
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                      },
                    })
                  }
                  placeholder="31.2304"
                />
              </Field>
              <Field label="经度">
                <input
                  className="field font-mono"
                  inputMode="decimal"
                  value={selected.location?.lng ?? ""}
                  onChange={(event) =>
                    patchAlbum({
                      location: {
                        ...selected.location,
                        lng:
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                      },
                    })
                  }
                  placeholder="121.4737"
                />
              </Field>
            </div>

            <div className="mt-4">
              <MapPicker
                lat={selected.location?.lat}
                lng={selected.location?.lng}
                onChange={(lat, lng) =>
                  patchAlbum({
                    location: { ...selected.location, lat, lng },
                  })
                }
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border border-ink/15 bg-paper-2/50 p-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink/40">
                  Frames / {photos.length}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink/50">
                  {photos.length > 0
                    ? "继续添加照片，或到「照片」里调整标题、标签与拍摄时间；上传完成后记得保存至磁盘。"
                    : "这个相册还没有照片。点右侧按钮上传第一批照片，完成后记得保存至磁盘。"}
                </p>
              </div>
              <Button
                variant="accent"
                size="sm"
                onClick={() => uploadInput.current?.click()}
              >
                {photos.length > 0 ? "继续上传" : "上传第一批照片"} ↑
              </Button>
            </div>

            <div className="border border-ink/15 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg">上传照片到相册</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink/45">
                    上传后可在照片编辑区设置拍摄时间。照片标题默认不读取。
                  </p>
                </div>
                <Button
                  variant="accent"
                  size="sm"
                  disabled={uploading}
                  onClick={() => uploadInput.current?.click()}
                >
                  {uploading ? "上传中…" : "选择照片 ↑"}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink/60">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={readTitle}
                    onChange={(event) => setReadTitle(event.target.checked)}
                  />
                  读取照片标题
                </label>
              </div>
              <input
                ref={uploadInput}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => void uploadToAlbum(event.target.files)}
              />
              {uploadError ? (
                <p
                  role="alert"
                  className="mt-2 border-l-2 border-red bg-red/5 px-2 py-1 text-[11px] text-red"
                >
                  {uploadError}
                </p>
              ) : null}
            </div>

            <section className="border border-ink/15 bg-paper-2/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink/40">
                    相册照片 / {photos.length}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink/50">
                    拖动任意缩略图调整前台顺序。手动顺序会写入相册数组；
                    在「照片」面板也可以拖动排序。
                  </p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/30">
                  拖动排序
                </span>
              </div>

              {photos.length > 0 ? (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                    {photos.map((photo, index) => {
                      const dropTarget =
                        dragOverPhotoId === photo.id &&
                        dragPhotoId !== photo.id;
                      return (
                        <div
                          key={photo.id}
                          draggable={photos.length > 1}
                          onDragStart={(event) => {
                            setDragPhotoId(photo.id);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData(
                              "text/plain",
                              photo.id,
                            );
                          }}
                          onDragOver={(event) => {
                            if (
                              !dragPhotoId ||
                              dragPhotoId === photo.id
                            ) {
                              return;
                            }
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
                            if (
                              dragPhotoId &&
                              dragPhotoId !== photo.id
                            ) {
                              reorderAlbumPhotos(dragPhotoId, photo.id);
                            }
                            resetDrag();
                          }}
                          onDragEnd={resetDrag}
                          title="拖动调整顺序"
                          className={`group cursor-grab border bg-white p-1 active:cursor-grabbing ${
                            dragPhotoId === photo.id
                              ? "border-ink/20 opacity-40"
                              : "border-ink/15"
                          } ${
                            dropTarget
                              ? "border-dashed border-red bg-red/5"
                              : ""
                          }`}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                            <img
                              src={photo.thumb}
                              alt={photo.title ?? "照片"}
                              loading="lazy"
                              draggable={false}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute left-1 top-1 border border-ink/15 bg-white/90 px-1 font-mono text-[8px]">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            {selected.coverPhotoId === photo.id ? (
                              <span className="absolute right-1 top-1 bg-ink px-1 py-0.5 font-mono text-[8px] text-paper">
                                封面
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex items-baseline justify-between gap-2 px-0.5">
                            <span className="min-w-0 truncate text-[10px] text-ink/70">
                              {photo.title ?? ""}
                            </span>
                            <span className="shrink-0 font-mono text-[8px] text-ink/35">
                              {formatDate(photo.dateTaken)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {photos.length > 1 ? (
                    <div
                      onDragOver={(event) => {
                        if (!dragPhotoId) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (dragPhotoId) {
                          reorderAlbumPhotos(dragPhotoId, null);
                        }
                        resetDrag();
                      }}
                      className={`mt-2 border border-dashed px-3 py-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                        dragPhotoId
                          ? "border-red bg-red/5 text-red"
                          : "border-ink/15 text-ink/30"
                      }`}
                    >
                      拖到这里移到相册末尾
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 border border-dashed border-ink/20 px-4 py-8 text-center text-[11px] text-ink/40">
                  还没有照片，先用上方按钮上传。
                </p>
              )}
            </section>

            <p className="border-t border-ink/10 pt-3 text-[10px] leading-relaxed text-ink/40">
              修改只会停留在草稿状态，点击右上角「保存至磁盘」才会写入
              <code className="font-mono"> src/data/portfolio-data.json</code>。
            </p>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-ink/20 bg-white/50 p-8 text-center">
            <p className="font-display text-xl">先建一个相册</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-ink/45">
              相册是作品的基本容器。新建后可直接上传照片并编辑标题、描述与地点。
            </p>
            <Button variant="solid" className="mt-5" onClick={addAlbum}>
              + 新建相册
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
