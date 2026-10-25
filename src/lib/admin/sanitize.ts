import type {
  Album,
  Folder,
  Photo,
  PortfolioData,
  SiteConfig,
  SocialLink,
} from "@/lib/types";
import { isIsoDate, sortPhotosByTakenDateDesc, toIsoUtc, uniqueTags } from "@/lib/photos";

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function asSlug(value: unknown, fallback: string): string {
  const base = asString(value) ?? fallback;
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function uniqueSlug(candidate: string, used: Set<string>): string {
  let slug = candidate;
  let counter = 2;
  while (used.has(slug)) {
    slug = `${candidate}-${counter}`;
    counter += 1;
  }
  used.add(slug);
  return slug;
}

function sanitizeGps(
  value: unknown,
): { lat: number; lng: number } | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const lat = asNumber(source.lat);
  const lng = asNumber(source.lng);
  if (lat === undefined || lng === undefined) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
  return { lat, lng };
}

export function sanitizePhoto(raw: unknown, index: number): Photo | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;

  const src = asString(source.src);
  if (!src || !src.startsWith("/photos/")) return null;

  const thumb = asString(source.thumb) ?? src;
  const dateRaw = asString(source.dateTaken);
  const dateTaken =
    dateRaw && isIsoDate(dateRaw) ? toIsoUtc(dateRaw) : new Date(0).toISOString();
  const sourceValue = source.dateTakenSource;
  const dateTakenSource =
    sourceValue === "exif" || sourceValue === "manual" || sourceValue === "fallback"
      ? sourceValue
      : "manual";

  const width = Math.round(asNumber(source.width) ?? 1200);
  const height = Math.round(asNumber(source.height) ?? 800);

  const id = asString(source.id) ?? `p_${index}_${src.split("/").pop() ?? index}`;
  const fileName = asString(source.fileName) ?? src.split("/").pop() ?? `${id}.webp`;

  const blurRaw = asString(source.blurDataURL);
  const blurDataURL =
    blurRaw && blurRaw.startsWith("data:image/") && blurRaw.length < 40_000
      ? blurRaw
      : undefined;

  const addedRaw = asString(source.addedAt);
  const addedAt =
    addedRaw && isIsoDate(addedRaw) ? toIsoUtc(addedRaw) : dateTaken;

  return {
    id,
    fileName,
    src,
    thumb,
    width: width > 0 ? width : 1200,
    height: height > 0 ? height : 800,
    blurDataURL,
    title: asString(source.title),
    caption: asString(source.caption),
    tags: uniqueTags(
      Array.isArray(source.tags)
        ? source.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
    ),
    dateTaken,
    dateTakenSource,
    camera: asString(source.camera),
    lens: asString(source.lens),
    focalLength: asString(source.focalLength),
    aperture: asString(source.aperture),
    shutterSpeed: asString(source.shutterSpeed),
    iso: asNumber(source.iso),
    gps: sanitizeGps(source.gps),
    addedAt,
  };
}

