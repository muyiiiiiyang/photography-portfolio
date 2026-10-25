"use client";

import { useMemo, useState } from "react";

import { PhotoGallery } from "@/components/site/PhotoGallery";
import type { PhotoView } from "@/lib/view-types";

export function CollectionGallery({ photos }: { photos: PhotoView[] }) {
  const [descending, setDescending] = useState(true);

  const ordered = useMemo(
    () => (descending ? photos : [...photos].reverse()),
    [photos, descending],
  );

  return (
    <section className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-ink/15 pb-4">
        <h2 className="font-display text-[11px] uppercase tracking-[0.3em]">
          全部作品 / {photos.length}
        </h2>
        <button
          type="button"
          onClick={() => setDescending((value) => !value)}
          aria-pressed={descending}
          aria-label={
            descending ? "当前按拍摄时间倒序，点击切换为正序" : "当前按拍摄时间正序，点击切换为倒序"
          }
          className="group flex shrink-0 items-center gap-2 border border-ink/20 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/55 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
        >
          {descending ? "按拍摄时间倒序" : "按拍摄时间正序"}
          <span
            aria-hidden
            className="text-[11px] transition-transform duration-300 group-hover:translate-y-0.5"
          >
            {descending ? "↓" : "↑"}
          </span>
        </button>
      </div>
      <PhotoGallery photos={ordered} />
    </section>
  );
}
