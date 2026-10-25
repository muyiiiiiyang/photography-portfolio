import Link from "next/link";

import type { Accent } from "@/lib/types";
import type { PhotoView } from "@/lib/view-types";

const ACCENT_BG: Record<Accent, string> = {
  red: "bg-red",
  yellow: "bg-yellow",
  blue: "bg-blue",
};

interface CollectionCardProps {
  href: string;
  code: "A" | "S";
  index: number;
  title: string;
  subtitle?: string;
  cover: PhotoView | null;
  count: number;
  year: string;
  location?: string;
  tags: string[];
  accent: Accent;
  priority?: boolean;
}

export function CollectionCard({
  href,
  code,
  index,
  title,
  subtitle,
  cover,
  count,
  year,
  location,
  tags,
  accent,
  priority = false,
}: CollectionCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative">
        <span
          aria-hidden
          className={`absolute -left-2 -top-2 h-full w-full ${ACCENT_BG[accent]} transition-transform duration-500 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:translate-x-2 group-hover:translate-y-2`}
        />
        <div className="photo-zoom relative aspect-[4/3] overflow-hidden border border-ink bg-paper-2">
          {cover ? (
            <img
              src={cover.thumbUrl}
              alt={title}
              width={cover.width}
              height={cover.height}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.3em] text-ink/30">
              No frames
            </div>
          )}
          <span className="absolute left-3 top-3 bg-paper/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] backdrop-blur-sm">
            {code}—{String(index + 1).padStart(2, "0")}
          </span>
          <span className="absolute bottom-0 right-0 flex h-9 items-center bg-ink px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-paper">
            {count} frames
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4 border-t border-ink/25 pt-4">
        <div className="min-w-0">
          <h3 className="font-display text-[22px] leading-tight tracking-[-0.01em] sm:text-[26px]">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 truncate text-[9px] uppercase tracking-[0.3em] text-ink/40">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="border border-ink/20 px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-ink/55"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 text-right font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-ink/50">
          <span className="block">{year}</span>
          <span className="block">{location ?? "—"}</span>
          <span
            aria-hidden
            className="mt-2 inline-block text-[15px] text-ink transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          >
            ↗
          </span>
        </div>
      </div>
    </Link>
  );
}
