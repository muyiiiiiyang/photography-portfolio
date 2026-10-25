import Link from "next/link";

import { SiteNav } from "./SiteNav";
import type { NavItem } from "./SiteNav";
import { getAlbums, getFolders, getSiteConfig } from "@/lib/api/portfolio";

export async function SiteHeader({ floating = false }: { floating?: boolean }) {
  const [albums, folders, config] = await Promise.all([
    getAlbums(),
    getFolders(),
    getSiteConfig(),
  ]);

  const items: NavItem[] = [
    {
      href: "/works",
      label: "作品集",
      en: "Works",
      children: [
        { label: "全部作品", href: "/works", en: "ALL" },
        ...albums.map((album) => ({
          label: album.title,
          href: `/albums/${album.slug}`,
          en: album.subtitle,
          meta: `${album.count} 张`,
        })),
      ],
    },
    {
      href: "/folders",
      label: "专题",
      en: "Series",
      children: [
        { label: "全部专题", href: "/folders", en: "ALL" },
        ...folders.map((folder) => ({
          label: folder.title,
          href: `/folders/${folder.slug}`,
          en: folder.subtitle,
          meta: `${folder.count} 张`,
        })),
      ],
    },
    {
      href: "/about",
      label: "关于",
      en: "About",
      children: [
        { label: "关于作者", href: "/about", en: "PROFILE" },
        { label: "个人照片", href: "/about#portrait", en: "PORTRAIT" },
        { label: "创作宣言", href: "/about#statement", en: "STATEMENT" },
        { label: "器材清单", href: "/about#equipment", en: "EQUIPMENT" },
      ],
    },
    {
      href: "/contact",
      label: "联系",
      en: "Contact",
      children: [
        {
          label: "发送邮件",
          href: `mailto:${config.email}`,
          en: "EMAIL",
          external: true,
        },
        { label: "社交主页", href: "/contact#elsewhere", en: "SOCIAL" },
        { label: "合作方式", href: "/contact#services", en: "SERVICES" },
      ],
    },
  ];

  const isDev = process.env.NODE_ENV === "development";

  return (
    <header
      className={
        floating
          ? "absolute inset-x-0 top-0 z-40"
          : "sticky top-0 z-40 border-b border-ink/15 bg-white/95 backdrop-blur-sm"
      }
    >
      <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 sm:h-[68px] sm:flex-nowrap sm:gap-6 sm:px-8 sm:py-0 lg:px-12">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2"
          aria-label="Bok Hamm Photography 首页"
        >
          <span className="font-display text-[15px] font-semibold tracking-[-0.01em] sm:text-[17px]">
            Bok_Hamm
          </span>
          <span
            className="mb-[1px] h-1.5 w-1.5 bg-red transition-transform duration-300 group-hover:rotate-45"
            aria-hidden
          />
        </Link>

        <SiteNav items={items} />

        <div className="hidden shrink-0 items-center gap-2 border-l border-ink/15 pl-5 text-[9px] uppercase tracking-[0.28em] text-ink/45 lg:flex">
          <span>CN</span>
          <span className="text-ink/25">/</span>
          <span>2026</span>
        </div>

        {isDev ? (
          <Link
            href="/admin"
            className="hidden shrink-0 border border-ink/25 px-2 py-1 text-[9px] tracking-[0.18em] text-ink/60 transition-colors hover:border-ink hover:text-ink sm:block"
          >
            Studio
          </Link>
        ) : null}
      </div>
    </header>
  );
}
