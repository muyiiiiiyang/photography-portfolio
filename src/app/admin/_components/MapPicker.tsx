"use client";

import { useMemo, useState } from "react";
import type { MouseEvent } from "react";

const TILE = 256;
const DEFAULT_CENTER = { lat: 31.2304, lng: 121.4737 };
const GRID_X = [-2, -1, 0, 1];
const GRID_Y = [-1, 0, 1];
const INNER_WIDTH = GRID_X.length * TILE;
const INNER_HEIGHT = GRID_Y.length * TILE;

function project(lat: number, lng: number, zoom: number) {
  const scale = 2 ** zoom;
  const x = ((lng + 180) / 360) * scale * TILE;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y =
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale * TILE;
  return { x, y };
}

function unproject(x: number, y: number, zoom: number) {
  const scale = 2 ** zoom;
  const lng = (x / (scale * TILE)) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / (scale * TILE);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface MapPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);
  const center = hasPoint
    ? { lat: lat as number, lng: lng as number }
    : DEFAULT_CENTER;

  const [zoom, setZoom] = useState(11);

  const view = useMemo(() => {
    const point = project(center.lat, center.lng, zoom);
    const tileX = Math.floor(point.x / TILE);
    const tileY = Math.floor(point.y / TILE);
    const offsetX = point.x - tileX * TILE;
    const offsetY = point.y - tileY * TILE;

    const tiles = [];
    for (const dx of GRID_X) {
      for (const dy of GRID_Y) {
        tiles.push({
          key: `${zoom}-${tileX + dx}-${tileY + dy}`,
          x: tileX + dx,
          y: tileY + dy,
          left: dx * TILE - offsetX + INNER_WIDTH / 2,
          top: dy * TILE - offsetY + INNER_HEIGHT / 2,
        });
      }
    }

    return { tiles };
  }, [center.lat, center.lng, zoom]);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const point = project(center.lat, center.lng, zoom);
    const next = unproject(point.x + dx, point.y + dy, zoom);

    onChange(
      Number(clamp(next.lat, -85, 85).toFixed(6)),
      Number(next.lng.toFixed(6)),
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label mb-0">地图选点</span>
        <span className="font-mono text-[9px] text-ink/35">
          {hasPoint
            ? `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`
            : "尚未设置坐标"}
        </span>
      </div>

      <div className="relative h-64 w-full overflow-hidden border border-ink/20 bg-paper-2">
        <div
          className="absolute left-1/2 top-1/2 h-[768px] w-[1024px] -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          {view.tiles.map((tile) => (
            <img
              key={tile.key}
              src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${tile.y}/${tile.x}`}
              alt=""
              width={TILE}
              height={TILE}
              draggable={false}
              loading="lazy"
              className="absolute h-64 w-64 select-none grayscale"
              style={{ left: tile.left, top: tile.top }}
            />
          ))}
        </div>

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full"
          aria-hidden
        >
          <span className="block h-4 w-4 rounded-full border-2 border-paper bg-red shadow-[0_0_0_1px_var(--color-ink)]" />
          <span className="mx-auto block h-2 w-px bg-ink/60" />
        </div>

        <div
          className="absolute inset-0 z-20 cursor-crosshair"
          onClick={handleClick}
          role="button"
          tabIndex={-1}
          aria-label="在地图上点击设置拍摄坐标"
        />

        <div className="absolute right-2 top-2 z-30 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setZoom((value) => clamp(value + 1, 3, 17))}
            className="flex h-7 w-7 items-center justify-center border border-ink bg-white text-sm hover:bg-yellow"
            aria-label="放大地图"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => clamp(value - 1, 3, 17))}
            className="flex h-7 w-7 items-center justify-center border border-ink bg-white text-sm hover:bg-yellow"
            aria-label="缩小地图"
          >
            −
          </button>
        </div>

        <span className="absolute bottom-1 left-2 z-30 bg-paper/80 px-1 text-[8px] text-ink/50">
          点击地图拾取坐标 · Tiles © Esri
        </span>
      </div>
    </div>
  );
}
