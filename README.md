# Bok_Hamm Photography

一个包豪斯（Bauhaus）视觉取向的个人摄影作品集：几何网格、三原色、硬边阴影与克制的编辑排版，让作品本身成为页面主角。

前台是纯静态站点，可零成本部署到 GitHub Pages；本地则带一个只在这台机器上运行的可视化工作台（`/admin`），负责上传、WebP 压制、EXIF 解析、拍摄时间排序、专题编排与 Git 快照。

---

## 页面结构

| 路由 | 说明 |
| --- | --- |
| `/` | 首页：左右分栏。左侧 `Bok_Hamm / Photography` 标题与分类导航，右侧随机抽取照片展示（可换一组） |
| `/works` | 作品集索引，按相册展示，支持标签筛选 |
| `/albums/[slug]` | 相册详情：大图封面 + 按拍摄时间倒序的作品墙 + 灯箱 |
| `/folders`、`/folders/[slug]` | 跨相册的专题序列 |
| `/about` | 关于摄影师、创作宣言、器材与社交链接 |
| `/contact` | 联系方式、合作类型与社交入口 |
| `/admin` | **仅本地**的可视化工作台（生产构建中会被物理删除） |

---

## 技术栈

- **Next.js 16**（App Router / React Server Components）
- **React 19** + **TypeScript 5.9**（strict）
- **Tailwind CSS 4**（设计令牌集中定义在 `src/app/globals.css`）
- **sharp**：WebP 压制、缩略图、极小模糊占位图
- **exifr**：相机、镜头、光圈、快门、ISO、GPS、拍摄时间
- **pnpm 11** + Node.js 24

---

## 快速开始

```bash
pnpm install
```

创建本地环境变量（Windows 用 `copy`，macOS/Linux 用 `cp`）：

```bash
copy .env.example .env.local
```

填写自己的后台密码：

```env
ADMIN_PASSWORD=your-strong-password
```

启动：

```bash
pnpm dev
```

- 前台：<http://localhost:3000>
- 工作台：<http://localhost:3000/admin>
- 若没有创建 `.env.local`，开发环境会回退到默认密码 `admin123`；**生产环境不会使用任何默认密码**。

当前仓库自带一组演示作品（Unsplash 图片 + 示例文案），方便直接看到完整版式。

---

## 内容管理（本地 Studio）

打开 `/admin` 后：

1. **相册**：新建/编辑标题、slug、描述、地点与封面。
2. **照片**：拖拽上传（一次最多 24 张，单张 ≤ 60MB），自动：
   - 转成高质量 WebP（单边 ≤ 2048px，quality 88，effort 4）
   - 生成 1000px 缩略图与 24px 模糊占位图
   - 从 EXIF 读取 `DateTimeOriginal` / `CreateDate`，统一存为 ISO-8601 UTC
   - 提取相机、镜头、焦距、光圈、快门、ISO、GPS
3. **专题**：跨相册勾选照片，组成主题序列（只保存照片 id 引用）。
4. **站点设置**：姓名、标语、个人照片、Bio、邮箱、社交链接、器材清单。
5. **保存至磁盘**：把草稿写入 `src/data/*.json`，并清理不再被引用的图片。
6. **版本快照**：填写 Commit Message，一键 `git add -A && git commit`。

> 上传接口只负责把图片写进 `public/photos/<年份>/` 并返回元数据；点击「保存至磁盘」才会更新 JSON。未保存的上传会在下次保存时按规则清理。

### 演示内容

```bash
# 重新生成演示数据（会覆盖现有作品，需 --force）
pnpm seed:demo --force

# 清空演示数据与图片（谨慎）
node scripts/reset-demo.mjs --yes
```

---

## 数据与铁律

单一真相源：

- `src/data/portfolio-data.json`：`albums` / `albumPhotos` / `folders` / `folderPhotos`
- `src/data/site-config.json`：站点文案与社交链接

三条不可破坏的规则：

