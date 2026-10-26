"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { exifLine, formatDate } from "@/lib/format";
import type { PhotoView } from "@/lib/view-types";

export interface GalleryLink {
  label: string;
  href: string;
}

interface PhotoGalleryProps {
  photos: PhotoView[];
  links?: (photo: PhotoView) => GalleryLink[];
}

export function PhotoGallery({ photos, links }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [fullPreview, setFullPreview] = useState<{
    id: string;
    src: string;
  } | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const originRectRef = useRef<DOMRect | null>(null);
  const openingRef = useRef(false);
  const closingRef = useRef(false);

  const active = activeIndex === null ? null : photos[activeIndex];
  const activeLinks = active && links ? links(active) : [];
  const activeSrc =
    active && fullPreview?.id === active.id
      ? fullPreview.src
      : active?.thumbUrl ?? "";

  // 先用已缓存的缩略图立即撑开灯箱，再在后台换成大图。
  // 这样第一次点击时动画不会等待大图加载，也就不会出现先错位再修正。
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const preload = new Image();
    const reveal = () => {
      if (cancelled) return;
      setFullPreview({ id: active.id, src: active.srcUrl });
    };
    preload.addEventListener("load", reveal);
    preload.src = active.srcUrl;
    if (preload.complete) reveal();
    return () => {
      cancelled = true;
      preload.removeEventListener("load", reveal);
    };
  }, [active]);

  const openPhoto = useCallback((index: number, element: HTMLElement) => {
    const image = element.querySelector("img");
    originRectRef.current = image?.getBoundingClientRect() ?? null;
    openingRef.current = true;
    setActiveIndex(index);
  }, []);

  const close = useCallback(() => {
    if (activeIndex === null || closingRef.current) return;

    const dialog = dialogRef.current;
    const image = imageRef.current;
    const activeId = active?.id;
    const thumbnail = activeId
      ? document.querySelector<HTMLImageElement>(
          `img[data-photo-thumb="${activeId}"]`,
        )
      : null;
    const origin = thumbnail?.getBoundingClientRect() ?? originRectRef.current;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const finish = () => {
      closingRef.current = false;
      setActiveIndex(null);
    };

    if (!dialog || !image || !origin || reduceMotion) {
      finish();
      return;
    }

    closingRef.current = true;
    const final = image.getBoundingClientRect();
    const scale = Math.min(
      origin.width / Math.max(final.width, 1),
      origin.height / Math.max(final.height, 1),
      1,
    );
    const dx =
      origin.left - final.left + (origin.width - final.width * scale) / 2;
    const dy =
      origin.top - final.top + (origin.height - final.height * scale) / 2;

    image.getAnimations().forEach((animation) => animation.cancel());
    dialog.getAnimations().forEach((animation) => animation.cancel());

    const imageAnimation = image.animate(
      [
        { transform: "none" },
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        },
      ],
      {
        duration: 440,
        easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
        fill: "both",
      },
    );
    const backdropAnimation = dialog.animate(
      [
        {
          backgroundColor: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(32px)",
        },
        {
          backgroundColor: "rgba(255,255,255,0)",
          backdropFilter: "blur(0px)",
        },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "both",
      },
    );

    Promise.allSettled([
      imageAnimation.finished,
      backdropAnimation.finished,
    ]).then(finish);
  }, [active, activeIndex]);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (closingRef.current) return;
      setActiveIndex((current) => {
        if (current === null || photos.length === 0) return current;
        return (current + direction + photos.length) % photos.length;
      });
    },
    [photos.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
      if (
        [" ", "PageUp", "PageDown", "Home", "End"].includes(event.key)
      ) {
        event.preventDefault();
      }
    };

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("wheel", preventScroll, { passive: false });
    document.addEventListener("touchmove", preventScroll, { passive: false });
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("wheel", preventScroll);
      document.removeEventListener("touchmove", preventScroll);
    };
  }, [activeIndex, close, step]);

  useLayoutEffect(() => {
    if (activeIndex === null || !openingRef.current) return;
    openingRef.current = false;

    const dialog = dialogRef.current;
    const image = imageRef.current;
    const origin = originRectRef.current;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!dialog || reduceMotion) return;

    dialog.animate(
      [
        {
          backgroundColor: "rgba(255,255,255,0)",
          backdropFilter: "blur(0px)",
        },
        {
          backgroundColor: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(32px)",
        },
      ],
      {
        duration: 380,
        easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
        fill: "both",
      },
    );

    if (!image || !origin) return;

    const final = image.getBoundingClientRect();
    const scale = Math.min(
      origin.width / Math.max(final.width, 1),
      origin.height / Math.max(final.height, 1),
      1,
    );
    const dx =
      origin.left - final.left + (origin.width - final.width * scale) / 2;
    const dy =
      origin.top - final.top + (origin.height - final.height * scale) / 2;

    image.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        },
        { transform: "none" },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
        fill: "both",
      },
    );
  }, [activeIndex]);

  return (
    <>
      <div
        className={
          photos.length > 4
            ? "columns-1 gap-5 sm:columns-2 lg:columns-3 lg:gap-6"
            : "grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:gap-6"
        }
      >
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={(event) => openPhoto(index, event.currentTarget)}
            aria-label={`查看作品：${photo.title ?? "未命名"}`}
            className={`group block w-full border border-ink/15 bg-white p-2 text-left transition-colors duration-300 hover:border-ink ${
              photos.length > 4 ? "mb-5 break-inside-avoid lg:mb-6" : ""
            } ${active?.id === photo.id ? "opacity-0" : ""}`}
          >
            <div className="relative overflow-hidden bg-paper-2">
              <img
                data-photo-thumb={photo.id}
                src={photo.thumbUrl}
                alt={photo.title ?? "摄影作品"}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className="h-auto w-full transition-transform duration-[1000ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.03]"
              />
              <span className="absolute left-2 top-2 bg-ink px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] text-paper opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-paper/90 text-[11px] opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                ↗
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 px-1 pt-2">
              <span className="truncate text-[10px] uppercase tracking-[0.18em] text-ink/60">
                {photo.title ?? ""}
              </span>
              <span className="shrink-0 font-mono text-[9px] tracking-[0.06em] text-ink/35">
                {photo.dateTaken ? formatDate(photo.dateTaken) : ""}
              </span>
            </div>
          </button>
        ))}
      </div>

      {active
        ? createPortal(
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="作品大图"
              className="fixed inset-0 z-[80] flex flex-col bg-white/60 text-ink backdrop-saturate-150"
              onClick={close}
            >
              <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 sm:px-8">
                <span className="font-mono text-[10px] tracking-[0.24em] text-ink/50">
                  {String((activeIndex ?? 0) + 1).padStart(2, "0")} /{" "}
                  {String(photos.length).padStart(2, "0")}
                </span>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  className="flex h-9 items-center gap-2 border border-ink/20 px-3 text-[10px] uppercase tracking-[0.2em] text-ink/65 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                >
                  关闭 <span aria-hidden>×</span>
                </button>
              </div>

              <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-8">
                <img
                  ref={imageRef}
                  key={active.id}
                  src={activeSrc}
                  alt={active.title ?? "摄影作品"}
                  width={active.width}
                  height={active.height}
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    transformOrigin: "top left",
                    width: "auto",
                    height: "auto",
                    backgroundImage: `url(${active.thumbUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    willChange: "transform",
                  }}
                  className="max-h-full max-w-full object-contain shadow-[0_24px_80px_rgba(20,18,16,0.22)]"
                />
              </div>

              <div
                className="border-t border-ink/10 bg-white/30 px-4 py-4 sm:px-8"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                  {active.dateTaken ? (
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-ink/40">
                      {formatDate(active.dateTaken)}
                    </p>
                  ) : null}
                  {active.title ? (
                    <h3 className="mt-1 font-display text-xl tracking-[-0.01em]">
                      {active.title}
                    </h3>
                  ) : null}
                  {active.caption ? (
                    <p className="mt-2 max-w-2xl whitespace-pre-line text-[13px] leading-relaxed text-ink/65">
                      {active.caption}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-ink/50">
                    {exifLine(active) || active.fileName}
                  </p>
                  {active.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                      {active.tags.map((tag) => (
                        <span
                          key={tag}
                          className="border border-ink/15 px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-ink/55"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {activeLinks.length > 0 ? (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {activeLinks.map((link) => (
                        <Link
                          key={`${link.href}-${link.label}`}
                          href={link.href}
                          className="inline-flex items-center gap-1.5 border border-ink/25 px-2.5 py-1.5 text-[10px] tracking-[0.06em] text-ink/65 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                        >
                          {link.label} <span aria-hidden>↗</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      className="flex h-10 w-10 items-center justify-center border border-ink/20 text-ink/60 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                      aria-label="上一张"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      className="flex h-10 w-10 items-center justify-center border border-ink/20 text-ink/60 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                      aria-label="下一张"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
