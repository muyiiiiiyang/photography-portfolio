import type { PortfolioData, SiteConfig } from "./types";

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  photographer: "Bok Hamm",
  title: "Bok_Hamm Photography",
  tagline: "记录城市、光线与旅途里的短暂停顿。",
  navAlbumIds: [],
  statement:
    "我拍城市，也拍城市里短暂停顿的人。光线、秩序和偶然，是我一直在找的三样东西。",
  bio: "Bok Hamm，摄影师，往返于上海与南方城市之间。习惯带着一台相机和一卷胶卷出门，在城市的边缘、车站、海边和巷口寻找可以停留的瞬间。\n\n目前持续拍摄《城市切片》与《南方公路》两个长期项目。比起完整叙事，我更在意一张照片里光线落下的方式，以及人和空间之间那一点没有说出口的距离。",
  location: "Shanghai, CN",
  email: "hello@bokhamm.studio",
  socials: [
    { label: "Instagram", url: "https://www.instagram.com/" },
    { label: "Behance", url: "https://www.behance.net/" },
    { label: "小红书", url: "https://www.xiaohongshu.com/" },
  ],
  equipment: [
    "Sony A7R III",
    "FE 24-70mm f/2.8 GM",
    "FE 35mm f/1.4 ZA",
    "Kodak Portra 400",
  ],
  copyright: "© 2026 Bok Hamm. All rights reserved.",
};

export const EMPTY_PORTFOLIO: PortfolioData = {
  albums: [],
  albumPhotos: {},
  folders: [],
  folderPhotos: {},
  updatedAt: new Date(0).toISOString(),
};
