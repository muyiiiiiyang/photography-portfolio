/**
 * 本地模拟 CI 的静态导出：
 * 1. 物理移出 admin / api 源码（模拟 GitHub Actions 的 strip 步骤）
 * 2. next build -> out/
 * 3. 无论成败都把源码移回
 *
 * 注意：运行前请先停止 `pnpm dev`，避免 Windows 下 .next 文件被占用。
 */
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STASH = path.join(ROOT, ".stash", `static-${Date.now()}`);
const TARGETS = ["src/app/admin", "src/app/api", "src/lib/admin"];
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function move(from, to) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.rename(from, to);
}

let restored = false;

async function restore() {
  if (restored) return;
  restored = true;

  for (const relative of TARGETS) {
    const stashed = path.join(STASH, relative);
    if (!(await exists(stashed))) continue;

    const target = path.join(ROOT, relative);
    if (await exists(target)) {
      await fs.rm(target, { recursive: true, force: true });
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.rename(stashed, target);
    console.log(`  ↳ restored ${relative}`);
  }

  await fs.rm(STASH, { recursive: true, force: true }).catch(() => undefined);
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      env,
      windowsHide: true,
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }
      resolve(code ?? 1);
    });
  });
}

async function main() {
  // 开发模式会写入 .next/dev/types，静态导出前必须清掉，否则 Next 的类型检查会引用已删除的 admin 路由。
  try {
    await fs.rm(path.join(ROOT, ".next"), { recursive: true, force: true });
  } catch {
    console.warn(
      "⚠ 无法清空 .next（可能被 dev server 占用）。请先停止 pnpm dev 再重试。",
    );
  }

  console.log("→ stripping local studio from the build…");
  for (const relative of TARGETS) {
    const source = path.join(ROOT, relative);
    if (!(await exists(source))) {
      console.log(`  skip ${relative} (not found)`);
      continue;
    }
    await move(source, path.join(STASH, relative));
    console.log(`  ✂ ${relative}`);
  }

  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();
  console.log(
    `→ next build (static export${basePath ? `, basePath=${basePath}` : ""})…`,
  );

  const code = await run(process.execPath, [NEXT_BIN, "build"], {
    ...process.env,
    NEXT_PUBLIC_STATIC_EXPORT: "true",
    NEXT_PUBLIC_BASE_PATH: basePath,
  });

  if (code !== 0) {
    throw new Error(`next build exited with code ${code}`);
  }

  console.log("\n✓ 静态产物已生成：./out");
  console.log("  检查点：out/admin 与 out/api 不应存在（公网 404）。");
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await restore();
    process.exit(130);
  });
}

main()
  .then(async () => {
    await restore();
  })
  .catch(async (error) => {
    console.error(`\n✖ ${error.message}`);
    await restore();
    process.exit(1);
  });
