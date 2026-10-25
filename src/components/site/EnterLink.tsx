"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MouseEvent } from "react";

export function EnterLink() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => router.push("/works"), 430);
  }

  return (
    <>
      <Link
        href="/works"
        onClick={handleClick}
        aria-label="进入作品集"
        className="fade-up group relative inline-flex w-fit items-stretch transition-transform duration-300 hover:-translate-y-0.5"
        style={{ animationDelay: "0.95s" }}
      >
        <span className="flex items-center gap-4 border border-ink bg-paper px-6 py-4 shadow-[5px_5px_0_0_var(--color-ink)] transition-shadow duration-300 group-hover:shadow-[7px_7px_0_0_var(--color-red)] sm:px-8 sm:py-5">
          <span className="text-[13px] font-medium tracking-[0.16em] sm:text-sm">
            进入作品集
          </span>
          <span className="hidden text-[9px] uppercase tracking-[0.3em] text-ink/40 sm:inline">
            Enter the works
          </span>
        </span>
        <span className="flex w-14 items-center justify-center border border-l-0 border-ink bg-ink text-paper transition-colors duration-300 group-hover:bg-red sm:w-16">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
          >
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </span>
      </Link>

      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-[90] bg-red transition-transform duration-[520ms] ease-[cubic-bezier(.76,0,.24,1)] ${
          entering ? "translate-y-0" : "translate-y-full"
        }`}
      />
    </>
  );
}
