import { promises as fs } from "node:fs";
import path from "node:path";

import { DEFAULT_SITE_CONFIG, EMPTY_PORTFOLIO } from "@/lib/defaults";
import type { PortfolioData, SiteConfig } from "@/lib/types";

import { getGitStatus } from "./git";
import { sanitizePortfolio, sanitizeSiteConfig } from "./sanitize";
import type { AdminSnapshot } from "./types";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const PORTFOLIO_FILE = path.join(DATA_DIR, "portfolio-data.json");
const CONFIG_FILE = path.join(DATA_DIR, "site-config.json");
const PHOTOS_ROOT = path.join(ROOT, "public", "photos");

let writeQueue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(task, task);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function readJson(file: string): Promise<unknown | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error(`数据文件解析失败：${path.relative(ROOT, file)}`);
  }
}

async function writeJsonAtomic(file: string, value: unknown): Promise<void> {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  const temp = `${file}.${process.pid}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(temp, content, "utf8");
  try {
    await fs.rename(temp, file);
  } catch {
    await fs.writeFile(file, content, "utf8");
    await fs.unlink(temp).catch(() => undefined);
  }
}

export async function readPortfolioFile(): Promise<PortfolioData> {
  const raw = await readJson(PORTFOLIO_FILE);
  if (raw === null) return EMPTY_PORTFOLIO;
  return sanitizePortfolio(raw);
}

export async function readSiteConfigFile(): Promise<SiteConfig> {
  const raw = await readJson(CONFIG_FILE);
  return sanitizeSiteConfig(raw, DEFAULT_SITE_CONFIG);
}

async function listFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function referencedFiles(data: PortfolioData): Set<string> {
  const references = new Set<string>();
  for (const photos of Object.values(data.albumPhotos)) {
    for (const photo of photos) {
      for (const candidate of [photo.src, photo.thumb]) {
        if (!candidate) continue;
        references.add(path.resolve(ROOT, "public", candidate.replace(/^\//, "")));
      }
    }
  }
  return references;
}

/**
 * 保存后清理未被任何相册引用的图片。
 * 10 分钟内的新文件跳过，避免误删刚刚上传、还没保存的图片。
 */
async function pruneOrphanImages(data: PortfolioData): Promise<void> {
  const references = referencedFiles(data);
  const root = path.resolve(PHOTOS_ROOT);
  const files = await listFiles(PHOTOS_ROOT);
  const cutoff = Date.now() - 10 * 60 * 1000;

  for (const file of files) {
    if (!file.toLowerCase().endsWith(".webp")) continue;
    const resolved = path.resolve(file);
    if (!resolved.startsWith(`${root}${path.sep}`)) continue;
    if (references.has(resolved)) continue;

    try {
      const stat = await fs.stat(resolved);
      if (stat.mtimeMs > cutoff) continue;
      await fs.unlink(resolved);
    } catch {
      // 清理失败不阻断保存，下一次保存时会重试。
    }
  }
}

export async function savePortfolio(raw: unknown): Promise<PortfolioData> {
  return serialize(async () => {
    const next = sanitizePortfolio(raw);
    next.updatedAt = new Date().toISOString();
    await writeJsonAtomic(PORTFOLIO_FILE, next);
    await pruneOrphanImages(next);
    return next;
  });
}

export async function saveSiteConfig(raw: unknown): Promise<SiteConfig> {
  return serialize(async () => {
    const next = sanitizeSiteConfig(raw, DEFAULT_SITE_CONFIG);
    await writeJsonAtomic(CONFIG_FILE, next);
    return next;
  });
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  const [portfolio, config, git] = await Promise.all([
    readPortfolioFile(),
    readSiteConfigFile(),
    getGitStatus(),
  ]);

  return { portfolio, config, git };
}
