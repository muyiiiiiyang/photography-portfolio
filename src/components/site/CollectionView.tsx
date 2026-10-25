import Link from "next/link";

import { CollectionGallery } from "@/components/site/CollectionGallery";
import type { FolderSummary, PhotoView } from "@/lib/view-types";

export interface CollectionViewProps {
  code: string;
  title: string;
  subtitle?: string;
  description?: string;
  meta: { label: string; value: string }[];
  cover: PhotoView | null;
  photos: PhotoView[];
  childSeries?: FolderSummary[];
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
  cover,
  photos,
  childSeries,
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
                <p className="max-w-xl whitespace-pre-line text-sm leading-relaxed text-ink/65">
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

      {childSeries && childSeries.length > 0 ? (
        <section className="border-b border-ink/15">
          <div className="mx-auto max-w-[1560px] px-5 py-10 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between gap-4 border-b border-ink/15 pb-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-ink/45">
                子专题 / SUB SERIES
              </p>
              <span className="font-mono text-[9px] text-ink/35">
                {String(childSeries.length).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {childSeries.map((child) => (
                <Link
                  key={child.id}
                  href={`/folders/${child.slug}`}
                  className="group flex items-center gap-4 border border-ink/15 bg-white p-3 transition-colors hover:border-ink"
                >
                  <span className="relative h-16 w-20 shrink-0 overflow-hidden bg-paper-2">
                    {child.cover ? (
                      <img
                        src={child.cover.thumbUrl}
                        alt={child.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg leading-tight">
                      {child.title}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[9px] uppercase tracking-[0.14em] text-ink/40">
                      {child.count} frames · {child.childCount} 子专题
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="text-ink/35 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink"
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {cover ? (
        <div className="mx-auto max-w-[1560px] px-5 pt-10 sm:px-8 lg:px-12">
          <figure>
            <div className="relative overflow-hidden border border-ink/20 bg-paper-2">
              <img
                src={cover.srcUrl}
                alt={cover.title ?? title}
                width={cover.width}
                height={cover.height}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="max-h-[52vh] w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
              <span>{cover.title ?? title}</span>
              <span>Cover / {cover.camera ?? "—"}</span>
            </figcaption>
          </figure>
        </div>
      ) : null}

      <CollectionGallery photos={photos} />

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
