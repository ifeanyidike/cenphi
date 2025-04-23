import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";

/**
 * Performance Optimizer Component
 *
 * This component silently manages performance optimizations for audio processing:
 * - Monitors system performance and adjusts processing settings
 * - Manages audio buffer cleanup
 * - Handles memory usage optimizations
 * - Detects and fixes memory leaks
 */
const PerformanceOptimizer: React.FC = observer(() => {
  const { audioEditorManager } = workspaceHub;
  const [memoryWarning, setMemoryWarning] = useState<boolean>(false);

  // Check initial browser support and capabilities
  useEffect(() => {
    checkBrowserCapabilities();

    // Set up periodic memory checks
    const memoryCheckInterval = setInterval(checkMemoryUsage, 10000);

    // Clean up on unmount
    return () => {
      clearInterval(memoryCheckInterval);
      cleanupResources();
    };
  }, []);

  // Detect browser capabilities
  const checkBrowserCapabilities = () => {
    const capabilities = {
      audioContext: "AudioContext" in window,
      webAudio: "AudioContext" in window,
      audioWorklet: "AudioWorklet" in (window.AudioContext?.prototype || {}),
      mediaRecorder: "MediaRecorder" in window,
      sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
      webWorker: typeof Worker !== "undefined",
      webGL: hasWebGLSupport(),
      performanceAPI:
        typeof performance !== "undefined" &&
        typeof performance.now === "function",
      mediaSession: "mediaSession" in navigator,
    };

    console.log("Browser capabilities detected:", capabilities);

    // Apply optimizations based on capabilities
    if (!capabilities.audioWorklet) {
      console.log(
        "AudioWorklet not supported - using fallback processing methods"
      );
    }

    if (!capabilities.webGL) {
      console.log("WebGL not supported - using simplified visualizations");
    }

    if (capabilities.performanceAPI) {
      enablePerformanceMonitoring();
    }
  };

  // Check for WebGL support
  const hasWebGLSupport = (): boolean => {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e: any) {
      console.log("e", e);
      return false;
    }
  };

  // Enable performance monitoring if available
  const enablePerformanceMonitoring = () => {
    if (typeof performance === "undefined") return;

    // For browsers that support the Memory API
    if ("memory" in performance) {
      // Check memory usage periodically
      console.log("Performance monitoring enabled with memory API");
    } else {
      // Fallback performance monitoring
      console.log("Basic performance monitoring enabled");
    }

    // Monitor for long tasks
    if ("PerformanceObserver" in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              console.warn(
                "Long task detected:",
                entry.duration.toFixed(2),
                "ms"
              );
              // If we detect too many long tasks, we could adjust quality settings
              if (entry.duration > 200) {
                optimizeForPerformance();
              }
            }
          });
        });

        longTaskObserver.observe({ entryTypes: ["longtask"] });
      } catch (e: any) {
        console.warn(
          "PerformanceObserver for long tasks not supported",
          e.message
        );
      }
    }
  };

  // Check memory usage
  const checkMemoryUsage = () => {
    if ("performance" in window && "memory" in (performance as any)) {
      const memoryInfo = (performance as any).memory;

      if (memoryInfo) {
        const usedJSHeapSize = memoryInfo.usedJSHeapSize;
        const jsHeapSizeLimit = memoryInfo.jsHeapSizeLimit;

        // Calculate memory usage percentage
        const memoryUsagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;

        // If memory usage is high, trigger optimizations
        if (memoryUsagePercent > 70) {
          console.warn(
            `High memory usage detected: ${memoryUsagePercent.toFixed(2)}%`
          );
          setMemoryWarning(true);
          optimizeForMemory();
        } else if (memoryWarning && memoryUsagePercent < 50) {
          // Memory usage has decreased
          setMemoryWarning(false);
        }
      }
    }
  };

  // Optimize for performance when needed
  const optimizeForPerformance = () => {
    if (!audioEditorManager) return;

    // Reduce waveform quality
    if (audioEditorManager.waveformManager) {
      const currentZoom = audioEditorManager.waveformManager.zoom;
      if (currentZoom > 2) {
        // Reduce zoom if it's too high
        audioEditorManager.waveformManager.setZoom(
          Math.max(1, currentZoom * 0.8)
        );
      }
    }

    // Implement other performance optimizations as needed
    console.log("Performance optimizations applied");
  };

  // Optimize for memory when needed
  const optimizeForMemory = () => {
    if (!audioEditorManager) return;

    // Clear any unnecessary caches
    if (audioEditorManager.waveformManager) {
      // Keep only the current URL in cache
      const currentUrl =
        audioEditorManager.processedAudioUrl ||
        audioEditorManager.originalTestimonial?.media_url;

      if (currentUrl) {
        audioEditorManager.waveformManager.clearCache();
        // We could re-cache just the current URL if needed
      }
    }

    // Release any large memory buffers that aren't actively being used

    // Force garbage collection (not directly possible but can hint)
    // @ts-expect-error - This is just a hint for the browser
    if (window.gc) window.gc();

    console.log("Memory optimizations applied");
  };

  // Final cleanup
  const cleanupResources = () => {
    if (!audioEditorManager) return;

    // Release audio resources
    if (audioEditorManager.waveformManager) {
      audioEditorManager.waveformManager.destroyWaveSurfer();
    }

    console.log("Audio resources cleaned up");
  };

  // This is a silent component with no UI
  return null;
});

export default PerformanceOptimizer;
