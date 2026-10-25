"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { Button, Field, PanelHeader } from "./ui";
import { MapPicker } from "./MapPicker";
import type { Album, PortfolioData } from "@/lib/types";

interface AlbumsPanelProps {
  portfolio: PortfolioData;
  setPortfolio: Dispatch<SetStateAction<PortfolioData>>;
}

export function AlbumsPanel({ portfolio, setPortfolio }: AlbumsPanelProps) {
  const [selectedId, setSelectedId] = useState(portfolio.albums[0]?.id ?? "");
  const selected =
    portfolio.albums.find((album) => album.id === selectedId) ??
    portfolio.albums[0] ??
    null;

  const photos = selected ? portfolio.albumPhotos[selected.id] ?? [] : [];

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
          <Button variant="solid" onClick={addAlbum}>
            + 新建相册
          </Button>
        }
      />

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
              <div className="flex items-center gap-2">
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

            <p className="border-t border-ink/10 pt-3 text-[10px] leading-relaxed text-ink/40">
              修改只会停留在草稿状态，点击右上角「保存至磁盘」才会写入
              <code className="font-mono"> src/data/portfolio-data.json</code>。
            </p>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-ink/20 bg-white/50 p-8 text-center">
            <p className="font-display text-xl">先建一个相册</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-ink/45">
              相册是作品的基本容器，新建后即可拖拽上传照片。
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
