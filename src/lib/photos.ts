import type { Photo } from "./types";

/** 取 ISO 时间戳；缺失或非法一律视为最小值，保证永不用文件时间兜底排序。 */
export function isoTime(iso?: string | null): number {
  if (!iso) return Number.NEGATIVE_INFINITY;
  const value = Date.parse(iso);
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

/** 取拍摄时间戳。 */
export function takenAt(photo: Pick<Photo, "dateTaken">): number {
  return isoTime(photo.dateTaken);
}

/**
 * 按拍摄时间绝对降序，用于专题、首页时间轴与前台的时间排序视图。
 * 相册内部顺序由后台拖动决定，写入时不再强制重排。
 */
export function sortPhotosByTakenDateDesc<
  T extends Pick<Photo, "dateTaken" | "addedAt" | "id">,
>(photos: T[]): T[] {
  return [...photos].sort((a, b) => {
    const aTime = takenAt(a);
    const bTime = takenAt(b);
    if (aTime !== bTime) {
      if (!Number.isFinite(aTime)) return 1;
      if (!Number.isFinite(bTime)) return -1;
      return bTime - aTime;
    }

    const addedDiff = Date.parse(b.addedAt) - Date.parse(a.addedAt);
    if (Number.isFinite(addedDiff) && addedDiff !== 0) return addedDiff;

    return b.id.localeCompare(a.id);
  });
}

export function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = String(raw ?? "").trim();
    if (!tag) continue;
    const key = tag.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time);
}

export function toIsoUtc(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
