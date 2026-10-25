# AGENTS.md — Bok_Hamm Photography 运维手册

> 面向 AI Agent 与人类协作者的单一事实文档。改代码、改数据、部署之前先读第 2 节的四条铁律。
> 技术栈：Next.js 16（App Router）· React 19 · TypeScript strict · Tailwind CSS 4 · sharp · exifr · pnpm 11。

---

## 0. 一分钟速查

```bash
pnpm dev                 # 本地站点 + /admin，默认 3000
pnpm check               # next typegen + tsc --noEmit
pnpm lint                # eslint
pnpm build               # 服务端模式构建（保留 /admin）
pnpm build:static        # 模拟 CI：物理移出 admin/api → 静态导出 → 还原
pwsh -File scripts/enable-pages.ps1   # 首次开启 GitHub Pages
```

- 工作台：`http://localhost:3000/admin`（密码来自 `.env.local` 的 `ADMIN_PASSWORD`）
- 单一真相源：`src/data/portfolio-data.json`、`src/data/site-config.json`
- 生产部署：GitHub Actions 物理删除后台目录后 `output: "export"`，产物在 `out/`

---

## 1. 双模架构（物理隔离）

| | 本地 `pnpm dev` | 公网 GitHub Pages |
| --- | --- | --- |
| 模式 | Node 服务端 | 纯静态 SSG |
| `/admin` | 可视化工作台 | **不存在**（404） |
| `/api/admin/*` | 可读写 JSON、上传图片、执行 git | **不存在** |
| 写入能力 | 有 | 无 |
| 密码 | 服务端环境变量 | 无 |

实现方式：

1. `next.config.mjs`：仅当 `NEXT_PUBLIC_STATIC_EXPORT=true` 时启用 `output: "export"`、`images.unoptimized`。
2. `.github/workflows/nextjs.yaml` 在构建前执行：
   ```bash
   rm -rf src/app/admin src/app/api src/lib/admin
   ```
   并注入 `NEXT_PUBLIC_BASE_PATH=${{ steps.pages.outputs.base_path }}`。
3. 所有后台组件都放在 `src/app/admin/**` 内（包括 `_components`），确保随目录一起被删除；不要在 `src/components/` 下新增后台专用组件。
4. 前台 `SiteHeader` 只在 `NODE_ENV === "development"` 时渲染 Studio 入口。

> 不要试图用“隐藏路由/前端鉴权”代替物理剥离。公网产物里不能出现 admin 的任何 JS 或 HTML。

---

## 2. 四条铁律（不可破坏）

### 2.1 拍摄时间是真实元数据，相册顺序由手动拖动决定

- 排序字段：`photo.dateTaken`，完整 ISO-8601 UTC 字符串（如 `2026-09-14T09:12:00.000Z`）。
- 取值优先级：EXIF `DateTimeOriginal` → `CreateDate` → （缺失时）导入时间兜底，并标记 `dateTakenSource: "fallback"`。
- **严禁**使用文件 `mtime`、`ctime` 或上传时间参与正常排序；`dateTaken` 仍必须准确。
- **相册内顺序**：`albumPhotos[albumId]` 的数组顺序就是前台顺序，由 Studio「照片」或「相册」面板拖动决定。写入、读取和保存都不得自动按日期重排。
- **时间排序视图**：`sortPhotosByTakenDateDesc()` 仍用于专题、首页时间轴，以及相册页的手动/倒序/正序切换；不要删除该函数。
- 校验（PowerShell）：只检查时间字段合法/缺时兜底；不要再断言相册数组按日期降序。

```powershell
node -e "const d=require('./src/data/portfolio-data.json');for(const [id,ps] of Object.entries(d.albumPhotos)){console.log(id, ps.length, ps.every(p=>p.dateTaken))}"
```

### 2.2 原始大图不进库

- 上传入口：`src/lib/admin/images.ts` → `processUpload()`。
- 参数固定：单边 ≤ 2048px、`webp({ quality: 88, effort: 4 })`；缩略图 1000px q80；24px 模糊占位。
- 输出：`public/photos/<YYYY>/<timestamp>-<token>.webp` 与 `-thumb.webp`。
- JSON 只存 `/photos/...` 路径与宽高，不存 base64 大图（`blurDataURL` 除外，且限制长度）。
- 删除照片时只从 JSON 移除；保存时 `pruneOrphanImages()` 清理 10 分钟前的未引用 WebP。
- 不要把相机原图、`.dng`、`.heic` 原片提交到仓库。

