import type { Metadata } from "next";
import Link from "next/link";

import { getSiteConfig } from "@/lib/api/portfolio";

export const metadata: Metadata = {
  title: "联系",
  description: "商业拍摄、编辑约稿与展览合作，欢迎联系。",
};

export default async function ContactPage() {
  const config = await getSiteConfig();

  return (
    <div className="page-enter">
      <header className="border-b border-ink/15">
        <div className="mx-auto max-w-[1560px] px-5 pb-10 pt-10 sm:px-8 lg:px-12 lg:pb-16 lg:pt-16">
          <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-ink/40">
            <span>Index / 04</span>
            <span className="h-px w-10 bg-ink/25" />
            <span>Say hello</span>
          </div>
          <h1 className="mt-8 font-display text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.92] tracking-[-0.035em]">
            一起做点
            <br />
            有光的事<span className="text-red">。</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink/65">
            商业拍摄、建筑与空间、编辑约稿、展览与出版合作，都欢迎来信。
            通常会在两个工作日内回复。
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1560px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <a
          href={`mailto:${config.email}`}
          className="group flex flex-col gap-4 border-y border-ink py-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="break-all font-display text-[clamp(1.4rem,4.6vw,3.8rem)] leading-none tracking-[-0.02em] transition-colors duration-300 group-hover:text-red">
            {config.email}
          </span>
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink transition-all duration-300 group-hover:border-red group-hover:bg-red group-hover:text-paper"
          >
            ↗
          </span>
        </a>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <p className="label">Elsewhere</p>
            <ul className="mt-4 divide-y divide-ink/15 border-t border-ink/15">
              {config.socials.map((social, index) => (
                <li key={`${social.label}-${social.url}`}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-5 py-4"
                  >
                    <span className="font-mono text-[9px] text-ink/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-lg tracking-[-0.01em] transition-colors group-hover:text-red">
                      {social.label}
                    </span>
                    <span
                      aria-hidden
                      className="ml-auto text-[13px] text-ink/30 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="label">Based in</p>
              <p className="mt-2 font-display text-xl">{config.location}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink/50">
                接受国内及海外委托，可灵活安排行程。
              </p>
            </div>
            <div>
              <p className="label">Availability</p>
              <p className="mt-2 flex items-center gap-2 font-display text-xl">
                <span className="h-2 w-2 rounded-full bg-red" aria-hidden />
                接受新项目
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink/50">
                2026 年秋季档期开放中。
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="label">Services</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["建筑 / 空间", "品牌视觉", "编辑肖像", "展览 / 出版"].map(
                  (service) => (
                    <span
                      key={service}
                      className="border border-ink/20 px-3 py-1.5 text-[11px] tracking-[0.06em] text-ink/65"
                    >
                      {service}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/15">
        <div className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight tracking-[-0.02em]">
              先看看作品？<span className="text-blue"> →</span>
            </p>
            <Link
              href="/works"
              className="inline-flex w-fit items-center gap-4 border border-ink px-5 py-3 text-[11px] tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper"
            >
              进入作品集 <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
