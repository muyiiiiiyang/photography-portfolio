"use client";

import { useMemo, useState } from "react";

import { PhotoGallery } from "@/components/site/PhotoGallery";
import { sortPhotosByTakenDateDesc } from "@/lib/photos";
import type { PhotoView } from "@/lib/view-types";

type OrderMode = "manual" | "desc" | "asc";

const LABELS: Record<OrderMode, string> = {
  manual: "手动排序",
  desc: "按拍摄时间倒序",
  asc: "按拍摄时间正序",
};

export function CollectionGallery({ photos }: { photos: PhotoView[] }) {
  const [mode, setMode] = useState<OrderMode>("manual");

  const ordered = useMemo(() => {
    if (mode === "manual") return photos;
    const descending = sortPhotosByTakenDateDesc(photos);
    return mode === "desc" ? descending : [...descending].reverse();
  }, [photos, mode]);

  function cycleOrder() {
    setMode((current) =>
      current === "manual" ? "desc" : current === "desc" ? "asc" : "manual",
    );
  }

  return (
    <section className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-ink/15 pb-4">
        <h2 className="font-display text-[11px] uppercase tracking-[0.3em]">
          全部作品 / {photos.length}
        </h2>
        <button
          type="button"
          onClick={cycleOrder}
          aria-label={`当前${LABELS[mode]}，点击切换排序方式`}
          title="在工作台拖动可调整手动顺序；这里可切换拍摄时间排序"
          className="group flex shrink-0 items-center gap-2 border border-ink/20 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/55 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
        >
          {LABELS[mode]}
          <span
            aria-hidden
            className="text-[11px] transition-transform duration-300 group-hover:translate-y-0.5"
          >
            {mode === "asc" ? "↑" : "↓"}
          </span>
        </button>
      </div>
      <PhotoGallery photos={ordered} />
    </section>
  );
}
