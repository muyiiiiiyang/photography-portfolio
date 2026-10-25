const SITE_TIME_ZONE = "Asia/Shanghai";

function partsOf(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: SITE_TIME_ZONE,
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
  };
}

/** 2026.09.14 */
export function formatDate(iso?: string | null): string {
  const parts = partsOf(iso);
  if (!parts) return "—";
  return `${parts.year}.${parts.month}.${parts.day}`;
}

/** 2026年9月14日 */
export function formatDateLong(iso?: string | null): string {
  const parts = partsOf(iso);
  if (!parts) return "—";
  return `${parts.year}年${Number(parts.month)}月${Number(parts.day)}日`;
}

export function formatYear(iso?: string | null): string {
  return partsOf(iso)?.year ?? "—";
}

export interface PhotoExifLineInput {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
}

/** LEICA M11 · 35mm · f/1.4 · 1/250s · ISO 400 */
export function exifLine(photo: PhotoExifLineInput): string {
  return [
    photo.camera,
    photo.lens,
    photo.focalLength,
    photo.aperture,
    photo.shutterSpeed,
    photo.iso ? `ISO ${photo.iso}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}