1. **拍摄时间绝对降序**：只认 `DateTimeOriginal` → `CreateDate`，绝不使用文件修改时间或上传时间。排序在三处强制执行：写入 JSON 前、读取 API 时、后台保存前。
2. **原始大图不进库**：所有图片先经 sharp 压制成 WebP，再写入 `public/photos/<年份>/`。
3. **二级路径兼容**：数据里永远存 `/photos/...` 这类无前缀路径，渲染时由 `withBasePath()` 注入 `NEXT_PUBLIC_BASE_PATH`，避免把 `/repo-name` 写进 JSON。

缺少 EXIF 拍摄时间的照片会以导入时间兜底，并标记 `dateTakenSource: "fallback"`，在后台显示红色提醒，请手动校正。

---

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 本地开发（含 `/admin`） |
| `pnpm check` | 生成 Next 路由类型并做 TypeScript 检查（`next typegen && tsc --noEmit`） |
| `pnpm lint` | ESLint |
| `pnpm build` | 服务端模式构建（本地完整功能） |
| `pnpm build:static` | 模拟 CI：移出 admin/api → `output: export` → 还原源码 |
| `pnpm seed:demo` | 生成演示作品 |
| `pnpm reset:demo` | 清空演示作品（需 `--yes`） |

针对缺少拍摄时间的旧数据：

```bash
# 列出所有可疑照片
node scripts/fix-missing-dates.mjs

# 修正某一张（时间按本机时区解释，写入 UTC）
node scripts/fix-missing-dates.mjs --id p_xxxx --date "2026-05-01 14:30"
```

---

## 部署到 GitHub Pages

1. 新建 GitHub 仓库并推送本项目。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 推送到 `main`，`.github/workflows/nextjs.yaml` 会：
   - 安装依赖并执行 `pnpm check` / `pnpm lint`
   - **物理删除** `src/app/admin`、`src/app/api`、`src/lib/admin`
   - 注入 `NEXT_PUBLIC_STATIC_EXPORT=true` 与 `NEXT_PUBLIC_BASE_PATH=${{ steps.pages.outputs.base_path }}`
   - 构建 `out/` 并发布到 Pages

首次部署若遇到 `Get Pages site failed (404)`，说明仓库还没启用 Pages。可手动在 Settings 里切换，或使用本机 Git 凭据调用 REST API：

```powershell
pwsh -File scripts/enable-pages.ps1
```

本地验证子路径构建：

```powershell
$env:NEXT_PUBLIC_BASE_PATH="/your-repo"; pnpm build:static
```

然后检查 `out/`：`out/admin` 与 `out/api` 必须不存在，HTML 中的资源应以 `/your-repo/_next/...` 开头。

> 运行 `pnpm build:static` 前请先停止 `pnpm dev`，避免 Windows 下 `.next` 文件被占用。

---

## 目录结构

```text
src/
  app/
    (site)/              前台路由组（共享页头页脚）
    admin/               本地工作台（CI 会删除）
    api/admin/           本地 API（CI 会删除）
    globals.css          包豪斯设计令牌与动效
    page.tsx             首页（左右分栏 + 随机照片）
  components/site/       首页、导航、随机照片墙、作品墙、灯箱等
  lib/
    api/portfolio.ts     只读数据层 + 排序 + basePath 视图模型
    admin/               鉴权、上传管线、原子写入、Git（CI 会删除）
    types.ts             领域类型
    view-types.ts        展示层类型（可安全用于客户端组件）
  data/                  唯一真相源 JSON
public/photos/           压制后的 WebP 与缩略图
scripts/                 演示数据、静态构建、补救、Pages 启用脚本
```

---

## 说明

- 演示图片来自 [Unsplash](https://unsplash.com)，仅用于占位；正式发布前请替换为自己的作品并确认授权。
- 工程思路参考 [TfiyuenLau/Photography-Portfolio](https://github.com/TfiyuenLau/Photography-Portfolio) 与 [agarun/photos](https://github.com/agarun/photos)；视觉与交互为本项目原创的包豪斯方向。
- 详细维护规范见 [AGENTS.md](./AGENTS.md)。
