import React, { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";
import { useIsTouchDevice } from "../../../utils/responsiveUtils";

/**
 * Performance Optimizer component that monitors the application performance
 * and automatically adjusts quality settings to maintain smooth operation
 */
const PerformanceOptimizer: React.FC = observer(() => {
  const { videoEditorManager } = workspaceHub;
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastFpsCheck, setLastFpsCheck] = useState(0);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const isTouch = useIsTouchDevice();

  // Frames per second calculation
  const calculateFps = useCallback(() => {
    if (!window.canvasCoordinator) return;

    const now = performance.now();
    const elapsed = now - lastFpsCheck;
    if (elapsed < 1000) return; // Check once per second

    // Get average render time from canvas coordinator
    const avgRenderTime = window.canvasCoordinator.getAverageRenderTime();
    const fps = avgRenderTime > 0 ? 1000 / avgRenderTime : 60;

    // Add to history and keep last 5 measurements
    setFpsHistory((prev) => {
      const newHistory = [...prev, fps].slice(-5);
      return newHistory;
    });

    setLastFpsCheck(now);
  }, [lastFpsCheck]);

  // Detect performance issues and optimize
  const detectPerformanceIssues = useCallback(() => {
    if (fpsHistory.length < 3) return; // Need at least 3 data points

    // Calculate average FPS
    const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;

    // If performance is poor, optimize
    if (avgFps < 25 && !isOptimizing) {
      console.log(
        `Performance optimization: Detected slow performance (${avgFps.toFixed(1)} FPS)`
      );
      setIsOptimizing(true);

      // Apply optimizations
      videoEditorManager.setPreviewQuality("low");
      videoEditorManager.setCacheFrames(true);

      // Log the optimization
      console.log(
        "Performance optimization: Applied low quality and frame caching"
      );
    }
    // If performance is good and we're currently optimizing, restore quality
    else if (avgFps > 50 && isOptimizing) {
      console.log(
        `Performance optimization: Performance has improved (${avgFps.toFixed(1)} FPS)`
      );
      setIsOptimizing(false);

      // Restore quality
      videoEditorManager.setPreviewQuality("balanced");

      // Keep frame caching enabled for touch devices
      if (!isTouch) {
        videoEditorManager.setCacheFrames(false);
      }

      console.log("Performance optimization: Restored quality settings");
    }
  }, [fpsHistory, isOptimizing, videoEditorManager, isTouch]);

  // Monitor performance continuously
  useEffect(() => {
    // For touch devices, start with optimized settings
    if (isTouch) {
      videoEditorManager.setCacheFrames(true);
    }

    // Performance monitoring loop with requestAnimationFrame
    let rafId: number | null = null;

    const monitorPerformance = () => {
      calculateFps();
      detectPerformanceIssues();
      rafId = requestAnimationFrame(monitorPerformance);
    };

    rafId = requestAnimationFrame(monitorPerformance);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [calculateFps, detectPerformanceIssues, isTouch, videoEditorManager]);

  // This is an invisible component that just monitors performance
  return null;
});

export default PerformanceOptimizer;
