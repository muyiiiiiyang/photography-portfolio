"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatDate } from "@/lib/format";
import type { FrameView } from "@/lib/view-types";

const PICKS = 3;

function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const result: T[] = [];

  while (result.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }

  return result;
}

function FrameMeta({ frame }: { frame: FrameView }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-ink/90 px-2.5 py-1.5 text-paper">
      <span className="truncate text-[10px] tracking-[0.02em]">
        {frame.title ?? frame.albumTitle}
      </span>
      <span className="shrink-0 font-mono text-[8px] text-paper/55">
        {formatDate(frame.dateTaken)}
      </span>
    </div>
  );
}

export function RandomWall({ frames }: { frames: FrameView[] }) {
  const [selection, setSelection] = useState<FrameView[]>(() =>
    frames.slice(0, PICKS),
  );
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (frames.length === 0) return;

    // 延迟一帧再随机，避免在 effect 内同步 setState；服务端渲染保留最新三张作为兜底。
    const timer = window.setTimeout(() => {
      setSelection(pickRandom(frames, Math.min(PICKS, frames.length)));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [frames, round]);

  if (frames.length === 0) {
    return (
      <div className="mt-6 flex flex-1 flex-col">
        <div className="flex items-end justify-between border-b border-ink/20 pb-3">
          <p className="font-mono text-[9px] tracking-[0.18em] text-ink/40">
            Random selection
          </p>
          <p className="font-mono text-[9px] tracking-[0.14em] text-ink/30">
            00 frames
          </p>
        </div>
        <div className="relative flex flex-1 items-center justify-center border border-ink/15 px-6 py-20 text-center">
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] text-ink/35">
              Awaiting frames
            </p>
            <p className="mt-3 font-display text-2xl tracking-[-0.01em]">
              等待第一组作品
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-ink/45">
              上传照片后，这里会在每次打开时随机抽取作品。
            </p>
          </div>
          <span
            aria-hidden
            className="absolute right-4 top-4 h-2 w-2 bg-red"
          />
        </div>
      </div>
    );
  }

  const [lead, ...rest] = selection;

  return (
    <div className="mt-6 flex flex-1 flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/20 pb-3">
        <div>
          <p className="font-mono text-[9px] tracking-[0.18em] text-ink/40">
            Random selection
          </p>
          <p className="mt-1 text-[11px] text-ink/55">
            随机观看 · 点击进入所属相册
          </p>
        </div>
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

      <div className="mt-3 grid flex-1 grid-cols-2 gap-3">
        {lead ? (
          <Link
            href={`/albums/${lead.albumSlug}`}
            className="group relative col-span-2 overflow-hidden border border-ink bg-paper-2"
            aria-label={`查看相册：${lead.albumTitle}`}
          >
            <img
              src={lead.srcUrl}
              alt={lead.title ?? lead.albumTitle}
              width={lead.width}
              height={lead.height}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="aspect-[2/1] w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.025]"
            />
            <span className="absolute left-2 top-2 bg-white px-1.5 py-0.5 font-mono text-[8px] tracking-[0.12em]">
              F—01
            </span>
            <FrameMeta frame={lead} />
          </Link>
        ) : null}

        {rest.map((frame, index) => (
          <Link
            key={frame.id}
            href={`/albums/${frame.albumSlug}`}
            className="group relative overflow-hidden border border-ink bg-paper-2"
            aria-label={`查看相册：${frame.albumTitle}`}
          >
            <img
              src={frame.srcUrl}
              alt={frame.title ?? frame.albumTitle}
              width={frame.width}
              height={frame.height}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.03]"
            />
            <span className="absolute left-2 top-2 bg-white px-1.5 py-0.5 font-mono text-[8px] tracking-[0.12em]">
              F—{String(index + 2).padStart(2, "0")}
            </span>
            <FrameMeta frame={frame} />
          </Link>
        ))}
      </div>

      <p className="mt-3 font-mono text-[9px] tracking-[0.12em] text-ink/35">
        每次打开随机抽取 · 共 {frames.length} 张可选
      </p>
    </div>
  );
}
