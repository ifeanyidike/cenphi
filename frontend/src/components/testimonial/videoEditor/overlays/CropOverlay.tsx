import React, { useRef, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { AnimatePresence, motion } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";

const CropOverlay: React.FC = observer(() => {
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    crop,
    setCrop,
    aspectRatio,
    setAspectRatio,
    videoWidth,
    videoHeight,
  } = videoEditorManager;

  // Refs and state
  const containerRef = useRef<HTMLDivElement>(null);
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState({ ...crop });
  const [isDragging, setIsDragging] = useState(false);
  const [cropMode, setCropMode] = useState<"free" | "fixed-ratio">(
    aspectRatio === "original" ? "free" : "fixed-ratio"
  );
  const [showPresetPanel, setShowPresetPanel] = useState(false);
  const [animateHighlight, setAnimateHighlight] = useState(false);

  // Update cropMode when aspectRatio changes
  useEffect(() => {
    setCropMode(aspectRatio === "original" ? "free" : "fixed-ratio");
  }, [aspectRatio]);

  // Measure container size
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({
          width,
          height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Convert percentages to pixels for display
  const percentToPixels = useCallback(
    (percent: number, dimension: "width" | "height"): number => {
      return (percent / 100) * containerSize[dimension];
    },
    [containerSize]
  );

  // Convert pixels to percentages for storage
  const pixelsToPercent = useCallback(
    (pixels: number, dimension: "width" | "height"): number => {
      if (containerSize[dimension] === 0) return 0;
      return (pixels / containerSize[dimension]) * 100;
    },
    [containerSize]
  );

  // Get crop box in pixels for rendering
  const getCropBoxPixels = useCallback(() => {
    return {
      x: percentToPixels(crop.x, "width"),
      y: percentToPixels(crop.y, "height"),
      width: percentToPixels(crop.width, "width"),
      height: percentToPixels(crop.height, "height"),
    };
  }, [crop, percentToPixels]);

  // Current crop box in pixels
  const cropBox = getCropBoxPixels();

  // Start resizing
  const handleResizeStart = useCallback(
    (handle: string, e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      setResizeHandle(handle);

      // Get client position from either mouse or touch event
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;

      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      setStartPos({ x: clientX, y: clientY });
      setStartCrop({ ...crop });

      // Improve UX with cursor styles
      const cursorMap: Record<string, string> = {
        "top-left": "nwse-resize",
        "bottom-right": "nwse-resize",
        "top-right": "nesw-resize",
        "bottom-left": "nesw-resize",
        top: "ns-resize",
        bottom: "ns-resize",
        left: "ew-resize",
        right: "ew-resize",
      };

      document.body.style.cursor = cursorMap[handle] || "move";
    },
    [crop]
  );

  // Calculate aspect ratio value based on current setting
  const getAspectRatioValue = useCallback((): number => {
    switch (aspectRatio) {
      case "16:9":
        return 16 / 9;
      case "4:3":
        return 4 / 3;
      case "1:1":
        return 1;
      case "9:16":
        return 9 / 16;
      case "custom":
        return (
          videoEditorManager.customAspectRatio.width /
          videoEditorManager.customAspectRatio.height
        );
      default:
        return videoWidth / videoHeight; // Original aspect ratio
    }
  }, [aspectRatio, videoWidth, videoHeight]);

  // Apply free resize (no aspect ratio constraint)
  const applyFreeResize = useCallback(
    (
      newCrop: typeof crop,
      handle: string,
      deltaXPercent: number,
      deltaYPercent: number
    ) => {
      switch (handle) {
        case "top-left":
          newCrop.x = Math.max(
            0,
            Math.min(
              startCrop.x + deltaXPercent,
              startCrop.x + startCrop.width - 10
            )
          );
          newCrop.y = Math.max(
            0,
            Math.min(
              startCrop.y + deltaYPercent,
              startCrop.y + startCrop.height - 10
            )
          );
          newCrop.width = Math.max(10, startCrop.width - deltaXPercent);
          newCrop.height = Math.max(10, startCrop.height - deltaYPercent);
          break;
        case "top-right":
          newCrop.y = Math.max(
            0,
            Math.min(
              startCrop.y + deltaYPercent,
              startCrop.y + startCrop.height - 10
            )
          );
          newCrop.width = Math.max(
            10,
            Math.min(startCrop.width + deltaXPercent, 100 - startCrop.x)
          );
          newCrop.height = Math.max(10, startCrop.height - deltaYPercent);
          break;
        case "bottom-left":
          newCrop.x = Math.max(
            0,
            Math.min(
              startCrop.x + deltaXPercent,
              startCrop.x + startCrop.width - 10
            )
          );
          newCrop.width = Math.max(10, startCrop.width - deltaXPercent);
          newCrop.height = Math.max(
            10,
            Math.min(startCrop.height + deltaYPercent, 100 - startCrop.y)
          );
          break;
        case "bottom-right":
          newCrop.width = Math.max(
            10,
            Math.min(startCrop.width + deltaXPercent, 100 - startCrop.x)
          );
          newCrop.height = Math.max(
            10,
            Math.min(startCrop.height + deltaYPercent, 100 - startCrop.y)
          );
          break;
        case "top":
          newCrop.y = Math.max(
            0,
            Math.min(
              startCrop.y + deltaYPercent,
              startCrop.y + startCrop.height - 10
            )
          );
          newCrop.height = Math.max(10, startCrop.height - deltaYPercent);
          break;
        case "right":
          newCrop.width = Math.max(
            10,
            Math.min(startCrop.width + deltaXPercent, 100 - startCrop.x)
          );
          break;
        case "bottom":
          newCrop.height = Math.max(
            10,
            Math.min(startCrop.height + deltaYPercent, 100 - startCrop.y)
          );
          break;
        case "left":
          newCrop.x = Math.max(
            0,
            Math.min(
              startCrop.x + deltaXPercent,
              startCrop.x + startCrop.width - 10
            )
          );
          newCrop.width = Math.max(10, startCrop.width - deltaXPercent);
          break;
      }
    },
    [startCrop]
  );

  // Apply fixed-ratio resize (maintain aspect ratio)
  const applyFixedRatioResize = useCallback(
    (
      newCrop: typeof crop,
      handle: string,
      deltaXPercent: number,
      deltaYPercent: number
    ) => {
      // Get current aspect ratio
      const aspectRatioValue = getAspectRatioValue();

      // Different logic based on handle and aspect ratio
      switch (handle) {
        case "top-left":
        case "bottom-right":
          // For these handles, prioritize width change and calculate height based on aspect ratio
          if (Math.abs(deltaXPercent) > Math.abs(deltaYPercent)) {
            // Width is changing more
            if (handle === "top-left") {
              newCrop.x = Math.max(
                0,
                Math.min(
                  startCrop.x + deltaXPercent,
                  startCrop.x + startCrop.width - 10
                )
              );
              newCrop.width = Math.max(10, startCrop.width - deltaXPercent);
              // Calculate height based on new width and aspect ratio
              const newHeight = newCrop.width / aspectRatioValue;
              // Adjust y position if top-left
              if (handle === "top-left") {
                newCrop.y = startCrop.y + startCrop.height - newHeight;
              }
              newCrop.height = Math.max(10, newHeight);
            } else {
              // bottom-right
              newCrop.width = Math.max(
                10,
                Math.min(startCrop.width + deltaXPercent, 100 - startCrop.x)
              );
              // Calculate height based on width and aspect ratio
              newCrop.height = Math.max(10, newCrop.width / aspectRatioValue);
            }
          } else {
            // Height is changing more
            if (handle === "top-left") {
              newCrop.y = Math.max(
                0,
                Math.min(
                  startCrop.y + deltaYPercent,
                  startCrop.y + startCrop.height - 10
                )
              );
              newCrop.height = Math.max(10, startCrop.height - deltaYPercent);
              // Calculate width based on new height and aspect ratio
              const newWidth = newCrop.height * aspectRatioValue;
              // Adjust x position
              newCrop.x = Math.max(0, startCrop.x + startCrop.width - newWidth);
              newCrop.width = Math.max(10, newWidth);
            } else {
              // bottom-right
              newCrop.height = Math.max(
                10,
                Math.min(startCrop.height + deltaYPercent, 100 - startCrop.y)
              );
              // Calculate width based on height and aspect ratio
              newCrop.width = Math.max(10, newCrop.height * aspectRatioValue);
            }
          }
          break;

        case "top-right":
        case "bottom-left":
          // For these handles, also prioritize width change
          if (Math.abs(deltaXPercent) > Math.abs(deltaYPercent)) {
            if (handle === "top-right") {
              newCrop.width = Math.max(
                10,
                Math.min(startCrop.width + deltaXPercent, 100 - startCrop.x)
              );
              // Calculate height based on width
              newCrop.height = Math.max(10, newCrop.width / aspectRatioValue);
              // Adjust y position
              newCrop.y = Math.max(
                0,
                startCrop.y + startCrop.height - newCrop.height
              );
            } else {
              // bottom-left
              newCrop.x = Math.max(
                0,
                Math.min(
                  startCrop.x + deltaXPercent,
                  startCrop.x + startCrop.width - 10
                )
              );
              newCrop.width = Math.max(10, startCrop.width - deltaXPercent);
              // Calculate height based on width
              newCrop.height = Math.max(10, newCrop.width / aspectRatioValue);
            }
          } else {
            if (handle === "top-right") {
              newCrop.y = Math.max(
                0,
                Math.min(
                  startCrop.y + deltaYPercent,
                  startCrop.y + startCrop.height - 10
                )
              );
              newCrop.height = Math.max(10, startCrop.height - deltaYPercent);
              // Calculate width based on height
              newCrop.width = Math.max(10, newCrop.height * aspectRatioValue);
            } else {
              // bottom-left
              newCrop.height = Math.max(
                10,
                Math.min(startCrop.height + deltaYPercent, 100 - startCrop.y)
              );
              // Calculate width based on height
              const newWidth = newCrop.height * aspectRatioValue;
              // Adjust x position
              newCrop.x = Math.max(0, startCrop.x + startCrop.width - newWidth);
              newCrop.width = Math.max(10, newWidth);
            }
          }
          break;

        // For single-axis handles, maintain aspect ratio and adjust both dimensions
        case "top":
          newCrop.y = Math.max(
            0,
            Math.min(
              startCrop.y + deltaYPercent,
              startCrop.y + startCrop.height - 10
            )
          );
          newCrop.height = Math.max(10, startCrop.height - deltaYPercent);
          // Adjust width based on new height
          newCrop.width = Math.max(10, newCrop.height * aspectRatioValue);
          // Center the crop horizontally
          newCrop.x = Math.max(
            0,
            startCrop.x + (startCrop.width - newCrop.width) / 2
          );
          break;

        case "bottom":
          newCrop.height = Math.max(
            10,
            Math.min(startCrop.height + deltaYPercent, 100 - startCrop.y)
          );
          // Adjust width based on new height
          newCrop.width = Math.max(10, newCrop.height * aspectRatioValue);
          // Center the crop horizontally
          newCrop.x = Math.max(
            0,
            startCrop.x + (startCrop.width - newCrop.width) / 2
          );
          break;

        case "left":
          newCrop.x = Math.max(
            0,
            Math.min(
              startCrop.x + deltaXPercent,
              startCrop.x + startCrop.width - 10
            )
          );
          newCrop.width = Math.max(10, startCrop.width - deltaXPercent);
          // Adjust height based on new width
          newCrop.height = Math.max(10, newCrop.width / aspectRatioValue);
          // Center the crop vertically
          newCrop.y = Math.max(
            0,
            startCrop.y + (startCrop.height - newCrop.height) / 2
          );
          break;

        case "right":
          newCrop.width = Math.max(
            10,
            Math.min(startCrop.width + deltaXPercent, 100 - startCrop.x)
          );
          // Adjust height based on new width
          newCrop.height = Math.max(10, newCrop.width / aspectRatioValue);
          // Center the crop vertically
          newCrop.y = Math.max(
            0,
            startCrop.y + (startCrop.height - newCrop.height) / 2
          );
          break;
      }

      // Ensure crop does not exceed boundaries
      newCrop.x = Math.max(0, Math.min(newCrop.x, 100 - newCrop.width));
      newCrop.y = Math.max(0, Math.min(newCrop.y, 100 - newCrop.height));
      newCrop.width = Math.min(newCrop.width, 100 - newCrop.x);
      newCrop.height = Math.min(newCrop.height, 100 - newCrop.y);
    },
    [getAspectRatioValue, startCrop]
  );

  // Handle resizing
  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isResizing || !resizeHandle) return;

      const clientX =
        "touches" in e
          ? (e as TouchEvent).touches[0].clientX
          : (e as MouseEvent).clientX;

      const clientY =
        "touches" in e
          ? (e as TouchEvent).touches[0].clientY
          : (e as MouseEvent).clientY;

      // Calculate deltas
      const deltaX = clientX - startPos.x;
      const deltaY = clientY - startPos.y;

      // Convert deltas to percentage
      const deltaXPercent = pixelsToPercent(deltaX, "width");
      const deltaYPercent = pixelsToPercent(deltaY, "height");

      const newCrop = { ...crop };

      // Apply resize logic based on the current crop mode
      if (cropMode === "free") {
        applyFreeResize(newCrop, resizeHandle, deltaXPercent, deltaYPercent);
      } else {
        applyFixedRatioResize(
          newCrop,
          resizeHandle,
          deltaXPercent,
          deltaYPercent
        );
      }

      // Update crop with requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        setCrop(newCrop);
      });
    },
    [
      isResizing,
      resizeHandle,
      startPos,
      crop,
      cropMode,
      pixelsToPercent,
      applyFreeResize,
      applyFixedRatioResize,
      setCrop,
    ]
  );

  // End resizing
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
    document.body.style.cursor = "default";
  }, []);

  // Set up event listeners for handling resize
  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => handleResize(e);
      const handleTouchMove = (e: TouchEvent) => handleResize(e);
      const handleMouseUp = () => handleResizeEnd();
      const handleTouchEnd = () => handleResizeEnd();

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  // Start dragging the whole crop box
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isResizing) return;

      e.preventDefault();
      e.stopPropagation();

      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;

      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      setIsDragging(true);
      setStartPos({ x: clientX, y: clientY });
      setStartCrop({ ...crop });
      document.body.style.cursor = "move";
    },
    [isResizing, crop]
  );

  // Handle dragging the crop box
  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX =
        "touches" in e
          ? (e as TouchEvent).touches[0].clientX
          : (e as MouseEvent).clientX;

      const clientY =
        "touches" in e
          ? (e as TouchEvent).touches[0].clientY
          : (e as MouseEvent).clientY;

      // Calculate deltas
      const deltaX = clientX - startPos.x;
      const deltaY = clientY - startPos.y;

      // Convert deltas to percentage
      const deltaXPercent = pixelsToPercent(deltaX, "width");
      const deltaYPercent = pixelsToPercent(deltaY, "height");

      // Calculate new position with boundaries
      const newX = Math.max(
        0,
        Math.min(startCrop.x + deltaXPercent, 100 - startCrop.width)
      );
      const newY = Math.max(
        0,
        Math.min(startCrop.y + deltaYPercent, 100 - startCrop.height)
      );

      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        setCrop({ ...crop, x: newX, y: newY });
      });
    },
    [isDragging, startPos, startCrop, pixelsToPercent, crop, setCrop]
  );

  // End dragging
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = "default";
  }, []);

  // Set up event listeners for handling drag
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDrag(e);
      const handleTouchMove = (e: TouchEvent) => handleDrag(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchEnd = () => handleDragEnd();

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  // Define crop presets
  const cropPresets = [
    {
      id: "full",
      name: "Full Frame",
      crop: { x: 0, y: 0, width: 100, height: 100 },
    },
    {
      id: "left-half",
      name: "Left Half",
      crop: { x: 0, y: 0, width: 50, height: 100 },
    },
    {
      id: "right-half",
      name: "Right Half",
      crop: { x: 50, y: 0, width: 50, height: 100 },
    },
    {
      id: "top-half",
      name: "Top Half",
      crop: { x: 0, y: 0, width: 100, height: 50 },
    },
    {
      id: "bottom-half",
      name: "Bottom Half",
      crop: { x: 0, y: 50, width: 100, height: 50 },
    },
    {
      id: "center",
      name: "Center Focus",
      crop: { x: 25, y: 25, width: 50, height: 50 },
    },
    {
      id: "center-wide",
      name: "Center Wide",
      crop: { x: 15, y: 30, width: 70, height: 40 },
    },
    {
      id: "center-tall",
      name: "Center Tall",
      crop: { x: 30, y: 15, width: 40, height: 70 },
    },
    {
      id: "rule-thirds",
      name: "Rule of Thirds",
      crop: { x: 20, y: 20, width: 60, height: 60 },
    },
  ];

  // Apply a crop preset
  const applyCropPreset = useCallback(
    (preset: (typeof cropPresets)[0]) => {
      if (cropMode === "fixed-ratio" && aspectRatio !== "original") {
        // Need to adjust the preset to maintain aspect ratio
        const targetAspectRatio = getAspectRatioValue();
        const presetCrop = { ...preset.crop };

        // Adjust height based on width and ratio for landscape orientation
        if (targetAspectRatio >= 1) {
          presetCrop.height = presetCrop.width / targetAspectRatio;

          // Center vertically if needed
          if (presetCrop.height > 100) {
            // Too tall, adjust width instead
            presetCrop.width = 100 * targetAspectRatio;
            presetCrop.height = 100;
            // Center horizontally
            presetCrop.x = Math.max(0, (100 - presetCrop.width) / 2);
            presetCrop.y = 0;
          } else {
            // Center vertically
            presetCrop.y = Math.max(0, (100 - presetCrop.height) / 2);
          }
        } else {
          // Portrait orientation
          presetCrop.width = presetCrop.height * targetAspectRatio;

          // Center horizontally if needed
          if (presetCrop.width > 100) {
            presetCrop.height = 100 / targetAspectRatio;
            presetCrop.width = 100;
            presetCrop.x = 0;
            presetCrop.y = Math.max(0, (100 - presetCrop.height) / 2);
          } else {
            presetCrop.x = Math.max(0, (100 - presetCrop.width) / 2);
          }
        }

        setCrop(presetCrop);
      } else {
        setCrop(preset.crop);
      }

      // Highlight animation to indicate the change
      setAnimateHighlight(true);
      setTimeout(() => setAnimateHighlight(false), 500);

      setShowPresetPanel(false);
    },
    [cropMode, aspectRatio, getAspectRatioValue, setCrop]
  );

  // Toggle between free and fixed-ratio crop modes
  const toggleCropMode = useCallback(() => {
    if (cropMode === "free") {
      setCropMode("fixed-ratio");
      // Set a default aspect ratio if it's 'original'
      if (aspectRatio === "original") {
        setAspectRatio("16:9");
      }
    } else {
      setCropMode("free");
      setAspectRatio("original");
    }

    // Highlight animation to indicate the change
    setAnimateHighlight(true);
    setTimeout(() => setAnimateHighlight(false), 500);
  }, [cropMode, aspectRatio, setAspectRatio]);

  // Handles for resizing the crop box
  const renderResizeHandles = useCallback(() => {
    const handles = [
      { position: "top-left", className: "top-0 left-0 cursor-nwse-resize" },
      { position: "top-right", className: "top-0 right-0 cursor-nesw-resize" },
      {
        position: "bottom-left",
        className: "bottom-0 left-0 cursor-nesw-resize",
      },
      {
        position: "bottom-right",
        className: "bottom-0 right-0 cursor-nwse-resize",
      },
      {
        position: "top",
        className: "top-0 left-1/2 -translate-x-1/2 cursor-ns-resize",
      },
      {
        position: "right",
        className: "top-1/2 right-0 -translate-y-1/2 cursor-ew-resize",
      },
      {
        position: "bottom",
        className: "bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize",
      },
      {
        position: "left",
        className: "top-1/2 left-0 -translate-y-1/2 cursor-ew-resize",
      },
    ];

    return handles.map((handle) => (
      <div
        key={handle.position}
        className={`absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full ${handle.className} shadow-md touch-manipulation z-30`}
        onMouseDown={(e) => handleResizeStart(handle.position, e)}
        onTouchStart={(e) => handleResizeStart(handle.position, e)}
        style={{
          transform: `${handle.className.includes("translate") ? handle.className.split("-translate")[1] : ""}`,
          marginTop: handle.position.includes("top") ? "-10px" : "",
          marginBottom: handle.position.includes("bottom") ? "-10px" : "",
          marginLeft: handle.position.includes("left") ? "-10px" : "",
          marginRight: handle.position.includes("right") ? "-10px" : "",
        }}
      />
    ));
  }, [handleResizeStart]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {/* Darkened areas outside the crop */}
      <div className="absolute inset-0 bg-black bg-opacity-70 touch-none">
        {/* Clear area for the crop box */}
        <motion.div
          ref={cropBoxRef}
          className={`absolute border-2 ${animateHighlight ? "border-green-500" : "border-blue-500"} touch-manipulation`}
          animate={{
            borderColor: animateHighlight
              ? ["#3B82F6", "#10B981", "#3B82F6"]
              : "#3B82F6",
          }}
          transition={{ duration: 0.5 }}
          style={{
            left: cropBox.x,
            top: cropBox.y,
            width: cropBox.width,
            height: cropBox.height,
            cursor: isResizing
              ? `${resizeHandle?.includes("resize") || "move"}`
              : "move",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 border border-white border-opacity-30 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white border-opacity-30" />
            ))}
          </div>

          {/* Resize handles */}
          {renderResizeHandles()}
        </motion.div>
      </div>

      {/* Control panel */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col space-y-3">
        {/* Preset panel (visible when toggled) */}
        <AnimatePresence>
          {showPresetPanel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`p-3 rounded-lg bg-opacity-90 shadow-lg grid grid-cols-3 gap-2 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              {cropPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={`p-2 rounded text-xs font-medium flex flex-col items-center ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white active:bg-gray-500"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800 active:bg-gray-300"
                  }`}
                  onClick={() => applyCropPreset(preset)}
                >
                  <div className="w-12 h-8 mb-1 bg-gray-200 dark:bg-gray-600 rounded relative overflow-hidden">
                    <div
                      className="absolute bg-blue-500 bg-opacity-60"
                      style={{
                        left: `${preset.crop.x}%`,
                        top: `${preset.crop.y}%`,
                        width: `${preset.crop.width}%`,
                        height: `${preset.crop.height}%`,
                      }}
                    ></div>
                  </div>
                  {preset.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls bar */}
        <div
          className={`p-3 rounded-lg bg-opacity-90 backdrop-blur-sm shadow-lg flex justify-between items-center ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex items-center space-x-4">
            {/* Dimensions display */}
            <div
              className={`text-sm font-medium ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              {Math.round(crop.width)}% × {Math.round(crop.height)}%
            </div>

            {/* Aspect ratio selector */}
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Ratio:
              </span>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className={`text-sm rounded p-1 ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-800 border-gray-300"
                } border`}
                disabled={cropMode === "free"}
              >
                <option value="original">Free</option>
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="1:1">1:1</option>
                <option value="9:16">9:16</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Toggle crop mode */}
            <button
              className={`px-2 py-1 rounded text-xs font-medium ${
                cropMode === "fixed-ratio"
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
              onClick={toggleCropMode}
            >
              {cropMode === "free" ? "Free Crop" : "Fixed Ratio"}
            </button>

            {/* Presets button */}
            <button
              className={`px-2 py-1 rounded text-xs font-medium ${
                showPresetPanel
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
              onClick={() => setShowPresetPanel(!showPresetPanel)}
            >
              Presets
            </button>

            {/* Reset button */}
            <button
              className={`px-2 py-1 rounded text-xs font-medium ${
                crop.x !== 0 ||
                crop.y !== 0 ||
                crop.width !== 100 ||
                crop.height !== 100
                  ? isDarkMode
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-red-500 text-white hover:bg-red-600"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={() => setCrop({ x: 0, y: 0, width: 100, height: 100 })}
              disabled={
                crop.x === 0 &&
                crop.y === 0 &&
                crop.width === 100 &&
                crop.height === 100
              }
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CropOverlay;
