"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavChild {
  label: string;
  href: string;
  en?: string;
  meta?: string;
  external?: boolean;
}

export interface NavItem {
  href: string;
  label: string;
  en: string;
  children: NavChild[];
}

export function SiteNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="主导航"
      className="order-3 -mx-1 flex w-full items-center justify-between gap-4 overflow-x-auto border-t border-ink/10 pt-2.5 sm:order-none sm:mx-0 sm:ml-auto sm:w-auto sm:justify-end sm:gap-7 sm:overflow-visible sm:border-0 sm:pt-0 lg:gap-9"
    >
      {items.map((item, itemIndex) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const alignRight = itemIndex >= items.length - 2;

        return (
          <div key={item.href} className="group relative shrink-0">
            <Link
              href={item.href}
              data-active={active}
              className="nav-link flex items-baseline gap-1.5 py-1"
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
              <span
                aria-hidden
                className="ml-0.5 hidden text-[8px] font-light text-ink/30 transition-transform duration-300 group-hover:rotate-45 group-focus-within:rotate-45 md:inline"
              >
                +
              </span>
            </Link>

            <div
              className={`invisible absolute top-full z-50 hidden w-[272px] pt-4 opacity-0 transition-[opacity,visibility] duration-200 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 md:block ${
                alignRight
                  ? "left-auto right-0 translate-x-0"
                  : "left-1/2 -translate-x-1/2"
              }`}
            >
              <div className="border border-ink bg-white shadow-[7px_7px_0_0_rgba(20,18,16,0.12)]">
                <div className="h-1 w-full bg-red" aria-hidden />
                <div className="flex items-center justify-between border-b border-ink/10 px-3.5 py-2.5">
                  <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-ink/40">
                    {item.en} / Index
                  </span>
                  <span className="font-mono text-[8px] text-ink/30">
                    {String(item.children.length).padStart(2, "0")}
                  </span>
                </div>

                <ul className="max-h-[56vh] overflow-y-auto py-1">
                  {item.children.map((child, childIndex) => {
                    const content = (
                      <>
                        <span className="flex min-w-0 items-baseline gap-2">
                          <span
                            className={`shrink-0 font-mono text-[8px] ${
                              child.external ? "text-red" : "text-ink/30"
                            }`}
                          >
                            {child.external
                              ? "↗"
                              : String(childIndex + 1).padStart(2, "0")}
                          </span>
                          <span className="truncate text-[12px] tracking-[0.02em]">
                            {child.label}
                          </span>
                        </span>
                        <span className="ml-3 shrink-0 font-mono text-[8px] uppercase tracking-[0.08em] text-ink/30 group-hover/child:text-paper/50">
                          {child.meta ?? child.en ?? ""}
                        </span>
                      </>
                    );

                    const className =
                      "group/child flex items-baseline justify-between gap-2 px-3.5 py-2.5 transition-colors duration-150 hover:bg-ink hover:text-paper";

                    return (
                      <li key={`${child.href}-${child.label}`}>
                        {child.external ? (
                          <a href={child.href} className={className}>
                            {content}
                          </a>
                        ) : (
                          <Link href={child.href} className={className}>
                            {content}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