### 2.3 二级路径绝对兼容

- 数据永远存无前缀路径：`/photos/2026/x.webp`。
- 渲染时使用 `src/lib/site.ts` → `withBasePath()` 补 `NEXT_PUBLIC_BASE_PATH`（只对 `<img src>` 等静态资源）。
- 站内跳转一律用 `next/link`，Next 会自动处理 basePath；**不要**手写 `<a href="/works">`。
- 禁止把带 `/repo-name` 的路径写回 JSON，否则换仓库名会全部 404。
- 本地验证：
  ```powershell
  $env:NEXT_PUBLIC_BASE_PATH="/your-repo"; pnpm build:static
  ```
  检查 `out/**/index.html` 中资源以 `/your-repo/_next/` 开头、图片以 `/your-repo/photos/` 开头。

### 2.4 公网零后台

- 构建产物的判定标准：`out/admin`、`out/api` 均不存在，HTML 中不出现 `/admin`。
- CI 中已有 `Verify no admin artifacts` 步骤；本地用 `pnpm build:static` 后手动确认。
- 新增后台能力时，必须同时更新 CI 的 strip 列表（例如新增 `src/middleware.ts` / `src/proxy.ts`）。
- 任何 API 路由都必须放在 `src/app/api/admin/**` 并调用 `guardAdmin()`。

---

## 3. 数据契约

### 3.1 `src/data/portfolio-data.json`

```jsonc
{
  "albums": [
    {
      "id": "album-concrete",
      "slug": "concrete-geometry",
      "title": "几何城市",
      "subtitle": "CONCRETE GEOMETRY",
      "description": "…",
      "location": { "name": "上海", "lat": 31.2304, "lng": 121.4737 },
      "coverPhotoId": "p_concrete_01",
      "createdAt": "2026-06-08T08:30:00.000Z"
    }
  ],
  "albumPhotos": {
    "album-concrete": [
      {
        "id": "p_concrete_01",
        "fileName": "concrete-01.webp",
        "src": "/photos/2026/concrete-01.webp",
        "thumb": "/photos/2026/concrete-01-thumb.webp",
        "width": 1800,
        "height": 1200,
        "blurDataURL": "data:image/webp;base64,…",
        "title": "垂直的秩序",
        "caption": "Vertical Order",
        "tags": ["建筑", "几何", "光影"],
        "dateTaken": "2026-09-14T09:12:00.000Z",
        "dateTakenSource": "exif",
        "camera": "Leica M11",
        "lens": "Summilux-M 35mm f/1.4 ASPH",
        "focalLength": "35mm",
        "aperture": "f/5.6",
        "shutterSpeed": "1/500s",
        "iso": 64,
        "gps": { "lat": 31.2304, "lng": 121.4737 },
        "addedAt": "2026-10-01T00:00:00.000Z"
      }
    ]
  },
  "folders": [{ "id": "folder-portrait", "slug": "portrait", "title": "人像", "parentId": null, "createdAt": "…" }],
  "folderPhotos": { "folder-portrait": ["p_concrete_01", "p_silent_01"] },
  "updatedAt": "…"
}
```

关键约定：

- `albumPhotos[albumId]` 的数组顺序就是该相册的前台顺序；工作台拖动后由保存接口原样保留，不要按日期重排。
- `folders` 使用 `parentId` 表示上级专题，`null` / 缺失为顶级专题；子专题可继续嵌套。
- `folderPhotos` 只存照片 **id**，照片本体唯一存放在 `albumPhotos`；不要复制整份照片对象。
- `id` 一经生成不再修改（专题引用依赖它）；`slug` 是前台 URL，发布后避免修改。
- `coverPhotoId` 缺失时自动取该组最新一张；删除封面会自动回退。
- `slug` 由后台/服务端清洗为小写字母、数字、中文和连字符，并自动去重。

### 3.2 `src/data/site-config.json`

