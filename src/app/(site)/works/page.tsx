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
                {albums.length > 0
                  ? `${albums.length} series · ${totalPhotos} frames · ${tags.length} tags`
                  : "Archive 2026 · 作品整理中"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {albums.length > 0 ? (
        <WorksExplorer albums={albums} />
      ) : (
        <section className="border-b border-ink/15">
          <div className="mx-auto grid max-w-[1560px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-12 lg:py-24">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-ink/40">
                Coming soon / 00
              </p>
              <h2 className="mt-5 font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.95] tracking-[-0.03em]">
                第一组作品
                <br />
                正在整理中<span className="text-red">.</span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/55">
                摄影师正在整理第一批照片。稍后回来，你会看到按拍摄时间排列的城市、风景与光。
              </p>
              <Link
                href="/about"
                className="mt-8 inline-flex items-center gap-4 border border-ink px-5 py-3 text-[11px] tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper"
              >
                先了解摄影师 <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden border border-ink bg-white">
              <span
                aria-hidden
                className="absolute left-[12%] top-[14%] h-[36%] w-[24%] bg-blue"
              />
              <span
                aria-hidden
                className="absolute bottom-[14%] right-[12%] h-[13%] w-[17%] bg-red"
              />
              <span
                aria-hidden
                className="absolute left-[12%] right-[12%] top-1/2 h-px bg-ink/20"
              />
              <span className="absolute right-[12%] top-[14%] font-mono text-[9px] uppercase tracking-[0.2em] text-ink/35">
                Awaiting frames
              </span>
            </div>
          </div>
        </section>
      )}

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
