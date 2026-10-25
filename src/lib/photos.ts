import type { Photo } from "./types";

/** 取 ISO 时间戳；缺失或非法一律视为最小值，保证永不用文件时间兜底排序。 */
export function isoTime(iso?: string | null): number {
  if (!iso) return Number.NEGATIVE_INFINITY;
  const value = Date.parse(iso);
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

/** 取拍摄时间戳。 */
export function takenAt(photo: Photo): number {
  return isoTime(photo.dateTaken);
}

/**
 * 拍摄时间绝对降序。所有展示入口都必须经过这里：
 * 1) 写入 JSON 前重排；2) 读取 API 时重排；3) 管理后台保存前二次重排。
 */
export function sortPhotosByTakenDateDesc(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => {
    const diff = takenAt(b) - takenAt(a);
    if (diff !== 0) return diff;

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
