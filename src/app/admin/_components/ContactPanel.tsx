"use client";

import { Button, Field, PanelHeader } from "./ui";
import type { Dispatch, SetStateAction } from "react";

import type { SiteConfig } from "@/lib/types";

interface ContactPanelProps {
  config: SiteConfig;
  setConfig: Dispatch<SetStateAction<SiteConfig>>;
}

export function ContactPanel({ config, setConfig }: ContactPanelProps) {
  function patch(patchValue: Partial<SiteConfig>) {
    setConfig((prev) => ({ ...prev, ...patchValue }));
  }

  function patchContact(patchValue: Partial<SiteConfig["contact"]>) {
    setConfig((prev) => ({
      ...prev,
      contact: { ...prev.contact, ...patchValue },
    }));
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
        eyebrow="Contact"
        title="联系方式"
        description="联系页的全部可见文案、邮箱、所在地与社交链接。"
      />

      <div className="mt-6 space-y-5">
        <section className="border border-ink/15 bg-white p-5">
          <p className="font-display text-lg">联系信息</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          </div>
        </section>

        <section className="border border-ink/15 bg-white p-5">
          <p className="font-display text-lg">联系页文案</p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
            主标题用换行控制断行；介绍文字支持回车换行。
          </p>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="顶部小标 / Eyebrow">
                <input
                  className="field"
                  value={config.contact.eyebrow}
                  onChange={(event) =>
                    patchContact({ eyebrow: event.target.value })
                  }
                />
              </Field>
              <Field label="主标题" hint="句末会自动加红点。">
                <textarea
                  className="field min-h-20"
                  rows={3}
                  value={config.contact.title}
                  onChange={(event) =>
                    patchContact({ title: event.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="介绍文字">
              <textarea
                className="field min-h-24"
                rows={4}
                value={config.contact.intro}
                onChange={(event) =>
                  patchContact({ intro: event.target.value })
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="社交区块标题">
                <input
                  className="field"
                  value={config.contact.elsewhereLabel}
                  onChange={(event) =>
                    patchContact({ elsewhereLabel: event.target.value })
                  }
                />
              </Field>
              <Field label="服务区块标题">
                <input
                  className="field"
                  value={config.contact.servicesLabel}
                  onChange={(event) =>
                    patchContact({ servicesLabel: event.target.value })
                  }
                />
              </Field>
              <Field label="所在地标题">
                <input
                  className="field"
                  value={config.contact.basedInLabel}
                  onChange={(event) =>
                    patchContact({ basedInLabel: event.target.value })
                  }
                />
              </Field>
              <Field label="所在地说明">
                <textarea
                  className="field min-h-16"
                  rows={2}
                  value={config.contact.basedInNote}
                  onChange={(event) =>
                    patchContact({ basedInNote: event.target.value })
                  }
                />
              </Field>
              <Field label="档期标题">
                <input
                  className="field"
                  value={config.contact.availabilityLabel}
                  onChange={(event) =>
                    patchContact({ availabilityLabel: event.target.value })
                  }
                />
              </Field>
              <Field label="档期状态">
                <input
                  className="field"
                  value={config.contact.availabilityStatus}
                  onChange={(event) =>
                    patchContact({ availabilityStatus: event.target.value })
                  }
                />
              </Field>
            </div>

            <Field label="档期说明">
              <textarea
                className="field min-h-16"
                rows={2}
                value={config.contact.availabilityNote}
                onChange={(event) =>
                  patchContact({ availabilityNote: event.target.value })
                }
              />
            </Field>

            <Field label="Services 列表" hint="一行一项，会渲染为标签。">
              <textarea
                className="field min-h-28 font-mono text-[11px]"
                rows={5}
                value={config.contact.services.join("\n")}
                onChange={(event) =>
                  patchContact({
                    services: event.target.value
                      .split(/\r?\n/)
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="底部 CTA 标题">
                <textarea
                  className="field min-h-16"
                  rows={2}
                  value={config.contact.ctaTitle}
                  onChange={(event) =>
                    patchContact({ ctaTitle: event.target.value })
                  }
                />
              </Field>
              <Field label="底部 CTA 按钮">
                <input
                  className="field"
                  value={config.contact.ctaButton}
                  onChange={(event) =>
                    patchContact({ ctaButton: event.target.value })
                  }
                />
              </Field>
            </div>
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
                  placeholder="平台"
                  value={social.label}
                  onChange={(event) =>
                    updateSocial(index, "label", event.target.value)
                  }
                />
                <input
                  className="field font-mono text-[11px]"
                  placeholder="https://…"
                  value={social.url}
                  onChange={(event) =>
                    updateSocial(index, "url", event.target.value)
                  }
                />
                <Button
                  size="sm"
                  variant="danger"
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
          </div>
        </section>

        <p className="border-l-2 border-yellow bg-yellow/10 px-3 py-2 text-[11px] leading-relaxed text-ink/55">
          修改只停留在草稿状态，点击右上角「保存至磁盘」写入
          <code className="font-mono"> src/data/site-config.json</code>。
        </p>
      </div>
    </div>
  );
}
