/**
 * Studio Helper Utilities
 *
 * Shared utilities for studio components
 */

export type ServiceType =
  | 'platform_optimization'
  | 'story_video'
  | 'clipping'
  | 'enhancement'
  | 'custom_pipeline';

/**
 * Get display name for service type
 */
export const getServiceDisplayName = (serviceType: ServiceType): string => {
  const names: Record<ServiceType, string> = {
    platform_optimization: 'Platform Optimization',
    story_video: 'Story Video',
    clipping: 'Clipping',
    enhancement: 'Enhancement',
    custom_pipeline: 'Custom Pipeline',
  };

  return names[serviceType] || serviceType;
};

/**
 * Get short display name for service type
 */
export const getServiceShortName = (serviceType: ServiceType): string => {
  const names: Record<ServiceType, string> = {
    platform_optimization: 'Optimize',
    story_video: 'Story',
    clipping: 'Clip',
    enhancement: 'Enhance',
    custom_pipeline: 'Custom',
  };

  return names[serviceType] || serviceType;
};

/**
 * Sanitize error messages for user display
 */
export const sanitizeErrorMessage = (message: string | undefined): string => {
  if (!message) return 'An error occurred during processing';

  // Remove technical stack traces
  const withoutStack = message.split('\n')[0];

  // Remove internal error codes
  const withoutCodes = withoutStack.replace(/\[.*?\]/g, '').trim();

  // Common error patterns to simplify
  const simplifications: Record<string, string> = {
    'ECONNREFUSED': 'Connection failed. Please try again.',
    'ETIMEDOUT': 'Request timed out. Please try again.',
    'Failed to fetch': 'Network error. Please check your connection.',
    'NetworkError': 'Network error. Please check your connection.',
    'timeout': 'Operation timed out. Please try again.',
  };

  for (const [pattern, replacement] of Object.entries(simplifications)) {
    if (withoutCodes.includes(pattern)) {
      return replacement;
    }
  }

  // If message is too long, truncate it
  if (withoutCodes.length > 150) {
    return withoutCodes.substring(0, 150) + '...';
  }

  return withoutCodes || 'An error occurred during processing';
};

/**
 * Calculate overall progress from multiple jobs
 */
export const calculateOverallProgress = (jobs: Array<{ progress: number }>): number => {
  if (jobs.length === 0) return 0;

  const total = jobs.reduce((sum, job) => sum + job.progress, 0);
  return Math.round(total / jobs.length);
};

/**
 * Format duration in seconds to human-readable string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

/**
 * Get elapsed time since date
 */
export const getElapsedTime = (startDate: Date): string => {
  const now = new Date().getTime();
  const start = new Date(startDate).getTime();
  const elapsed = (now - start) / 1000; // Convert to seconds

  return formatDuration(elapsed);
};
