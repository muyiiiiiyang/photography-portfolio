/**
 * GitHub Pages 二级路径支持。
 * 数据里永远存不带前缀的路径（/photos/...），只在渲染时补前缀，
 * 避免后台保存时把 /repo 前缀写回 JSON。
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "")
  .trim()
  .replace(/\/+$/, "");

export function withBasePath(pathname: string | undefined | null): string {
  if (!pathname) return "";
  if (/^(https?:)?\/\//i.test(pathname) || pathname.startsWith("data:")) {
    return pathname;
  }
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${BASE_PATH}${normalized}`;
}
