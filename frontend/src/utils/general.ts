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

export const formatMessageDateIntl = (
  sentAt: Date | null | undefined
): string => {
  if (!sentAt) return "";

  const messageDate = new Date(sentAt);
  const now = new Date();

  const diffMs = now.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays === 0) {
    return `Today at ${timeFormatter.format(messageDate)}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${timeFormatter.format(messageDate)}`;
  } else if (diffDays <= 7) {
    return `${diffDays} days ago`;
  } else if (diffDays <= 30) {
    return `${Math.round(diffDays / 7)} weeks ago`;
  } else if (diffDays <= 365) {
    return `${Math.round(diffDays / 30)} months ago`;
  } else {
    return `${Math.round(diffDays / 365)} years ago`;
    // return dateFormatter.format(messageDate);
  }
};

export const formatMessageDateIntlShort = (
  sentAt: Date | null | undefined
): string => {
  if (!sentAt) return "";

  const messageDate = new Date(sentAt);
  const now = new Date();

  const diffMs = now.getTime() - messageDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Handle granular cases
  if (diffSeconds < 10) {
    return "just now";
  } else if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  } else if (diffMinutes === 1) {
    return "a minute ago";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours === 1) {
    return "an hour ago";
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays <= 7) {
    return `${diffDays} days ago`;
  } else if (diffDays <= 30) {
    return `${Math.round(diffDays / 7)} weeks ago`;
  } else if (diffDays <= 365) {
    return `${Math.round(diffDays / 30)} months ago`;
  } else {
    return `${Math.round(diffDays / 365)} years ago`;
  }
};

// Helper function for formatting timecodes
export const formatTimecode = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
