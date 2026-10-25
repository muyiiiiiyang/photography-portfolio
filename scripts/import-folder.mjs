/**
 * 批量导入一个文件夹里的照片（走本地 /admin 上传管线，确保 WebP/EXIF 一致）。
 *
 * 前置：先运行 `pnpm dev`，并确认相册 slug 已存在。
 * 用法：
 *   node scripts/import-folder.mjs --dir "D:\\photos\\2026" --album night-tide
 *   node scripts/import-folder.mjs --dir ./inbox --album street --tags "街头,黑白" --password xxx
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

function argOf(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const dir = argOf("--dir");
const albumSlug = argOf("--album");
const base = argOf("--base", "http://127.0.0.1:3000").replace(/\/+$/, "");
const password = argOf("--password", process.env.ADMIN_PASSWORD ?? "admin123");
const tags = (argOf("--tags", "") ?? "")
  .split(",")
  .map((tag) => tag.trim())
  .filter(Boolean);

if (!dir || !albumSlug) {
  console.error(
    '用法：node scripts/import-folder.mjs --dir <文件夹> --album <相册 slug> [--tags "a,b"] [--password ***]',
  );
  process.exit(1);
}

const files = (await fs.readdir(dir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && MIME[path.extname(entry.name).toLowerCase()])
  .map((entry) => path.join(dir, entry.name));

if (files.length === 0) {
  console.error("✖ 文件夹里没有支持的图片。");
  process.exit(1);
}

const loginResponse = await fetch(`${base}/api/admin/login/`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password }),
});

if (!loginResponse.ok) {
  console.error("✖ 登录失败，请检查 ADMIN_PASSWORD 与 dev server。");
  process.exit(1);
}

const cookie = (loginResponse.headers.getSetCookie?.() ?? [])[0]?.split(";")[0];
if (!cookie) {
  console.error("✖ 没有拿到会话 Cookie。");
  process.exit(1);
}

const dataResponse = await fetch(`${base}/api/admin/data/`, {
  headers: { cookie },
});
const data = await dataResponse.json();
const album = data?.portfolio?.albums?.find((item) => item.slug === albumSlug);

if (!album) {
  console.error(
    `✖ 找不到 slug 为 ${albumSlug} 的相册。现有：${(data?.portfolio?.albums ?? [])
      .map((item) => item.slug)
      .join(", ")}`,
  );
  process.exit(1);
}

console.log(
  `→ 导入 ${files.length} 张照片到「${album.title}」${tags.length ? `，标签：${tags.join(" / ")}` : ""}`,
);

const imported = [];
for (const file of files) {
  const buffer = await fs.readFile(file);
  const form = new FormData();
  form.append(
    "files",
    new Blob([buffer], { type: MIME[path.extname(file).toLowerCase()] }),
    path.basename(file),
  );
  if (tags.length > 0) form.append("tags", tags.join(","));

  const response = await fetch(`${base}/api/admin/upload/`, {
    method: "POST",
    headers: { cookie },
    body: form,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(`  ✖ ${path.basename(file)}: ${payload.error ?? response.status}`);
    continue;
  }

  if (payload.errors?.length) {
    console.error(
      `  ✖ ${path.basename(file)}: ${payload.errors[0].message}`,
    );
    continue;
  }

  const photo = payload.photos?.[0];
  if (photo) {
    imported.push(photo);
    console.log(`  ✓ ${path.basename(file)} → ${photo.src}`);
  }
}

if (imported.length === 0) {
  console.error("✖ 没有成功导入任何照片。");
  process.exit(1);
}

data.portfolio.albumPhotos[album.id] = [
  ...(data.portfolio.albumPhotos[album.id] ?? []),
  ...imported,
];

const saveResponse = await fetch(`${base}/api/admin/data/`, {
  method: "PUT",
  headers: { cookie, "Content-Type": "application/json" },
  body: JSON.stringify({ portfolio: data.portfolio }),
});

if (!saveResponse.ok) {
  const payload = await saveResponse.json().catch(() => ({}));
  console.error(`✖ 保存失败：${payload.error ?? saveResponse.status}`);
  process.exit(1);
}

console.log(
  `✓ 完成：${imported.length} 张照片已写入 ${album.title}，排序与清理已由保存接口处理。`,
);
