// src/components/capture-widget/utils/formatting.ts

/**
 * Formats seconds into MM:SS format
 * @param seconds - Number of seconds to format
 * @returns Formatted time string (MM:SS)
 */
// export const formatTime = (seconds: number): string => {
//   const mins = Math.floor(seconds / 60);
//   const secs = seconds % 60;
//   return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
// };

export const formatTime = (seconds: number): string => {
  // Handle invalid inputs gracefully
  if (
    seconds === undefined ||
    seconds === null ||
    isNaN(seconds) ||
    !isFinite(seconds)
  ) {
    return "0:00";
  }

  // Ensure seconds is treated as a number and handle very small values
  seconds = Number(seconds);
  if (seconds < 0.1) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * Generates a title from transcript text
 * @param transcript - Transcript text
 * @returns Generated title
 */
export const generateTitleFromTranscript = (transcript: string): string => {
  if (!transcript || transcript.length < 10) return "";

  // Take first 8-10 words from transcript
  const words = transcript.split(" ");
  const titleWords = words.slice(0, Math.min(10, words.length));
  let title = titleWords.join(" ");

  // Add ellipsis if truncated
  if (words.length > 10) {
    title += "...";
  }

  return title;
};

/**
 * Generates a session ID for the testimonial
 * @returns A unique session ID
 */
export const generateSessionId = (): string => {
  return "tw-" + Date.now().toString();
};

/**
 * Generates a simple QR code image from text
 * @param text - Text to encode in QR code
 * @returns Data URL of the QR code image
 */
export const generateQRCode = (text: string): string => {
  // This is a simplified placeholder implementation
  // In a real application, use a library like qrcode.react

  // Simple hash function for generating QR code pattern
  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // Define QR code options
  const moduleCount = 33; // This will create a 33x33 QR code (version 3)
  const cellSize = 5;
  const margin = 4;
  const size = moduleCount * cellSize + 2 * margin * cellSize;

  // Create canvas element
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return "";
  }

  // Fill background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, size, size);

  // Simulate QR code pattern
  ctx.fillStyle = "#000000";

  // Draw position detection patterns (the three big squares in corners)
  // Top-left
  ctx.fillRect(
    margin * cellSize,
    margin * cellSize,
    7 * cellSize,
    7 * cellSize
  );
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(
    (margin + 1) * cellSize,
    (margin + 1) * cellSize,
    5 * cellSize,
    5 * cellSize
  );
  ctx.fillStyle = "#000000";
  ctx.fillRect(
    (margin + 2) * cellSize,
    (margin + 2) * cellSize,
    3 * cellSize,
    3 * cellSize
  );

  // Top-right
  ctx.fillStyle = "#000000";
  ctx.fillRect(
    size - (margin + 7) * cellSize,
    margin * cellSize,
    7 * cellSize,
    7 * cellSize
  );
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(
    size - (margin + 6) * cellSize,
    (margin + 1) * cellSize,
    5 * cellSize,
    5 * cellSize
  );
  ctx.fillStyle = "#000000";
  ctx.fillRect(
    size - (margin + 5) * cellSize,
    (margin + 2) * cellSize,
    3 * cellSize,
    3 * cellSize
  );

  // Bottom-left
  ctx.fillStyle = "#000000";
  ctx.fillRect(
    margin * cellSize,
    size - (margin + 7) * cellSize,
    7 * cellSize,
    7 * cellSize
  );
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(
    (margin + 1) * cellSize,
    size - (margin + 6) * cellSize,
    5 * cellSize,
    5 * cellSize
  );
  ctx.fillStyle = "#000000";
  ctx.fillRect(
    (margin + 2) * cellSize,
    size - (margin + 5) * cellSize,
    3 * cellSize,
    3 * cellSize
  );

  // Add random-looking data modules to make it look like a QR code
  ctx.fillStyle = "#000000";
  const hash = simpleHash(text);

  for (let i = 0; i < moduleCount; i++) {
    for (let j = 0; j < moduleCount; j++) {
      // Skip the position detection patterns and their quiet zones
      if (
        (i < 9 && j < 9) || // Top-left
        (i < 9 && j > moduleCount - 10) || // Top-right
        (i > moduleCount - 10 && j < 9) // Bottom-left
      ) {
        continue;
      }

      // Some pseudo-random pattern based on the hash and position
      if ((hash + i * j + i + j) % 3 === 0) {
        ctx.fillRect(
          (margin + i) * cellSize,
          (margin + j) * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }

  return canvas.toDataURL("image/png");
};

/**
 * Convert hexadecimal color to RGBA
 * @param hex - Hexadecimal color code
 * @param alpha - Alpha value (0-1)
 * @returns RGBA color string
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Adjusts a hex color by a given percentage
 * @param hex - Hexadecimal color code
 * @param percent - Percentage to adjust by (positive to lighten, negative to darken)
 * @returns Adjusted hex color
 */
export const adjustColor = (hex: string, percent: number): string => {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
  g = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
  b = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};
