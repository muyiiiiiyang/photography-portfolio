import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 站点是纯静态导出，图片统一走 sharp 预压制的 WebP，不需要 next/image 运行时。
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "next-env.d.ts",
    "scripts/**",
    ".stash/**",
    "ver1.0/**",
    "ver1.5/**",
    "ver1.5.2/**",
    "ver1.5.3/**",
    "ver1.6.3/**",
    "ver1.6.5/**",
    "ver1.6.8/**",
  ]),
]);
