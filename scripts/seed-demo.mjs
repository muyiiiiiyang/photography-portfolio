/**
 * 生成一组可替换的示范作品（Unsplash 图片 ≈ 免费演示素材），
 * 用于首次打开站点时就能看到完整版式。
 *
 * 用法：pnpm seed:demo [--force]
 * 注意：会写入 src/data/portfolio-data.json 并覆盖同名演示数据。
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const PHOTOS_DIR = path.join(ROOT, "public", "photos");
const DATA_FILE = path.join(ROOT, "src", "data", "portfolio-data.json");
const FORCE = process.argv.includes("--force");

const ALBUMS = [
  {
    id: "album-concrete",
    slug: "concrete-geometry",
    title: "几何城市",
    subtitle: "CONCRETE GEOMETRY",
    description:
      "在混凝土、玻璃与阴影之间寻找秩序的切片。建筑从不解释自己，它只是把光切成不同的形状。",
    location: { name: "上海", lat: 31.2304, lng: 121.4737 },
    createdAt: "2026-06-08T08:30:00.000Z",
    camera: "Leica M11",
    lens: "Summilux-M 35mm f/1.4 ASPH",
    focalLength: "35mm",
    photos: [
      {
        key: "concrete-01",
        unsplash: "photo-1511818966892-d7d671e672a2",
        title: "垂直的秩序",
        caption: "Vertical Order",
        date: "2026-09-14T09:12:00.000Z",
        tags: ["建筑", "几何", "光影"],
        aperture: "f/5.6",
        shutter: "1/500s",
        iso: 64,
      },
      {
        key: "concrete-02",
        unsplash: "photo-1487958449943-2429e8be8625",
        title: "白墙与阴影",
        caption: "White Wall, Long Shadow",
        date: "2026-08-02T15:40:00.000Z",
        tags: ["建筑", "极简", "光影"],
        aperture: "f/8",
        shutter: "1/320s",
        iso: 100,
      },
      {
        key: "concrete-03",
        unsplash: "photo-1449824913935-59a10b8d2000",
        title: "转角的光",
        caption: "Light Around the Corner",
        date: "2026-07-21T11:05:00.000Z",
        tags: ["城市", "街头", "光影"],
        aperture: "f/4",
        shutter: "1/250s",
        iso: 200,
      },
      {
        key: "concrete-04",
        unsplash: "photo-1494526585095-c41746248156",
        title: "无人的长廊",
        caption: "Empty Corridor",
        date: "2026-06-08T08:30:00.000Z",
        tags: ["建筑", "室内", "极简"],
        aperture: "f/2.8",
        shutter: "1/125s",
        iso: 400,
      },
    ],
  },
  {
    id: "album-silent",
    slug: "silent-landscape",
    title: "静默风景",
    subtitle: "SILENT LANDSCAPE",
    description:
      "把镜头交给雾、湖面与清晨。风景不急着被讲述，它只需要被安静地看完。",
    location: { name: "云南", lat: 25.6065, lng: 100.2676 },
    createdAt: "2025-04-12T07:05:00.000Z",
    camera: "Hasselblad 500CM",
    lens: "Planar 80mm f/2.8",
    focalLength: "80mm",
    photos: [
      {
        key: "silent-01",
        unsplash: "photo-1470071459604-3b5ec3a7fe05",
        title: "雾中山脊",
        caption: "Ridge in Fog",
        date: "2025-11-03T06:20:00.000Z",
        tags: ["风景", "雾", "自然"],
        aperture: "f/8",
        shutter: "1/125s",
        iso: 100,
      },
      {
        key: "silent-02",
        unsplash: "photo-1493246507139-91e8fad9978e",
        title: "湖面之下",
        caption: "Below the Lake",
        date: "2025-09-18T10:15:00.000Z",
        tags: ["风景", "水", "倒影"],
        aperture: "f/11",
        shutter: "1/60s",
        iso: 100,
      },
      {
        key: "silent-03",
        unsplash: "photo-1501785888041-af3ef285b470",
        title: "晨光抵达之前",
        caption: "Before the Light",
        date: "2025-05-26T05:48:00.000Z",
        tags: ["风景", "晨光", "山"],
        aperture: "f/8",
        shutter: "1/250s",
        iso: 200,
      },
      {
        key: "silent-04",
        unsplash: "photo-1470252649378-9c29740c9fa8",
        title: "草地的尽头",
        caption: "Edge of the Field",
        date: "2025-04-12T07:05:00.000Z",
        tags: ["风景", "日落", "自然"],
        aperture: "f/5.6",
        shutter: "1/500s",
        iso: 100,
      },
    ],
  },
  {
    id: "album-night",
    slug: "night-tide",
    title: "夜与海",
    subtitle: "NIGHT TIDE",
    description:
      "城市入睡之后，海还在呼吸。用长曝光把潮汐、霓虹与最后一班车收进同一片蓝。",
    location: { name: "青岛", lat: 36.0671, lng: 120.3826 },
    createdAt: "2024-03-04T09:55:00.000Z",
    camera: "Sony A7R V",
    lens: "FE 24-70mm f/2.8 GM II",
    focalLength: "50mm",
    photos: [
      {
        key: "night-01",
        unsplash: "photo-1519501025264-65ba15a82390",
        title: "城市入睡之后",
        caption: "After the City Sleeps",
        date: "2024-10-27T14:22:00.000Z",
        tags: ["夜景", "城市", "蓝调"],
        aperture: "f/2.8",
        shutter: "1/30s",
        iso: 1600,
      },
      {
        key: "night-02",
        unsplash: "photo-1505765050516-f72dcac9c60e",
        title: "潮汐线",
        caption: "Tide Line",
        date: "2024-08-09T13:10:00.000Z",
        tags: ["海", "长曝光", "黑白"],
        aperture: "f/16",
        shutter: "30s",
        iso: 100,
      },
      {
        key: "night-03",
        unsplash: "photo-1518837695005-2083093ee35b",
        title: "长曝光的海",
        caption: "Sea, Long Exposure",
        date: "2024-06-15T12:40:00.000Z",
        tags: ["海", "长曝光", "极简"],
        aperture: "f/11",
        shutter: "8s",
        iso: 64,
      },
      {
        key: "night-04",
        unsplash: "photo-1500530855697-b586d89ba3ee",
        title: "最后一道蓝",
        caption: "The Last Blue",
        date: "2024-03-04T09:55:00.000Z",
        tags: ["夜", "蓝调", "公路"],
        aperture: "f/4",
        shutter: "1/160s",
        iso: 800,
      },
    ],
  },
];

const FOLDERS = [
  {
    id: "folder-selected",
    slug: "selected-2026",
    title: "精选",
    subtitle: "SELECTED 2026",
    description: "从三个长期项目里挑出的十张照片，一条关于秩序的线索。",
    createdAt: "2026-10-01T00:00:00.000Z",
    photoKeys: [
      "concrete-01",
      "silent-01",
      "night-01",
      "concrete-02",
      "silent-02",
    ],
  },
  {
    id: "folder-form",
    slug: "form-study",
    title: "构成研究",
    subtitle: "FORM STUDY",
    description: "圆、方、线与阴影的练习。包豪斯的观看方式，被翻译成镜头语言。",
    createdAt: "2026-08-01T00:00:00.000Z",
    photoKeys: ["concrete-03", "concrete-04", "night-02", "night-03"],
  },
];

const PALETTES = [
  ["#df3b2f", "#f2c230", "#1f4e8c", "#141210"],
  ["#f2c230", "#1f4e8c", "#df3b2f", "#141210"],
  ["#1f4e8c", "#df3b2f", "#f2c230", "#141210"],
];

function fallbackSvg(key, index) {
  const [a, b, c, ink] = PALETTES[index % PALETTES.length];
  const rotation = index % 2 === 0 ? 0 : 90;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">
      <rect width="1600" height="1200" fill="#f2ede2"/>
      <g transform="rotate(${rotation} 800 600)">
        <circle cx="1050" cy="420" r="300" fill="${a}"/>
        <rect x="220" y="520" width="420" height="420" fill="${b}"/>
        <path d="M980 1140 L1320 520 L1480 1140 Z" fill="${c}"/>
        <rect x="120" y="180" width="380" height="18" fill="${ink}"/>
        <rect x="120" y="220" width="240" height="18" fill="${ink}"/>
      </g>
    </svg>`,
  );
}

async function downloadPhoto(unsplashId) {
  const url = `https://images.unsplash.com/${unsplashId}?w=1800&q=82&fm=jpg&fit=max`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: { "User-Agent": "bok-hamm-portfolio-seed/1.0" },
  });
  if (!response.ok) {
    throw new Error(`下载失败 ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function renderVariants(buffer) {
  const full = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const thumb = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();

  const blur = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 24 })
    .webp({ quality: 35 })
    .toBuffer();

  return {
    full: full.data,
    width: full.info.width,
    height: full.info.height,
    thumb,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

async function main() {
  const emptyState = { albums: [], albumPhotos: {}, folders: [], folderPhotos: {} };

  try {
    const existing = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
    const count = Object.values(existing.albumPhotos ?? {}).reduce(
      (total, list) => total + (Array.isArray(list) ? list.length : 0),
      0,
    );
    if (count > 0 && !FORCE) {
      console.error(
        `✖ 已存在 ${count} 张作品。演示数据不会覆盖真实内容。\n  如确认要重建演示数据，请运行：pnpm seed:demo --force`,
      );
      process.exit(1);
    }
  } catch {
    // 没有旧数据时直接继续
  }

  await fs.mkdir(PHOTOS_DIR, { recursive: true });

  const portfolio = {
    ...emptyState,
    albums: [],
    albumPhotos: {},
    folders: [],
    folderPhotos: {},
    updatedAt: new Date().toISOString(),
  };

  const keyToPhotoId = new Map();
  let sequence = 0;

  for (const album of ALBUMS) {
    const photos = [];

    for (const photo of album.photos) {
      sequence += 1;
      const year = new Date(photo.date).getUTCFullYear().toString();
      const folder = path.join(PHOTOS_DIR, year);
      await fs.mkdir(folder, { recursive: true });

      let source;
      try {
        process.stdout.write(`↓ ${photo.key}  ${photo.unsplash} … `);
        source = await downloadPhoto(photo.unsplash);
        process.stdout.write("ok\n");
      } catch (error) {
        process.stdout.write(`fallback (${error.message})\n`);
        source = fallbackSvg(photo.key, sequence);
      }

      const variants = await renderVariants(source);
      const fileName = `${photo.key}.webp`;
      const thumbName = `${photo.key}-thumb.webp`;

      await fs.writeFile(path.join(folder, fileName), variants.full);
      await fs.writeFile(path.join(folder, thumbName), variants.thumb);

      const id = `p_${photo.key.replace(/[^a-z0-9]+/gi, "_")}`;

      photos.push({
        id,
        fileName,
        src: `/photos/${year}/${fileName}`,
        thumb: `/photos/${year}/${thumbName}`,
        width: variants.width,
        height: variants.height,
        blurDataURL: variants.blurDataURL,
        title: photo.title,
        caption: photo.caption,
        tags: photo.tags,
        dateTaken: photo.date,
        dateTakenSource: "manual",
        camera: album.camera,
        lens: album.lens,
        focalLength: album.focalLength,
        aperture: photo.aperture,
        shutterSpeed: photo.shutter,
        iso: photo.iso,
        addedAt: "2026-10-01T00:00:00.000Z",
      });

      keyToPhotoId.set(photo.key, id);
      console.log(
        `  ↳ public/photos/${year}/${fileName} (${variants.width}×${variants.height})`,
      );
    }

    photos.sort((a, b) => Date.parse(b.dateTaken) - Date.parse(a.dateTaken));

    portfolio.albums.push({
      id: album.id,
      slug: album.slug,
      title: album.title,
      subtitle: album.subtitle,
      description: album.description,
      location: album.location,
      coverPhotoId: photos[0]?.id,
      createdAt: album.createdAt,
    });
    portfolio.albumPhotos[album.id] = photos;
  }

  for (const folder of FOLDERS) {
    const ids = folder.photoKeys
      .map((key) => keyToPhotoId.get(key))
      .filter(Boolean);

    portfolio.folders.push({
      id: folder.id,
      slug: folder.slug,
      title: folder.title,
      subtitle: folder.subtitle,
      description: folder.description,
      coverPhotoId: ids[0],
      createdAt: folder.createdAt,
    });
    portfolio.folderPhotos[folder.id] = ids;
  }

  await fs.writeFile(DATA_FILE, `${JSON.stringify(portfolio, null, 2)}\n`, "utf8");

  const total = Object.values(portfolio.albumPhotos).reduce(
    (sum, list) => sum + list.length,
    0,
  );
  console.log(
    `\n✓ 演示数据完成：${total} 张作品 / ${portfolio.albums.length} 个相册 / ${portfolio.folders.length} 个专题`,
  );
  console.log(`  ${path.relative(ROOT, DATA_FILE)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
