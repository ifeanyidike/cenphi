import React from "react";

// Base icon component
interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Helper function to generate icon components
const createIcon = (viewBox: string, path: React.ReactNode) => {
  return ({ size = 24, color = "currentColor", className = "" }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {path}
    </svg>
  );
};

// Icon definitions
export const ArrowCounterClockwise = createIcon(
  "0 0 24 24",
  <path d="M3 2v6h6M21 12A9 9 0 1 1 6.16 6.16L3 9" />
);

export const ArrowClockwise = createIcon(
  "0 0 24 24",
  <path d="M21 2v6h-6M3 12a9 9 0 0 0 15.84 5.84L21 15" />
);

export const Crop = createIcon(
  "0 0 24 24",
  <>
    <path d="M6 2v14a2 2 0 0 0 2 2h14" />
    <path d="M18 22V8a2 2 0 0 0-2-2H2" />
  </>
);

export const MagnifyingGlassPlus = createIcon(
  "0 0 24 24",
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </>
);

export const TextT = createIcon(
  "0 0 24 24",
  <>
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </>
);

export const Pencil = createIcon(
  "0 0 24 24",
  <>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </>
);

export const SlidersHorizontal = createIcon(
  "0 0 24 24",
  <>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="2" y1="14" x2="6" y2="14" />
    <line x1="10" y1="8" x2="14" y2="8" />
    <line x1="18" y1="16" x2="22" y2="16" />
  </>
);

export const X = createIcon(
  "0 0 24 24",
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
);

export const Check = createIcon(
  "0 0 24 24",
  <polyline points="20 6 9 17 4 12" />
);

export const ImageSquare = createIcon(
  "0 0 24 24",
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </>
);

export const Note = createIcon(
  "0 0 24 24",
  <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </>
);

export const Download = createIcon(
  "0 0 24 24",
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
);

export const Share = createIcon(
  "0 0 24 24",
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </>
);

export const Trash = createIcon(
  "0 0 24 24",
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </>
);

export const Edit = createIcon(
  "0 0 24 24",
  <>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </>
);

export const Plus = createIcon(
  "0 0 24 24",
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>
);

export const Minus = createIcon(
  "0 0 24 24",
  <line x1="5" y1="12" x2="19" y2="12" />
);

export const Maximize = createIcon(
  "0 0 24 24",
  <>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </>
);

export const Minimize = createIcon(
  "0 0 24 24",
  <>
    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </>
);

export const RotateLeft = createIcon(
  "0 0 24 24",
  <>
    <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
  </>
);

export const RotateRight = createIcon(
  "0 0 24 24",
  <>
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
  </>
);

export const Cursor = createIcon(
  "0 0 24 24",
  <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
);