export function sanitizePortfolio(raw: unknown): PortfolioData {
  const source = (raw ?? {}) as Record<string, unknown>;

  const albumsRaw = Array.isArray(source.albums) ? source.albums : [];
  const albumPhotosRaw =
    source.albumPhotos && typeof source.albumPhotos === "object"
      ? (source.albumPhotos as Record<string, unknown>)
      : {};
  const foldersRaw = Array.isArray(source.folders) ? source.folders : [];
  const folderPhotosRaw =
    source.folderPhotos && typeof source.folderPhotos === "object"
      ? (source.folderPhotos as Record<string, unknown>)
      : {};

  const albums: Album[] = [];
  const albumPhotos: Record<string, Photo[]> = {};
  const usedIds = new Set<string>();
  const usedSlugs = new Set<string>();
  const validPhotoIds = new Set<string>();

  albumsRaw.forEach((rawAlbum, index) => {
    if (!rawAlbum || typeof rawAlbum !== "object") return;
    const value = rawAlbum as Record<string, unknown>;

    const originalId = asString(value.id);
    let id = originalId ?? `album_${index + 1}`;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${originalId ?? `album_${index + 1}`}_${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    const title = asString(value.title) ?? "未命名相册";
    const slug = uniqueSlug(
      asSlug(value.slug, `album-${index + 1}`),
      usedSlugs,
    );

    const createdAtRaw = asString(value.createdAt);
    const createdAt =
      createdAtRaw && isIsoDate(createdAtRaw)
        ? toIsoUtc(createdAtRaw)
        : new Date().toISOString();

    const locationRaw =
      value.location && typeof value.location === "object"
        ? (value.location as Record<string, unknown>)
        : undefined;

    const photosSource = originalId ? albumPhotosRaw[originalId] : undefined;
    const photos = (Array.isArray(photosSource) ? photosSource : [])
      .map((photo, photoIndex) => sanitizePhoto(photo, photoIndex))
      .filter((photo): photo is Photo => Boolean(photo));

    for (const photo of photos) validPhotoIds.add(photo.id);

    const coverPhotoId = asString(value.coverPhotoId);

    albums.push({
      id,
      slug,
      title,
      subtitle: asString(value.subtitle),
      description: asString(value.description),
      location: locationRaw
        ? {
            name: asString(locationRaw.name),
            lat: asNumber(locationRaw.lat),
            lng: asNumber(locationRaw.lng),
          }
        : undefined,
      coverPhotoId:
        coverPhotoId && photos.some((photo) => photo.id === coverPhotoId)
          ? coverPhotoId
          : photos[0]?.id,
      createdAt,
    });

    albumPhotos[id] = sortPhotosByTakenDateDesc(photos);
  });

  const folders: Folder[] = [];
  const folderPhotos: Record<string, string[]> = {};
  const usedFolderIds = new Set<string>();
  const usedFolderSlugs = new Set<string>();
  const originalFolderIds = new Map<string, string>();
  const folderParentOriginals = new Map<string, string | undefined>();

  foldersRaw.forEach((rawFolder, index) => {
    if (!rawFolder || typeof rawFolder !== "object") return;
    const value = rawFolder as Record<string, unknown>;

    const originalId = asString(value.id);
    let id = originalId ?? `folder_${index + 1}`;
    let suffix = 2;
    while (usedFolderIds.has(id)) {
      id = `${originalId ?? `folder_${index + 1}`}_${suffix}`;
      suffix += 1;
    }
    usedFolderIds.add(id);
    if (originalId) originalFolderIds.set(originalId, id);

    const createdAtRaw = asString(value.createdAt);
    const createdAt =
      createdAtRaw && isIsoDate(createdAtRaw)
        ? toIsoUtc(createdAtRaw)
        : new Date().toISOString();

    const idsSource = originalId ? folderPhotosRaw[originalId] : undefined;
    const ids = Array.isArray(idsSource)
      ? [
          ...new Set(
            idsSource.filter(
              (photoId): photoId is string =>
                typeof photoId === "string" && validPhotoIds.has(photoId),
            ),
          ),
        ]
      : [];

    folders.push({
      id,
      slug: uniqueSlug(
        asSlug(value.slug, `series-${index + 1}`),
        usedFolderSlugs,
      ),
      title: asString(value.title) ?? "未命名专题",
      subtitle: asString(value.subtitle),
      description: asString(value.description),
      coverPhotoId:
        asString(value.coverPhotoId) && ids.includes(asString(value.coverPhotoId) as string)
          ? (asString(value.coverPhotoId) as string)
          : ids[0],
      createdAt,
    });

    folderParentOriginals.set(id, asString(value.parentId));
    folderPhotos[id] = ids;
  });

  // 解析 parentId，并阻断自引用与环。
  const folderIds = new Set(folders.map((folder) => folder.id));
  for (const folder of folders) {
    const parentOriginal = folderParentOriginals.get(folder.id);
    const parentId = parentOriginal
      ? originalFolderIds.get(parentOriginal)
      : undefined;

    if (!parentId || parentId === folder.id || !folderIds.has(parentId)) {
      continue;
    }

    let cursor: string | undefined = parentId;
    const chain = new Set([folder.id]);
    let valid = true;
    while (cursor) {
      if (chain.has(cursor)) {
        valid = false;
        break;
      }
      chain.add(cursor);
      const nextOriginal = folderParentOriginals.get(cursor);
      cursor = nextOriginal ? originalFolderIds.get(nextOriginal) : undefined;
    }

    if (valid) folder.parentId = parentId;
  }

  return {
    albums,
    albumPhotos,
    folders,
    folderPhotos,
    updatedAt:
      asString(source.updatedAt) && isIsoDate(source.updatedAt)
        ? toIsoUtc(source.updatedAt as string)
        : new Date().toISOString(),
  };
}

export function sanitizeSiteConfig(raw: unknown, fallback: SiteConfig): SiteConfig {
  const source = (raw ?? {}) as Record<string, unknown>;

  const socials: SocialLink[] = Array.isArray(source.socials)
    ? source.socials
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          label: asString(item.label) ?? "",
          url: asString(item.url) ?? "",
        }))
        .filter((item) => item.label && item.url)
        .slice(0, 12)
    : fallback.socials;

  const equipment = Array.isArray(source.equipment)
    ? source.equipment
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 24)
    : fallback.equipment;

  const portraitRaw = asString(source.portrait);
  const portrait =
    portraitRaw && /^\/portrait\/[a-zA-Z0-9._-]+$/.test(portraitRaw)
      ? portraitRaw
      : fallback.portrait;

  const navAlbumIds = Array.isArray(source.navAlbumIds)
    ? source.navAlbumIds
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4)
    : fallback.navAlbumIds ?? [];

  const pageCopyRaw =
    source.pageCopy && typeof source.pageCopy === "object"
      ? (source.pageCopy as Record<string, unknown>)
      : {};
  const pageCopy = {
    aboutHeadingLead:
      asString(pageCopyRaw.aboutHeadingLead) ??
      fallback.pageCopy.aboutHeadingLead,
    aboutHeadingAccent:
      asString(pageCopyRaw.aboutHeadingAccent) ??
      fallback.pageCopy.aboutHeadingAccent,
    worksIntro:
      asString(pageCopyRaw.worksIntro) ?? fallback.pageCopy.worksIntro,
    foldersIntro:
      asString(pageCopyRaw.foldersIntro) ?? fallback.pageCopy.foldersIntro,
  };

  const contactRaw =
    source.contact && typeof source.contact === "object"
      ? (source.contact as Record<string, unknown>)
      : {};
  const contactServices = Array.isArray(contactRaw.services)
    ? contactRaw.services
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 16)
    : fallback.contact.services;
  const contact = {
    eyebrow: asString(contactRaw.eyebrow) ?? fallback.contact.eyebrow,
    title: asString(contactRaw.title) ?? fallback.contact.title,
    intro: asString(contactRaw.intro) ?? fallback.contact.intro,
    elsewhereLabel:
      asString(contactRaw.elsewhereLabel) ?? fallback.contact.elsewhereLabel,
    basedInLabel:
      asString(contactRaw.basedInLabel) ?? fallback.contact.basedInLabel,
    basedInNote:
      asString(contactRaw.basedInNote) ?? fallback.contact.basedInNote,
    availabilityLabel:
      asString(contactRaw.availabilityLabel) ??
      fallback.contact.availabilityLabel,
    availabilityStatus:
      asString(contactRaw.availabilityStatus) ??
      fallback.contact.availabilityStatus,
    availabilityNote:
      asString(contactRaw.availabilityNote) ??
      fallback.contact.availabilityNote,
    servicesLabel:
      asString(contactRaw.servicesLabel) ?? fallback.contact.servicesLabel,
    services: contactServices,
    ctaTitle: asString(contactRaw.ctaTitle) ?? fallback.contact.ctaTitle,
    ctaButton: asString(contactRaw.ctaButton) ?? fallback.contact.ctaButton,
  };

  return {
    photographer: asString(source.photographer) ?? fallback.photographer,
    title: asString(source.title) ?? fallback.title,
    tagline: asString(source.tagline) ?? fallback.tagline,
    portrait,
    navAlbumIds,
    statement: asString(source.statement) ?? fallback.statement,
    bio: typeof source.bio === "string" ? source.bio : fallback.bio,
    location: asString(source.location) ?? fallback.location,
    email: asString(source.email) ?? fallback.email,
    socials,
    equipment,
    copyright: asString(source.copyright) ?? fallback.copyright,
    pageCopy,
    contact,
  };
}