`photographer`、`title`、`tagline`、`portrait`、`navAlbumIds`、`bio`、`statement`、`location`、`email`、`socials[]`、`equipment[]`、`copyright`、`pageCopy`、`contact`。
前台文案优先读这里，不要在页面里重复硬编码。`portrait` 由 Studio 上传，存 `/portrait/...` 路径。`navAlbumIds` 最多四个，控制顶部「作品集」下拉展示哪四组；未选择时回退前四个相册。`pageCopy` 控制关于页大标题、作品集/专题页引导语；`contact` 控制联系页全部可见文案（邮箱/所在地/社交仍来自顶层字段）。

---

## 4. CRUD 与导入规范

### 4.1 常规流程（推荐）

1. 打开 `/admin` → **相册** → 新建/选择相册，填写标题、slug、地点（地图点击拾取坐标）。
2. **照片** → 拖拽上传。也可在「相册」页点击「上传照片 ↑」，会直接切到「照片」并自动选中当前相册。服务端会：
   - 校验格式与大小（≤60MB，单次 ≤24 张）
   - sharp 旋转/缩放/转 WebP、生成缩略图与 blur
   - exifr 解析拍摄时间、器材与 GPS 经纬度；有 GPS 的照片会自动写入 `photo.gps`，后台缩略图显示 `GPS` 徽标，编辑面板可跳转地图。
3. 勾选照片批量加/减标签、删除、编辑标题与拍摄时间。切到「全部照片」可跨相册选中照片：移动到作品集，或加入任意专题/子专题。
4. **工作台分区**：相册（含顶部导航作品集、作品集页引导语）、照片、专题（含专题页引导语）、关于作者、联系方式、版本快照。
5. **关于作者**：品牌名、标语、个人照片、关于页大标题、合并后的个人简介/创作宣言、器材清单。
6. **联系方式**：邮箱、所在地、社交链接、联系页文案。
7. **保存至磁盘**（`Ctrl/⌘ + S`）→ 写 JSON + 清理未引用图片。
8. **版本快照** → 填写语义化 Commit Message → 提交。

### 4.2 批量导入

```bash
# 先启动 pnpm dev，并确保相册 slug 已存在
node scripts/import-folder.mjs --dir "D:\photos\inbox" --album street-night --tags "夜,长曝光"
```

该脚本走真实 `/api/admin/upload` 管线，复用同一套压缩/EXIF/保存逻辑，最后调用保存接口完成校验与清理（保留相册手动顺序）。
需要临时改导入逻辑时，直接修改 `scripts/import-folder.mjs`，不要复制一份新的 sharp 参数。

### 4.3 API 契约（仅本地）

| Method | Path | 说明 |
| --- | --- | --- |
| POST | `/api/admin/login/` | `{ password }`，成功后写 HttpOnly Cookie |
| POST | `/api/admin/logout/` | 清除会话 |
| GET | `/api/admin/data/` | 返回 `{ portfolio, config, git }` |
| PUT | `/api/admin/data/` | `{ portfolio?, config? }`，保存并返回最新快照 |
| POST | `/api/admin/upload/` | multipart：`files[]` + 可选 `tags`，只写图片文件、不改 JSON |
| POST | `/api/admin/portrait/` | multipart：`file`，压制成 `public/portrait/*.webp`，供关于页个人照片使用 |
| GET | `/api/admin/git/` | 工作区状态 |
| POST | `/api/admin/git/` | `{ message }`，`git add -A && git commit` |

所有接口（除 login）必须先 `await guardAdmin()`；返回 401 时前端应跳转登录。

### 4.4 删除级联规则

- 删除照片：从 `albumPhotos[albumId]` 移除；同步从所有 `folderPhotos[*]` 移除该 id；若它是封面则回退到剩余最新一张；保存后清理 WebP 文件。
- 删除相册：移除相册记录与整个 `albumPhotos[albumId]`；保存后清理文件。
- 删除专题：同时删除其所有子专题与 `folderPhotos` 引用，照片本身保留。
- 任何批量删除前必须二次确认；保存前都只是草稿。

### 4.5 排序与校验

- 保存接口会重新执行 `sanitizePortfolio()`：字段类型清洗、slug 去重、文件夹引用过滤、**保留 `albumPhotos` 数组的手动顺序**、`updatedAt` 刷新。
- 服务端会丢弃 `src` 不以 `/photos/` 开头的照片记录，防止手写 JSON 注入外链或路径穿越。
- 相册 slug 冲突会自动追加 `-2`、`-3`；不要依赖旧 slug 的链接。

---

## 5. 视觉与前端规范

### 5.1 设计令牌

