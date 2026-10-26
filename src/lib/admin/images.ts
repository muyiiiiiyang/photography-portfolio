import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import exifr from "exifr";
import sharp from "sharp";

import { uniqueTags } from "@/lib/photos";
import type { Photo } from "@/lib/types";

const PHOTOS_ROOT = path.join(process.cwd(), "public", "photos");
const MAX_BYTES = 60 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/tiff",
  "image/heic",
  "image/heif",
]);
const ACCEPTED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
]);

type ExifBag = Record<string, unknown>;

export interface ProcessedUpload {
  photo: Photo;
  warnings: string[];
}

function asText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (Array.isArray(value) && value.length > 0) return asText(value[0]);
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = asNumber(item);
      if (parsed !== undefined) return parsed;
    }
  }
  return undefined;
}

function trimNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

/** EXIF 无时区，用 OffsetTimeOriginal 校准为真实 UTC。 */
function applyExifOffset(date: Date, offset?: string): Date {
  if (!offset) return date;
  const match = /^([+-])(\d{2}):?(\d{2})$/.exec(offset.trim());
  if (!match) return date;

  const sign = match[1] === "-" ? -1 : 1;
  const offsetMinutes = sign * (Number(match[2]) * 60 + Number(match[3]));
  const wallClockUtc = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );

  return new Date(wallClockUtc - offsetMinutes * 60_000);
}

function pickShotDate(exif: ExifBag | undefined): {
  date: Date | null;
  source?: Photo["dateTakenSource"];
} {
  for (const key of ["DateTimeOriginal", "CreateDate"] as const) {
    const value = exif?.[key];
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const offset =
        asText(exif?.OffsetTimeOriginal) ??
        asText(exif?.OffsetTime) ??
        asText(exif?.OffsetTimeDigitized);
      return { date: applyExifOffset(value, offset), source: "exif" };
    }
  }
  // 不伪造日期：没有 EXIF 拍摄时间时保持空白，等待后台手动补充。
  return { date: null };
}

function pickCamera(exif: ExifBag | undefined): {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
} {
  const make = asText(exif?.Make);
  const model = asText(exif?.Model);
  let camera = [make, model].filter(Boolean).join(" ").trim();

  if (make && model && model.toLowerCase().startsWith(make.toLowerCase())) {
    camera = model;
  }

  const focal = asNumber(exif?.FocalLength);
  const fNumber = asNumber(exif?.FNumber);
  const exposure = asNumber(exif?.ExposureTime);
  const isoRaw = asNumber(exif?.ISO ?? exif?.PhotographicSensitivity);
  const lens = asText(exif?.LensModel) ?? asText(exif?.Lens);

  let shutterSpeed: string | undefined;
  if (exposure !== undefined && exposure > 0) {
    shutterSpeed =
      exposure < 1 ? `1/${Math.round(1 / exposure)}s` : `${trimNumber(exposure)}s`;
  }

  return {
    camera: camera || undefined,
    lens,
    focalLength: focal !== undefined ? `${trimNumber(focal)}mm` : undefined,
    aperture: fNumber !== undefined ? `f/${trimNumber(fNumber)}` : undefined,
    shutterSpeed,
    iso: isoRaw !== undefined ? Math.round(isoRaw) : undefined,
  };
}

function dmsToDecimal(value: unknown, ref: unknown, negativeRef: string): number | undefined {
  const raw = asNumber(value);
  let decimal: number | undefined;

  if (Array.isArray(value) && value.length >= 3) {
    const degrees = Number(value[0]);
    const minutes = Number(value[1]);
    const seconds = Number(value[2]);
    if ([degrees, minutes, seconds].every(Number.isFinite)) {
      decimal = degrees + minutes / 60 + seconds / 3600;
    }
  } else if (raw !== undefined) {
    decimal = raw;
  }

  if (decimal === undefined) return undefined;
  const refText = asText(ref)?.toUpperCase() ?? "";
  return refText.startsWith(negativeRef) ? -Math.abs(decimal) : decimal;
}

function pickGps(exif: ExifBag | undefined): Photo["gps"] {
  if (!exif) return undefined;

  const latitude =
    asNumber(exif.latitude) ??
    dmsToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef, "S");
  const longitude =
    asNumber(exif.longitude) ??
    dmsToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef, "W");

  if (
    latitude === undefined ||
    longitude === undefined ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return undefined;
  }

  return {
    lat: Number(latitude.toFixed(6)),
    lng: Number(longitude.toFixed(6)),
  };
}

