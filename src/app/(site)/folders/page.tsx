import type { Metadata } from "next";
import Link from "next/link";

import { CollectionCard } from "@/components/site/CollectionCard";
import { getFolders } from "@/lib/api/portfolio";
import { formatYear } from "@/lib/format";

export const metadata: Metadata = {
  title: "专题",
  description: "从主题到子专题，以不同层级重新编排作品序列。",
};

export default async function FoldersPage() {
  const folders = await getFolders();
  const topLevel = folders.filter((folder) => !folder.parentId);
  const childrenByParent = new Map<string, typeof folders>();
  for (const folder of folders) {
    if (!folder.parentId) continue;
    const list = childrenByParent.get(folder.parentId) ?? [];
    list.push(folder);
    childrenByParent.set(folder.parentId, list);
  }

  return (
    <div className="page-enter">
      <header className="relative overflow-hidden border-b border-ink/15">
        <div className="relative mx-auto max-w-[1560px] px-5 pb-10 pt-10 sm:px-8 lg:px-12 lg:pb-16 lg:pt-16">
          <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-ink/40">
            <span>Index / 02</span>
            <span className="h-px w-10 bg-ink/25" />
            <span>Series &amp; sub-series</span>
          </div>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="font-display text-[clamp(3.4rem,10vw,9rem)] leading-[0.82] tracking-[-0.04em]">
              专题<span className="text-blue">.</span>
            </h1>
            <div className="max-w-md lg:pb-3">
              <p className="text-sm leading-relaxed text-ink/65">
                从主题到子专题，逐层收拢照片。先选一个大方向，再进入下一层继续细分。
              </p>
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.24em] text-ink/40">
                {topLevel.length} top series · {folders.length} total
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1560px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        {topLevel.length > 0 ? (
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-10">
            {topLevel.map((folder, index) => {
              const children = childrenByParent.get(folder.id) ?? [];
              return (
                <div key={folder.id}>
                  <CollectionCard
                    href={`/folders/${folder.slug}`}
                    code="S"
                    index={index}
                    title={folder.title}
                    subtitle={folder.subtitle}
                    cover={folder.cover}
                    count={folder.count}
                    year={formatYear(folder.latestTakenAt)}
                    tags={folder.tags}
                    priority={index < 3}
                  />
                  <div className="mt-3 border-t border-ink/15">
                    <p className="flex items-center justify-between py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/40">
                      <span>子专题 / SUB</span>
                      <span>{String(children.length).padStart(2, "0")}</span>
                    </p>
                    {children.length > 0 ? (
                      <ul className="divide-y divide-ink/10 border-t border-ink/10">
                        {children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/folders/${child.slug}`}
                              className="group flex items-center justify-between gap-3 py-2.5 text-[12px] transition-colors hover:text-red"
                            >
                              <span className="truncate">
                                <span className="mr-2 text-ink/30">↳</span>
                                {child.title}
                              </span>
                              <span className="flex shrink-0 items-center gap-2 font-mono text-[9px] text-ink/35">
                                {child.count} 张
                                <span
                                  aria-hidden
                                  className="transition-transform duration-300 group-hover:translate-x-1"
                                >
                                  →
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="border-t border-ink/10 py-3 text-[10px] text-ink/35">
                        还没有子专题，可在工作台继续创建。
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-10 border border-ink/15 bg-white p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink/40">
                Series / 00
              </p>
              <p className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] leading-tight tracking-[-0.02em]">
                专题正在整理中。
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/50">
                一组照片，一条线索。新的主题序列将和作品一起上线。
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span aria-hidden className="h-16 w-16 bg-blue" />
              <span aria-hidden className="mt-6 h-10 w-10 bg-red" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
