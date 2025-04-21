import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date according to the specified format.
 * 
 * @param date - The date to format
 * @param format - The desired format string: 
 *   "MM-DD-YYYY" -> "01-15-2023"
 *   "YYYY-MM-DD" -> "2023-01-15"
 *   "MMM DD, YYYY" -> "Jan 15, 2023"
 *   "DD MMM YYYY" -> "15 Jan 2023"
 *   "relative" -> "2 days ago"
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: string = "MM-DD-YYYY"): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }
  
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const monthName = monthNames[date.getMonth()];
  
  switch (format) {
    case "MM-DD-YYYY":
      return `${month}-${day}-${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "MMM DD, YYYY":
      return `${monthName} ${day}, ${year}`;
    case "DD MMM YYYY":
      return `${day} ${monthName} ${year}`;
    case "relative":
      return getRelativeTimeString(date);
    default:
      return `${month}-${day}-${year}`;
  }
}

/**
 * Returns a relative time string (e.g., "2 days ago") based on the difference
 * between the provided date and the current date.
 */
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSecs < 60) {
    return "just now";
  } else if (diffInMins < 60) {
    return `${diffInMins} minute${diffInMins !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else {
    // For older dates, return the formatted date
    return formatDate(date, "MMM DD, YYYY");
  }
}