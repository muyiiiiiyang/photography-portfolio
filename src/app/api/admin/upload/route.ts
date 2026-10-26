import { NextResponse } from "next/server";

import { guardAdmin } from "@/lib/admin/auth";
import { processUpload } from "@/lib/admin/images";
import { uniqueTags } from "@/lib/photos";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "无法解析上传表单，请重试。" },
      { status: 400 },
    );
  }

  const files = form
    .getAll("files")
    .filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "没有收到图片文件。" }, { status: 400 });
  }
  if (files.length > 24) {
    return NextResponse.json(
      { error: "单次最多上传 24 张，请分批导入。" },
      { status: 400 },
    );
  }

  const tags = uniqueTags(
    String(form.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  );
  const readTitle = String(form.get("readTitle") ?? "") === "1";
  const dateTaken = String(form.get("dateTaken") ?? "").trim();

  const photos: Photo[] = [];
  const errors: { name: string; message: string }[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    try {
      const result = await processUpload(file, {
        tags,
        readTitle,
        dateTaken: dateTaken || undefined,
      });
      photos.push(result.photo);
      warnings.push(...result.warnings);
    } catch (error) {
      errors.push({
        name: file.name,
        message: error instanceof Error ? error.message : "处理失败。",
      });
    }
  }

  return NextResponse.json({ photos, errors, warnings });
}
