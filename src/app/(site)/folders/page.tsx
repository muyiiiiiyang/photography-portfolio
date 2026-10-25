import type { Metadata } from "next";

import { CollectionCard } from "@/components/site/CollectionCard";
import { getFolders } from "@/lib/api/portfolio";
import { formatYear } from "@/lib/format";

export const metadata: Metadata = {
  title: "专题",
  description: "跨相册的专题合集：以主题重新编排的作品序列。",
};

export default async function FoldersPage() {
  const folders = await getFolders();

  return (
    <div className="page-enter">
      <header className="relative overflow-hidden border-b border-ink/15">
        <div
          aria-hidden
          className="absolute -left-16 -top-16 h-52 w-52 rounded-full border-[18px] border-blue/15"
        />
        <div className="relative mx-auto max-w-[1560px] px-5 pb-10 pt-10 sm:px-8 lg:px-12 lg:pb-16 lg:pt-16">
          <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-ink/40">
            <span>Index / 02</span>
            <span className="h-px w-10 bg-ink/25" />
            <span>Series &amp; studies</span>
          </div>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="font-display text-[clamp(3.4rem,10vw,9rem)] leading-[0.82] tracking-[-0.04em]">
              专题<span className="text-blue">.</span>
            </h1>
            <div className="max-w-md lg:pb-3">
              <p className="text-sm leading-relaxed text-ink/65">
                打破相册的时间边界，以主题重新编排。一组照片，一条线索。
              </p>
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.24em] text-ink/40">
                {folders.length} series
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        {folders.length > 0 ? (
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:gap-x-16 lg:gap-y-20">
            {folders.map((folder, index) => (
              <CollectionCard
                key={folder.id}
                href={`/folders/${folder.slug}`}
                code="S"
                index={index}
                title={folder.title}
                subtitle={folder.subtitle}
                cover={folder.cover}
                count={folder.count}
                year={formatYear(folder.latestTakenAt)}
                tags={folder.tags}
                accent={folder.accent}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-ink/25 px-6 py-20 text-center">
            <p className="font-display text-2xl">还没有专题</p>
            <p className="mt-2 text-sm text-ink/50">
              在本地 Studio 的「专题」面板里创建第一组序列。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
