"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";

import { Button, Field, PanelHeader } from "./ui";
import { withBasePath } from "@/lib/site";
import type { SiteConfig } from "@/lib/types";

interface SettingsPanelProps {
  config: SiteConfig;
  setConfig: Dispatch<SetStateAction<SiteConfig>>;
}

export function SettingsPanel({ config, setConfig }: SettingsPanelProps) {
  const portraitInput = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function patch(patchValue: Partial<SiteConfig>) {
    setConfig((prev) => ({ ...prev, ...patchValue }));
  }

  async function uploadPortrait(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/portrait/", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        src?: string;
        error?: string;
      };

      if (!response.ok || !payload.src) {
        setUploadError(payload.error ?? "上传失败，请重试。");
        return;
      }

      patch({ portrait: payload.src });
    } catch {
      setUploadError("上传失败：无法连接本地服务。");
    } finally {
      setUploading(false);
    }
  }

  function updateSocial(
    index: number,
    key: "label" | "url",
    value: string,
  ) {
    setConfig((prev) => ({
      ...prev,
      socials: prev.socials.map((social, current) =>
        current === index ? { ...social, [key]: value } : social,
      ),
    }));
  }

  return (
    <div>
      <PanelHeader
        eyebrow="Site"
        title="站点设置"
        description="这些文案会出现在首页、关于页、联系页与页脚。"
      />

      <div className="mt-6 space-y-5">
        <section className="border border-ink/15 bg-white p-5">
          <p className="font-display text-lg">品牌信息</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="摄影师姓名">
              <input
                className="field"
                value={config.photographer}
                onChange={(event) =>
                  patch({ photographer: event.target.value })
                }
              />
            </Field>
            <Field label="站点标题">
              <input
                className="field"
                value={config.title}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </Field>
            <Field label="一句话标语" className="sm:col-span-2">
              <input
                className="field"
                value={config.tagline}
                onChange={(event) => patch({ tagline: event.target.value })}
              />
            </Field>
            <Field label="邮箱">
              <input
                className="field"
                type="email"
                value={config.email}
                onChange={(event) => patch({ email: event.target.value })}
              />
            </Field>
            <Field label="所在地">
              <input
                className="field"
                value={config.location}
                onChange={(event) => patch({ location: event.target.value })}
              />
            </Field>
            <Field label="版权信息" className="sm:col-span-2">
              <input
                className="field"
                value={config.copyright}
                onChange={(event) => patch({ copyright: event.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="border border-ink/15 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg">个人照片</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
                会显示在「关于作者」页面左侧，建议上传竖幅人像。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={portraitInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void uploadPortrait(event)}
              />
              <Button
                size="sm"
                variant="solid"
                disabled={uploading}
                onClick={() => portraitInput.current?.click()}
              >
                {uploading
                  ? "上传中…"
                  : config.portrait
                    ? "更换照片"
                    : "上传照片"}
              </Button>
              {config.portrait ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => patch({ portrait: undefined })}
                >
                  移除
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative aspect-[4/5] w-full max-w-[160px] overflow-hidden border border-ink/20 bg-paper-2">
              {config.portrait ? (
                <img
                  src={withBasePath(config.portrait)}
                  alt="个人照片预览"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center font-mono text-[9px] uppercase tracking-[0.2em] text-ink/35">
                  No portrait
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[11px] leading-relaxed text-ink/45">
                上传只写入图片文件；点击右上角「保存至磁盘」后才会写入站点配置。
                保存成功后，被替换的旧照片会自动清理。
              </p>
              {uploadError ? (
                <p
                  role="alert"
                  className="mt-2 border-l-2 border-red bg-red/5 px-2 py-1 text-[11px] text-red"
                >
                  {uploadError}
                </p>
              ) : null}
              <p className="mt-3 break-all font-mono text-[9px] text-ink/30">
                {config.portrait ?? "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="border border-ink/15 bg-white p-5">
          <p className="font-display text-lg">关于页文本</p>
          <div className="mt-4 space-y-4">
            <Field label="创作宣言 / Statement">
              <textarea
                className="field min-h-24"
                rows={4}
                value={config.statement}
                onChange={(event) =>
                  patch({ statement: event.target.value })
                }
              />
            </Field>
            <Field
              label="个人简介 / Bio"
              hint="空行分段，会按段落渲染在关于页。"
            >
              <textarea
                className="field min-h-40"
                rows={8}
                value={config.bio}
                onChange={(event) => patch({ bio: event.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="border border-ink/15 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-lg">社交链接</p>
            <Button
              size="sm"
              onClick={() =>
                patch({
                  socials: [...config.socials, { label: "", url: "" }],
                })
              }
            >
              + 添加
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {config.socials.map((social, index) => (
              <div
                key={`social-${index}`}
                className="grid gap-2 sm:grid-cols-[160px_1fr_auto]"
              >
                <input
                  className="field"
                  placeholder="平台名称"
                  value={social.label}
                  onChange={(event) =>
                    updateSocial(index, "label", event.target.value)
                  }
                />
                <input
                  className="field font-mono"
                  placeholder="https://"
                  value={social.url}
                  onChange={(event) =>
                    updateSocial(index, "url", event.target.value)
                  }
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    patch({
                      socials: config.socials.filter(
                        (_, current) => current !== index,
                      ),
                    })
                  }
                >
                  移除
                </Button>
              </div>
            ))}
            {config.socials.length === 0 ? (
              <p className="text-xs text-ink/40">
                还没有社交链接，前台页脚会相应留空。
              </p>
            ) : null}
          </div>
        </section>

        <section className="border border-ink/15 bg-white p-5">
          <p className="font-display text-lg">器材清单</p>
          <p className="mt-1 text-[11px] text-ink/45">
            一行一件，会按编号列在关于页。
          </p>
          <textarea
            className="field mt-3 min-h-32 font-mono text-[11px]"
            rows={6}
            value={config.equipment.join("\n")}
            onChange={(event) =>
              patch({
                equipment: event.target.value.split(/\r?\n/),
              })
            }
          />
        </section>

        <p className="border-l-2 border-yellow bg-yellow/10 px-3 py-2 text-[11px] leading-relaxed text-ink/55">
          修改只停留在草稿状态，点击右上角「保存至磁盘」写入
          <code className="font-mono"> src/data/site-config.json</code>。
        </p>
      </div>
    </div>
  );
}
