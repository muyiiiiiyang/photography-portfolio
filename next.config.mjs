/** @type {import('next').NextConfig} */

function normalizeBasePath(value) {
  if (!value) return "";
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages 等纯静态托管时开启；本地 `pnpm dev` / `pnpm build` 保持服务端能力以启用 /admin。
  ...(isStaticExport ? { output: "export" } : {}),
  ...(basePath ? { basePath } : {}),
  // 导出目录 out/ 下每个路由都会生成 index.html，兼容 Pages 的目录寻址。
  trailingSlash: true,
  // 静态导出必须关闭 Next 图片优化服务。
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
