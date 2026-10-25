"use client";

import { useEffect, useMemo, useState } from "react";

import { PhotoGallery } from "@/components/site/PhotoGallery";
import type { GalleryLink } from "@/components/site/PhotoGallery";
import type { FrameView, PhotoView } from "@/lib/view-types";

function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

export function AllFrames({ frames }: { frames: FrameView[] }) {
  const [items, setItems] = useState<FrameView[]>(frames);
  const [round, setRound] = useState(0);
  const [ready, setReady] = useState(frames.length < 2);

  useEffect(() => {
    if (frames.length < 2) return;
    const timer = window.setTimeout(() => {
      setItems(shuffle(frames));
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [frames, round]);

  const frameById = useMemo(
    () => new Map(frames.map((frame) => [frame.id, frame])),
    [frames],
  );

  function linksFor(photo: PhotoView): GalleryLink[] {
    const frame = frameById.get(photo.id);
    if (!frame) return [];

    return [
      ...(frame.albumSlug && frame.albumTitle
        ? [
            {
              label: `作品集 · ${frame.albumTitle}`,
              href: `/albums/${frame.albumSlug}`,
            },
          ]
        : []),
      ...frame.series.map((series) => ({
        label: `专题 · ${series.parentTitle ? `${series.parentTitle} / ` : ""}${series.title}`,
        href: `/folders/${series.slug}`,
      })),
    ];
  }

  return (
    <section
      id="all-frames"
      className="border-t border-ink/15 bg-paper"
      aria-label="全部照片"
    >
      <div className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="flex flex-col gap-5 border-b border-ink/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink/40">
              All frames / 全部照片
            </p>
            <h2 className="mt-2 font-display text-[clamp(2.4rem,5vw,4.8rem)] leading-[0.9] tracking-[-0.03em]">
              所有照片<span className="text-red">.</span>
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-ink/50">
              随机排列全部作品。点开照片可以查看说明，并选择进入对应作品集或专题。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/35">
              {frames.length} frames
            </span>
            <button
              type="button"
              onClick={() => setRound((value) => value + 1)}
              className="group inline-flex items-center gap-2 border border-ink/25 px-3 py-1.5 text-[10px] tracking-[0.08em] text-ink/60 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            >
              换一组
              <span
                aria-hidden
                className="text-[11px] transition-transform duration-300 group-hover:rotate-180"
              >
                ↻
              </span>
            </button>
          </div>
        </div>

        <div className="mt-7" aria-busy={!ready}>
          {ready ? (
            <PhotoGallery photos={items} links={linksFor} />
          ) : (
            <p className="border border-dashed border-ink/20 px-6 py-16 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35">
              正在随机排列 {frames.length} 张照片…
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