`src/app/globals.css` 的 `@theme`：

| Token | Value | 用途 |
| --- | --- | --- |
| `paper` | `#ffffff` | 纯白底色 |
| `paper-2` | `#f2f2f0` | 图片占位/次级面板 |
| `ink` | `#141210` | 文字、硬边框 |
| `red` | `#df3b2f` | 主强调、下划线、删除 |
| `yellow` | `#f2c230` | 几何色块、高亮 |
| `blue` | `#1f4e8c` | 次级强调、链接箭头 |

- 字体：拉丁展示字 `Bahnschrift` / DIN 回退；中文 `PingFang SC` / `Microsoft YaHei`。不要引入需要构建时联网下载的字体。
- 版式：直角、1px 硬边框、5px 偏移硬阴影（`shadow-[5px_5px_0_0_var(--color-ink)]`）、大量留白。
- 动效：统一 `cubic-bezier(0.65, 0, 0.35, 1)` 或 `(0.22, 0.61, 0.36, 1)`；必须支持 `prefers-reduced-motion`。
- 不要加入圆角卡片、玻璃拟态、渐变英雄区等与包豪斯冲突的元素。
- 唯一例外：作品灯箱使用「白色毛玻璃」效果（半透明白 + `backdrop-blur`），这是明确的产品要求；其余页面保持实色直角。

### 5.2 页面与组件

- 首页：`src/app/page.tsx`，纯白左右分栏；左侧标题与分类导航，右侧 `RandomWall` 每 5 秒自动换一组；下方 `AllFrames` 随机展示全部照片，点开可查看并进入作品集/专题。
- 关于页：`config.portrait` 优先显示个人照片；未上传时退回第一张相册封面，再退回几何占位。大标题读取 `config.pageCopy.aboutHeadingLead / aboutHeadingAccent`（两行都为空时整块标题不显示，标题区垂直居中），编辑入口在 Studio「关于作者」。个人简介与创作宣言已合并为同一个文本字段，空行分段、段内换行保留。导航只保留「关于作者」直达链接。
- 作品集/专题索引引导语：分别读取 `config.pageCopy.worksIntro / foldersIntro`，编辑入口分别在 Studio「相册」顶部与「专题」顶部。
- 联系页：可见文案读取 `config.contact`（标题、介绍、Elsewhere/Based in/Availability/Services 标签与说明、Services 列表、底部 CTA），编辑入口在 Studio「联系方式」；邮箱/所在地/社交也在此面板。介绍文字支持回车换行。
- 品牌名：前台左上角、首页大字、页脚、浏览器标题与 Studio 标题均读取 `config.photographer`，不要再硬编码 `Bok_Hamm`。
- 导航：`SiteHeader`（服务端，读取 albums / folders / `config.navAlbumIds`）→ `SiteNav`（客户端 hover 子目录面板）。「作品集」为四组可配置相册 + 更多作品集；「专题」列出顶级专题，子专题在专题页内浏览。
- 专题页：`/folders` 展示顶级专题与子专题列表；`/folders/[slug]` 同时支持父/子专题，顶部展示子专题入口。
- 前台布局：`src/app/(site)/layout.tsx`（页头/页脚），路由组不影响 URL。
- 作品墙：`PhotoGallery`（客户端灯箱，Portal 到 `body`，白色毛玻璃遮罩 + 从点击缩略图位置开始的共享缩放开关动画，简介与说明居中显示）；打开时保留原生滚动条、用 `wheel` / `touchmove` / 键盘事件阻止背景滚动，避免滚动条消失造成的页面抖动；先用缩略图撑开灯箱再后台替换大图。相册卡片：`CollectionCard`（作品集封面使用 3:2 比例，无彩色偏移描边）；筛选：`WorksExplorer`（xl 四列）。
- 相册详情：`CollectionView` 顶部封面限高 52vh；`CollectionGallery` 默认展示工作台拖动的手动顺序，按钮可循环切换「手动 → 拍摄时间倒序 → 拍摄时间正序」。
- 图片一律使用 `<img>` + `withBasePath()`（已关闭 `@next/next/no-img-element`），必须带 `width`/`height`、`loading`、`decoding`。
- 内页静态生成：`generateStaticParams()` 必须穷举所有 albums 与 folders，且 `dynamicParams = false`；新增维度（年份/城市/标签页）时同样要穷举，否则导出后 404。
- 空作品集时，两个动态路由会返回 `coming-soon` 占位参数（`src/lib/constants.ts`），避免 `output: export` 报 “empty array”；有数据后自动恢复真实参数。这个兜底不要删除。
- 客户端组件只 import 纯类型/纯函数（如 `@/lib/view-types`、`@/lib/photos`）；禁止从带 `fs` 的 `@/lib/api/portfolio`、`@/lib/admin/*` 导入运行时代码。

