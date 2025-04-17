import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  FC,
} from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import { formatTimecode } from "@/utils/general";

// Minimum zoom level - 0.25 shows 4x more content
const MIN_ZOOM = 1;

const VideoTimeline: FC = observer(() => {
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    currentTime,
    duration,
    isPlaying,
    seek,
    timelineSegments,
    timelineMarkers,
    timelineZoom,
    setTimelineZoom,
    trim,
    subtitles,
    activeEditMode,
    setTrim,
    activeSubtitleId,
    setActiveSubtitle,
    waveformManager,
    originalTestimonial,
    processedVideoUrl,
  } = videoEditorManager;

  const videoDiscoveryRef = useRef<{
    element: HTMLVideoElement | null;
    attempts: number;
    maxAttempts: number;
  }>({
    element: null,
    attempts: 0,
    maxAttempts: 5,
  });

  // Refs for DOM elements and mutable state
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const trimStartRef = useRef<HTMLDivElement>(null);
  const trimEndRef = useRef<HTMLDivElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Drag state using refs for better performance
  const isDraggingRef = useRef<boolean>(false);
  const dragTypeRef = useRef<"playhead" | "trimStart" | "trimEnd" | null>(null);
  const dragStartInfoRef = useRef({
    clientX: 0,
    startTime: 0,
    rectLeft: 0,
    rectWidth: 0,
  });

  // UI state
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [waveformInitialized] = useState(false);
  const [visibleTimeRange, setVisibleTimeRange] = useState({
    start: 0,
    end: duration,
  });
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [snapToMarkers, setSnapToMarkers] = useState(true);
  const [tooltipContent, setTooltipContent] = useState<{
    show: boolean;
    text: string;
    x: number;
    y: number;
  }>({
    show: false,
    text: "",
    x: 0,
    y: 0,
  });
  const [activeTimelineAction, setActiveTimelineAction] = useState<
    string | null
  >(null);

  // Zoom and performance optimization
  const maxZoom = useMemo(
    () => Math.min(20, Math.max(5, Math.floor(duration / 10))),
    [duration]
  );
  const isScrollingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const throttleTimeRef = useRef<number>(25); // milliseconds

  useEffect(() => {
    // Only run if we haven't found a video element yet
    if (
      videoDiscoveryRef.current.element ||
      videoDiscoveryRef.current.attempts >=
        videoDiscoveryRef.current.maxAttempts
    ) {
      return;
    }

    const findVideoElement = () => {
      console.log("Searching for video element...");

      // First check if there's a global video element reference
      if (videoElementRef.current) {
        return videoElementRef.current;
      }

      // Try different strategies to find the video
      const strategies = [
        // Strategy 1: Look for any video element in the document
        () => document.querySelector("video"),

        // Strategy 2: Look in common player containers
        () => document.querySelector(".video-player video"),
        () => document.querySelector(".player-container video"),

        // Strategy 3: Look for video elements with src or data attributes
        () => document.querySelector("video[src]"),
        () => document.querySelector("video[data-src]"),

        // Strategy 4: Find by size (larger videos are likely the main video)
        () => {
          const videos = Array.from(document.querySelectorAll("video"));
          return videos.sort(
            (a, b) =>
              b.offsetWidth * b.offsetHeight - a.offsetWidth * a.offsetHeight
          )[0];
        },
      ];

      // Try each strategy
      for (const strategy of strategies) {
        const videoElement = strategy();
        if (videoElement) {
          return videoElement as HTMLVideoElement;
        }
      }

      return null;
    };

    // Attempt to find the video element
    const videoElement = findVideoElement();
    if (videoElement) {
      console.log("Found video element:", videoElement);
      videoElementRef.current = videoElement;
      videoDiscoveryRef.current.element = videoElement;

      // Connect to waveform manager if available
      if (waveformManager) {
        console.log("Connecting video element to waveform manager");
        waveformManager.setVideoElement(videoElement);
      }
    } else {
      // Increment attempts count
      videoDiscoveryRef.current.attempts++;

      if (
        videoDiscoveryRef.current.attempts <
        videoDiscoveryRef.current.maxAttempts
      ) {
        // Try again after a delay, with increasing intervals
        const delay =
          500 * Math.pow(1.5, videoDiscoveryRef.current.attempts - 1);
        console.log(`Video element not found, retrying in ${delay}ms...`);

        const retryTimer = setTimeout(() => {
          // This will trigger the effect to run again
          videoDiscoveryRef.current = {
            ...videoDiscoveryRef.current,
            attempts: videoDiscoveryRef.current.attempts,
          };
        }, delay);

        return () => clearTimeout(retryTimer);
      } else {
        console.warn("Failed to find video element after multiple attempts");
        // Handle the failure case - can still try to generate waveform without video element
        if (waveformManager && waveformContainerRef.current) {
          waveformManager.setContainer(waveformContainerRef.current);

          const videoUrl =
            processedVideoUrl || originalTestimonial?.media_url || "";

          if (videoUrl) {
            console.log(
              "Attempting to generate waveform without video element"
            );
            waveformManager.generateWaveform(videoUrl);
          }
        }
      }
    }
  }, [videoDiscoveryRef.current.attempts]);

  // Update timeline width measurement
  useEffect(() => {
    const updateTimelineWidth = () => {
      if (timelineRef.current) {
        const width = timelineRef.current.clientWidth;
        setTimelineWidth(width);
      }
    };

    updateTimelineWidth();

    const resizeObserver = new ResizeObserver(updateTimelineWidth);
    if (timelineRef.current) {
      resizeObserver.observe(timelineRef.current);
    }

    window.addEventListener("resize", updateTimelineWidth);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateTimelineWidth);
    };
  }, []);

  // Initialize waveform manager with container and video URL
  // useEffect(() => {
  //   if (
  //     !waveformContainerRef.current ||
  //     !waveformManager ||
  //     waveformInitialized
  //   ) {
  //     return;
  //   }

  //   // Set explicit dimensions to ensure visibility
  //   waveformContainerRef.current.style.height = "40px";
  //   waveformContainerRef.current.style.width = "100%";

  //   console.log("Initializing waveform container");
  //   waveformManager.setContainer(waveformContainerRef.current);
  //   setWaveformInitialized(true);

  //   // Load the video URL only once the container is set
  //   const initWaveform = () => {
  //     // Determine which URL to use
  //     const videoUrl =
  //       processedVideoUrl || originalTestimonial?.media_url || "";

  //     if (videoUrl) {
  //       console.log("Generating waveform for:", videoUrl);
  //       waveformManager.generateWaveform(videoUrl);
  //     }
  //   };

  //   // Short delay to ensure container is fully rendered
  //   const timer = setTimeout(initWaveform, 100);

  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, [waveformManager, waveformContainerRef.current, waveformInitialized]);
  useEffect(() => {
    if (!waveformContainerRef.current || !waveformManager) {
      return;
    }

    // Set explicit dimensions to ensure visibility
    waveformContainerRef.current.style.height = "40px";
    waveformContainerRef.current.style.width = "100%";

    console.log("Initializing waveform container");

    // Set the container
    waveformManager.setContainer(waveformContainerRef.current);

    // Determine which URL to use
    const videoUrl = processedVideoUrl || originalTestimonial?.media_url || "";

    if (videoUrl) {
      console.log("Generating waveform for:", videoUrl);
      // Force regenerate to ensure we get a clean attempt
      waveformManager.generateWaveform(videoUrl, true);
    }

    // Cleanup on unmount
    return () => {
      if (waveformManager) {
        waveformManager.destroyWaveSurfer();
      }
    };
  }, [
    waveformContainerRef.current,
    processedVideoUrl,
    originalTestimonial?.media_url,
  ]);

  // Update waveform when video URL changes
  useEffect(() => {
    if (!waveformManager || !waveformInitialized) {
      return;
    }

    const videoUrl = processedVideoUrl || originalTestimonial?.media_url || "";

    if (videoUrl) {
      console.log("Video URL changed, regenerating waveform");
      waveformManager.generateWaveform(videoUrl);
    }
  }, [processedVideoUrl, originalTestimonial?.media_url, waveformInitialized]);

  // Update zoom level when timeline zoom changes
  useEffect(() => {
    if (waveformManager && waveformInitialized && timelineZoom) {
      console.log("Timeline zoom changed to:", timelineZoom);
      waveformManager.setZoom(timelineZoom);
    }
  }, [waveformManager, timelineZoom, waveformInitialized]);

  // Update waveform position when current time changes
  useEffect(() => {
    if (waveformManager && waveformInitialized && currentTime >= 0) {
      waveformManager.seekTo(currentTime);
    }
  }, [waveformManager, currentTime, waveformInitialized]);

  // Update trim region when trim points change
  useEffect(() => {
    if (waveformManager && waveformInitialized && trim) {
      waveformManager.updateTrimRegion(trim.startTime, trim.endTime);
    }
  }, [waveformManager, trim.startTime, trim.endTime, waveformInitialized]);

  // Update visible time range
  useEffect(() => {
    if (!timelineContainerRef.current) return;

    const updateVisibleRange = () => {
      const scrollLeft = timelineContainerRef.current?.scrollLeft || 0;
      const containerWidth =
        timelineContainerRef.current?.clientWidth || timelineWidth;
      const fullWidth = timelineWidth * timelineZoom;

      if (fullWidth <= 0) return;

      const startTime = (scrollLeft / fullWidth) * duration;
      const endTime = ((scrollLeft + containerWidth) / fullWidth) * duration;

      setVisibleTimeRange({
        start: Math.max(0, startTime),
        end: Math.min(duration, endTime),
      });
    };

    updateVisibleRange();

    const scrollHandler = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;

        // Throttle updates using requestAnimationFrame
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          updateVisibleRange();
          isScrollingRef.current = false;
        });
      }
    };

    timelineContainerRef.current.addEventListener("scroll", scrollHandler, {
      passive: true,
    });

    return () => {
      if (timelineContainerRef.current) {
        timelineContainerRef.current.removeEventListener(
          "scroll",
          scrollHandler
        );
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [timelineWidth, timelineZoom, duration]);

  // Auto-scroll to keep playhead in view during playback
  useEffect(() => {
    if (!isAutoScrollEnabled || !isPlaying || !timelineContainerRef.current)
      return;

    const scrollToPlayhead = () => {
      const playheadPosition =
        (currentTime / duration) * timelineWidth * timelineZoom;
      const scrollLeft = timelineContainerRef.current?.scrollLeft || 0;
      const containerWidth = timelineContainerRef.current?.clientWidth || 0;

      // Calculate buffer zones (20% from left edge, 20% from right edge)
      const leftBuffer = containerWidth * 0.2;
      const rightBuffer = containerWidth * 0.8;

      // Check if playhead is outside the buffer zones
      if (playheadPosition < scrollLeft + leftBuffer) {
        // Playhead is too far left
        timelineContainerRef.current?.scrollTo({
          left: Math.max(0, playheadPosition - leftBuffer),
          behavior: "smooth",
        });
      } else if (playheadPosition > scrollLeft + rightBuffer) {
        // Playhead is too far right
        timelineContainerRef.current?.scrollTo({
          left: playheadPosition - rightBuffer,
          behavior: "smooth",
        });
      }
    };

    // Use interval instead of watching currentTime to prevent too many updates
    const scrollInterval = setInterval(scrollToPlayhead, 500);

    return () => clearInterval(scrollInterval);
  }, [
    currentTime,
    isPlaying,
    duration,
    timelineWidth,
    timelineZoom,
    isAutoScrollEnabled,
  ]);

  // Cleanup waveformManager on component unmount
  useEffect(() => {
    return () => {
      if (waveformManager) {
        waveformManager.destroyWaveSurfer();
      }
    };
  }, [waveformManager]);

  // Convert time to position
  const timeToPosition = useCallback(
    (time: number): number => {
      if (duration <= 0) return 0;
      return (time / duration) * timelineWidth * timelineZoom;
    },
    [duration, timelineWidth, timelineZoom]
  );

  // Convert position to time
  const positionToTime = useCallback(
    (position: number): number => {
      if (timelineWidth <= 0 || timelineZoom <= 0 || duration <= 0) return 0;
      return (position / (timelineWidth * timelineZoom)) * duration;
    },
    [duration, timelineWidth, timelineZoom]
  );

  // Find nearest marker for snapping with performance optimization
  const findNearestSnapPoint = useCallback(
    (time: number, threshold: number = 0.5): number | null => {
      if (!snapToMarkers) return null;

      // Convert threshold to pixels to make it zoom-invariant
      const pixelThreshold = 10; // pixels
      const timeThresholdScale =
        (pixelThreshold / (timelineWidth * timelineZoom)) * duration;
      const timeThreshold = Math.min(threshold, timeThresholdScale);

      let closestTime: number | null = null;
      let minDiff = timeThreshold;

      // Check trim points first (most important)
      if (Math.abs(time - trim.startTime) < minDiff) {
        closestTime = trim.startTime;
        minDiff = Math.abs(time - trim.startTime);
      }

      if (Math.abs(time - trim.endTime) < minDiff) {
        closestTime = trim.endTime;
        minDiff = Math.abs(time - trim.endTime);
      }

      // Only check markers if we haven't found a close trim point
      if (closestTime === null) {
        // Check markers (less common)
        for (const marker of timelineMarkers) {
          if (Math.abs(time - marker.time) < minDiff) {
            closestTime = marker.time;
            minDiff = Math.abs(time - marker.time);
            break; // Exit early once we find a close enough marker
          }
        }
      }

      // Only check segments if we haven't found a snap point yet
      if (closestTime === null) {
        // Check segment boundaries
        for (const segment of timelineSegments) {
          if (Math.abs(time - segment.startTime) < minDiff) {
            closestTime = segment.startTime;
            minDiff = Math.abs(time - segment.startTime);
            break;
          }
          if (Math.abs(time - segment.endTime) < minDiff) {
            closestTime = segment.endTime;
            minDiff = Math.abs(time - segment.endTime);
            break;
          }
        }
      }

      // Only check subtitles as last resort (most numerous)
      if (closestTime === null) {
        // Check subtitle boundaries
        for (const subtitle of subtitles) {
          if (Math.abs(time - subtitle.startTime) < minDiff) {
            closestTime = subtitle.startTime;
            minDiff = Math.abs(time - subtitle.startTime);
            break;
          }
          if (Math.abs(time - subtitle.endTime) < minDiff) {
            closestTime = subtitle.endTime;
            minDiff = Math.abs(time - subtitle.endTime);
            break;
          }
        }
      }

      return closestTime;
    },
    [
      snapToMarkers,
      timelineWidth,
      timelineZoom,
      duration,
      trim.startTime,
      trim.endTime,
      timelineMarkers,
      timelineSegments,
      subtitles,
    ]
  );

  // Improved timeline click handler with throttling
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current || !timelineRef.current) return;

      // Throttle for better performance
      const now = performance.now();
      if (now - lastUpdateTimeRef.current < throttleTimeRef.current) return;
      lastUpdateTimeRef.current = now;

      // Calculate click position and convert to time
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const scrollOffset = timelineContainerRef.current?.scrollLeft || 0;
      const clickPosition = clickX + scrollOffset;

      let clickTime = positionToTime(clickPosition);

      // Snap to nearby markers if enabled
      const snappedTime = findNearestSnapPoint(clickTime);
      if (snappedTime !== null) {
        clickTime = snappedTime;
      }

      // Seek to the clicked time
      seek(clickTime);

      // Show tooltip with the clicked time
      setTooltipContent({
        show: true,
        text: formatTimecode(clickTime),
        x: e.clientX,
        y: e.clientY - 30,
      });

      // Hide tooltip after a short delay
      setTimeout(() => {
        setTooltipContent((prev) => ({ ...prev, show: false }));
      }, 1500);
    },
    [positionToTime, seek, findNearestSnapPoint]
  );

  // Optimized drag handlers that use refs instead of state for better performance
  const handleDragStart = useCallback(
    (type: "playhead" | "trimStart" | "trimEnd", e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Pause if playing
      if (isPlaying) {
        videoEditorManager.pause();
      }

      if (!timelineRef.current) return;

      // Store drag start info in ref for better performance
      const rect = timelineRef.current.getBoundingClientRect();

      isDraggingRef.current = true;
      dragTypeRef.current = type;
      dragStartInfoRef.current = {
        clientX: e.clientX,
        startTime:
          type === "playhead"
            ? currentTime
            : type === "trimStart"
              ? trim.startTime
              : trim.endTime,
        rectLeft: rect.left,
        rectWidth: rect.width,
      };

      // Set appropriate cursor
      document.body.style.cursor = "ew-resize";
      setActiveTimelineAction(type);

      // Add document-level event listeners
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", handleDragEnd);
    },
    [isPlaying, currentTime, trim.startTime, trim.endTime]
  );

  // Optimized drag handler using requestAnimationFrame for better performance
  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragTypeRef.current) return;

      // Throttle updates for better performance
      const now = performance.now();
      if (now - lastUpdateTimeRef.current < throttleTimeRef.current) {
        return;
      }
      lastUpdateTimeRef.current = now;

      const { clientX, startTime, rectWidth } = dragStartInfoRef.current;

      // Calculate drag distance
      const deltaX = e.clientX - clientX;
      const deltaPct = deltaX / rectWidth;
      const deltaTime = deltaPct * duration;

      // Calculate new time with boundary checks
      let newTime = Math.max(0, Math.min(duration, startTime + deltaTime));

      // Apply snapping if enabled
      const snappedTime = findNearestSnapPoint(newTime);
      if (snappedTime !== null) {
        newTime = snappedTime;
      }

      // Update based on drag type using requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        if (dragTypeRef.current === "playhead") {
          seek(newTime);
        } else if (dragTypeRef.current === "trimStart") {
          // Ensure start is before end with min gap
          if (newTime < trim.endTime - 0.1) {
            setTrim({ startTime: newTime });
            seek(newTime);
          }
        } else if (dragTypeRef.current === "trimEnd") {
          // Ensure end is after start with min gap
          if (newTime > trim.startTime + 0.1) {
            setTrim({ endTime: newTime });
            seek(newTime);
          }
        }
      });

      // Show tooltip with the current dragged time
      setTooltipContent({
        show: true,
        text: formatTimecode(newTime),
        x: e.clientX,
        y: e.clientY - 30,
      });

      // Handle auto-scrolling during drag
      if (timelineContainerRef.current) {
        const containerRect =
          timelineContainerRef.current.getBoundingClientRect();
        const edgeMargin = 30; // pixels from edge to trigger scrolling

        if (e.clientX < containerRect.left + edgeMargin) {
          // Scrolling left
          timelineContainerRef.current.scrollBy({
            left: -10,
            behavior: "auto",
          });
        } else if (e.clientX > containerRect.right - edgeMargin) {
          // Scrolling right
          timelineContainerRef.current.scrollBy({ left: 10, behavior: "auto" });
        }
      }
    },
    [
      duration,
      trim.startTime,
      trim.endTime,
      findNearestSnapPoint,
      seek,
      setTrim,
    ]
  );

  // Drag end handler
  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    dragTypeRef.current = null;
    document.body.style.cursor = "default";
    setActiveTimelineAction(null);

    // Hide tooltip
    setTooltipContent((prev) => ({ ...prev, show: false }));

    // Remove document-level event listeners
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", handleDragEnd);
  }, [handleDrag]);

  // Timeline hover handler with throttling
  const handleTimelineHover = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current || !timelineRef.current) return;

      // Throttle updates
      const now = performance.now();
      if (now - lastUpdateTimeRef.current < throttleTimeRef.current) return;
      lastUpdateTimeRef.current = now;

      const rect = timelineRef.current.getBoundingClientRect();
      const hoverX = e.clientX - rect.left;
      const scrollOffset = timelineContainerRef.current?.scrollLeft || 0;
      const hoverPosition = hoverX + scrollOffset;

      const hoverTime = positionToTime(hoverPosition);
      setHoveredTime(hoverTime);
    },
    [positionToTime]
  );

  // Improved touch support for mobile
  const handleTouchStart = useCallback(
    (type: "playhead" | "trimStart" | "trimEnd", e: React.TouchEvent) => {
      if (!timelineRef.current || e.touches.length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      // Pause if playing
      if (isPlaying) {
        videoEditorManager.pause();
      }

      const touch = e.touches[0];
      const rect = timelineRef.current.getBoundingClientRect();

      isDraggingRef.current = true;
      dragTypeRef.current = type;
      dragStartInfoRef.current = {
        clientX: touch.clientX,
        startTime:
          type === "playhead"
            ? currentTime
            : type === "trimStart"
              ? trim.startTime
              : trim.endTime,
        rectLeft: rect.left,
        rectWidth: rect.width,
      };

      setActiveTimelineAction(type);

      // Add document-level event listeners for touch events
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    },
    [isPlaying, currentTime, trim.startTime, trim.endTime]
  );

  // Handle touch move for dragging
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (
        !isDraggingRef.current ||
        !dragTypeRef.current ||
        e.touches.length === 0
      )
        return;

      e.preventDefault();

      // Throttle updates for better performance
      const now = performance.now();
      if (now - lastUpdateTimeRef.current < throttleTimeRef.current) {
        return;
      }
      lastUpdateTimeRef.current = now;

      const touch = e.touches[0];
      const { clientX, startTime, rectWidth } = dragStartInfoRef.current;

      // Calculate drag distance
      const deltaX = touch.clientX - clientX;
      const deltaPct = deltaX / rectWidth;
      const deltaTime = deltaPct * duration;

      // Calculate new time with boundary checks
      let newTime = Math.max(0, Math.min(duration, startTime + deltaTime));

      // Apply snapping if enabled
      const snappedTime = findNearestSnapPoint(newTime);
      if (snappedTime !== null) {
        newTime = snappedTime;
      }

      // Update based on drag type using requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        if (dragTypeRef.current === "playhead") {
          seek(newTime);
        } else if (dragTypeRef.current === "trimStart") {
          if (newTime < trim.endTime - 0.1) {
            setTrim({ startTime: newTime });
            seek(newTime);
          }
        } else if (dragTypeRef.current === "trimEnd") {
          if (newTime > trim.startTime + 0.1) {
            setTrim({ endTime: newTime });
            seek(newTime);
          }
        }
      });

      // Show tooltip with the current dragged time
      setTooltipContent({
        show: true,
        text: formatTimecode(newTime),
        x: touch.clientX,
        y: touch.clientY - 30,
      });

      // Handle auto-scrolling during touch drag
      if (timelineContainerRef.current) {
        const containerRect =
          timelineContainerRef.current.getBoundingClientRect();
        const edgeMargin = 30;

        if (touch.clientX < containerRect.left + edgeMargin) {
          timelineContainerRef.current.scrollBy({
            left: -10,
            behavior: "auto",
          });
        } else if (touch.clientX > containerRect.right - edgeMargin) {
          timelineContainerRef.current.scrollBy({
            left: 10,
            behavior: "auto",
          });
        }
      }
    },
    [
      duration,
      trim.startTime,
      trim.endTime,
      findNearestSnapPoint,
      seek,
      setTrim,
    ]
  );

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    dragTypeRef.current = null;
    setActiveTimelineAction(null);

    // Hide tooltip
    setTooltipContent((prev) => ({ ...prev, show: false }));

    // Remove document-level event listeners
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  }, []);

  // Zoom in/out handlers with smoothing
  const handleZoomIn = useCallback(() => {
    if (timelineZoom >= maxZoom) return;

    // Zoom centered on playhead position
    if (timelineContainerRef.current) {
      const playheadPosition = timeToPosition(currentTime);
      const scrollLeft = timelineContainerRef.current.scrollLeft;
      const containerWidth = timelineContainerRef.current.clientWidth;

      // Calculate relative position of playhead in viewport
      const playheadViewportPos = playheadPosition - scrollLeft;
      const playheadRatio = playheadViewportPos / containerWidth;

      // Update zoom
      const newZoom = Math.min(maxZoom, timelineZoom + 0.5);
      setTimelineZoom(newZoom);

      // Adjust scroll to keep playhead at same relative position
      requestAnimationFrame(() => {
        if (timelineContainerRef.current) {
          const newPlayheadPos =
            (currentTime / duration) * timelineWidth * newZoom;
          const newScrollLeft = newPlayheadPos - playheadRatio * containerWidth;
          timelineContainerRef.current.scrollLeft = Math.max(0, newScrollLeft);
        }
      });
    } else {
      setTimelineZoom(Math.min(maxZoom, timelineZoom + 0.5));
    }
  }, [
    timelineZoom,
    maxZoom,
    currentTime,
    duration,
    timelineWidth,
    timeToPosition,
    setTimelineZoom,
  ]);

  const handleZoomOut = useCallback(() => {
    if (timelineZoom <= MIN_ZOOM) return;

    // Zoom centered on playhead position
    if (timelineContainerRef.current) {
      const playheadPosition = timeToPosition(currentTime);
      const scrollLeft = timelineContainerRef.current.scrollLeft;
      const containerWidth = timelineContainerRef.current.clientWidth;

      // Calculate relative position of playhead in viewport
      const playheadViewportPos = playheadPosition - scrollLeft;
      const playheadRatio = playheadViewportPos / containerWidth;

      // Update zoom (allow zooming below 1)
      const newZoom = Math.max(MIN_ZOOM, timelineZoom - 0.25);
      setTimelineZoom(newZoom);

      // Adjust scroll to keep playhead at same relative position
      requestAnimationFrame(() => {
        if (timelineContainerRef.current) {
          const newPlayheadPos =
            (currentTime / duration) * timelineWidth * newZoom;
          const newScrollLeft = newPlayheadPos - playheadRatio * containerWidth;
          timelineContainerRef.current.scrollLeft = Math.max(0, newScrollLeft);
        }
      });
    } else {
      setTimelineZoom(Math.max(MIN_ZOOM, timelineZoom - 0.25));
    }
  }, [
    timelineZoom,
    currentTime,
    duration,
    timelineWidth,
    timeToPosition,
    setTimelineZoom,
  ]);

  // Handle mouse wheel zoom
  const handleMouseWheel = useCallback(
    (e: React.WheelEvent) => {
      // Only zoom if Ctrl key is pressed
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      } else if (timelineContainerRef.current) {
        // Otherwise, allow horizontal scrolling with wheel
        timelineContainerRef.current.scrollLeft += e.deltaY;
      }
    },
    [handleZoomIn, handleZoomOut]
  );

  // Extract visible elements based on current view with virtualization
  const visibleElements = useMemo(() => {
    if (!timelineContainerRef.current) {
      return {
        segments: timelineSegments,
        markers: timelineMarkers,
        subtitles: subtitles,
      };
    }

    const { start, end } = visibleTimeRange;
    const buffer = (end - start) * 0.2; // Add 20% buffer
    const bufferStart = Math.max(0, start - buffer);
    const bufferEnd = Math.min(duration, end + buffer);

    // Filter each type of element - use binary search for large collections
    const visibleSegments = timelineSegments.filter(
      (segment) =>
        segment.endTime >= bufferStart && segment.startTime <= bufferEnd
    );

    const visibleMarkers = timelineMarkers.filter(
      (marker) => marker.time >= bufferStart && marker.time <= bufferEnd
    );

    // For subtitles, only render those in the visible range plus buffer
    const visibleSubtitles = subtitles.filter(
      (subtitle) =>
        subtitle.endTime >= bufferStart && subtitle.startTime <= bufferEnd
    );

    return {
      segments: visibleSegments,
      markers: visibleMarkers,
      subtitles: visibleSubtitles,
    };
  }, [
    timelineSegments,
    timelineMarkers,
    subtitles,
    visibleTimeRange,
    duration,
  ]);

  // Format time for display
  const formatShortTimecode = useCallback(
    (time: number): string => {
      if (duration < 3600) {
        // Less than an hour, show MM:SS
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      } else {
        // Otherwise show full timecode
        return formatTimecode(time);
      }
    },
    [duration]
  );

  // Create time markers - only render those in the visible range
  const renderTimeMarkers = useMemo(() => {
    const { start, end } = visibleTimeRange;
    const timeSpan = end - start;

    // Determine appropriate time interval based on zoom level
    let interval = 1; // Default 1 second
    if (timeSpan > 300)
      interval = 60; // 1 minute
    else if (timeSpan > 120)
      interval = 30; // 30 seconds
    else if (timeSpan > 60)
      interval = 10; // 10 seconds
    else if (timeSpan > 30)
      interval = 5; // 5 seconds
    else if (timeSpan > 10)
      interval = 1; // 1 second
    else interval = 0.5; // 0.5 seconds

    // Calculate the major interval (for labeled markers)
    const majorInterval = interval * 5;

    // Round start time down to nearest interval
    const startInterval = Math.floor(start / interval) * interval;

    const markers = [];
    for (let time = startInterval; time <= end + interval; time += interval) {
      if (time < 0) continue;
      if (time > duration) break;

      const position = timeToPosition(time);
      const isMajor = Math.abs(time % majorInterval) < 0.001;

      markers.push(
        <div
          key={`marker-${time}`}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${position}px` }}
        >
          <div
            className={`w-px ${isMajor ? "h-4" : "h-2"} ${
              isDarkMode ? "bg-gray-400" : "bg-gray-500"
            } ${isMajor ? "opacity-80" : "opacity-40"}`}
          ></div>

          {isMajor && (
            <div
              className={`text-xs mt-0.5 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {formatShortTimecode(time)}
            </div>
          )}
        </div>
      );
    }

    return markers;
  }, [
    visibleTimeRange,
    duration,
    timeToPosition,
    isDarkMode,
    formatShortTimecode,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond if timeline has focus
      if (!timelineRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case " ": // Space - play/pause
          e.preventDefault();
          videoEditorManager.togglePlay();
          break;
        case "ArrowLeft": // Left - step back
          e.preventDefault();
          seek(Math.max(0, currentTime - (e.shiftKey ? 10 : 1)));
          break;
        case "ArrowRight": // Right - step forward
          e.preventDefault();
          seek(Math.min(duration, currentTime + (e.shiftKey ? 10 : 1)));
          break;
        case "Home": // Home - go to start
          e.preventDefault();
          seek(0);
          break;
        case "End": // End - go to end
          e.preventDefault();
          seek(duration);
          break;
        case "+": // + - zoom in
          e.preventDefault();
          handleZoomIn();
          break;
        case "-": // - - zoom out
          e.preventDefault();
          handleZoomOut();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, duration, seek, handleZoomIn, handleZoomOut]);

  // Enhanced mobile touch gestures for zoom
  useEffect(() => {
    if (!timelineRef.current) return;

    let initialTouchDistance = 0;
    let initialZoom = timelineZoom;

    const handleTouchStartZoom = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialTouchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      initialZoom = timelineZoom;
    };

    const handleTouchMoveZoom = (e: TouchEvent) => {
      if (e.touches.length !== 2 || initialTouchDistance === 0) return;

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const scaleFactor = currentDistance / initialTouchDistance;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(maxZoom, initialZoom * scaleFactor)
      );

      // Throttle zoom updates
      const now = performance.now();
      if (now - lastUpdateTimeRef.current > 100) {
        lastUpdateTimeRef.current = now;
        setTimelineZoom(newZoom);
      }
    };

    const handleTouchEndZoom = () => {
      initialTouchDistance = 0;
    };

    timelineRef.current.addEventListener("touchstart", handleTouchStartZoom);
    timelineRef.current.addEventListener("touchmove", handleTouchMoveZoom);
    timelineRef.current.addEventListener("touchend", handleTouchEndZoom);

    return () => {
      if (timelineRef.current) {
        timelineRef.current.removeEventListener(
          "touchstart",
          handleTouchStartZoom
        );
        timelineRef.current.removeEventListener(
          "touchmove",
          handleTouchMoveZoom
        );
        timelineRef.current.removeEventListener("touchend", handleTouchEndZoom);
      }
    };
  }, [timelineZoom, maxZoom, setTimelineZoom]);

  return (
    <div
      className={`h-full flex flex-col ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
      } border rounded-lg shadow-lg`}
      ref={timelineRef}
      tabIndex={0}
      onWheel={handleMouseWheel}
    >
      {/* Timeline controls */}
      <div
        className={`p-1.5 flex items-center justify-between ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border-b z-10`}
      >
        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center">
            <button
              className={`p-1.5 rounded-l-md ${
                timelineZoom <= MIN_ZOOM
                  ? isDarkMode
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={handleZoomOut}
              disabled={timelineZoom <= MIN_ZOOM}
              title="Zoom out"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>

            <div
              className={`px-2 py-1 text-sm ${
                isDarkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {timelineZoom.toFixed(1)}x
            </div>

            <button
              className={`p-1.5 rounded-r-md ${
                timelineZoom >= maxZoom
                  ? isDarkMode
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={handleZoomIn}
              disabled={timelineZoom >= maxZoom}
              title="Zoom in"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center space-x-1">
            {/* Snap toggle */}
            <button
              className={`flex items-center px-2 py-1 rounded text-xs ${
                snapToMarkers
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              onClick={() => setSnapToMarkers(!snapToMarkers)}
              title={snapToMarkers ? "Disable snapping" : "Enable snapping"}
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Snap</span>
            </button>

            {/* Auto-scroll toggle */}
            <button
              className={`flex items-center px-2 py-1 rounded text-xs ${
                isAutoScrollEnabled
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
              title={
                isAutoScrollEnabled
                  ? "Disable auto-scroll"
                  : "Enable auto-scroll"
              }
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 7H7v6h6V7z" />
                <path
                  fillRule="evenodd"
                  d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline">Auto-scroll</span>
            </button>
          </div>
        </div>

        {/* Current time display */}
        <div
          className={`text-xs font-mono px-2 py-1 rounded ${
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          {formatTimecode(currentTime)} / {formatTimecode(duration)}
        </div>
      </div>

      {/* Timeline content - with virtualization */}
      <div
        ref={timelineContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar"
        onMouseLeave={() => setHoveredTime(null)}
      >
        {/* Scrollable content */}
        <div
          className="relative h-full"
          style={{
            width: `${timelineWidth * timelineZoom}px`,
            minWidth: "100%",
          }}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineHover}
        >
          {/* Time markers */}
          <div
            className={`sticky top-0 h-8 z-10 ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-100 border-gray-200"
            } border-b`}
          >
            {renderTimeMarkers}
          </div>

          {/* Waveform container */}
          <div className="relative h-12 z-0">
            {/* Container for the waveform */}
            <div
              ref={waveformContainerRef}
              className="absolute top-0 left-0 h-full w-full"
              style={{ minHeight: "40px" }}
            />

            {/* Loading indicator */}
            {waveformManager?.isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
                <div
                  className={`text-xs ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"} px-2 py-1 rounded-md shadow-md`}
                >
                  Generating waveform...
                </div>
              </div>
            )}

            {/* Error message - only show it briefly */}
            {waveformManager?.error && (
              <div className="absolute top-0 right-0 m-1 z-10">
                <div
                  className={`text-xs ${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-700"} px-2 py-0.5 rounded-md shadow-sm`}
                >
                  {waveformManager.error}
                </div>
              </div>
            )}
          </div>

          {/* Timeline segments */}
          {/* <div
            className={`relative h-8 border-t border-b ${
              isDarkMode
                ? "border-gray-700 bg-gray-850"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div
              className={`absolute h-full ${
                isDarkMode ? "bg-blue-900/30" : "bg-blue-100/60"
              }`}
              style={{
                left: timeToPosition(trim.startTime),
                width:
                  timeToPosition(trim.endTime) - timeToPosition(trim.startTime),
              }}
            />

            {visibleElements.segments.map((segment) => {
              const startPos = timeToPosition(segment.startTime);
              const endPos = timeToPosition(segment.endTime);
              const isHovered = hoveredSegmentId === segment.id;

              return (
                <div
                  key={segment.id}
                  className={`absolute h-full ${
                    isHovered
                      ? isDarkMode
                        ? "bg-blue-500/40"
                        : "bg-blue-500/30"
                      : isDarkMode
                        ? "bg-indigo-500/30 hover:bg-indigo-500/40"
                        : "bg-indigo-500/20 hover:bg-indigo-500/30"
                  } transition-colors duration-150 cursor-pointer`}
                  style={{ left: startPos, width: endPos - startPos }}
                  onMouseEnter={() => setHoveredSegmentId(segment.id)}
                  onMouseLeave={() => setHoveredSegmentId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    seek(segment.startTime);
                  }}
                  title={segment.label || `Segment ${segment.id}`}
                >
                  {endPos - startPos > 40 && (
                    <div className="px-2 py-1 text-xs truncate whitespace-nowrap">
                      {segment.label || `Segment ${segment.id}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div> */}

          {/* Subtitle regions - only render visible ones */}
          {Boolean(visibleElements.subtitles.length) && (
            <div
              className={`relative h-6 border-b ${
                isDarkMode
                  ? "border-gray-700 bg-gray-900"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {visibleElements.subtitles.map((subtitle) => {
                const startPos = timeToPosition(subtitle.startTime);
                const endPos = timeToPosition(subtitle.endTime);

                return (
                  <div
                    key={subtitle.id}
                    className={`absolute h-full ${
                      subtitle.id === activeSubtitleId
                        ? isDarkMode
                          ? "bg-green-500/40 border-l-2 border-r-2 border-green-500"
                          : "bg-green-500/30 border-l-2 border-r-2 border-green-500"
                        : isDarkMode
                          ? "bg-green-500/20 hover:bg-green-500/30"
                          : "bg-green-500/10 hover:bg-green-500/20"
                    } cursor-pointer transition-colors duration-150`}
                    style={{ left: startPos, width: endPos - startPos }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSubtitle(subtitle.id);
                      seek(subtitle.startTime);
                    }}
                    title={subtitle.text}
                  >
                    {endPos - startPos > 40 && (
                      <div className="px-2 py-1 text-xs truncate whitespace-nowrap">
                        {subtitle.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Markers - only render visible ones */}
          {Boolean(visibleElements.markers.length) && (
            <div className="relative h-8 flex items-center">
              {visibleElements.markers.map((marker) => (
                <div
                  key={marker.id}
                  className="absolute h-full flex items-center justify-center"
                  style={{ left: timeToPosition(marker.time) }}
                >
                  <div
                    className={`h-3 w-0.5 ${
                      isDarkMode ? "bg-yellow-500/50" : "bg-yellow-500/70"
                    }`}
                  />
                  <div
                    className={`absolute top-0 -translate-x-1/2 cursor-pointer w-3 h-3 flex items-center justify-center rounded-full ${
                      marker.type === "bookmark"
                        ? "bg-yellow-500"
                        : marker.type === "chapter"
                          ? "bg-green-500"
                          : "bg-blue-500"
                    } text-white transform hover:scale-110 transition-transform`}
                    onClick={(e) => {
                      e.stopPropagation();
                      seek(marker.time);
                    }}
                    title={marker.label || marker.type}
                  >
                    {marker.type === "bookmark" && (
                      <svg
                        className="w-2 h-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    )}
                    {marker.type === "chapter" && (
                      <svg
                        className="w-2 h-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                    )}
                    {marker.type === "subtitle" && (
                      <svg
                        className="w-2 h-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trim handles */}
          {activeEditMode === "trim" && (
            <>
              {/* Trim start handle */}
              <div
                ref={trimStartRef}
                className={`absolute top-8 bottom-0 w-1 bg-blue-500 cursor-ew-resize z-20 ${
                  activeTimelineAction === "trimStart"
                    ? "ring-2 ring-blue-300"
                    : ""
                }`}
                style={{ left: timeToPosition(trim.startTime) }}
                onMouseDown={(e) => handleDragStart("trimStart", e)}
                onTouchStart={(e) => handleTouchStart("trimStart", e)}
              >
                <div className="absolute -left-2 top-4 w-5 h-10 bg-blue-500 rounded-md" />

                {/* Label */}
                <div
                  className={`absolute top-2 -translate-x-1/2 px-1.5 py-0.5 rounded text-xs ${
                    isDarkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {formatShortTimecode(trim.startTime)}
                </div>
              </div>

              {/* Trim end handle */}
              <div
                ref={trimEndRef}
                className={`absolute top-8 bottom-0 w-1 bg-blue-500 cursor-ew-resize z-20 ${
                  activeTimelineAction === "trimEnd"
                    ? "ring-2 ring-blue-300"
                    : ""
                }`}
                style={{ left: timeToPosition(trim.endTime) }}
                onMouseDown={(e) => handleDragStart("trimEnd", e)}
                onTouchStart={(e) => handleTouchStart("trimEnd", e)}
              >
                <div className="absolute -left-2 top-4 w-5 h-10 bg-blue-500 rounded-md" />

                {/* Label */}
                <div
                  className={`absolute top-2 -translate-x-1/2 px-1.5 py-0.5 rounded text-xs ${
                    isDarkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {formatShortTimecode(trim.endTime)}
                </div>
              </div>
            </>
          )}

          {/* Playhead */}
          <div
            ref={playheadRef}
            className={`absolute top-8 bottom-0 w-0.5 bg-red-500 z-30 cursor-ew-resize ${
              activeTimelineAction === "playhead" ? "ring-1 ring-red-300" : ""
            }`}
            style={{ left: timeToPosition(currentTime) }}
            onMouseDown={(e) => handleDragStart("playhead", e)}
            onTouchStart={(e) => handleTouchStart("playhead", e)}
          >
            <div className="absolute -left-1.5 -top-1 w-3.5 h-3.5 rounded-full bg-red-500" />
          </div>

          {/* Hover time indicator */}
          <AnimatePresence>
            {hoveredTime !== null && !isDraggingRef.current && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`absolute top-8 bottom-0 w-0.5 z-20 pointer-events-none ${
                  isDarkMode ? "bg-gray-400/30" : "bg-gray-600/30"
                }`}
                style={{ left: timeToPosition(hoveredTime) }}
              >
                <div
                  className={`absolute -top-6 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 rounded text-xs ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-200"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {formatTimecode(hoveredTime)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tooltip */}
          <AnimatePresence>
            {tooltipContent.show && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className={`fixed px-2 py-1 rounded text-xs z-50 ${
                  isDarkMode
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-900"
                } shadow-lg pointer-events-none`}
                style={{
                  left: tooltipContent.x,
                  top: tooltipContent.y,
                  transform: "translateX(-50%)",
                }}
              >
                {tooltipContent.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div
        className={`flex justify-center items-center py-1 text-xs ${
          isDarkMode
            ? "bg-gray-800 text-gray-400 border-t border-gray-700"
            : "bg-gray-50 text-gray-500 border-t border-gray-200"
        }`}
      >
        <span className="flex items-center space-x-2">
          <kbd
            className={`px-1.5 py-0.5 rounded ${
              isDarkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Space
          </kbd>
          <span className="hidden xs:inline">Play/Pause</span>
        </span>
        <span className="mx-2 hidden xs:inline">•</span>
        <span className="flex items-center space-x-2">
          <kbd
            className={`px-1.5 py-0.5 rounded ${
              isDarkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            ←/→
          </kbd>
          <span className="hidden xs:inline">Navigate</span>
        </span>
        <span className="mx-2 hidden sm:inline">•</span>
        <span className="hidden sm:flex items-center space-x-2">
          <kbd
            className={`px-1.5 py-0.5 rounded ${
              isDarkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Shift+←/→
          </kbd>
          <span>Jump 10s</span>
        </span>
      </div>

      {/* Add CSS for hiding scrollbar but maintaining functionality */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? "#1F2937" : "#F3F4F6"};
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background-color: ${isDarkMode ? "#4B5563" : "#D1D5DB"};
          border-radius: 6px;
        }
        @media (max-width: 640px) {
          .hide-scrollbar::-webkit-scrollbar {
            height: 4px;
          }
        }
      `}</style>
    </div>
  );
});

export default VideoTimeline;
