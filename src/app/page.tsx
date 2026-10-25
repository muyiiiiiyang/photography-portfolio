import type { Metadata } from "next";

import { EnterLink } from "@/components/site/EnterLink";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getPortfolioStats, getSiteConfig } from "@/lib/api/portfolio";
import { formatYear } from "@/lib/format";

export const metadata: Metadata = {
  title: "Bok_Hamm Photography — 摄影作品集",
  description:
    "以几何的目光，收集光、秩序与城市的呼吸。Bok Hamm 摄影作品集。",
};

const WORDMARK = "BOK_HAMM".split("");

export default async function CoverPage() {
  const [config, stats] = await Promise.all([
    getSiteConfig(),
    getPortfolioStats(),
  ]);

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      <SiteHeader floating />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-60"
      />

      {/* 右上：蓝色矩形与红色方块，替代原先的黄色圆形 */}
      <div
        aria-hidden
        className="shape-in pointer-events-none absolute right-0 top-[76px] hidden h-[15vh] w-[20vw] bg-blue sm:block"
      />
      <div
        aria-hidden
        className="shape-in pointer-events-none absolute right-[20vw] top-[calc(15vh+88px)] hidden h-3 w-3 bg-red sm:block"
        style={{ animationDelay: "0.38s" }}
      />

      {/* 移动端：右下角的小型蓝块与红方块 */}
      <div
        aria-hidden
        className="shape-in pointer-events-none absolute bottom-[12vh] right-0 h-24 w-24 bg-blue sm:hidden"
      />
      <div
        aria-hidden
        className="shape-in pointer-events-none absolute bottom-[calc(12vh+90px)] right-[90px] h-3 w-3 bg-red sm:hidden"
        style={{ animationDelay: "0.3s" }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-[38%] top-[10vh] h-[72vh] w-px bg-ink/10"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1560px] flex-1 flex-col px-5 pb-6 pt-28 sm:px-8 sm:pt-24 lg:px-12">
        <div className="flex flex-1 flex-col justify-center py-8">
          <div
            className="fade-up flex items-center gap-3"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="h-2 w-2 rounded-full bg-red" aria-hidden />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink/55 sm:text-[10px]">
              Photographic portfolio — est. 2019
            </span>
            <span className="hidden h-px flex-1 bg-ink/20 sm:block" />
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.3em] text-ink/55 sm:block">
              Shanghai / CN
            </span>
          </div>

          <h1 className="mt-6 sm:mt-8" aria-label="Bok Hamm Photography">
            <span className="sr-only">Bok Hamm Photography</span>
            <span
              aria-hidden
              className="wordmark block whitespace-nowrap text-[clamp(3rem,14vw,13rem)]"
            >
              {WORDMARK.map((char, index) => (
                <span
                  key={`${char}-${index}`}
                  className={`wordmark-letter ${char === "_" ? "text-red" : ""}`}
                  style={{ animationDelay: `${0.24 + index * 0.055}s` }}
                >
                  {char}
                </span>
              ))}
              <span
                className="wordmark-letter ml-[0.14em] inline-block h-[0.09em] w-[0.09em] bg-red align-baseline"
                style={{ animationDelay: "0.82s" }}
              />
            </span>

            <span aria-hidden className="mt-2 flex items-center gap-4 sm:mt-4">
              <span className="hidden h-px flex-1 bg-ink/25 sm:block" />
              <span
                className="text-outline fade-up font-display text-[clamp(0.85rem,2.8vw,2.2rem)] font-medium uppercase leading-none tracking-[0.32em] sm:tracking-[0.46em]"
                style={{ animationDelay: "0.92s" }}
              >
                Photography
              </span>
            </span>
          </h1>

          <div className="mt-9 flex flex-col gap-8 sm:mt-12 sm:flex-row sm:items-end sm:justify-between">
            <EnterLink />
            <p
              className="fade-up max-w-xs text-[13px] leading-relaxed text-ink/75 sm:text-right"
              style={{ animationDelay: "1.08s" }}
            >
              {config.tagline}
            </p>
          </div>
        </div>

        <div
          className="fade-up mt-8 flex flex-col gap-2 border-t border-ink/20 pt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-ink/45 sm:flex-row sm:items-center sm:justify-between"
          style={{ animationDelay: "1.22s" }}
        >
          <span>01 — Cover</span>
          <span className="hidden sm:block">
            Photography / Architecture / Landscape
          </span>
          <span>
            {stats.photos > 0
              ? `${String(stats.photos).padStart(2, "0")} frames · ${String(
                  stats.albums,
                ).padStart(2, "0")} series · ${formatYear(stats.latest)}`
              : "Portfolio 2026"}
          </span>
        </div>
      </div>
    </main>
  );
}
