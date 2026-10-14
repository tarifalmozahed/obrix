"use client";

import React from "react";

interface SegmentedLogoProps {
  className?: string;
  size?: number;
}

/**
 * 4-Quadrant Metallic Segmented Orb Emblem
 * Inspired by the design in the reference screenshot
 */
export function SegmentedLogo({ className = "w-9 h-9", size = 36 }: SegmentedLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
      >
        <defs>
          {/* Top-Left Quadrant Brushed Metallic Gradient */}
          <radialGradient
            id="quadrant-tl"
            cx="40%"
            cy="40%"
            r="60%"
            fx="30%"
            fy="30%"
          >
            <stop offset="0%" stopColor="#8A929E" />
            <stop offset="45%" stopColor="#4A515D" />
            <stop offset="85%" stopColor="#252A32" />
            <stop offset="100%" stopColor="#15181E" />
          </radialGradient>

          {/* Top-Right Quadrant */}
          <radialGradient
            id="quadrant-tr"
            cx="60%"
            cy="40%"
            r="60%"
            fx="70%"
            fy="30%"
          >
            <stop offset="0%" stopColor="#717985" />
            <stop offset="50%" stopColor="#373D47" />
            <stop offset="85%" stopColor="#1C2026" />
            <stop offset="100%" stopColor="#101216" />
          </radialGradient>

          {/* Bottom-Left Quadrant */}
          <radialGradient
            id="quadrant-bl"
            cx="40%"
            cy="60%"
            r="60%"
            fx="30%"
            fy="70%"
          >
            <stop offset="0%" stopColor="#5E6571" />
            <stop offset="50%" stopColor="#2F353E" />
            <stop offset="85%" stopColor="#181B21" />
            <stop offset="100%" stopColor="#0B0D10" />
          </radialGradient>

          {/* Bottom-Right Quadrant */}
          <radialGradient
            id="quadrant-br"
            cx="60%"
            cy="60%"
            r="60%"
            fx="70%"
            fy="70%"
          >
            <stop offset="0%" stopColor="#808894" />
            <stop offset="45%" stopColor="#424853" />
            <stop offset="85%" stopColor="#21252D" />
            <stop offset="100%" stopColor="#13151A" />
          </radialGradient>

          {/* Cross Seam Inner Glow */}
          <linearGradient id="seam-glow" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Outer Circular Rim */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="#1A1D23"
          stroke="#2A2F38"
          strokeWidth="1.5"
        />

        {/* Top-Left Quadrant (Slice with rounded bevel & cross seam gap) */}
        <path
          d="M 47.5 47.5 L 47.5 5.5 A 44.5 44.5 0 0 0 5.5 47.5 Z"
          fill="url(#quadrant-tl)"
        />

        {/* Top-Right Quadrant */}
        <path
          d="M 52.5 47.5 L 94.5 47.5 A 44.5 44.5 0 0 0 52.5 5.5 Z"
          fill="url(#quadrant-tr)"
        />

        {/* Bottom-Left Quadrant */}
        <path
          d="M 47.5 52.5 L 5.5 52.5 A 44.5 44.5 0 0 0 47.5 94.5 Z"
          fill="url(#quadrant-bl)"
        />

        {/* Bottom-Right Quadrant */}
        <path
          d="M 52.5 52.5 L 52.5 94.5 A 44.5 44.5 0 0 0 94.5 52.5 Z"
          fill="url(#quadrant-br)"
        />

        {/* Subtle Horizontal & Vertical Seam Dividing Line Details */}
        <line x1="50" y1="5" x2="50" y2="95" stroke="#121418" strokeWidth="2.5" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="#121418" strokeWidth="2.5" />

        {/* Center Point Intersection Accent */}
        <circle cx="50" cy="50" r="3" fill="#1C2027" stroke="#2D333E" strokeWidth="0.75" />

        {/* Glass Sheen Ring */}
        <circle
          cx="50"
          cy="50"
          r="47.5"
          fill="none"
          stroke="url(#seam-glow)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
