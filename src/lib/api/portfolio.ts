import { promises as fs } from "node:fs";
import path from "node:path";

import { DEFAULT_SITE_CONFIG, EMPTY_PORTFOLIO } from "@/lib/defaults";
import { isoTime, sortPhotosByTakenDateDesc, uniqueTags } from "@/lib/photos";
import { withBasePath } from "@/lib/site";
import type {
  Accent,
  Album,
  Folder,
  Photo,
  PortfolioData,
  SiteConfig,
} from "@/lib/types";
import type {
  AlbumSummary,
  AlbumView,
  FolderSummary,
  FolderView,
  FrameView,
  PhotoView,
} from "@/lib/view-types";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const PORTFOLIO_FILE = path.join(DATA_DIR, "portfolio-data.json");
const CONFIG_FILE = path.join(DATA_DIR, "site-config.json");

const ACCENTS: Accent[] = ["red", "yellow", "blue"];

export type {
  AlbumSummary,
  AlbumView,
  FolderSummary,
  FolderView,
  FrameView,
  PhotoView,
};

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[portfolio] 读取失败，使用空数据兜底：${file}`, error);
    }
    return fallback;
  }
}

export async function getPortfolioData(): Promise<PortfolioData> {
  const data = await readJson<PortfolioData>(PORTFOLIO_FILE, EMPTY_PORTFOLIO);
  return {
    albums: Array.isArray(data.albums) ? data.albums : [],
    albumPhotos: data.albumPhotos ?? {},
    folders: Array.isArray(data.folders) ? data.folders : [],
    folderPhotos: data.folderPhotos ?? {},
    updatedAt: data.updatedAt ?? EMPTY_PORTFOLIO.updatedAt,
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const data = await readJson<Partial<SiteConfig>>(CONFIG_FILE, {});
  return {
    ...DEFAULT_SITE_CONFIG,
    ...data,
    socials: Array.isArray(data.socials)
      ? data.socials
      : DEFAULT_SITE_CONFIG.socials,
    equipment: Array.isArray(data.equipment)
      ? data.equipment
      : DEFAULT_SITE_CONFIG.equipment,
    navFolderIds: Array.isArray(data.navFolderIds)
      ? data.navFolderIds
      : DEFAULT_SITE_CONFIG.navFolderIds,
    pageCopy: {
      ...DEFAULT_SITE_CONFIG.pageCopy,
      ...(data.pageCopy ?? {}),
    },
    contact: {
      ...DEFAULT_SITE_CONFIG.contact,
      ...(data.contact ?? {}),
      services: Array.isArray(data.contact?.services)
        ? data.contact.services
        : DEFAULT_SITE_CONFIG.contact.services,
    },
  };
}

function toPhotoView(photo: Photo): PhotoView {
  return {
    ...photo,
    srcUrl: withBasePath(photo.src),
    thumbUrl: withBasePath(photo.thumb || photo.src),
  };
}

function latestOf(photos: Photo[]): string | null {
  return photos.length > 0 ? photos[0].dateTaken : null;
}

function buildAlbumSummary(
  album: Album,
  photos: Photo[],
  accent: Accent,
): AlbumSummary {
  const sorted = sortPhotosByTakenDateDesc(photos);
  const cover =
    sorted.find((photo) => photo.id === album.coverPhotoId) ?? sorted[0] ?? null;
  const latestTakenAt = latestOf(sorted);

  return {
    id: album.id,
    slug: album.slug,
    title: album.title,
    subtitle: album.subtitle,
    description: album.description,
    location: album.location,
    createdAt: album.createdAt,
    cover: cover ? toPhotoView(cover) : null,
    count: sorted.length,
    latestTakenAt,
    year: latestTakenAt
      ? String(new Date(latestTakenAt).getUTCFullYear())
      : String(new Date(album.createdAt).getUTCFullYear()),
    tags: uniqueTags(sorted.flatMap((photo) => photo.tags)),
    accent,
  };
}

/** 相册列表：按最新作品拍摄时间降序，空相册沉底。 */
export async function getAlbums(): Promise<AlbumSummary[]> {
  const data = await getPortfolioData();

  return data.albums
    .map((album, index) =>
      buildAlbumSummary(
        album,
        data.albumPhotos[album.id] ?? [],
        ACCENTS[index % ACCENTS.length],
      ),
    )
    .sort((a, b) => {
      const aTime = isoTime(a.latestTakenAt);
      const bTime = isoTime(b.latestTakenAt);
      if (aTime !== bTime) return bTime - aTime;
      return a.title.localeCompare(b.title, "zh-CN");
    });
}

export async function getAlbumBySlug(slug: string): Promise<AlbumView | null> {
  const data = await getPortfolioData();
  const index = data.albums.findIndex((album) => album.slug === slug);
  if (index === -1) return null;

  const album = data.albums[index];
  const photos = (data.albumPhotos[album.id] ?? []).map(toPhotoView);
  const summary = buildAlbumSummary(
    album,
    data.albumPhotos[album.id] ?? [],
    ACCENTS[index % ACCENTS.length],
  );

  return { ...summary, photos };
}

/** 全部照片的去重索引，用于专题引用解析。 */
function photoIndex(data: PortfolioData): Map<string, { photo: Photo; albumId: string }> {
  const map = new Map<string, { photo: Photo; albumId: string }>();
  for (const album of data.albums) {
    for (const photo of data.albumPhotos[album.id] ?? []) {
      map.set(photo.id, { photo, albumId: album.id });
    }
  }
  return map;
}

function buildFolderSummary(
  folder: Folder,
  photos: Photo[],
  accent: Accent,
  childCount = 0,
): FolderSummary {
  const sorted = sortPhotosByTakenDateDesc(photos);
  const latestTakenAt = latestOf(sorted);
  const cover =
    sorted.find((photo) => photo.id === folder.coverPhotoId) ?? sorted[0] ?? null;

  return {
    id: folder.id,
    slug: folder.slug,
    title: folder.title,
    subtitle: folder.subtitle,
    description: folder.description,
    parentId: folder.parentId,
    createdAt: folder.createdAt,
    cover: cover ? toPhotoView(cover) : null,
    count: sorted.length,
    latestTakenAt,
    tags: uniqueTags(sorted.flatMap((photo) => photo.tags)),
    accent,
    childCount,
  };
}

export async function getFolders(): Promise<FolderSummary[]> {
  const data = await getPortfolioData();
  const index = photoIndex(data);
  const childCounts = new Map<string, number>();
  for (const folder of data.folders) {
    if (folder.parentId) {
      childCounts.set(folder.parentId, (childCounts.get(folder.parentId) ?? 0) + 1);
    }
  }

  return data.folders.map((folder, i) => {
    const photos = (data.folderPhotos[folder.id] ?? [])
      .map((id) => index.get(id)?.photo)
      .filter((photo): photo is Photo => Boolean(photo));
    return buildFolderSummary(
      folder,
      photos,
      ACCENTS[i % ACCENTS.length],
      childCounts.get(folder.id) ?? 0,
    );
  });
}

export async function getFolderBySlug(slug: string): Promise<FolderView | null> {
  const data = await getPortfolioData();
  const index = photoIndex(data);
  const folderIndex = data.folders.findIndex((folder) => folder.slug === slug);
  if (folderIndex === -1) return null;

  const folder = data.folders[folderIndex];
  const photos = (data.folderPhotos[folder.id] ?? [])
    .map((id) => index.get(id)?.photo)
    .filter((photo): photo is Photo => Boolean(photo));

  const childCounts = new Map<string, number>();
  for (const item of data.folders) {
    if (item.parentId) {
      childCounts.set(item.parentId, (childCounts.get(item.parentId) ?? 0) + 1);
    }
  }

  const summaryFor = (item: Folder) => {
    const itemPhotos = (data.folderPhotos[item.id] ?? [])
      .map((id) => index.get(id)?.photo)
      .filter((photo): photo is Photo => Boolean(photo));
    return buildFolderSummary(
      item,
      itemPhotos,
      ACCENTS[data.folders.indexOf(item) % ACCENTS.length],
      childCounts.get(item.id) ?? 0,
    );
  };

  const children = data.folders
    .filter((item) => item.parentId === folder.id)
    .map(summaryFor);

  const parentFolder = folder.parentId
    ? data.folders.find((item) => item.id === folder.parentId) ?? null
    : null;

  const summary = summaryFor(folder);

  return {
    ...summary,
    photos: sortPhotosByTakenDateDesc(photos).map(toPhotoView),
    children,
    parent: parentFolder ? summaryFor(parentFolder) : null,
  };
}

/** 全站标签，按使用频次降序。 */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const data = await getPortfolioData();
  const counts = new Map<string, number>();
  for (const album of data.albums) {
    for (const photo of data.albumPhotos[album.id] ?? []) {
      for (const tag of uniqueTags(photo.tags)) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-CN"));
}

/** 首页随机墙：全站照片 + 所属相册/专题信息，按拍摄时间降序。 */
export async function getAllFrames(): Promise<FrameView[]> {
  const data = await getPortfolioData();
  const frames: FrameView[] = [];
  const folderById = new Map(data.folders.map((folder) => [folder.id, folder]));
  const seriesByPhoto = new Map<string, FrameView["series"]>();

  for (const folder of data.folders) {
    const parentTitle = folder.parentId
      ? folderById.get(folder.parentId)?.title
      : undefined;
    for (const photoId of data.folderPhotos[folder.id] ?? []) {
      const list = seriesByPhoto.get(photoId) ?? [];
      if (!list.some((item) => item.slug === folder.slug)) {
        list.push({
          slug: folder.slug,
          title: folder.title,
          parentTitle,
        });
      }
      seriesByPhoto.set(photoId, list);
    }
  }

  for (const album of data.albums) {
    for (const photo of data.albumPhotos[album.id] ?? []) {
      frames.push({
        ...toPhotoView(photo),
        albumSlug: album.slug,
        albumTitle: album.title,
        series: seriesByPhoto.get(photo.id) ?? [],
      });
    }
  }

  return frames.sort((a, b) => isoTime(b.dateTaken) - isoTime(a.dateTaken));
}

export async function getPortfolioStats(): Promise<{
  photos: number;
  albums: number;
  folders: number;
  tags: number;
  latest: string | null;
}> {
  const data = await getPortfolioData();
  let photos = 0;
  let latest: string | null = null;

  for (const album of data.albums) {
    const list = data.albumPhotos[album.id] ?? [];
    photos += list.length;
    for (const photo of list) {
      if (isoTime(photo.dateTaken) > isoTime(latest)) {
        latest = photo.dateTaken;
      }
    }
  }

  return {
    photos,
    albums: data.albums.length,
    folders: data.folders.length,
    tags: (await getAllTags()).length,
    latest,
  };
}
