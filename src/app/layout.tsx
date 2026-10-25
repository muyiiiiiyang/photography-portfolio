import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { withBasePath } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bok_Hamm Photography — 摄影作品集",
    template: "%s / Bok_Hamm Photography",
  },
  description:
    "Bok Hamm 的摄影作品集：城市几何、静默风景与夜的海。以包豪斯的秩序观看光。",
  applicationName: "Bok_Hamm Photography",
  authors: [{ name: "Bok Hamm" }],
  keywords: ["摄影", "作品集", "包豪斯", "上海摄影师", "Bok Hamm"],
  openGraph: {
    title: "Bok_Hamm Photography",
    description: "以几何的目光，收集光、秩序与城市的呼吸。",
    type: "website",
    locale: "zh_CN",
  },
  icons: {
    icon: withBasePath("/favicon.svg"),
  },
};

export const viewport: Viewport = {
  themeColor: "#f2ede2",
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
