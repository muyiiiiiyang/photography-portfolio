"use client";

import { useMemo, useState } from "react";

import { CollectionCard } from "@/components/site/CollectionCard";
import type { AlbumSummary } from "@/lib/view-types";

export function WorksExplorer({ albums }: { albums: AlbumSummary[] }) {
  const [activeTag, setActiveTag] = useState("全部");
  const [showAllTags, setShowAllTags] = useState(false);

  const MAX_TAGS = 10;

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const album of albums) {
      for (const tag of album.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
      .map(([tag]) => tag);
  }, [albums]);

  const visibleTags = showAllTags ? tags : tags.slice(0, MAX_TAGS);

  function toggleTagList() {
    if (showAllTags && !tags.slice(0, MAX_TAGS).includes(activeTag)) {
      setActiveTag("全部");
    }
    setShowAllTags((prev) => !prev);
  }

  const filtered = useMemo(
    () =>
      activeTag === "全部"
        ? albums
        : albums.filter((album) => album.tags.includes(activeTag)),
    [albums, activeTag],
  );

  return (
    <section aria-label="作品列表">
      <div className="border-b border-ink/15 bg-paper">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-2 px-5 py-3 sm:gap-2.5 sm:px-8 lg:px-12">
          <span className="mr-1 shrink-0 font-mono text-[9px] uppercase tracking-[0.28em] text-ink/40">
            Filter
          </span>
          {["全部", ...visibleTags].map((tag) => {
            const active = tag === activeTag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                aria-pressed={active}
                className={`shrink-0 border px-3 py-1.5 text-[11px] tracking-[0.08em] transition-colors duration-200 ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 text-ink/65 hover:border-ink hover:text-ink"
                }`}
              >
                {tag}
              </button>
            );
          })}
          {tags.length > MAX_TAGS ? (
            <button
              type="button"
              onClick={toggleTagList}
              className="shrink-0 border border-dashed border-ink/30 px-3 py-1.5 text-[11px] tracking-[0.06em] text-ink/45 transition-colors hover:border-ink hover:text-ink"
            >
              {showAllTags ? "收起 −" : `更多 +${tags.length - MAX_TAGS}`}
            </button>
          ) : null}
          <span className="ml-auto hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.22em] text-ink/40 sm:block">
            {filtered.length} series / {albums.length}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-4 xl:gap-x-8 xl:gap-y-14">
          {filtered.map((album, index) => (
            <CollectionCard
              key={album.id}
              href={`/albums/${album.slug}`}
              code="A"
              index={index}
              title={album.title}
              subtitle={album.subtitle}
              cover={album.cover}
              count={album.count}
              year={album.year}
              location={album.location?.name}
              tags={album.tags}
              priority={index < 4}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="border border-dashed border-ink/25 px-6 py-16 text-center text-sm text-ink/50">
            这个分类下还没有作品。
          </p>
        ) : null}
      </div>
    </section>
  );
}
