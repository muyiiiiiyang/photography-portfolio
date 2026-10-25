import Link from "next/link";

export function ComingSoon({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <article className="page-enter">
      <header className="border-b border-ink/15">
        <div className="mx-auto max-w-[1560px] px-5 pb-12 pt-12 sm:px-8 lg:px-12 lg:pb-20 lg:pt-20">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.28em] text-ink/45 transition-colors hover:text-ink"
          >
            <span aria-hidden>←</span> {backLabel}
          </Link>
          <p className="mt-10 font-mono text-[9px] uppercase tracking-[0.32em] text-ink/40">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.9] tracking-[-0.035em]">
            {title}
            <span className="text-red">.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/55">
            {description}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="relative aspect-[16/7] overflow-hidden border border-ink bg-white">
          <span
            aria-hidden
            className="absolute left-[8%] top-[18%] h-[42%] w-[16%] bg-blue"
          />
          <span
            aria-hidden
            className="absolute bottom-[18%] right-[8%] h-[18%] w-[10%] bg-red"
          />
          <span
            aria-hidden
            className="absolute left-[8%] right-[8%] top-1/2 h-px bg-ink/20"
          />
          <span className="absolute right-[8%] top-[18%] font-mono text-[9px] uppercase tracking-[0.22em] text-ink/35">
            Awaiting frames
          </span>
        </div>
      </section>
    </article>
  );
}
