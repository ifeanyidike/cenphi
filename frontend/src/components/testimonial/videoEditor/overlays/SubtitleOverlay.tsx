import React, { useEffect, useState, useRef, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";
import { Subtitle } from "../../../../repo/managers/video_editor";
import { reaction, toJS } from "mobx";

const SubtitleOverlay: React.FC = observer(() => {
  const { videoEditorManager } = workspaceHub;
  const {
    subtitles,
    currentTime,
    activeSubtitleId,
    setActiveSubtitle,
    updateSubtitle,
    deleteSubtitle,
    isPlaying,
  } = videoEditorManager;

  // State
  const [activeSubtitles, setActiveSubtitles] = useState<Subtitle[]>([]);
  const [upcomingSubtitles, setUpcomingSubtitles] = useState<Subtitle[]>([]);
  const [recentSubtitles, setRecentSubtitles] = useState<Subtitle[]>([]);
  const [showEditInterface, setShowEditInterface] = useState<boolean>(false);
  const [editingSubtitleId, setEditingSubtitleId] = useState<string | null>(
    null
  );
  const [editText, setEditText] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [subtitlePosition, setSubtitlePosition] = useState({ x: 0, y: 0 });
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false);
  const [subtitleToDelete, setSubtitleToDelete] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState<number>(0); // Add this to force update

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const editTextRef = useRef<HTMLTextAreaElement>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveSubtitlesRef = useRef<Subtitle[]>([]);

  // Constants for subtitle timing
  const PRE_DISPLAY_TIME = 0.15; // Show upcoming subtitle 150ms early for smoother transition
  const POST_DISPLAY_TIME = 0.2; // Keep recent subtitle 200ms after end time
  const SUBTITLE_GAP_THRESHOLD = 0.5; // If subtitles are closer than 500ms, treat as continuous

  // Improved positioning logic - find the actual video container rather than just canvas
  useEffect(() => {
    // Get the video-canvas-container element for accurate positioning
    const videoContainer = document.querySelector(".video-canvas-container");
    if (videoContainer) {
      videoContainerRef.current = videoContainer as HTMLDivElement;
    }
  }, []);

  // Find active, upcoming, and recent subtitles for smoother transitions
  useEffect(() => {
    if (!subtitles || subtitles.length === 0) {
      setActiveSubtitles([]);
      setUpcomingSubtitles([]);
      setRecentSubtitles([]);
      return;
    }

    // Sort subtitles by start time once to optimize performance
    const sortedSubtitles = [...subtitles].sort(
      (a, b) => a.startTime - b.startTime
    );

    // Get the active subtitle if one is selected
    const activeSubtitle = activeSubtitleId
      ? subtitles.find((sub) => sub.id === activeSubtitleId)
      : null;

    // CRITICAL FIX 1: MAJOR CHANGE - When paused, ALWAYS show the active subtitle
    // regardless of current time position, if one is selected
    if (!isPlaying && activeSubtitle) {
      setActiveSubtitles([activeSubtitle]);
      setUpcomingSubtitles([]);
      setRecentSubtitles([]);
      return;
    }

    // CRITICAL FIX 2: If editing a subtitle, always ensure it's visible
    if (editingSubtitleId) {
      const editingSubtitle = subtitles.find(
        (sub) => sub.id === editingSubtitleId
      );
      if (editingSubtitle) {
        setActiveSubtitles([editingSubtitle]);
        setUpcomingSubtitles([]);
        setRecentSubtitles([]);
        return;
      }
    }

    // Find subtitles that should be active at current time
    const exactTimeSubtitles = sortedSubtitles.filter(
      (subtitle) =>
        currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
    );

    // Find upcoming subtitles for pre-loading
    const upcoming = sortedSubtitles.filter(
      (subtitle) =>
        currentTime + PRE_DISPLAY_TIME >= subtitle.startTime &&
        currentTime < subtitle.startTime
    );

    // Find recently ended subtitles to keep displayed briefly
    const recent = sortedSubtitles.filter(
      (subtitle) =>
        currentTime > subtitle.endTime &&
        currentTime <= subtitle.endTime + POST_DISPLAY_TIME
    );

    // Handle the case when video is paused - maintain more user-friendly behavior
    if (!isPlaying) {
      // If there are subtitles at the current time, use them
      if (exactTimeSubtitles.length > 0) {
        setActiveSubtitles(exactTimeSubtitles);

        // Also show upcoming subtitle if it's very close (looks more natural)
        const nextSubtitles = sortedSubtitles.filter(
          (sub) =>
            sub.startTime > currentTime &&
            sub.startTime < currentTime + SUBTITLE_GAP_THRESHOLD
        );
        setUpcomingSubtitles(nextSubtitles.slice(0, 1)); // Only show the next one
        setRecentSubtitles([]);
      }
      // If we're close to an upcoming subtitle, show it
      else if (upcoming.length > 0) {
        setActiveSubtitles([]);
        setUpcomingSubtitles(upcoming);
        setRecentSubtitles([]);
      }
      // If we just passed a subtitle, keep showing it
      else if (recent.length > 0) {
        setActiveSubtitles([]);
        setUpcomingSubtitles([]);
        setRecentSubtitles(recent);
      }
      // Otherwise, find the closest subtitle for better UX when scrubbing
      else {
        // Find the closest upcoming subtitle
        const nextSubtitle = sortedSubtitles.find(
          (sub) => sub.startTime > currentTime
        );

        // Find the closest previous subtitle
        const prevSubtitle = [...sortedSubtitles]
          .reverse()
          .find((sub) => sub.endTime < currentTime);

        // Determine which one is closer to show
        if (nextSubtitle && prevSubtitle) {
          const nextDistance = nextSubtitle.startTime - currentTime;
          const prevDistance = currentTime - prevSubtitle.endTime;

          if (
            nextDistance < prevDistance &&
            nextDistance < SUBTITLE_GAP_THRESHOLD
          ) {
            setUpcomingSubtitles([nextSubtitle]);
            setActiveSubtitles([]);
            setRecentSubtitles([]);
          } else if (prevDistance < SUBTITLE_GAP_THRESHOLD) {
            setRecentSubtitles([prevSubtitle]);
            setActiveSubtitles([]);
            setUpcomingSubtitles([]);
          } else {
            setActiveSubtitles([]);
            setUpcomingSubtitles([]);
            setRecentSubtitles([]);
          }
        } else if (
          nextSubtitle &&
          nextSubtitle.startTime - currentTime < SUBTITLE_GAP_THRESHOLD
        ) {
          setUpcomingSubtitles([nextSubtitle]);
          setActiveSubtitles([]);
          setRecentSubtitles([]);
        } else if (
          prevSubtitle &&
          currentTime - prevSubtitle.endTime < SUBTITLE_GAP_THRESHOLD
        ) {
          setRecentSubtitles([prevSubtitle]);
          setActiveSubtitles([]);
          setUpcomingSubtitles([]);
        } else {
          setActiveSubtitles([]);
          setUpcomingSubtitles([]);
          setRecentSubtitles([]);
        }
      }
    }
    // Normal playback behavior - show appropriate subtitles with smooth transitions
    else {
      setActiveSubtitles(exactTimeSubtitles);
      setUpcomingSubtitles(upcoming);
      setRecentSubtitles(recent);
    }

    // Auto-select first active subtitle if none is selected (helps with UI interaction)
    if (exactTimeSubtitles.length > 0 && !activeSubtitleId) {
      setActiveSubtitle(exactTimeSubtitles[0].id);
    }

    // Store the last active subtitles for transition reference
    lastActiveSubtitlesRef.current = exactTimeSubtitles;
  }, [
    currentTime,
    subtitles,
    activeSubtitleId,
    isPlaying,
    editingSubtitleId,
    PRE_DISPLAY_TIME,
    POST_DISPLAY_TIME,
    SUBTITLE_GAP_THRESHOLD,
    forceUpdate, // CRITICAL FIX 3: Add forceUpdate to dependencies
  ]);

  // Focus edit text when editing starts
  useEffect(() => {
    if (showEditInterface && editTextRef.current) {
      editTextRef.current.focus();
    }
  }, [showEditInterface]);

  // Last subtitle content hash - used to detect any changes
  const [subtitleContentHash, setSubtitleContentHash] = useState<string>("");

  // Create a content hash to track any changes to subtitles
  useEffect(() => {
    // Convert MobX observable array to plain JS structure
    const subtitlesPlain = toJS(subtitles);

    // Create a hash of all subtitle content to detect any changes
    const hash = subtitlesPlain
      .map(
        (sub) =>
          `${sub.id}-${sub.text}-${sub.position}-${sub.startTime}-${sub.endTime}-` +
          `${sub.style.fontFamily}-${sub.style.fontSize}-${sub.style.color}-` +
          `${sub.style.backgroundColor}-${sub.style.opacity}`
      )
      .join("|");

    // Only update state if hash changed to avoid infinite loops
    if (hash !== subtitleContentHash) {
      setSubtitleContentHash(hash);
      // Also trigger a force update when any subtitle changes
      setForceUpdate((prev) => prev + 1);
    }
  }, [subtitles]);

  // Explicitly track any subtitle changes using MobX reaction
  useEffect(() => {
    // This reaction will run whenever any subtitle property changes
    const disposer = reaction(
      // Track the entire subtitles array with all its properties
      () =>
        subtitles.map((sub) => ({
          id: sub.id,
          text: sub.text,
          position: sub.position,
          startTime: sub.startTime,
          endTime: sub.endTime,
          style: { ...sub.style },
        })),
      // When changes are detected, force an update
      () => {
        setForceUpdate((prev) => prev + 1);
      },
      // Make sure this is deep equal comparison
      { equals: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
    );

    // Clean up the reaction when component unmounts
    return () => disposer();
  }, []);

  // // Get vertical position class based on subtitle position
  // const getPositionClass = useCallback((position: string): string => {
  //   switch (position) {
  //     case "top":
  //       return "top-16"; // Moved down from very top for better visibility
  //     case "middle":
  //       return "top-1/2 -translate-y-1/2"; // Perfect center
  //     case "bottom":
  //     default:
  //       return "bottom-32"; // Positioned higher to be above progress bar but clearly visible
  //   }
  // }, []);

  // // Adjust subtitle width based on aspect ratio
  // const getSubtitleWidth = useCallback((): string => {
  //   switch (aspectRatio) {
  //     case "16:9":
  //     case "4:3":
  //       return "max-w-[80%]";
  //     case "1:1":
  //       return "max-w-[90%]";
  //     case "9:16":
  //       return "max-w-[95%]";
  //     default:
  //       return "max-w-[80%]";
  //   }
  // }, [aspectRatio]);

  // Handle click on subtitle
  const handleSubtitleClick = useCallback(
    (e: React.MouseEvent, subtitleId: string) => {
      if (isDragging) return;
      e.stopPropagation();

      setActiveSubtitle(subtitleId);

      // Get subtitle for editing
      const subtitle = subtitles.find((s) => s.id === subtitleId);
      if (subtitle) {
        setEditText(subtitle.text);
        setEditingSubtitleId(subtitleId);
      }
    },
    [isDragging, setActiveSubtitle, subtitles]
  );

  // Save subtitle edit
  const saveSubtitleEdit = useCallback(() => {
    if (editingSubtitleId && editText.trim()) {
      updateSubtitle(editingSubtitleId, {
        text: editText.trim(),
      });
      setShowEditInterface(false);
      // CRITICAL FIX 4: Force a component update to reflect changes immediately
      setForceUpdate((prev) => prev + 1);
    }
  }, [editingSubtitleId, editText, updateSubtitle]);

  // Handle keyboard events in the edit interface
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        saveSubtitleEdit();
      } else if (e.key === "Escape") {
        setShowEditInterface(false);
      }
    },
    [saveSubtitleEdit]
  );

  // Handle subtitle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent, subtitleId: string) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      setActiveSubtitle(subtitleId);

      const subtitle = subtitles.find((s) => s.id === subtitleId);
      if (!subtitle) return;

      // Store starting position
      setDragStartPosition({ x: e.clientX, y: e.clientY });

      // Initialize subtitle position based on its current position setting
      let initialY = 0;

      switch (subtitle.position) {
        case "top":
          initialY = 50;
          break;
        case "middle":
          initialY = containerRef.current
            ? containerRef.current.clientHeight / 2
            : 0;
          break;
        case "bottom":
          initialY = containerRef.current
            ? containerRef.current.clientHeight - 100
            : 0;
          break;
      }

      setSubtitlePosition({ x: 0, y: initialY });

      // Add global event listeners
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
    },
    [subtitles, setActiveSubtitle]
  );

  // Handle subtitle drag
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !editingSubtitleId) return;

      const deltaY = e.clientY - dragStartPosition.y;

      // Update subtitle position
      setSubtitlePosition((prev) => ({
        ...prev,
        y: prev.y + deltaY,
      }));

      // Update dragStartPosition for next move event
      setDragStartPosition({ x: e.clientX, y: e.clientY });
    },
    [isDragging, editingSubtitleId, dragStartPosition]
  );

  // Handle subtitle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !editingSubtitleId) return;

    setIsDragging(false);

    // Determine new position based on where subtitle was dragged
    let newPosition: "top" | "middle" | "bottom" = "bottom";

    if (!containerRef.current) return;

    const containerHeight = containerRef.current.clientHeight;
    const yPosition = subtitlePosition.y;

    if (yPosition < containerHeight / 3) {
      newPosition = "top";
    } else if (yPosition < (containerHeight * 2) / 3) {
      newPosition = "middle";
    } else {
      newPosition = "bottom";
    }

    // Update subtitle position
    updateSubtitle(editingSubtitleId, { position: newPosition });
    // CRITICAL FIX 5: Force a component update after position change
    setForceUpdate((prev) => prev + 1);

    // Remove event listeners
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
  }, [isDragging, editingSubtitleId, subtitlePosition, updateSubtitle]);

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  // Initiate delete confirmation
  const initiateDeleteSubtitle = useCallback(
    (e: React.MouseEvent, subtitleId: string) => {
      e.stopPropagation();
      setSubtitleToDelete(subtitleId);
      setShowDeleteConfirmation(true);
    },
    []
  );

  // Confirm delete subtitle
  const confirmDeleteSubtitle = useCallback(() => {
    if (subtitleToDelete) {
      deleteSubtitle(subtitleToDelete);
      setShowDeleteConfirmation(false);
      setSubtitleToDelete(null);
      setShowEditInterface(false);
    }
  }, [subtitleToDelete, deleteSubtitle]);

  // Open edit interface for subtitle
  const openEditInterface = useCallback(
    (e: React.MouseEvent, subtitleId: string) => {
      e.stopPropagation();

      const subtitle = subtitles.find((s) => s.id === subtitleId);
      if (subtitle) {
        setEditText(subtitle.text);
        setEditingSubtitleId(subtitleId);
        setShowEditInterface(true);
      }
    },
    [subtitles]
  );

  // Generate text shadow for better readability on any background
  const getTextShadow = useCallback((textColor: string): string => {
    // For dark text, use light/no shadow
    if (textColor === "#000000" || textColor === "#333333") {
      return "none";
    }
    // For light text, use subtle shadow
    return "0 1px 2px rgba(0,0,0,0.3)";
  }, []);

  // Helper function to render a subtitle with proper styling and animations
  const renderSubtitle = useCallback(
    (subtitle: Subtitle, subtitleType: "active" | "upcoming" | "recent") => {
      // Calculate animation properties based on subtitle type
      // let initialAnimation = {};
      // let exitAnimation = {};
      let opacityValue = 1;

      switch (subtitleType) {
        case "active":
          // initialAnimation = {
          //   ...initialAnimation,
          //   opacity: 0,
          //   y: subtitle.position === "top" ? -15 : 15,
          // };
          // exitAnimation = {
          //   ...exitAnimation,
          //   opacity: 0,
          //   y: subtitle.position === "top" ? -10 : 10,
          // };
          opacityValue = 1;
          break;
        case "upcoming":
          // initialAnimation = {
          //   ...initialAnimation,
          //   opacity: 0,
          //   y: subtitle.position === "top" ? -20 : 20,
          // };
          // exitAnimation = { ...exitAnimation, opacity: 0 };
          opacityValue = 0.85;
          break;
        case "recent":
          // initialAnimation = { ...initialAnimation, opacity: 0 };
          // exitAnimation = {
          //   ...exitAnimation,
          //   opacity: 0,
          //   y: subtitle.position === "top" ? -10 : 10,
          // };
          opacityValue = 0.75;
          break;
      }

      // Modern white background with clean styling
      const subtitleStyle = {
        fontFamily:
          subtitle.style.fontFamily ||
          "'Urbanist', 'Inter', 'Roboto', sans-serif",
        fontSize: `${subtitle.style.fontSize || 22}px`,
        fontWeight: subtitle.style.fontWeight || 400,
        color: subtitle.style.color || "#000000",
        backgroundColor:
          subtitle.style.backgroundColor || "rgba(255, 255, 255, 0.9)",
        opacity: subtitle.style.opacity * opacityValue || opacityValue,
        textShadow: getTextShadow(subtitle.style.color || "#000000"),
        lineHeight: 1.5,
        padding: "12px 20px",
        borderRadius: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        letterSpacing: "0.01em",
        border:
          subtitle.id === activeSubtitleId
            ? "2px solid rgba(59, 130, 246, 0.9)"
            : "1px solid rgba(226, 232, 240, 0.8)",
        pointerEvents: "auto",
        maxWidth: "80%",
        width: "auto",
        display: "inline-block",
        margin: "0 auto",
        textAlign: "center",
        zIndex:
          subtitleType === "active"
            ? 55
            : subtitleType === "upcoming"
              ? 54
              : 53,
      };

      // const getTransitionDuration = () => {
      //   // Use faster transitions when subtitles are closer together for smoother experience
      //   if (subtitleType === "upcoming") {
      //     return 0.15;
      //   } else if (subtitleType === "recent") {
      //     return 0.2;
      //   }
      //   return 0.25;
      // };

      return (
        <div
          key={`${subtitle.id}-${subtitleType}`}
          className="absolute w-full"
          style={{
            [subtitle.position === "top"
              ? "top"
              : subtitle.position === "middle"
                ? "top"
                : "bottom"]:
              subtitle.position === "top"
                ? "16px"
                : subtitle.position === "middle"
                  ? "50%"
                  : "128px",
            transform:
              subtitle.position === "middle" ? "translateY(-50%)" : "none",
            pointerEvents: "none",
            zIndex: subtitleStyle.zIndex,
          }}
        >
          <div className="w-full flex justify-center items-center">
            <motion.div
              data-subtitle-id={subtitle.id}
              data-subtitle-type={subtitleType}
              style={
                {
                  ...subtitleStyle,
                  ...(isDragging && subtitle.id === editingSubtitleId
                    ? {
                        position: "absolute",
                        top: `${subtitlePosition.y}px`,
                        transform: "none",
                        cursor: "grabbing",
                        zIndex: 60,
                      }
                    : {}),
                } as React.CSSProperties
              }
              // initial={initialAnimation}
              // animate={{ opacity: opacityValue, y: 0 }}
              // exit={exitAnimation}
              // transition={{
              //   duration: getTransitionDuration(),
              //   ease: "easeInOut",
              // }}
              onClick={(e) => handleSubtitleClick(e, subtitle.id)}
              onMouseDown={(e) => handleDragStart(e, subtitle.id)}
              className="cursor-grab hover:shadow-md transition-all duration-150"
              title="Click to select or drag to reposition"
            >
              {subtitle.text}

              {/* Only show controls for active subtitles */}
              {subtitleType === "active" &&
                subtitle.id === activeSubtitleId && (
                  <>
                    {/* Bright, modern subtitle controls with white background */}
                    <AnimatePresence>
                      <motion.div
                        className={`absolute left-1/2 transform -translate-x-1/2 flex space-x-3 p-2 shadow-md ${
                          subtitle.position === "top"
                            ? "top-full mt-3"
                            : "-top-14"
                        }`}
                        style={{
                          background: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid rgba(226, 232, 240, 0.8)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                          zIndex: 61,
                        }}
                        // initial={{ opacity: 0, y: 5 }}
                        // animate={{ opacity: 1, y: 0 }}
                        // exit={{ opacity: 0, y: 5 }}
                        // transition={{ duration: 0.15 }}
                      >
                        <button
                          className="p-2 rounded-full bg-white hover:bg-blue-50 active:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-150 shadow-sm"
                          onClick={(e) => openEditInterface(e, subtitle.id)}
                          title="Edit subtitle"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded-full bg-white hover:bg-red-50 active:bg-red-100 text-red-500 hover:text-red-600 transition-all duration-150 shadow-sm"
                          onClick={(e) =>
                            initiateDeleteSubtitle(e, subtitle.id)
                          }
                          title="Delete subtitle"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-500 hover:text-gray-600 transition-all duration-150 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubtitle(""); // Deselect
                          }}
                          title="Deselect"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </motion.div>
                    </AnimatePresence>

                    {/* Clean white position controls with tooltips */}
                    <motion.div
                      className="absolute -left-12 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-2.5"
                      // initial={{ opacity: 0, x: 5 }}
                      // animate={{ opacity: 0.95, x: 0 }}
                      // exit={{ opacity: 0, x: 5 }}
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))",
                        zIndex: 61,
                      }}
                    >
                      <div className="group relative">
                        <button
                          className={`p-1.5 rounded-full ${
                            subtitle.position === "top"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-600"
                          } hover:bg-blue-500 hover:text-white transition-all shadow-sm`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSubtitle(subtitle.id, { position: "top" });
                            // CRITICAL FIX 8: Force update on position change
                            setForceUpdate((prev) => prev + 1);
                          }}
                          title="Position at top"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          </svg>
                        </button>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-white text-gray-700 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm border border-gray-100">
                          Top position
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          className={`p-1.5 rounded-full ${
                            subtitle.position === "middle"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-600"
                          } hover:bg-blue-500 hover:text-white transition-all shadow-sm`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSubtitle(subtitle.id, { position: "middle" });
                            // CRITICAL FIX 9: Force update on position change
                            setForceUpdate((prev) => prev + 1);
                          }}
                          title="Position in middle"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M18 12H6"
                            />
                          </svg>
                        </button>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-white text-gray-700 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm border border-gray-100">
                          Middle position
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          className={`p-1.5 rounded-full ${
                            subtitle.position === "bottom"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-600"
                          } hover:bg-blue-500 hover:text-white transition-all shadow-sm`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSubtitle(subtitle.id, { position: "bottom" });
                            // CRITICAL FIX 10: Force update on position change
                            setForceUpdate((prev) => prev + 1);
                          }}
                          title="Position at bottom"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                        </button>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-white text-gray-700 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm border border-gray-100">
                          Bottom position
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
            </motion.div>
          </div>
        </div>
      );
    },
    [
      activeSubtitleId,
      editingSubtitleId,
      handleSubtitleClick,
      handleDragStart,
      isDragging,
      subtitlePosition,
      getTextShadow,
      openEditInterface,
      initiateDeleteSubtitle,
      updateSubtitle,
    ]
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-visible z-50 subtitle-container"
      style={{
        width: "100%",
        height: "100%",
        left: 0,
        top: 0,
        pointerEvents: "none",
      }}
    >
      {/* Active subtitles (currently visible) */}
      <AnimatePresence>
        {activeSubtitles.map((subtitle) => renderSubtitle(subtitle, "active"))}
      </AnimatePresence>

      {/* Upcoming subtitles (preloaded for smoother transitions) */}
      <AnimatePresence>
        {upcomingSubtitles.map((subtitle) =>
          renderSubtitle(subtitle, "upcoming")
        )}
      </AnimatePresence>

      {/* Recent subtitles (lingering briefly after their end time) */}
      <AnimatePresence>
        {recentSubtitles.map((subtitle) => renderSubtitle(subtitle, "recent"))}
      </AnimatePresence>

      {/* Clean white edit interface */}
      <AnimatePresence>
        {showEditInterface && editingSubtitleId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-0 left-0 right-0 pointer-events-auto z-60"
            style={{
              backdropFilter: "blur(8px)",
              background: "rgba(255, 255, 255, 0.95)",
              borderTop: "1px solid rgba(229, 231, 235, 0.8)",
              boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div className="max-w-3xl mx-auto p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="p-1.5 mr-3 rounded-md bg-blue-100">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-800">
                    Edit Subtitle
                  </h3>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-500">
                    Press Enter to save, Esc to cancel
                  </span>
                  <button
                    className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors"
                    onClick={() => setShowEditInterface(false)}
                    aria-label="Close editor"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <textarea
                ref={editTextRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all duration-200 text-base"
                style={{
                  boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
                rows={3}
                placeholder="Enter subtitle text..."
              />

              <div className="flex justify-between mt-4 items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-3 text-gray-600">
                    Position:
                  </span>
                  <div className="flex space-x-2 bg-gray-50 p-1 rounded-lg">
                    <button
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        subtitles.find((s) => s.id === editingSubtitleId)
                          ?.position === "top"
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        updateSubtitle(editingSubtitleId, { position: "top" });
                        // CRITICAL FIX 11: Force update on position change
                        setForceUpdate((prev) => prev + 1);
                      }}
                    >
                      Top
                    </button>
                    <button
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        subtitles.find((s) => s.id === editingSubtitleId)
                          ?.position === "middle"
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        updateSubtitle(editingSubtitleId, {
                          position: "middle",
                        });
                        // CRITICAL FIX 12: Force update on position change
                        setForceUpdate((prev) => prev + 1);
                      }}
                    >
                      Middle
                    </button>
                    <button
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        subtitles.find((s) => s.id === editingSubtitleId)
                          ?.position === "bottom" ||
                        !subtitles.find((s) => s.id === editingSubtitleId)
                          ?.position
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        updateSubtitle(editingSubtitleId, {
                          position: "bottom",
                        });
                        // CRITICAL FIX 13: Force update on position change
                        setForceUpdate((prev) => prev + 1);
                      }}
                    >
                      Bottom
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
                    onClick={() => setShowEditInterface(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
                    onClick={saveSubtitleEdit}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean white delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-70 pointer-events-auto backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4"
              style={{
                border: "1px solid rgba(226, 232, 240, 0.8)",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-full mr-3 bg-red-100">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Subtitle
                </h3>
              </div>

              <p className="mb-5 text-gray-600 text-sm leading-relaxed">
                Are you sure you want to delete this subtitle? This action
                cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 active:bg-gray-100 text-gray-700 transition-colors"
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setSubtitleToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 active:bg-red-500 text-white transition-colors"
                  onClick={confirmDeleteSubtitle}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SubtitleOverlay;
