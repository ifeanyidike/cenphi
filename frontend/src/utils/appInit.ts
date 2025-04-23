import { canvasCoordinator } from "../services/CanvasCoordinator";

/**
 * Initialize the application and its dependencies
 */
export function initializeApp() {
  // Make canvas coordinator available globally
  if (typeof window !== "undefined") {
    window.canvasCoordinator = canvasCoordinator;
  }

  // Add any other global initializations here

  // Set up performance monitoring
  setupPerformanceMonitoring();

  console.log("Application initialized");
}

/**
 * Set up performance monitoring for debugging
 */
function setupPerformanceMonitoring() {
  if (typeof window === "undefined" || !window.performance || !window.console)
    return;

  // Check for long frames that might cause UI jank
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let longFrames = 0;

  // Request animation frame loop to measure frame times
  function checkFrameTimes() {
    const now = performance.now();
    const frameDuration = now - lastFrameTime;

    // Consider frames taking longer than 33ms (less than 30fps) as problematic
    if (frameDuration > 33) {
      longFrames++;

      // Log severe frame drops (less than 15fps)
      if (frameDuration > 66) {
        console.warn(
          `Performance: Long frame detected (${frameDuration.toFixed(1)}ms)`
        );
      }
    }

    frameCount++;
    lastFrameTime = now;

    // Log performance stats periodically
    if (frameCount % 300 === 0) {
      // Every ~5 seconds at 60fps
      const longFramePercentage = (longFrames / frameCount) * 100;

      if (longFramePercentage > 10) {
        console.warn(
          `Performance: ${longFramePercentage.toFixed(1)}% of frames took longer than 33ms ` +
            `(${longFrames} of ${frameCount})`
        );
      }

      // Reset counters
      longFrames = 0;
      frameCount = 0;
    }

    requestAnimationFrame(checkFrameTimes);
  }

  // Start performance monitoring
  requestAnimationFrame(checkFrameTimes);
}
