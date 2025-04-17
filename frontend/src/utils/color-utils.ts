// src/lib/color-utils.ts

/**
 * Convert a hex color to RGB values
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Check if it's a 3 or 6 character hex
  const isShortHex = hex.length === 3;
  const fullHex = isShortHex
    ? hex
        .split("")
        .map((char) => char + char)
        .join("")
    : hex;

  // Parse the hex value
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);

  if (!result) return null;

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB values to a hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Convert a hex color to an RGBA string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "rgba(0, 0, 0, 0)";

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Calculate a contrasting text color (black or white) for a given background color
 */
export function getContrastTextColor(bgColor: string): string {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return "#000000";

  // Calculate luminance using the relative luminance formula
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;

  // Return black or white based on luminance
  return luminance > 128 ? "#000000" : "#ffffff";
}

/**
 * Generate a lighter or darker shade of a color
 * @param hex The base color
 * @param amount Amount to lighten or darken (-1 to 1, negative for darker)
 */
export function shadeColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  // Adjust RGB values
  const r = Math.max(0, Math.min(255, rgb.r + rgb.r * amount));
  const g = Math.max(0, Math.min(255, rgb.g + rgb.g * amount));
  const b = Math.max(0, Math.min(255, rgb.b + rgb.b * amount));

  return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
}

/**
 * Generate a gradient based on a primary color
 */
export function generateGradient(
  primaryColor: string,
  direction: string = "to right"
): string {
  const lighterShade = shadeColor(primaryColor, 0.2);
  const darkerShade = shadeColor(primaryColor, -0.2);

  return `linear-gradient(${direction}, ${darkerShade}, ${primaryColor}, ${lighterShade})`;
}

/**
 * Convert a color name to hex
 */
export const colorNameToHex: Record<string, string> = {
  blue: "#3B82F6",
  indigo: "#6366F1",
  purple: "#8B5CF6",
  pink: "#EC4899",
  red: "#EF4444",
  orange: "#F97316",
  amber: "#F59E0B",
  yellow: "#EAB308",
  green: "#10B981",
  teal: "#14B8A6",
  cyan: "#06B6D4",
  slate: "#64748B",
  gray: "#6B7280",
  zinc: "#71717A",
  neutral: "#737373",
  stone: "#78716C",
};

/**
 * Parse any color input (name, hex, rgb) and return a normalized hex color
 */
export function parseColorInput(color: string): string {
  // Check if it's a color name
  if (colorNameToHex[color.toLowerCase()]) {
    return colorNameToHex[color.toLowerCase()];
  }

  // Check if it's already a hex
  if (color.startsWith("#")) {
    return color;
  }

  // Check if it's an rgb/rgba color
  const rgbMatch = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
  );
  if (rgbMatch) {
    return rgbToHex(
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10)
    );
  }

  // Return a default color if we can't parse it
  return "#3B82F6";
}
