import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { getSiteConfig } from "@/lib/api/portfolio";
import { withBasePath } from "@/lib/site";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const brand = config.photographer || "Bok_Hamm";
  const siteTitle = config.title || `${brand} Photography`;

  return {
    title: {
      default: `${siteTitle} — 摄影作品集`,
      template: `%s / ${siteTitle}`,
    },
    description: `${brand} 的摄影作品集：${config.tagline || "城市、风景与光。"}`,
    applicationName: siteTitle,
    authors: [{ name: brand }],
    keywords: ["摄影", "作品集", "包豪斯", brand],
    openGraph: {
      title: siteTitle,
      description: config.tagline,
      type: "website",
      locale: "zh_CN",
    },
    icons: {
      icon: withBasePath("/favicon.svg"),
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
