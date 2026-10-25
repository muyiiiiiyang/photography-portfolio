import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";
import sharp from "sharp";

import { guardAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = process.cwd();
const PORTRAIT_DIR = path.join(ROOT, "public", "portrait");
const MAX_BYTES = 40 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "无法解析上传表单。" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择一张照片。" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "只支持图片文件。" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "照片超过 40MB，请先压缩。" },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const output = await sharp(buffer, {
      failOn: "none",
      limitInputPixels: 300_000_000,
    })
      .rotate()
      .resize({
        width: 1800,
        height: 1800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 90, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    await fs.mkdir(PORTRAIT_DIR, { recursive: true });
    const name = `portrait-${Date.now()}-${randomUUID().slice(0, 6)}.webp`;
    await fs.writeFile(path.join(PORTRAIT_DIR, name), output.data);

    return NextResponse.json({
      src: `/portrait/${name}`,
      width: output.info.width,
      height: output.info.height,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "照片处理失败，请换一张试试。",
      },
      { status: 500 },
    );
  }
}
