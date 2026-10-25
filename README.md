# Bok_Hamm Photography

一个包豪斯（Bauhaus）视觉取向的个人摄影作品集：几何网格、三原色、硬边阴影与克制的编辑排版，让作品本身成为页面主角。

前台是纯静态站点，可零成本部署到 GitHub Pages；本地则带一个只在这台机器上运行的可视化工作台（`/admin`），负责上传、WebP 压制、EXIF 解析、拍摄时间排序与 Git 快照。

---

## 页面结构

| 路由 | 说明 |
| --- | --- |
| `/` | 首页：左右分栏；向下滚动是全部照片的随机照片墙，点开可查看并进入作品集/专题 |
| `/works` | 作品集索引，按相册展示，支持标签筛选 |
| `/albums/[slug]` | 相册详情：大图封面 + 按拍摄时间排序的作品墙 + 灯箱 |
| `/folders`、`/folders/[slug]` | 专题与子专题：按层级组织照片 |
| `/about` | 关于作者、创作宣言、器材与社交链接 |
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

当前已导入四组作品：日本、广元、港新与粤车南下胶卷，共 58 张，文案为示例；照片与文字都可以在 Studio 内继续替换。

---

## 内容管理（本地 Studio）

打开 `/admin` 后：

1. **相册**：新建/编辑标题、slug、描述、地点与封面。
2. **照片**：拖拽上传（一次最多 24 张，单张 ≤ 60MB）。也可以直接在「相册」编辑页点 **上传照片 ↑**，会切到照片面板并自动选中当前相册。上传后自动：
   - 转成高质量 WebP（单边 ≤ 2048px，quality 88，effort 4）
   - 生成 1000px 缩略图与 24px 模糊占位图
   - 从 EXIF 读取 `DateTimeOriginal` / `CreateDate`，统一存为 ISO-8601 UTC
   - 提取相机、镜头、焦距、光圈、快门、ISO、GPS
   - 「全部照片」视图可跨相册查看；选中照片后可移动到作品集，或加入任意专题 / 子专题
3. **专题**：创建顶级专题（已预设景观、人像、产品），也可在任意专题下继续创建子专题；跨相册勾选照片。
4. **关于作者**：品牌名、标语、个人照片、关于页大标题、合并后的「个人简介 / 创作宣言」、器材清单。
5. **联系方式**：邮箱、所在地、社交链接，以及联系页全部文案。
6. **相册 / 专题页引导语**：分别放在「相册」和「专题」面板顶部。
7. **保存至磁盘**：把草稿写入 `src/data/*.json`，并清理不再被引用的图片。
8. **版本快照**：填写 Commit Message，一键 `git add -A && git commit`。

> 上传接口只负责把图片写进 `public/photos/<年份>/` 并返回元数据；点击「保存至磁盘」才会更新 JSON。未保存的上传会在下次保存时按规则清理。

### 示例数据工具（可选）

以下脚本会覆盖现有作品，仅在需要重新演示版式时使用：

```bash
# 重新生成演示数据（会覆盖现有作品，需 --force）
pnpm seed:demo --force

# 清空作品数据与图片（谨慎，当前 58 张作品会被删除）
node scripts/reset-demo.mjs --yes
```

---

## 数据与铁律

单一真相源：

- `src/data/portfolio-data.json`：`albums` / `albumPhotos` / `folders` / `folderPhotos`（`folders.parentId` 表示子专题）
- `src/data/site-config.json`：站点文案、导航作品集与社交链接

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
| `pnpm seed:demo` | 生成演示作品（会覆盖，需 `--force`） |
| `pnpm reset:demo` | 清空全部作品（需 `--yes`，谨慎） |

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

## 本地版本快照

`ver1.6.5/` 保存了本次交付的完整工作副本（源码、`src/data`、`public` 图片、配置与文档），不包含 `node_modules`、`.next`、`out`、`.git` 和本机环境变量。该目录已加入 `.gitignore`，不会重复提交；`ver1.0` / `ver1.5` / `ver1.5.2` / `ver1.5.3` / `ver1.6.3` 作为历史快照保留。

回滚时先停止 `pnpm dev`，把 `ver1.6.5/` 内的文件覆盖回项目根目录，再执行 `pnpm install && pnpm dev`。更细的回滚方式见 `ver1.6.5/VERSION.md`。

---

## 说明

- 站内作品图片来自摄影师本人提供的素材；正式发布前请自行确认肖像、场所与出版授权。
- 工程思路参考 [TfiyuenLau/Photography-Portfolio](https://github.com/TfiyuenLau/Photography-Portfolio) 与 [agarun/photos](https://github.com/agarun/photos)；视觉与交互为本项目原创的方向。
- 详细维护规范见 [AGENTS.md](./AGENTS.md)。
