"use client";

import { useId, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface Point {
  date: string;
  label: string;
  amount: number;
}

const WIDTH = 640;
const HEIGHT = 200;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 24;

export function RevenueChart({ points }: { points: Point[] }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const max = Math.max(1, ...points.map((p) => p.amount));
  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: PAD_L + step * i,
    y: PAD_T + innerH - (p.amount / max) * innerH,
    ...p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? 0} ${PAD_T + innerH} L ${coords[0]?.x ?? 0} ${PAD_T + innerH} Z`;

  const total = points.reduce((sum, p) => sum + p.amount, 0);
  const hovered = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <Card className="gap-1 p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Revenue — last 14 days</h2>
        <p className="text-sm font-semibold tabular-nums">{formatCurrency(total)}</p>
      </div>
      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label="Daily revenue over the last 14 days"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={PAD_L}
              x2={WIDTH - PAD_R}
              y1={PAD_T + innerH * (1 - f)}
              y2={PAD_T + innerH * (1 - f)}
              className="stroke-border"
              strokeWidth={1}
            />
          ))}

          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {coords.length > 0 && (
            <circle
              cx={coords[coords.length - 1].x}
              cy={coords[coords.length - 1].y}
              r={4}
              fill="var(--primary)"
            />
          )}

          {hovered && (
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PAD_T}
              y2={PAD_T + innerH}
              className="stroke-muted-foreground/30"
              strokeWidth={1}
            />
          )}

          {coords.map((c, i) => (
            <rect
              key={c.date}
              x={c.x - step / 2}
              y={PAD_T}
              width={step || WIDTH}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}

          {[0, Math.floor(points.length / 2), points.length - 1].map((i) => (
            <text
              key={i}
              x={coords[i]?.x ?? 0}
              y={HEIGHT - 6}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              className="fill-muted-foreground text-[10px]"
            >
              {points[i]?.label}
            </text>
          ))}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: `${(hovered.x / WIDTH) * 100}%` }}
          >
            <p className="font-medium text-popover-foreground">{formatCurrency(hovered.amount)}</p>
            <p className="text-muted-foreground">{hovered.label}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
