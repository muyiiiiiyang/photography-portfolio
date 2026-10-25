import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-70"
      />
      <header className="relative z-10 mx-auto flex w-full max-w-[1560px] items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="font-display text-[15px] font-semibold tracking-[-0.01em] sm:text-[17px]"
        >
          Bok_Hamm<span className="text-red">.</span>
        </Link>
        <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-ink/40">
          Error / 404
        </span>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <div
          aria-hidden
          className="absolute -left-[8vw] top-[12vh] h-48 w-48 rounded-full bg-blue/10"
        />
        <div
          aria-hidden
          className="absolute -right-[4vw] bottom-[10vh] h-40 w-40 rounded-full bg-red"
        />

        <p className="font-mono text-[9px] uppercase tracking-[0.34em] text-ink/45">
          Frame not found
        </p>
        <h1 className="wordmark relative mt-4 text-[clamp(7rem,28vw,22rem)]">
          404<span className="text-red">.</span>
        </h1>
        <p className="mt-2 text-sm text-ink/55">这一帧没有曝光。</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-4 border border-ink bg-paper px-6 py-3 text-[11px] tracking-[0.16em] shadow-[5px_5px_0_0_var(--color-ink)] transition-all duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-red)]"
        >
          返回首页 <span aria-hidden>←</span>
        </Link>
      </div>
    </main>
  );
}
