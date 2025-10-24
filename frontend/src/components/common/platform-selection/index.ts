/**
 * Platform Selection Components
 *
 * Reusable aspect ratio and platform selectors for AI processing flows.
 */

export { AspectRatioSelector, type AspectRatio } from './AspectRatioSelector';
export {
  PlatformSelector,
  ALL_PLATFORMS,
  DEFAULT_PLATFORMS,
  getPlatformsByAspectRatio,
  type Platform,
} from './PlatformSelector';
