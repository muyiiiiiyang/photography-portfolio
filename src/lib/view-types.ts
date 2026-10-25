import type { Accent, Album, Folder, Photo } from "./types";

/**
 * 视图模型只做展示层增强（basePath 前缀、统计字段），
 * 与 fs 数据层解耦，方便客户端组件安全引用类型。
 */

export interface PhotoView extends Photo {
  srcUrl: string;
  thumbUrl: string;
}

export interface AlbumSummary extends Omit<Album, "coverPhotoId"> {
  cover: PhotoView | null;
  count: number;
  latestTakenAt: string | null;
  year: string;
  tags: string[];
  accent: Accent;
}

export interface AlbumView extends AlbumSummary {
  photos: PhotoView[];
}

export interface FolderSummary extends Omit<Folder, "coverPhotoId"> {
  cover: PhotoView | null;
  count: number;
  latestTakenAt: string | null;
  tags: string[];
  accent: Accent;
}

export interface FolderView extends FolderSummary {
  photos: PhotoView[];
}

export type { Accent };