### 5.3 响应式

- 断点：`sm 640` / `md 768` / `lg 1024` / `xl 1280`。
- 页头在 `<640px` 变成两行（品牌 + 导航），导航不得横向溢出。
- 首页标题使用 `clamp()`；移动端先标题/分类、后随机照片，几何占位不能遮挡正文。
- 修改后至少检查 390 / 768 / 1440 三个宽度。

---

## 6. Git 版本规范

使用 Angular 语义化前缀：

| 前缀 | 用途 | 示例 |
| --- | --- | --- |
| `feat` | 新功能 | `feat(admin): add map picker` |
| `fix` | 修复 | `fix(sort): keep missing dates at bottom` |
| `content` | 作品/文案 | `content: add night-tide series` |
| `style` | 纯视觉 | `style(cover): refine wordmark spacing` |
| `refactor` | 重构 | `refactor(api): extract sanitize` |
| `perf` | 性能 | `perf(images): smaller thumbs` |
| `docs` | 文档 | `docs: update AGENTS` |
| `chore` | 杂务 | `chore: bump sharp` |
| `ci` | 流水线 | `ci: strip proxy.ts` |
| `revert` | 回滚 | `revert: feat(admin) ...` |

- 本地 `next-env.d.ts` 由 `pnpm check` / `next dev` / `next build` 生成，已在 `.gitignore` 中忽略；不要手写或提交它。
- 提交前门禁（代码改动必须执行）：

```powershell
pnpm check; if ($LASTEXITCODE -ne 0) { exit 1 }
pnpm lint
```

- Studio 里的「提交快照」适合**内容更新**，不会替你跑 check/lint。
- 改代码请用 CLI 提交，并在提交前跑门禁。
- 不要提交：`.env.local`、`.next`、`out`、`.shots`、原片、`node_modules`。
- 不要使用 `--no-verify` 绕过钩子（如后续添加）。

---

## 7. GitHub Pages 部署

### 7.1 首次配置

1. 推送仓库到 GitHub。
2. Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
3. 推送 `main`，等待 Actions 完成。

若 Actions 报 `Get Pages site failed (404)` / `Not Found`，说明 Pages 尚未启用。手动切换，或：

```powershell
pwsh -File scripts/enable-pages.ps1
```

脚本会读取 `origin`、用 `git credential fill` 拿 token，调用 `POST /repos/{owner}/{repo}/pages`（已存在则 `PUT`）并设置 `build_type: workflow`。

### 7.2 流水线要点

- `permissions: pages: write, id-token: write, contents: read`
- `configure-pages@v5` 输出 `base_path`（用户主页为空，项目页为 `/repo`）
- strip 后跑 `pnpm check`、`pnpm lint`
- `NEXT_PUBLIC_STATIC_EXPORT=true` + `NEXT_PUBLIC_BASE_PATH`
- `upload-pages-artifact@v3` → `deploy-pages@v4`
- `public/.nojekyll` 已存在，避免下划线目录被 Jekyll 忽略

### 7.3 自定义域名

使用自定义域名时 `base_path` 为空，`NEXT_PUBLIC_BASE_PATH` 应为空；图片仍走 `/photos/...`。切换后必须重新构建，不能复用旧 `out/`。

---