async function readExif(buffer: Buffer): Promise<ExifBag | undefined> {
  try {
    const data = await exifr.parse(buffer, {
      tiff: true,
      exif: true,
      gps: true,
      interop: false,
      translateValues: true,
      reviveValues: true,
      mergeOutput: true,
      sanitize: true,
    });
    return data && typeof data === "object" ? (data as ExifBag) : undefined;
  } catch {
    return undefined;
  }
}

function meaningFullTitle(fileName: string): string | undefined {
  const base = path
    .parse(fileName)
    .name.replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!base) return undefined;
  if (/^(img|dsc|dscf|dscn|pxl|gopr|dji|_dsc)[\s_-]?\d/i.test(base)) return undefined;
  if (/^[\d\s]+$/.test(base)) return undefined;
  if (base.length < 3) return undefined;
  return base;
}

export async function processUpload(
  file: File,
  options: {
    tags?: string[];
    readTitle?: boolean;
    dateTaken?: string;
  } = {},
): Promise<ProcessedUpload> {
  const extension = path.extname(file.name).toLowerCase();

  if (!ACCEPTED_TYPES.has(file.type) && !ACCEPTED_EXTENSIONS.has(extension)) {
    throw new Error(`不支持的图片格式：${file.type || extension || "unknown"}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error("单张图片超过 60MB，请先压缩后再上传。");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const exif = await readExif(buffer);

  let shotDate: { date: Date | null; source?: Photo["dateTakenSource"] };
  const customDate = options.dateTaken?.trim();
  if (customDate) {
    const parsed = new Date(customDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("自定义拍摄时间无效，请重新选择。");
    }
    shotDate = { date: parsed, source: "manual" };
  } else {
    shotDate = pickShotDate(exif);
  }

  const isoDate = shotDate.date ? shotDate.date.toISOString() : "";
  const gps = pickGps(exif);
  const meta = pickCamera(exif);

  const full = await sharp(buffer, { failOn: "none", limitInputPixels: 400_000_000 })
    .rotate()
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const thumb = await sharp(full.data)
    .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();

  const blur = await sharp(full.data)
    .resize({ width: 24 })
    .webp({ quality: 38 })
    .toBuffer();

  // 没有拍摄时间时，用当前时间生成不冲突的文件名，但 photo.dateTaken 仍保持空白。
  const fileDate = shotDate.date ?? new Date();
  const fileIso = fileDate.toISOString();
  const year = fileIso.slice(0, 4);
  const stamp = fileIso.replace(/[-:TZ.]/g, "").slice(0, 14);
  const token = randomUUID().replace(/-/g, "").slice(0, 6);
  const fileName = `${stamp}-${token}.webp`;
  const thumbName = `${stamp}-${token}-thumb.webp`;

  const targetDir = path.join(PHOTOS_ROOT, year);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, fileName), full.data);
  await fs.writeFile(path.join(targetDir, thumbName), thumb);

  const warnings: string[] = [];
  if (!shotDate.date) {
    warnings.push(
      `${file.name}：没有读取到拍摄时间，已保持空白，可在 Studio 中补充。`,
    );
  }
  if (!meta.camera) {
    warnings.push(`${file.name}：没有相机 EXIF 信息。`);
  }

  const photo: Photo = {
    id: `p_${randomUUID().replace(/-/g, "").slice(0, 10)}`,
    fileName,
    src: `/photos/${year}/${fileName}`,
    thumb: `/photos/${year}/${thumbName}`,
    width: full.info.width,
    height: full.info.height,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    title: options.readTitle ? meaningFullTitle(file.name) : undefined,
    tags: uniqueTags(options.tags ?? []),
    dateTaken: isoDate,
    dateTakenSource: shotDate.source,
    camera: meta.camera,
    lens: meta.lens,
    focalLength: meta.focalLength,
    aperture: meta.aperture,
    shutterSpeed: meta.shutterSpeed,
    iso: meta.iso,
    gps,
    addedAt: new Date().toISOString(),
  };

  return { photo, warnings };
}
