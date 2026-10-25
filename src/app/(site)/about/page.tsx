import type { Metadata } from "next";
import Link from "next/link";

import { getAlbums, getPortfolioStats, getSiteConfig } from "@/lib/api/portfolio";
import { withBasePath } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于作者",
  description: "关于摄影师 Bok Hamm：城市、几何与光的长期观察者。",
};

export default async function AboutPage() {
  const [config, stats, albums] = await Promise.all([
    getSiteConfig(),
    getPortfolioStats(),
    getAlbums(),
  ]);

  const portrait = config.portrait
    ? withBasePath(config.portrait)
    : albums[0]?.cover?.srcUrl ?? null;
  const portraitAlt = config.portrait
    ? `${config.photographer} 的个人照片`
    : `${config.photographer} 的作品`;
  const portraitCaption = config.portrait ? "Portrait / 个人照片" : "Selected work";
  const aboutText = [config.statement, config.bio]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
  const paragraphs = aboutText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const headingLead = config.pageCopy.aboutHeadingLead.trim();
  const headingAccent = config.pageCopy.aboutHeadingAccent.trim();
  const hasHeading = Boolean(headingLead || headingAccent);

  return (
    <div className="page-enter">
      {hasHeading ? (
        <header className="relative grid min-h-[42vh] place-items-center overflow-hidden border-b border-ink/15 py-12 lg:py-16">
          <div
            aria-hidden
            className="absolute -right-24 top-1/2 h-72 w-56 -translate-y-1/2 bg-blue/10"
          />
          <div className="relative mx-auto w-full max-w-[1560px] px-5 pt-8 sm:px-8 lg:px-12">
            <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-ink/40">
              <span>关于作者</span>
              <span className="h-px w-10 bg-ink/25" />
              <span>About the photographer</span>
            </div>
            <h1 className="mt-8 max-w-5xl font-display text-[clamp(2.6rem,6.4vw,6rem)] leading-[0.98] tracking-[-0.035em]">
              {headingLead}
              {headingLead && headingAccent ? <br /> : null}
              {headingAccent ? (
                <span className="text-outline">{headingAccent}</span>
              ) : null}
            </h1>
          </div>
        </header>
      ) : null}

      <section
        className={`mx-auto grid max-w-[1560px] gap-12 px-5 pb-14 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12 lg:pb-20 ${
          hasHeading ? "pt-14 lg:pt-20" : "pt-16 lg:pt-24"
        }`}
      >
        <div id="portrait" className="scroll-mt-28">
          <div className="sticky top-24">
            <div className="relative">
              {portrait ? (
                <>
                  <span
                    aria-hidden
                    className="absolute -left-2 -top-2 h-full w-full bg-yellow"
                  />
                  <img
                    src={portrait}
                    alt={portraitAlt}
                    className="relative aspect-[4/5] w-full border border-ink object-cover"
                  />
                </>
              ) : (
                <div className="relative aspect-[4/5] w-full overflow-hidden border border-ink bg-paper-2">
                  <span
                    aria-hidden
                    className="absolute left-[12%] top-[10%] h-[26%] w-[34%] bg-blue"
                  />
                  <span
                    aria-hidden
                    className="absolute bottom-[16%] right-[12%] h-16 w-16 bg-red"
                  />
                  <span
                    aria-hidden
                    className="absolute left-[12%] right-[12%] top-1/2 h-px bg-ink/20"
                  />
                  <span className="absolute bottom-6 left-6 font-mono text-[9px] uppercase tracking-[0.22em] text-ink/35">
                    Portrait / Soon
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-ink/40">
              <span>{portraitCaption}</span>
              <span>{config.location}</span>
            </div>
          </div>
        </div>

        <div>
          <div
            id="statement"
            className="scroll-mt-28 space-y-5 text-sm leading-loose text-ink/70"
          >
            {paragraphs.map((paragraph, index) => (
              <p
                key={`${paragraph.slice(0, 24)}-${index}`}
                className={
                  index === 0
                    ? "whitespace-pre-line font-display text-[clamp(1.3rem,2.2vw,1.9rem)] leading-snug tracking-[-0.01em] text-ink"
                    : "whitespace-pre-line"
                }
              >
                {paragraph}
              </p>
            ))}
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-6 border-y border-ink/15 py-6 sm:grid-cols-3">
            <div>
              <dt className="label">Based in</dt>
              <dd className="font-display text-lg">{config.location}</dd>
            </div>
            <div>
              <dt className="label">Frames</dt>
              <dd className="font-display text-lg">
                {String(stats.photos).padStart(2, "0")}
              </dd>
            </div>
            <div>
              <dt className="label">Series</dt>
              <dd className="font-display text-lg">
                {String(stats.albums).padStart(2, "0")}
              </dd>
            </div>
          </dl>

          <div id="equipment" className="mt-10 scroll-mt-28">
            <p className="label">Equipment</p>
            <ul className="mt-4 divide-y divide-ink/10 border-t border-ink/10">
              {config.equipment.map((item, index) => (
                <li
                  key={item}
                  className="flex items-baseline justify-between gap-6 py-3"
                >
                  <span className="font-mono text-[9px] text-ink/35">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm text-ink/75">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap gap-2.5">
            {config.socials.map((social) => (
              <a
                key={`${social.label}-${social.url}`}
                href={social.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 border border-ink/25 px-3.5 py-2 text-[11px] tracking-[0.08em] transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                {social.label} <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink/15 bg-ink py-16 text-paper sm:py-24">
        <div className="mx-auto max-w-[1560px] px-5 sm:px-8 lg:px-12">
          <p className="max-w-5xl font-display text-[clamp(1.8rem,4.6vw,4.2rem)] leading-[1.08] tracking-[-0.03em]">
            “摄影不是记录我看见了什么，
            <span className="text-yellow">而是排列光如何落在这些事物上</span>。”
          </p>
          <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.3em] text-paper/40">
            — {config.photographer}
          </p>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1560px] flex-col gap-6 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-20">
        <p className="font-display text-[clamp(1.8rem,4vw,3.4rem)] leading-tight tracking-[-0.02em]">
          想一起做点有光的事？
        </p>
        <Link
          href="/contact"
          className="inline-flex w-fit items-center gap-4 border border-ink px-5 py-3 text-[11px] tracking-[0.16em] transition-colors hover:bg-red hover:text-paper"
        >
          联系我 <span aria-hidden>→</span>
        </Link>
      </section>
    </div>
  );
}
