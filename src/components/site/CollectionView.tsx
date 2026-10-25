import Link from "next/link";

import { PhotoGallery } from "@/components/site/PhotoGallery";
import type { Accent } from "@/lib/types";
import type { PhotoView } from "@/lib/view-types";

const ACCENT_BG: Record<Accent, string> = {
  red: "bg-red",
  yellow: "bg-yellow",
  blue: "bg-blue",
};

export interface CollectionViewProps {
  code: string;
  title: string;
  subtitle?: string;
  description?: string;
  meta: { label: string; value: string }[];
  accent: Accent;
  cover: PhotoView | null;
  photos: PhotoView[];
  backHref: string;
  backLabel: string;
  next?: { href: string; title: string; label: string };
}

export function CollectionView({
  code,
  title,
  subtitle,
  description,
  meta,
  accent,
  cover,
  photos,
  backHref,
  backLabel,
  next,
}: CollectionViewProps) {
  return (
    <article className="page-enter">
      <header className="border-b border-ink/15">
        <div className="mx-auto max-w-[1560px] px-5 pb-10 pt-10 sm:px-8 lg:px-12 lg:pb-16 lg:pt-14">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.28em] text-ink/45 transition-colors hover:text-ink"
          >
            <span aria-hidden>←</span> {backLabel}
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:items-end">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-ink/40">
                {code}
                {subtitle ? ` / ${subtitle}` : ""}
              </p>
              <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6.8rem)] leading-[0.88] tracking-[-0.035em]">
                {title}
                <span className="text-red">.</span>
              </h1>
            </div>

            <div>
              {description ? (
                <p className="max-w-xl text-sm leading-relaxed text-ink/65">
                  {description}
                </p>
              ) : null}
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-ink/15 pt-4">
                {meta.map((item) => (
                  <div key={item.label}>
                    <dt className="text-[8px] uppercase tracking-[0.28em] text-ink/35">
                      {item.label}
                    </dt>
                    <dd className="mt-1 font-mono text-[11px] tracking-[0.06em]">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </header>

      {cover ? (
        <div className="mx-auto max-w-[1560px] px-5 pt-10 sm:px-8 lg:px-12">
          <figure>
            <div className="relative">
              <span
                aria-hidden
                className={`absolute -left-2 -top-2 h-full w-full ${ACCENT_BG[accent]}`}
              />
              <div className="relative overflow-hidden border border-ink bg-paper-2">
                <img
                  src={cover.srcUrl}
                  alt={cover.title ?? title}
                  width={cover.width}
                  height={cover.height}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="max-h-[72vh] w-full object-cover"
                />
              </div>
            </div>
            <figcaption className="mt-3 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
              <span>{cover.title ?? title}</span>
              <span>Cover / {cover.camera ?? "—"}</span>
            </figcaption>
          </figure>
        </div>
      ) : null}

      <section className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-ink/15 pb-4">
          <h2 className="font-display text-[11px] uppercase tracking-[0.3em]">
            全部作品 / {photos.length}
          </h2>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/35">
            按拍摄时间倒序 ↓
          </span>
        </div>
        <PhotoGallery photos={photos} />
      </section>

      {next ? (
        <div className="border-t border-ink/20">
          <Link
            href={next.href}
            className="group mx-auto flex max-w-[1560px] flex-col gap-5 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-16"
          >
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-ink/40">
                {next.label}
              </p>
              <p className="mt-2 font-display text-[clamp(2rem,5vw,4rem)] leading-none tracking-[-0.03em] transition-colors duration-300 group-hover:text-red">
                {next.title}
              </p>
            </div>
            <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-ink/50">
              下一组
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/30 transition-all duration-300 group-hover:border-red group-hover:bg-red group-hover:text-paper"
              >
                →
              </span>
            </span>
          </Link>
        </div>
      ) : null}
    </article>
  );
}
