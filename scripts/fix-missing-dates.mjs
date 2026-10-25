/**
 * 补救缺少拍摄时间的照片（EXIF 缺失或旧数据）。
 *
 * 列出：node scripts/fix-missing-dates.mjs
 * 修改：node scripts/fix-missing-dates.mjs --id p_xxxx --date "2026-05-01 14:30"
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "src", "data", "portfolio-data.json");

function argOf(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function sortPhotos(photos) {
  return [...photos].sort((a, b) => {
    const diff = Date.parse(b.dateTaken) - Date.parse(a.dateTaken);
    return Number.isFinite(diff) && diff !== 0 ? diff : 0;
  });
}

const portfolio = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
const missing = [];

for (const album of portfolio.albums) {
  for (const photo of portfolio.albumPhotos[album.id] ?? []) {
    const time = Date.parse(photo.dateTaken);
    if (
      photo.dateTakenSource === "fallback" ||
      !Number.isFinite(time) ||
      new Date(time).getUTCFullYear() < 1971
    ) {
      missing.push({ album, photo });
    }
  }
}

const id = argOf("--id");
const date = argOf("--date");

if (!id || !date) {
  console.log(`发现 ${missing.length} 张缺少可靠拍摄时间的照片：\n`);
  for (const { album, photo } of missing) {
    console.log(
      `  ${photo.id}  ${album.title}  ${photo.fileName}  (${photo.dateTakenSource ?? "unknown"})`,
    );
  }
  console.log(
    '\n修改其中一张：\n  node scripts/fix-missing-dates.mjs --id <photo-id> --date "2026-05-01 14:30"',
  );
  process.exit(0);
}

let target = null;
for (const album of portfolio.albums) {
  const found = (portfolio.albumPhotos[album.id] ?? []).find(
    (photo) => photo.id === id,
  );
  if (found) {
    target = found;
    break;
  }
}

if (!target) {
  console.error(`✖ 没有找到照片：${id}`);
  process.exit(1);
}

const parsed = new Date(date.replace(" ", "T"));
if (Number.isNaN(parsed.getTime())) {
  console.error("✖ 无法识别日期，请使用 YYYY-MM-DD HH:mm 格式。");
  process.exit(1);
}

target.dateTaken = parsed.toISOString();
target.dateTakenSource = "manual";

for (const album of portfolio.albums) {
  if (!portfolio.albumPhotos[album.id]) continue;
  portfolio.albumPhotos[album.id] = sortPhotos(portfolio.albumPhotos[album.id]);
}

portfolio.updatedAt = new Date().toISOString();
await fs.writeFile(DATA_FILE, `${JSON.stringify(portfolio, null, 2)}\n`, "utf8");
console.log(`✓ 已更新 ${id} 的拍摄时间为 ${target.dateTaken}，并重新排序。`);
