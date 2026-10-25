/**
 * 清空演示内容：删除 JSON 中引用到的图片文件，并写入空作品集。
 * 用法：node scripts/reset-demo.mjs --yes
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "src", "data", "portfolio-data.json");
const PHOTOS_ROOT = path.join(ROOT, "public", "photos");
const CONFIRMED = process.argv.includes("--yes");

if (!CONFIRMED) {
  console.error(
    "✖ 这会清空作品集数据并删除被引用的图片。确认后运行：\n  node scripts/reset-demo.mjs --yes",
  );
  process.exit(1);
}

const portfolio = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
const files = new Set();
let count = 0;

for (const photos of Object.values(portfolio.albumPhotos ?? {})) {
  for (const photo of photos) {
    count += 1;
    for (const candidate of [photo.src, photo.thumb]) {
      if (typeof candidate === "string" && candidate.startsWith("/photos/")) {
        files.add(candidate);
      }
    }
  }
}

const empty = {
  albums: [],
  albumPhotos: {},
  folders: [],
  folderPhotos: {},
  updatedAt: new Date().toISOString(),
};

await fs.writeFile(DATA_FILE, `${JSON.stringify(empty, null, 2)}\n`, "utf8");

let removed = 0;
for (const relative of files) {
  const absolute = path.resolve(ROOT, "public", relative.replace(/^\//, ""));
  if (!absolute.startsWith(`${path.resolve(PHOTOS_ROOT)}${path.sep}`)) continue;
  try {
    await fs.unlink(absolute);
    removed += 1;
  } catch {
    // 文件可能已经不存在
  }
}

// 清掉空目录，保留 .gitkeep
for (const entry of await fs.readdir(PHOTOS_ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = path.join(PHOTOS_ROOT, entry.name);
  const remaining = await fs.readdir(dir);
  if (remaining.length === 0) await fs.rmdir(dir);
}

console.log(
  `✓ 已清空 ${count} 张作品的记录，删除 ${removed} 个图片文件。\n  现在可以在 /admin 里上传自己的作品。`,
);
