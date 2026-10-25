import type { Metadata } from "next";
import Link from "next/link";

import { WorksExplorer } from "@/components/site/WorksExplorer";
import { getAllTags, getAlbums } from "@/lib/api/portfolio";

export const metadata: Metadata = {
  title: "作品集",
  description: "按相册收录的摄影作品，按相机原始拍摄时间倒序排列。",
};

export default async function WorksPage() {
  const [albums, tags] = await Promise.all([getAlbums(), getAllTags()]);
  const totalPhotos = albums.reduce((sum, album) => sum + album.count, 0);

  return (
    <div className="page-enter">
      <header className="relative overflow-hidden border-b border-ink/15">
        <div
          aria-hidden
          className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-red/10"
        />
        <div className="relative mx-auto max-w-[1560px] px-5 pb-10 pt-10 sm:px-8 lg:px-12 lg:pb-16 lg:pt-16">
          <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-ink/40">
            <span>Index / 01</span>
            <span className="h-px w-10 bg-ink/25" />
            <span>Selected works</span>
          </div>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="font-display text-[clamp(3.4rem,10vw,9rem)] leading-[0.82] tracking-[-0.04em]">
              作品集<span className="text-red">.</span>
            </h1>
            <div className="max-w-md lg:pb-3">
              <p className="text-sm leading-relaxed text-ink/65">
                按相册收录。每张作品以相机原始拍摄时间排序，最新的光永远在最前面。
              </p>
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.24em] text-ink/40">
                {albums.length} series · {totalPhotos} frames · {tags.length} tags
              </p>
            </div>
          </div>
        </div>
      </header>

      <WorksExplorer albums={albums} />

      <section className="border-t border-ink/15">
        <div className="mx-auto flex max-w-[1560px] flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <p className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight tracking-[-0.02em]">
            按主题重新观看 <span className="text-blue">→</span>
          </p>
          <Link
            href="/folders"
            className="inline-flex w-fit items-center gap-4 border border-ink px-5 py-3 text-[11px] tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper"
          >
            浏览专题 <span aria-hidden>↗</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
