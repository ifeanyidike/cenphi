// Utility function to generate a color from text
export const generateColorFromText = (text: string | undefined) => {
  if (!text) return "";
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use the hash to generate a hue between 0 and 360
  const hue = Math.abs(hash) % 360;
  // Return an HSL color with fixed saturation and lightness
  return `hsl(${hue}, 60%, 70%)`;
};
