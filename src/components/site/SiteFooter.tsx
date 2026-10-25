import Link from "next/link";

import { getSiteConfig } from "@/lib/api/portfolio";

const NAV = [
  { href: "/works", label: "作品集" },
  { href: "/folders", label: "专题" },
  { href: "/about", label: "关于作者" },
  { href: "/contact", label: "联系" },
];

export async function SiteFooter() {
  const config = await getSiteConfig();

  return (
    <footer className="border-t border-ink/20">
      <div className="marquee border-b border-ink/15 bg-ink py-2.5 text-paper">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center gap-6 pr-6 text-[9px] uppercase tracking-[0.32em]"
            >
              <span>{config.photographer || "Bok_Hamm"} Photography</span>
              <span className="text-yellow">●</span>
              <span>Selected Works 2019—2026</span>
              <span className="text-red">■</span>
              <span>Shanghai / CN</span>
              <span className="text-blue">▲</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1560px] px-5 pb-8 pt-14 sm:px-8 lg:px-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.85] tracking-[-0.04em]">
              {config.photographer || "Bok_Hamm"}
            </p>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-ink/55">
              {config.tagline}
            </p>
          </div>

          <div>
            <p className="label">Navigate</p>
            <ul className="mt-4 space-y-2 text-sm">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="link-underline text-ink/75 transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label">Contact</p>
            <a
              href={`mailto:${config.email}`}
              className="link-underline mt-4 block w-fit text-sm text-ink/80 hover:text-ink"
            >
              {config.email}
            </a>
            <ul className="mt-4 space-y-2 text-sm">
              {config.socials.map((social) => (
                <li key={`${social.label}-${social.url}`}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-underline inline-flex items-center gap-1 text-ink/70 hover:text-ink"
                  >
                    {social.label}
                    <span aria-hidden className="text-[9px]">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink/15 pt-5 text-[9px] uppercase tracking-[0.22em] text-ink/40 sm:flex-row sm:items-center sm:justify-between">
          <span>{config.copyright}</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red" aria-hidden />
            Shot on light / Built on geometry
          </span>
          <a href="#top" className="transition-colors hover:text-ink">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