## 8. 故障诊断

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `Get Pages site failed (404)` | Pages 未启用 | `pwsh -File scripts/enable-pages.ps1` |
| Windows 构建报 `EPERM .next/...` | dev server 占用 `.next` | 停止 `pnpm dev`，结束残留 node，删除 `.next` 后重试 |
| `pnpm build:static` 后 admin 目录消失 | 构建中断未还原 | 检查 `.stash/static-*`，手动移回 `src/app/admin`、`src/app/api`、`src/lib/admin` |
| 公网图片 404 | 数据里写了 basePath 前缀 / 忘记 `withBasePath` | 检查 JSON 是否为 `/photos/...`；检查 `<img src>` |
| 新相册/子专题页面 404 | `generateStaticParams` 未包含 | 确认构建前数据已保存，重新构建；本地 dev 新建后重启 `pnpm dev` 以刷新参数缓存 |
| 照片排序不对 | 缺 `dateTaken` 或手改了 JSON | 后台校时；运行 `scripts/fix-missing-dates.mjs` |
| 上传后中文变乱码 | 用 PowerShell 5.1 直接调 API（未按 UTF-8 解码） | 改用 `/admin` 页面或 Node `fetch`；不要用 PS 5.1 回写 JSON |
| `sharp` 安装后不可用 | pnpm 忽略了 build script | 在 `pnpm-workspace.yaml` 的 `allowBuilds` 中允许 `sharp`，重装 |
| 端口占用 | 3000 被占 | `pnpm dev --port 3001` |
| dev 下 HMR 跨域警告 | 用 `127.0.0.1` 打开而服务是 `localhost` | 统一用 `http://localhost:3000` |
| Git 提交失败 `Please tell me who you are` | 未配置身份 | `git config user.name "…"` / `git config user.email "…"` |

### 日志位置

- dev server 终端输出（HTTP 状态、编译错误）
- 浏览器 Console（客户端异常、图片 404）
- GitHub Actions 运行日志（构建/部署）

---

## 9. 回滚与恢复

### 9.1 内容回滚（推荐）

```bash
git log --oneline -- src/data
git show <commit>:src/data/portfolio-data.json > src/data/portfolio-data.json
pnpm check && pnpm lint
```

或在 Studio 里打开「版本快照」查看变更后手动还原。

### 9.2 代码回滚

```bash
# 安全：生成一个反向提交
git revert <commit>

# 仅撤销最近一次提交，保留工作区
git reset --soft HEAD~1

# 危险：丢弃所有本地改动（先备份 JSON！）
git reset --hard <commit>
```

回滚后必须：

1. `pnpm check` + `pnpm lint`
2. 本地打开 `/`、`/works`、任一相册确认资源正常
3. 重新触发部署（push 或手动 `workflow_dispatch`）

### 9.3 演示数据重置

```bash
node scripts/reset-demo.mjs --yes
```

会清空 JSON 并删除被引用的 WebP；不可撤销。当前站内已有 58 张真实作品，除非明确要清空，不要运行此命令。

---

## 10. Agent 工作检查清单

改完任何东西，按顺序自检：

- [ ] `pnpm check` 零错误
- [ ] `pnpm lint` 零 error（warning 尽量清零）
- [ ] `pnpm build` 通过（本地完整功能）
- [ ] 若改了前台/导出：`pnpm build:static` 通过，且 `out/admin`、`out/api` 不存在
- [ ] 相册数组顺序未被保存流程重排；专题 / 时间视图仍按 `dateTaken` 排序
- [ ] 新图片是否只在 `public/photos/` 且为 WebP
- [ ] 新路由是否有 `generateStaticParams` + `dynamicParams = false`
- [ ] 新 API 是否 `guardAdmin()` 且位于 `src/app/api/admin/`
- [ ] 390 / 768 / 1440 宽度无横向溢出
- [ ] 没有提交 `.env.local`、原片、`.next`、`out`、`.shots`
- [ ] 文案改动是否写进了 `site-config.json` 而不是散落在组件里

---

## 11. 常用命令备忘

```powershell
# 开发
pnpm dev
pnpm dev --port 3001

# 质量门禁
pnpm check
pnpm lint

# 静态导出（先停 dev）
$env:NEXT_PUBLIC_BASE_PATH="/repo-name"; pnpm build:static
Remove-Item Env:NEXT_PUBLIC_BASE_PATH

# 演示数据
pnpm seed:demo --force
node scripts/reset-demo.mjs --yes

# 缺失拍摄时间
node scripts/fix-missing-dates.mjs
node scripts/fix-missing-dates.mjs --id p_xxx --date "2026-05-01 14:30"

# 批量导入（需 dev server）
node scripts/import-folder.mjs --dir "D:\inbox" --album street-night --tags "夜,长曝光"

# Git / Pages
git status
git log --oneline -10
pwsh -File scripts/enable-pages.ps1

# 清理 Windows 构建缓存（先停 dev）
Remove-Item -Recurse -Force .next
```
