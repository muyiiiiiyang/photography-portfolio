export type Accent = "red" | "yellow" | "blue";

export type DateTakenSource = "exif" | "manual" | "fallback";

export interface PhotoGps {
  lat: number;
  lng: number;
}

export interface Photo {
  id: string;
  fileName: string;
  /** 站内绝对路径，例如 /photos/2026/xxxx.webp，不含 basePath */
  src: string;
  thumb: string;
  width: number;
  height: number;
  /** 24px 级别的极小 WebP，用作渐进加载占位 */
  blurDataURL?: string;
  title?: string;
  caption?: string;
  tags: string[];
  /** 拍摄时间，统一为 ISO-8601 UTC 字符串；排序唯一依据 */
  dateTaken: string;
  dateTakenSource?: DateTakenSource;
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  gps?: PhotoGps;
  addedAt: string;
}

export interface PhotoLocation {
  name?: string;
  lat?: number;
  lng?: number;
}

export interface Album {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  location?: PhotoLocation;
  coverPhotoId?: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverPhotoId?: string;
  createdAt: string;
}

export interface PortfolioData {
  albums: Album[];
  albumPhotos: Record<string, Photo[]>;
  folders: Folder[];
  /** 专题只存照片 id，照片本体唯一存放在 albumPhotos 中 */
  folderPhotos: Record<string, string[]>;
  updatedAt: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteConfig {
  photographer: string;
  title: string;
  tagline: string;
  /** 关于页个人照片，例如 /portrait/portrait-xxx.webp */
  portrait?: string;
  bio: string;
  statement: string;
  location: string;
  email: string;
  socials: SocialLink[];
  equipment: string[];
  copyright: string;
}
