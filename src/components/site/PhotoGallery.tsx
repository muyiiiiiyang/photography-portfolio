"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { exifLine, formatDate } from "@/lib/format";
import type { PhotoView } from "@/lib/view-types";

export function PhotoGallery({ photos }: { photos: PhotoView[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const step = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => {
        if (current === null || photos.length === 0) return current;
        return (current + direction + photos.length) % photos.length;
      });
    },
    [photos.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex, close, step]);

  const active = activeIndex === null ? null : photos[activeIndex];

  return (
    <>
      <div
        className={
          photos.length > 4
            ? "columns-1 gap-5 sm:columns-2 lg:columns-3 lg:gap-6"
            : "grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:gap-6"
        }
      >
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`查看作品：${photo.title ?? "未命名"}`}
            className={`group block w-full border border-ink/15 bg-white p-2 text-left transition-colors duration-300 hover:border-ink ${
              photos.length > 4 ? "mb-5 break-inside-avoid lg:mb-6" : ""
            }`}
          >
            <div className="relative overflow-hidden bg-paper-2">
              <img
                src={photo.thumbUrl}
                alt={photo.title ?? "摄影作品"}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className="h-auto w-full transition-transform duration-[1000ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.03]"
              />
              <span className="absolute left-2 top-2 bg-ink px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] text-paper opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-paper/90 text-[11px] opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                ↗
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 px-1 pt-2">
              <span className="truncate text-[10px] uppercase tracking-[0.18em] text-ink/60">
                {photo.title ?? "Untitled"}
              </span>
              <span className="shrink-0 font-mono text-[9px] tracking-[0.06em] text-ink/35">
                {formatDate(photo.dateTaken)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="作品大图"
          className="fixed inset-0 z-[80] flex flex-col bg-ink/95 text-paper backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex items-center justify-between border-b border-paper/15 px-4 py-3 sm:px-8">
            <span className="font-mono text-[10px] tracking-[0.24em] text-paper/60">
              {String((activeIndex ?? 0) + 1).padStart(2, "0")} /{" "}
              {String(photos.length).padStart(2, "0")}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="flex h-9 items-center gap-2 border border-paper/25 px-3 text-[10px] uppercase tracking-[0.2em] text-paper/80 transition-colors hover:border-paper hover:text-paper"
            >
              关闭 <span aria-hidden>×</span>
            </button>
          </div>

          <div
            className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={active.srcUrl}
              alt={active.title ?? "摄影作品"}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div
            className="border-t border-paper/15 px-4 py-4 sm:px-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-paper/40">
                  {formatDate(active.dateTaken)}
                </p>
                <h3 className="mt-1 truncate font-display text-xl tracking-[-0.01em]">
                  {active.title ?? "Untitled"}
                </h3>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-paper/50">
                  {exifLine(active) || active.fileName}
                </p>
                {active.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {active.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-paper/20 px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-paper/55"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="flex h-10 w-10 items-center justify-center border border-paper/25 transition-colors hover:border-paper hover:bg-paper hover:text-ink"
                  aria-label="上一张"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="flex h-10 w-10 items-center justify-center border border-paper/25 transition-colors hover:border-paper hover:bg-paper hover:text-ink"
                  aria-label="下一张"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
