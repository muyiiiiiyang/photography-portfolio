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
  pageCopy: {
    aboutHeadingLead: "用几何的秩序，",
    aboutHeadingAccent: "观看光。",
    worksIntro:
      "按相册收录。每张作品以相机原始拍摄时间排序，最新的光永远在最前面。",
    foldersIntro:
      "从主题到子专题，逐层收拢照片。先选一个大方向，再进入下一层继续细分。",
  },
  contact: {
    eyebrow: "Say hello",
    title: "一起做点\n有光的事",
    intro:
      "商业拍摄、建筑与空间、编辑约稿、展览与出版合作，都欢迎来信。通常会在两个工作日内回复。",
    elsewhereLabel: "Elsewhere",
    basedInLabel: "Based in",
    basedInNote: "接受国内及海外委托，可灵活安排行程。",
    availabilityLabel: "Availability",
    availabilityStatus: "接受新项目",
    availabilityNote: "2026 年秋季档期开放中。",
    servicesLabel: "Services",
    services: ["建筑 / 空间", "品牌视觉", "编辑肖像", "展览 / 出版"],
    ctaTitle: "先看看作品？",
    ctaButton: "进入作品集",
  },
};

export const EMPTY_PORTFOLIO: PortfolioData = {
  albums: [],
  albumPhotos: {},
  folders: [],
  folderPhotos: {},
  updatedAt: new Date(0).toISOString(),
};
