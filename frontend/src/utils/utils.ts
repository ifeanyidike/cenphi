export const getBadgeColor = (status: string): string => {
  switch (status) {
    case "New":
      return "text-purple-600 bg-purple-50";
    case "Replied":
      return "text-blue-600 bg-blue-50";
    case "Verified":
      return "text-green-600 bg-green-50";
    case "Featured":
      return "text-amber-600 bg-amber-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Format a date to a relative time string (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSecs < 60) {
    return "just now";
  } else if (diffInMins < 60) {
    return `${diffInMins} ${diffInMins === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  } else {
    return formatDate(date);
  }
}

/**
 * Simple debounce function for input handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Generate a random ID
 */
export function generateId(prefix = ""): string {
  return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(
  text: string,
  elementName: string,
  onCopy?: (element: string) => void,
  successCallback?: () => void,
  showToast?: (toast: {
    title: string;
    description: string;
    variant?: string;
  }) => void
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);

    if (onCopy) {
      onCopy(elementName);
    }

    if (successCallback) {
      successCallback();
    }

    if (showToast) {
      showToast({
        title: "Copied to Clipboard",
        description: `${elementName} has been copied to your clipboard.`,
        variant: "default",
      });
    }

    return true;
  } catch (err) {
    console.error("Failed to copy text:", err);

    if (showToast) {
      showToast({
        title: "Failed to Copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }

    return false;
  }
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert camelCase to Title Case
 */
export function camelToTitleCase(camelCase: string): string {
  if (!camelCase) return "";

  const result = camelCase.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Get first letters from a name (for avatars)
 */
export function getInitials(name: string): string {
  if (!name) return "C";

  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
}
