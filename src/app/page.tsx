import type { Metadata } from "next";
import Link from "next/link";

import { RandomWall } from "@/components/site/RandomWall";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  getAllFrames,
  getPortfolioStats,
  getSiteConfig,
} from "@/lib/api/portfolio";

export const metadata: Metadata = {
  description:
    "Bok Hamm 的摄影作品集：城市几何、静默风景与夜的海。以几何的目光，收集光、秩序与城市的呼吸。",
};

const TITLE = "Bok_Hamm";

export default async function CoverPage() {
  const [config, stats, frames] = await Promise.all([
    getSiteConfig(),
    getPortfolioStats(),
    getAllFrames(),
  ]);

  const categories = [
    {
      href: "/works",
      label: "作品集",
      en: "Works",
      meta: stats.albums > 0 ? `${stats.albums} 组` : "Soon",
    },
    {
      href: "/folders",
      label: "专题",
      en: "Series",
      meta: stats.folders > 0 ? `${stats.folders} 组` : "Soon",
    },
    { href: "/about", label: "关于", en: "About", meta: "Profile" },
    { href: "/contact", label: "联系", en: "Contact", meta: "Say hello" },
  ];

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="grid flex-1 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex flex-col justify-between border-b border-ink/15 px-5 pb-8 pt-10 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 lg:pb-10 lg:pt-14">
          <div>
            <p
              className="fade-up flex items-center gap-3 font-mono text-[9px] tracking-[0.22em] text-ink/45 sm:text-[10px]"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red" aria-hidden />
              Photographic portfolio — est. 2019
            </p>

            <h1 className="mt-7" aria-label="Bok Hamm Photography">
              <span className="sr-only">Bok Hamm Photography</span>
              <span
                aria-hidden
                className="wordmark block whitespace-nowrap text-[clamp(3rem,6.9vw,7rem)]"
              >
                {TITLE.split("").map((char, index) => (
                  <span
                    key={`${char}-${index}`}
                    className={`wordmark-letter ${
                      char === "_" ? "text-red" : ""
                    }`}
                    style={{ animationDelay: `${0.2 + index * 0.045}s` }}
                  >
                    {char}
                  </span>
                ))}
              </span>

              <span
                aria-hidden
                className="text-outline fade-up mt-3 block font-display text-[clamp(1.15rem,2.4vw,2.2rem)] leading-none tracking-[0.04em]"
                style={{ animationDelay: "0.82s" }}
              >
                Photography
              </span>
            </h1>

            <p
              className="fade-up mt-6 max-w-sm text-[13px] leading-relaxed text-ink/55"
              style={{ animationDelay: "0.92s" }}
            >
              {config.tagline}
            </p>

            <nav
              aria-label="分类导航"
              className="mt-9 border-t border-ink/20"
            >
              {categories.map((category, index) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className="fade-up group flex items-center gap-3 border-b border-ink/15 py-3.5 sm:gap-4"
                  style={{ animationDelay: `${1.02 + index * 0.06}s` }}
                >
                  <span className="w-5 shrink-0 font-mono text-[9px] text-ink/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-[clamp(1.25rem,1.9vw,1.8rem)] leading-none tracking-[-0.01em] transition-colors duration-200 group-hover:text-red">
                    {category.label}
                  </span>
                  <span className="hidden text-[9px] tracking-[0.16em] text-ink/35 sm:inline">
                    {category.en}
                  </span>
                  <span className="ml-auto font-mono text-[9px] tracking-[0.12em] text-ink/35">
                    {category.meta}
                  </span>
                  <span
                    aria-hidden
                    className="text-[12px] text-ink/30 transition-all duration-200 group-hover:translate-x-1 group-hover:text-ink"
                  >
                    ↗
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div
            className="fade-up mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4 font-mono text-[9px] tracking-[0.16em] text-ink/40"
            style={{ animationDelay: "1.26s" }}
          >
            <span>{config.location}</span>
            <span>
              {stats.photos > 0
                ? `${stats.photos} frames · ${stats.albums} series`
                : "Portfolio 2026"}
            </span>
          </div>
        </section>

        <section className="flex flex-col px-5 py-8 sm:px-8 lg:px-10 lg:pb-10 lg:pt-14">
          <RandomWall frames={frames} />
        </section>
      </main>
    </div>
  );
}
