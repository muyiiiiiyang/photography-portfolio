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
            <span>{config.contact.eyebrow}</span>
          </div>
          <h1 className="mt-8 font-display text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.92] tracking-[-0.035em]">
            {config.contact.title.split("\n").map((line, index, lines) => (
              <span key={`${line}-${index}`}>
                {line}
                {index === lines.length - 1 ? (
                  <span className="text-red">.</span>
                ) : null}
                {index < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-xl whitespace-pre-line text-sm leading-relaxed text-ink/65">
            {config.contact.intro}
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
          <div id="elsewhere" className="scroll-mt-28">
            <p className="label">{config.contact.elsewhereLabel}</p>
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
              <p className="label">{config.contact.basedInLabel}</p>
              <p className="mt-2 font-display text-xl">{config.location}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink/50">
                {config.contact.basedInNote}
              </p>
            </div>
            <div>
              <p className="label">{config.contact.availabilityLabel}</p>
              <p className="mt-2 flex items-center gap-2 font-display text-xl">
                <span className="h-2 w-2 rounded-full bg-red" aria-hidden />
                {config.contact.availabilityStatus}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink/50">
                {config.contact.availabilityNote}
              </p>
            </div>
            <div id="services" className="scroll-mt-28 sm:col-span-2">
              <p className="label">{config.contact.servicesLabel}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {config.contact.services.map((service) => (
                  <span
                    key={service}
                    className="border border-ink/20 px-3 py-1.5 text-[11px] tracking-[0.06em] text-ink/65"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/15">
        <div className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight tracking-[-0.02em]">
              {config.contact.ctaTitle}<span className="text-blue"> →</span>
            </p>
            <Link
              href="/works"
              className="inline-flex w-fit items-center gap-4 border border-ink px-5 py-3 text-[11px] tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper"
            >
              {config.contact.ctaButton} <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
