"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/works", label: "作品集", en: "WORKS" },
  { href: "/folders", label: "专题", en: "SERIES" },
  { href: "/about", label: "关于", en: "ABOUT" },
  { href: "/contact", label: "联系", en: "CONTACT" },
];

export function SiteHeader({ floating = false }: { floating?: boolean }) {
  const pathname = usePathname();
  const isDev = process.env.NODE_ENV === "development";

  return (
    <header
      className={
        floating
          ? "absolute inset-x-0 top-0 z-40"
          : "sticky top-0 z-40 border-b border-ink/15 bg-paper/95 backdrop-blur-sm"
      }
    >
      <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 sm:h-[68px] sm:flex-nowrap sm:gap-6 sm:px-8 sm:py-0 lg:px-12">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2"
          aria-label="Bok Hamm Photography 首页"
        >
          <span className="font-display text-[15px] font-semibold tracking-[-0.01em] sm:text-[17px]">
            BOK_HAMM
          </span>
          <span
            className="mb-[1px] h-1.5 w-1.5 bg-red transition-transform duration-300 group-hover:rotate-45"
            aria-hidden
          />
        </Link>

        <nav
          aria-label="主导航"
          className="order-3 -mx-1 flex w-full items-center justify-between gap-4 overflow-x-auto border-t border-ink/10 pt-2.5 sm:order-none sm:mx-0 sm:ml-auto sm:w-auto sm:justify-end sm:gap-7 sm:overflow-visible sm:border-0 sm:pt-0 lg:gap-9"
        >
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active}
                className="nav-link flex shrink-0 items-baseline gap-1.5 py-1"
              >
                <span
                  className={`text-[12px] tracking-[0.06em] sm:text-[13px] ${
                    active ? "text-ink" : "text-ink/75"
                  }`}
                >
                  {item.label}
                </span>
                <span className="hidden text-[8px] tracking-[0.22em] text-ink/35 md:inline">
                  {item.en}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 border-l border-ink/15 pl-5 text-[9px] uppercase tracking-[0.28em] text-ink/45 lg:flex">
          <span>CN</span>
          <span className="text-ink/25">/</span>
          <span>2026</span>
        </div>

        {isDev ? (
          <Link
            href="/admin"
            className="hidden shrink-0 border border-ink/25 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-ink/60 transition-colors hover:border-ink hover:text-ink sm:block"
          >
            Studio
          </Link>
        ) : null}
      </div>
    </header>
  );
}
