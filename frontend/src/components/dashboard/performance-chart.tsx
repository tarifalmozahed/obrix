"use client";

import { useState } from "react";

interface DataPoint {
  month: string;
  revenue: number; // in $K
  expenses: number;
}

const sampleData: DataPoint[] = [
  { month: "Jan", revenue: 42, expenses: 28 },
  { month: "Feb", revenue: 48, expenses: 31 },
  { month: "Mar", revenue: 55, expenses: 35 },
  { month: "Apr", revenue: 51, expenses: 33 },
  { month: "May", revenue: 64, expenses: 38 },
  { month: "Jun", revenue: 70, expenses: 42 },
  { month: "Jul", revenue: 68, expenses: 40 },
  { month: "Aug", revenue: 76, expenses: 44 },
  { month: "Sep", revenue: 79, expenses: 46 },
  { month: "Oct", revenue: 86, expenses: 49 },
];

export function PerformanceChart() {
  const [activePoint, setActivePoint] = useState<DataPoint | null>(null);
  const [filter, setFilter] = useState<"10M" | "6M">("10M");

  const displayData = filter === "6M" ? sampleData.slice(-6) : sampleData;

  const maxVal = 100;
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  // Calculate coordinates
  const points = displayData.map((d, i) => {
    const x = paddingX + (i / (displayData.length - 1)) * chartW;
    const y = svgHeight - paddingY - (d.revenue / maxVal) * chartH;
    return { ...d, x, y };
  });

  // SVG path for line
  const linePath = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  // SVG path for area fill
  const areaPath = `
    ${linePath} 
    L ${points[points.length - 1].x} ${svgHeight - paddingY} 
    L ${points[0].x} ${svgHeight - paddingY} 
    Z
  `;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Performance Overview
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Demo Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monthly gross revenue trends across all business operations.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter("6M")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              filter === "6M"
                ? "bg-white text-indigo-600 font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 6 Months
          </button>
          <button
            type="button"
            onClick={() => setFilter("10M")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              filter === "10M"
                ? "bg-white text-indigo-600 font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Year to Date
          </button>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 select-none"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = svgHeight - paddingY - (val / maxVal) * chartH;
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px]"
                >
                  ${val}k
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#revenueGradient)" />

          {/* Main line */}
          <path
            d={linePath}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p) => {
            const isHovered = activePoint?.month === p.month;
            return (
              <g
                key={p.month}
                className="cursor-pointer"
                onMouseEnter={() => setActivePoint(p)}
                onMouseLeave={() => setActivePoint(null)}
              >
                {/* Invisible larger hit target */}
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                {/* Point dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#ffffff"
                  stroke="#4f46e5"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />

                {/* Month Label */}
                <text
                  x={p.x}
                  y={svgHeight - paddingY + 16}
                  textAnchor="middle"
                  className={`text-[11px] transition-colors ${
                    isHovered
                      ? "fill-indigo-600 font-bold"
                      : "fill-slate-400 font-medium"
                  }`}
                >
                  {p.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activePoint && (
          <div className="absolute top-2 right-4 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-md text-xs">
            <span className="font-semibold text-slate-900">
              {activePoint.month}:
            </span>{" "}
            <span className="font-bold text-indigo-600">
              ${activePoint.revenue},000
            </span>{" "}
            <span className="text-slate-400 text-[11px]">revenue</span>
          </div>
        )}
      </div>

      {/* Legend & Summary */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-600" />
          <span>Gross Revenue ($)</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Peak: <span className="font-semibold text-slate-700">$86,420 (Current)</span>
        </div>
      </div>
    </div>
  );
}
