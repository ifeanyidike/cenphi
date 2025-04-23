import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { workspaceHub } from "../../../../repo/workspace_hub";
import { Subtitle } from "../../../../repo/managers/video_editor";
import { formatTimecode } from "@/utils/general";
import { Select, Switch, Tooltip } from "antd";
import type { SelectProps } from "antd";
import { runInAction } from "mobx";

const SubtitlePanel: React.FC = observer(() => {
  const { videoEditorManager, uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const {
    subtitles,
    activeSubtitleId,
    currentTime,
    duration,
    showSubtitles,
    isPlaying,
    activeSubtitle,
  } = videoEditorManager;

  // State management with performance optimizations
  const [newSubtitleText, setNewSubtitleText] = useState<string>("");
  const [editingText, setEditingText] = useState<string>("");
  const [editStartTime, setEditStartTime] = useState<string>("");
  const [editEndTime, setEditEndTime] = useState<string>("");
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState<boolean>(false);
  const [showFontPanel, setShowFontPanel] = useState<boolean>(false);
  const [transcriptVisible, setTranscriptVisible] = useState<boolean>(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [isDraggingTime, setIsDraggingTime] = useState<boolean>(false);
  const [draggingTimeType, setDraggingTimeType] = useState<
    "start" | "end" | null
  >(null);
  const [, setDraggingTimeValue] = useState<number>(0);
  const [draggingStartInfo, setDraggingStartInfo] = useState<{
    angle: number;
    time: number;
  }>({
    angle: 0,
    time: 0,
  });
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [activeWaveformSegment, setActiveWaveformSegment] = useState<
    [number, number] | null
  >(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [previewingSubtitle, setPreviewingSubtitle] = useState<string | null>(
    null
  );
  const [hasMadeChanges, setHasMadeChanges] = useState<boolean>(false);
  const [lastUsedStyle, setLastUsedStyle] = useState<
    Partial<Subtitle["style"]>
  >({
    fontFamily: "Urbanist",
    fontSize: 16,
    color: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    opacity: 1,
  });

  // New state for applying style to all subtitles
  const [applyStyleToAll, setApplyStyleToAll] = useState<boolean>(true);

  // Refs
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const subtitleListRef = useRef<HTMLDivElement>(null);
  const newSubtitleInputRef = useRef<HTMLInputElement>(null);
  const timeDialRef = useRef<HTMLDivElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const throttleTimeRef = useRef<number>(50); // ms

  // Filter subtitles based on search text with memoization for performance
  const filteredSubtitles = useMemo(() => {
    if (!searchText) return subtitles;

    return subtitles.filter((s) =>
      s.text.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [subtitles, searchText]);

  // Generate transcript
  const mockTranscript = useMemo(() => {
    return (
      (videoEditorManager.originalTestimonial?.content as any)?.transcript ||
      "This is a demo transcript for the video. You can extract subtitles from this transcript by selecting text and clicking 'Add as Subtitle'. This makes it easy to create accurate subtitles from an existing transcript. The transcript might be generated automatically or manually entered."
    );
  }, [videoEditorManager.originalTestimonial]);

  // Generate waveform data for audio visualization
  useEffect(() => {
    if (duration <= 0) return;

    // Generate synthetic waveform data
    // In a real implementation, this would extract actual audio data from the video
    const generateWaveform = () => {
      const dataPoints = 1000; // Number of data points
      const data: number[] = [];

      for (let i = 0; i < dataPoints; i++) {
        const t = (i / dataPoints) * Math.PI * 20;

        // Create more realistic looking waveform
        const baseline = Math.sin(t) * 0.3 + 0.5;
        const detail = Math.sin(t * 3) * 0.1;
        const lowFreq = Math.sin(t / 3) * 0.2;
        const noise = (Math.random() - 0.5) * 0.05;

        // Combine different frequencies for a more natural look
        let amplitude = baseline + detail + lowFreq + noise;

        // Ensure within range 0-1
        amplitude = Math.max(0.05, Math.min(0.95, amplitude));
        data.push(amplitude);
      }

      setWaveformData(data);
    };

    generateWaveform();
  }, [duration]);

  // Draw waveform on canvas with subtitle segments highlighted
  useEffect(() => {
    if (!waveformCanvasRef.current || waveformData.length === 0) return;

    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use device pixel ratio for sharper rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const centerY = height / 2;
    const barWidth = Math.max(1, width / waveformData.length);

    // Draw background
    ctx.fillStyle = isDarkMode ? "#1F2937" : "#F3F4F6";
    ctx.fillRect(0, 0, width, height);

    // Draw subtitle segments
    subtitles.forEach((subtitle) => {
      const startX = (subtitle.startTime / duration) * width;
      const endX = (subtitle.endTime / duration) * width;

      ctx.fillStyle =
        subtitle.id === activeSubtitleId
          ? isDarkMode
            ? "rgba(59, 130, 246, 0.3)"
            : "rgba(59, 130, 246, 0.2)"
          : isDarkMode
            ? "rgba(75, 85, 99, 0.3)"
            : "rgba(209, 213, 219, 0.5)";
      ctx.fillRect(startX, 0, endX - startX, height);

      // Draw segment boundaries
      ctx.strokeStyle =
        subtitle.id === activeSubtitleId
          ? "#3B82F6"
          : isDarkMode
            ? "#6B7280"
            : "#9CA3AF";
      ctx.lineWidth = subtitle.id === activeSubtitleId ? 2 : 1;

      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();
    });

    // Draw waveform
    ctx.fillStyle = isDarkMode
      ? "rgba(156, 163, 175, 0.7)"
      : "rgba(107, 114, 128, 0.6)";

    for (let i = 0; i < waveformData.length; i++) {
      const x = i * barWidth;
      const amplitude = waveformData[i] * centerY * 0.8;

      // Draw bar centered vertically
      ctx.fillRect(
        x,
        centerY - amplitude,
        barWidth - 0.5, // Small gap between bars
        amplitude * 2
      );
    }

    // Draw current time indicator
    const timeX = (currentTime / duration) * width;
    ctx.strokeStyle = "#EF4444"; // Red
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(timeX, 0);
    ctx.lineTo(timeX, height);
    ctx.stroke();

    // Draw playhead circle
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(timeX, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // If there's an active waveform segment, highlight it
    if (activeWaveformSegment) {
      const [start, end] = activeWaveformSegment;
      const startX = (start / duration) * width;
      const endX = (end / duration) * width;

      // Draw selection overlay
      ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
      ctx.fillRect(startX, 0, endX - startX, height);

      // Draw handles
      ctx.fillStyle = "#3B82F6";
      ctx.beginPath();
      ctx.arc(startX, height / 2, 5, 0, Math.PI * 2);
      ctx.arc(endX, height / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [
    waveformData,
    isDarkMode,
    subtitles,
    activeSubtitleId,
    currentTime,
    duration,
    activeWaveformSegment,
  ]);

  // Initialize editing fields when active subtitle changes
  useEffect(() => {
    if (activeSubtitle) {
      setEditingText(activeSubtitle.text);
      setEditStartTime(formatTimecode(activeSubtitle.startTime));
      setEditEndTime(formatTimecode(activeSubtitle.endTime));
      setActiveWaveformSegment([
        activeSubtitle.startTime,
        activeSubtitle.endTime,
      ]);
    } else {
      setActiveWaveformSegment(null);
    }
  }, [activeSubtitle]);

  // Auto-focus text area when editing a subtitle
  useEffect(() => {
    if (activeSubtitle && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [activeSubtitleId, activeSubtitle]);

  // Auto-scroll to active subtitle in the list
  useEffect(() => {
    if (activeSubtitleId && subtitleListRef.current && isAutoScrollEnabled) {
      const activeElement = subtitleListRef.current.querySelector(
        `[data-subtitle-id="${activeSubtitleId}"]`
      );
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeSubtitleId, isAutoScrollEnabled]);

  // Focus the new subtitle input when pressing key shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture shortcuts if typing in an input
      if (
        ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName || "")
      ) {
        return;
      }

      // Alt+N shortcut to focus new subtitle input
      if (e.altKey && e.key === "n" && newSubtitleInputRef.current) {
        e.preventDefault();
        newSubtitleInputRef.current.focus();
      }

      // Delete key to delete active subtitle (with confirmation)
      if (e.key === "Delete" && activeSubtitleId && !showConfirmDelete) {
        e.preventDefault();
        setShowConfirmDelete(true);
      }

      // Escape to cancel confirmation
      if (e.key === "Escape" && showConfirmDelete) {
        e.preventDefault();
        setShowConfirmDelete(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeSubtitleId, showConfirmDelete]);

  // Parse timecode string to seconds
  const parseTimecode = useCallback((timecode: string): number => {
    // Handle MM:SS format
    if (/^\d+:\d+$/.test(timecode)) {
      const [minutes, seconds] = timecode.split(":").map(Number);
      return minutes * 60 + seconds;
    }

    // Handle MM:SS.sss format
    if (/^\d+:\d+\.\d+$/.test(timecode)) {
      const [minutesPart, secondsPart] = timecode.split(":");
      const minutes = parseInt(minutesPart, 10);
      const seconds = parseFloat(secondsPart);
      return minutes * 60 + seconds;
    }

    // Try to parse as seconds
    const asNumber = Number(timecode);
    if (!isNaN(asNumber)) {
      return asNumber;
    }

    return 0;
  }, []);

  // Handle adding a new subtitle
  const handleAddSubtitle = useCallback(() => {
    if (newSubtitleText.trim()) {
      // Default subtitle duration: 3 seconds
      const startTime = currentTime;
      const endTime = Math.min(duration, currentTime + 3);

      const newSubtitle = videoEditorManager.addSubtitle(
        startTime,
        endTime,
        newSubtitleText.trim()
      );

      // Apply last used style if available
      if (lastUsedStyle && Object.keys(lastUsedStyle).length > 0) {
        videoEditorManager.updateSubtitle(newSubtitle.id, {
          style: { ...newSubtitle.style, ...lastUsedStyle },
        });
      }

      setNewSubtitleText("");
      videoEditorManager.setActiveSubtitle(newSubtitle.id);
      setHasMadeChanges(true);

      // Highlight the new subtitle on the waveform
      setActiveWaveformSegment([startTime, endTime]);
    }
  }, [newSubtitleText, currentTime, duration, lastUsedStyle]);

  // Handle updating subtitle text
  const handleUpdateSubtitleText = useCallback(() => {
    if (activeSubtitleId && editingText.trim()) {
      videoEditorManager.updateSubtitle(activeSubtitleId, {
        text: editingText.trim(),
      });
      setHasMadeChanges(true);
    }
  }, [activeSubtitleId, editingText]);

  // Handle changing subtitle timing
  const handleUpdateTiming = useCallback(
    (field: "startTime" | "endTime", value: string) => {
      if (!activeSubtitleId || !activeSubtitle) return;

      // Parse time in MM:SS format to seconds
      const timeInSeconds = parseTimecode(value);

      // Validate timing boundaries
      if (field === "startTime") {
        if (timeInSeconds >= activeSubtitle.endTime || timeInSeconds < 0) {
          return;
        }
        setEditStartTime(value);
      } else {
        if (
          timeInSeconds <= activeSubtitle.startTime ||
          timeInSeconds > duration
        ) {
          return;
        }
        setEditEndTime(value);
      }

      videoEditorManager.updateSubtitle(activeSubtitleId, {
        [field]: timeInSeconds,
      });

      // Update waveform selection
      setActiveWaveformSegment([
        field === "startTime" ? timeInSeconds : activeSubtitle.startTime,
        field === "endTime" ? timeInSeconds : activeSubtitle.endTime,
      ]);

      setHasMadeChanges(true);
    },
    [activeSubtitleId, activeSubtitle, duration, parseTimecode]
  );

  // Handle changing subtitle position
  const handleUpdatePosition = useCallback(
    (position: "top" | "middle" | "bottom") => {
      if (applyStyleToAll) {
        videoEditorManager.updateAllSubtitles({ position });
      } else if (activeSubtitleId) {
        videoEditorManager.updateSubtitle(activeSubtitleId, { position });
      }
      setHasMadeChanges(true);
    },
    [activeSubtitleId]
  );

  // Handle deleting the current subtitle
  const handleDeleteSubtitle = useCallback(() => {
    if (activeSubtitleId) {
      videoEditorManager.deleteSubtitle(activeSubtitleId);
      setShowConfirmDelete(false);
      setHasMadeChanges(true);
    }
  }, [activeSubtitleId]);

  // Enhanced style update handler with option to apply to all subtitles
  const handleUpdateStyle = (field: keyof Subtitle["style"], value: any) => {
    if (applyStyleToAll) {
      // Apply to all subtitles
      runInAction(() => {
        subtitles.forEach((subtitle) => {
          videoEditorManager.updateSubtitle(subtitle.id, {
            style: {
              ...subtitle.style,
              [field]: value,
            },
          });
        });
      });
    } else if (activeSubtitleId && activeSubtitle) {
      // Apply only to active subtitle
      const updatedStyle = {
        ...activeSubtitle.style,
        [field]: value,
      };

      videoEditorManager.updateSubtitle(activeSubtitleId, {
        style: updatedStyle,
      });
    }

    // Save this style for future subtitles
    setLastUsedStyle({
      ...lastUsedStyle,
      [field]: value,
    });

    setHasMadeChanges(true);
  };
  //   ,
  //   [
  //     activeSubtitleId,
  //     activeSubtitle,
  //     lastUsedStyle,
  //     subtitles,
  //     applyStyleToAll,
  //   ]
  // );

  // Handle time dial drag
  const handleTimeDialStart = useCallback(
    (
      type: "start" | "end",
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
      e.preventDefault();
      if (!timeDialRef.current || !activeSubtitle) return;

      setIsDraggingTime(true);
      setDraggingTimeType(type);

      const rect = timeDialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Get client position from either mouse or touch event
      const clientX =
        "touches" in e
          ? e.touches[0].clientX
          : (e as React.MouseEvent<HTMLDivElement>).clientX;

      const clientY =
        "touches" in e
          ? e.touches[0].clientY
          : (e as React.MouseEvent<HTMLDivElement>).clientY;

      // Calculate angle based on mouse position
      const initialAngle = Math.atan2(clientY - centerY, clientX - centerX);

      // Store current time value
      const initialTime =
        type === "start" ? activeSubtitle.startTime : activeSubtitle.endTime;

      setDraggingStartInfo({ angle: initialAngle, time: initialTime });
      setDraggingTimeValue(initialTime);

      // Add document-level event listeners
      document.addEventListener("mousemove", handleTimeDialMove);
      document.addEventListener("touchmove", handleTimeDialTouchMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleTimeDialEnd);
      document.addEventListener("touchend", handleTimeDialEnd);
    },
    [activeSubtitle]
  );

  // Handle time dial movement (mouse)
  const handleTimeDialMove = useCallback(
    (e: MouseEvent) => {
      if (
        !isDraggingTime ||
        !draggingTimeType ||
        !timeDialRef.current ||
        !activeSubtitle
      )
        return;

      // Throttle updates for better performance
      const now = performance.now();
      if (now - lastUpdateTimeRef.current < throttleTimeRef.current) return;
      lastUpdateTimeRef.current = now;

      const rect = timeDialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate new angle
      const newAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const angleDelta = newAngle - draggingStartInfo.angle;

      // Convert angle change to time change (2π = 10 seconds)
      const timeChange = (angleDelta / (2 * Math.PI)) * 10;

      // Calculate new time value with constraints
      let newTime = draggingStartInfo.time + timeChange;

      if (draggingTimeType === "start") {
        newTime = Math.max(0, Math.min(newTime, activeSubtitle.endTime - 0.5));
        videoEditorManager.updateSubtitle(activeSubtitleId!, {
          startTime: newTime,
        });
        setEditStartTime(formatTimecode(newTime));
        setActiveWaveformSegment([newTime, activeSubtitle.endTime]);
      } else {
        newTime = Math.max(
          activeSubtitle.startTime + 0.5,
          Math.min(newTime, duration)
        );
        videoEditorManager.updateSubtitle(activeSubtitleId!, {
          endTime: newTime,
        });
        setEditEndTime(formatTimecode(newTime));
        setActiveWaveformSegment([activeSubtitle.startTime, newTime]);
      }

      // Update displayed value
      setDraggingTimeValue(newTime);
      setHasMadeChanges(true);
    },
    [
      isDraggingTime,
      draggingTimeType,
      draggingStartInfo,
      activeSubtitle,
      activeSubtitleId,
      duration,
    ]
  );

  // Handle time dial movement (touch)
  const handleTimeDialTouchMove = useCallback(
    (e: TouchEvent) => {
      if (
        !isDraggingTime ||
        !draggingTimeType ||
        !timeDialRef.current ||
        !activeSubtitle ||
        e.touches.length === 0
      )
        return;

      e.preventDefault();

      // Throttle updates for better performance
      const now = performance.now();
      if (now - lastUpdateTimeRef.current < throttleTimeRef.current) return;
      lastUpdateTimeRef.current = now;

      const touch = e.touches[0];
      const rect = timeDialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate new angle
      const newAngle = Math.atan2(
        touch.clientY - centerY,
        touch.clientX - centerX
      );
      const angleDelta = newAngle - draggingStartInfo.angle;

      // Convert angle change to time change (2π = 10 seconds)
      const timeChange = (angleDelta / (2 * Math.PI)) * 10;

      // Calculate new time value with constraints
      let newTime = draggingStartInfo.time + timeChange;

      if (draggingTimeType === "start") {
        newTime = Math.max(0, Math.min(newTime, activeSubtitle.endTime - 0.5));
        videoEditorManager.updateSubtitle(activeSubtitleId!, {
          startTime: newTime,
        });
        setEditStartTime(formatTimecode(newTime));
        setActiveWaveformSegment([newTime, activeSubtitle.endTime]);
      } else {
        newTime = Math.max(
          activeSubtitle.startTime + 0.5,
          Math.min(newTime, duration)
        );
        videoEditorManager.updateSubtitle(activeSubtitleId!, {
          endTime: newTime,
        });
        setEditEndTime(formatTimecode(newTime));
        setActiveWaveformSegment([activeSubtitle.startTime, newTime]);
      }

      // Update displayed value
      setDraggingTimeValue(newTime);
      setHasMadeChanges(true);
    },
    [
      isDraggingTime,
      draggingTimeType,
      draggingStartInfo,
      activeSubtitle,
      activeSubtitleId,
      duration,
    ]
  );

  // End time dial drag
  const handleTimeDialEnd = useCallback(() => {
    setIsDraggingTime(false);
    setDraggingTimeType(null);

    // Remove event listeners
    document.removeEventListener("mousemove", handleTimeDialMove);
    document.removeEventListener("touchmove", handleTimeDialTouchMove);
    document.removeEventListener("mouseup", handleTimeDialEnd);
    document.removeEventListener("touchend", handleTimeDialEnd);
  }, [handleTimeDialMove, handleTimeDialTouchMove]);

  // Waveform interaction - seek and selection
  const handleWaveformClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!waveformCanvasRef.current) return;

      const rect = waveformCanvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickPosition = x / rect.width;

      // Calculate time from position
      const clickTime = clickPosition * duration;

      // Seek to time
      videoEditorManager.seek(clickTime);

      // If shift is held, extend selection
      if (e.shiftKey && activeWaveformSegment) {
        const [start, end] = activeWaveformSegment;

        // Determine whether to update start or end time
        if (Math.abs(clickTime - start) < Math.abs(clickTime - end)) {
          setActiveWaveformSegment([clickTime, end]);

          // Update subtitle if active
          if (activeSubtitleId) {
            videoEditorManager.updateSubtitle(activeSubtitleId, {
              startTime: clickTime,
            });
            setEditStartTime(formatTimecode(clickTime));
            setHasMadeChanges(true);
          }
        } else {
          setActiveWaveformSegment([start, clickTime]);

          // Update subtitle if active
          if (activeSubtitleId) {
            videoEditorManager.updateSubtitle(activeSubtitleId, {
              endTime: clickTime,
            });
            setEditEndTime(formatTimecode(clickTime));
            setHasMadeChanges(true);
          }
        }
      }
    },
    [duration, activeWaveformSegment, activeSubtitleId]
  );

  // Create a subtitle from waveform selection
  const handleCreateFromSelection = useCallback(() => {
    if (!activeWaveformSegment) return;

    const [start, end] = activeWaveformSegment;

    if (end - start >= 0.5) {
      if (activeSubtitleId) {
        // Update existing subtitle
        videoEditorManager.updateSubtitle(activeSubtitleId, {
          startTime: start,
          endTime: end,
        });
        setEditStartTime(formatTimecode(start));
        setEditEndTime(formatTimecode(end));
      } else {
        // Create new subtitle
        const newSubtitle = videoEditorManager.addSubtitle(
          start,
          end,
          newSubtitleText || "New subtitle"
        );

        // Apply last used style
        if (lastUsedStyle && Object.keys(lastUsedStyle).length > 0) {
          videoEditorManager.updateSubtitle(newSubtitle.id, {
            style: { ...newSubtitle.style, ...lastUsedStyle },
          });
        }

        setNewSubtitleText("");
        videoEditorManager.setActiveSubtitle(newSubtitle.id);
      }

      setHasMadeChanges(true);
    }
  }, [activeWaveformSegment, activeSubtitleId, newSubtitleText, lastUsedStyle]);

  // Add subtitle from selected transcript text
  const handleAddFromTranscript = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setNewSubtitleText(selection.toString().trim());
      if (newSubtitleInputRef.current) {
        newSubtitleInputRef.current.focus();
      }
    }
  }, []);

  // Create a voice detection subtitle (simulated)
  const handleAutomaticSubtitles = useCallback(() => {
    // In a real implementation, this would use speech recognition
    // For demo, we'll add some sample subtitles
    const sampleTexts = [
      "Welcome to our product demonstration.",
      "I've been using this for three months now.",
      "The quality is exceptional and the service is great.",
      "I would definitely recommend it to others.",
      "It has truly made a difference in my workflow.",
    ];

    // Add sample subtitles spread across the video duration
    sampleTexts.forEach((text, index) => {
      const segmentLength = duration / (sampleTexts.length + 1);
      const startTime = segmentLength * (index + 0.5);
      const endTime = startTime + Math.min(5, segmentLength * 0.8);

      const newSubtitle = videoEditorManager.addSubtitle(
        startTime,
        endTime,
        text
      );

      // Apply last used style
      videoEditorManager.updateSubtitle(newSubtitle.id, {
        style: { ...newSubtitle.style, ...lastUsedStyle },
      });
    });

    setHasMadeChanges(true);
  }, [duration, lastUsedStyle]);

  // Available font families
  const fontFamilies: SelectProps["options"] = [
    { value: "Inter", label: "Inter" },
    { value: "Urbanist", label: "Urbanist" },
    { value: "Arial", label: "Arial" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Georgia", label: "Georgia" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Roboto", label: "Roboto" },
    { value: "Verdana", label: "Verdana" },
    { value: "Impact", label: "Impact" },
  ];

  // Color presets
  const colorPresets = [
    "#FFFFFF", // White
    "#000000", // Black
    "#FFFF00", // Yellow
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FF00FF", // Magenta
  ];

  // Background color presets (with opacity)
  const bgColorPresets = [
    "rgba(0, 0, 0, 0.75)", // Semi-transparent black
    "rgba(0, 0, 0, 0.9)", // More opaque black
    "rgba(0, 0, 0, 0)", // Transparent
    "rgba(255, 255, 255, 0.5)", // Semi-transparent white
    "rgba(0, 0, 255, 0.3)", // Semi-transparent blue
    "rgba(255, 0, 0, 0.3)", // Semi-transparent red
  ];

  // Animation variants for different UI elements
  const contentVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  // Get a subtitle position in the timeline as a percentage
  const getSubtitleTimelinePosition = useCallback(
    (subtitle: Subtitle): { left: string; width: string } => {
      const left = (subtitle.startTime / duration) * 100;
      const width = ((subtitle.endTime - subtitle.startTime) / duration) * 100;
      return {
        left: `${left}%`,
        width: `${width}%`,
      };
    },
    [duration]
  );

  // Format duration as seconds
  const formatDuration = useCallback((start: number, end: number): string => {
    const seconds = end - start;
    return `${seconds.toFixed(1)}s`;
  }, []);

  // Preview a subtitle
  const handlePreviewSubtitle = useCallback(
    (subtitle: Subtitle) => {
      if (isPlaying) videoEditorManager.pause();
      videoEditorManager.seek(subtitle.startTime);
      setPreviewingSubtitle(subtitle.id);

      // Clear preview after 3 seconds
      setTimeout(() => {
        setPreviewingSubtitle(null);
      }, 3000);
    },
    [isPlaying]
  );

  return (
    <div
      className={`h-full flex flex-col ${isDarkMode ? "text-white" : "text-gray-800"}`}
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Subtitles Editor</h2>

          <div className="flex items-center">
            <button
              className={`relative flex items-center px-3 py-1.5 rounded-md text-sm ${
                showSubtitles
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-200 text-gray-600"
              }`}
              onClick={videoEditorManager.toggleSubtitles}
            >
              <span className="w-4 h-4 mr-2">
                {showSubtitles ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </span>
              {showSubtitles ? "Visible" : "Hidden"}
            </button>

            {hasMadeChanges && (
              <div className="ml-3 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                Unsaved Changes
              </div>
            )}
          </div>
        </div>
        <p
          className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Add and manage subtitles for your video
        </p>
      </div>

      {/* Waveform Timeline */}
      <div
        className={`px-4 pt-3 pb-1 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
      >
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-medium">Audio Waveform</h3>
          <span className="text-xs opacity-70">{formatTimecode(duration)}</span>
        </div>

        <canvas
          ref={waveformCanvasRef}
          className="w-full h-16 rounded-md cursor-pointer mb-1"
          onClick={handleWaveformClick}
        />

        {activeWaveformSegment && (
          <div className="flex justify-between items-center mb-1 text-xs">
            <div className="flex items-center">
              <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                Selection:
              </span>
              <span className="ml-1 font-mono">
                {formatTimecode(activeWaveformSegment[0])} -{" "}
                {formatTimecode(activeWaveformSegment[1])}
              </span>
              <span className="ml-1 opacity-70">
                (
                {formatDuration(
                  activeWaveformSegment[0],
                  activeWaveformSegment[1]
                )}
                )
              </span>
            </div>

            <button
              className={`px-2 py-0.5 rounded text-xs ${
                isDarkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              onClick={handleCreateFromSelection}
            >
              {activeSubtitleId ? "Apply Selection" : "Create Subtitle"}
            </button>
          </div>
        )}

        <div className="flex text-xs mb-1">
          <span className="opacity-50">
            Tip: Click to seek. Shift+Click to select range.
          </span>
        </div>
      </div>

      {/* Add New Subtitle */}
      <div
        className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">
            Add Subtitle at {formatTimecode(currentTime)}
          </h3>

          <div className="flex space-x-1">
            <button
              className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={() => setTranscriptVisible(!transcriptVisible)}
            >
              <svg
                className="w-3.5 h-3.5 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              Transcript
            </button>

            <button
              className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                isDarkMode
                  ? "bg-purple-700 hover:bg-purple-600 text-white"
                  : "bg-purple-500 hover:bg-purple-600 text-white"
              }`}
              onClick={handleAutomaticSubtitles}
              title="Generate automatic subtitles from audio"
            >
              <svg
                className="w-3.5 h-3.5 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Auto-Generate
            </button>
          </div>
        </div>

        <div className="flex">
          <input
            ref={newSubtitleInputRef}
            type="text"
            value={newSubtitleText}
            onChange={(e) => setNewSubtitleText(e.target.value)}
            placeholder="Enter subtitle text... (Alt+N)"
            className={`flex-1 px-3 py-2 rounded-l-md text-sm ${
              isDarkMode
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-white text-gray-900 border-gray-300"
            } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSubtitle();
              }
            }}
          />
          <button
            className={`px-3 py-2 rounded-r-md text-sm font-medium ${
              newSubtitleText.trim()
                ? isDarkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
                : isDarkMode
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            onClick={handleAddSubtitle}
            disabled={!newSubtitleText.trim()}
          >
            Add
          </button>
        </div>

        <AnimatePresence>
          {transcriptVisible && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={contentVariants}
              className={`mt-3 p-3 rounded-md text-sm ${
                isDarkMode ? "bg-gray-800" : "bg-white border border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium">Transcript</h4>
                <button
                  className={`text-xs px-2 py-0.5 rounded ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  }`}
                  onClick={handleAddFromTranscript}
                >
                  Use Selection
                </button>
              </div>

              <div
                className={`h-40 overflow-y-auto p-2 rounded text-xs ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                {mockTranscript}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtitle List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">
            Subtitles ({subtitles.length})
          </h3>

          <div className="flex items-center">
            <div className={`relative rounded-md shadow-sm`}>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search subtitles..."
                className={`w-48 px-3 py-1 text-xs rounded-md ${
                  isDarkMode
                    ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                    : "bg-white text-gray-900 placeholder-gray-500 border-gray-300"
                } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {searchText && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchText("")}
                >
                  <svg
                    className="h-3 w-3 text-gray-400"
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
              )}
            </div>

            <button
              className={`ml-2 p-1.5 rounded-md ${
                isAutoScrollEnabled
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-700"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-400"
                    : "bg-gray-200 text-gray-500"
              }`}
              onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
              title={
                isAutoScrollEnabled
                  ? "Disable auto-scroll"
                  : "Enable auto-scroll"
              }
            >
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm9 4a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L14 12.586V8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {subtitles.length === 0 ? (
          <div
            className={`text-center py-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            <div className="text-3xl mb-2">📝</div>
            <p>No subtitles yet. Add your first subtitle above.</p>
          </div>
        ) : (
          <div
            ref={subtitleListRef}
            className="space-y-2 max-h-full overflow-y-auto"
          >
            {filteredSubtitles.map((subtitle) => (
              <div
                key={subtitle.id}
                data-subtitle-id={subtitle.id}
                className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  subtitle.id === activeSubtitleId
                    ? isDarkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 border-blue-300 border"
                    : isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-100 hover:bg-gray-200"
                } ${previewingSubtitle === subtitle.id ? "ring-2 ring-green-500" : ""}`}
                onClick={() =>
                  videoEditorManager.setActiveSubtitle(subtitle.id)
                }
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <div className="flex items-center">
                    <span
                      className={`font-mono ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {formatTimecode(subtitle.startTime)} —{" "}
                      {formatTimecode(subtitle.endTime)}
                    </span>
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                        isDarkMode
                          ? "bg-gray-600 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {formatDuration(subtitle.startTime, subtitle.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span
                      className={`capitalize px-1.5 py-0.5 rounded text-[10px] ${
                        isDarkMode
                          ? "bg-gray-600 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {subtitle.position}
                    </span>

                    <button
                      className={`p-1 rounded ${
                        isDarkMode
                          ? "hover:bg-gray-600 text-gray-300"
                          : "hover:bg-gray-200 text-gray-500"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewSubtitle(subtitle);
                      }}
                      title="Preview subtitle"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zm1.995.139a7.962 7.962 0 0014.095 0 7.962 7.962 0 00-14.095 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm truncate">{subtitle.text}</p>

                {/* Visual timeline representation */}
                <div className="mt-1 h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={getSubtitleTimelinePosition(subtitle)}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Active Subtitle */}
      {activeSubtitle && (
        <div
          className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Edit Subtitle</h3>
            <div className="flex space-x-1">
              <button
                className={`px-1.5 py-1 rounded text-xs ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => setShowFontPanel(!showFontPanel)}
              >
                {showFontPanel ? "Hide Styling" : "Show Styling"}
              </button>
            </div>
          </div>

          {/* Edit text */}
          <textarea
            ref={editTextareaRef}
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            className={`w-full px-3 py-2 rounded-md text-sm ${
              isDarkMode
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-white text-gray-900 border-gray-300"
            } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
            rows={2}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                handleUpdateSubtitleText();
              }
            }}
          />

          <div className="flex justify-between mt-2">
            <button
              className={`px-3 py-1.5 rounded-md text-sm ${
                isDarkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              onClick={handleUpdateSubtitleText}
            >
              Update Text
            </button>

            <button
              className={`px-3 py-1.5 rounded-md text-sm ${
                isDarkMode
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
              onClick={() => setShowConfirmDelete(true)}
            >
              Delete
            </button>
          </div>

          {/* Timing controls */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="w-1/2">
              <label className="block text-xs mb-1">Start Time</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  onBlur={() => handleUpdateTiming("startTime", editStartTime)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUpdateTiming("startTime", editStartTime);
                    }
                  }}
                  className={`w-full px-3 py-1.5 rounded-l-md text-sm ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-white text-gray-900 border-gray-300"
                  } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="MM:SS"
                />
                <div
                  ref={timeDialRef}
                  className={`w-8 h-8 rounded-r-md flex items-center justify-center cursor-grab active:cursor-grabbing ${
                    isDarkMode ? "bg-gray-600" : "bg-gray-200"
                  }`}
                  onMouseDown={(e) => handleTimeDialStart("start", e)}
                  onTouchStart={(e) => handleTimeDialStart("start", e)}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="w-1/2">
              <label className="block text-xs mb-1">End Time</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  onBlur={() => handleUpdateTiming("endTime", editEndTime)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUpdateTiming("endTime", editEndTime);
                    }
                  }}
                  className={`w-full px-3 py-1.5 rounded-l-md text-sm ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-white text-gray-900 border-gray-300"
                  } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="MM:SS"
                />
                <div
                  className={`w-8 h-8 rounded-r-md flex items-center justify-center cursor-grab active:cursor-grabbing ${
                    isDarkMode ? "bg-gray-600" : "bg-gray-200"
                  }`}
                  onMouseDown={(e) => handleTimeDialStart("end", e)}
                  onTouchStart={(e) => handleTimeDialStart("end", e)}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 17a1 1 0 01-.707-.293l-3-3a1 1 0 011.414-1.414L9 13.586V4a1 1 0 012 0v9.586l1.293-1.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 17z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Position controls */}
          <div className="mt-4">
            <label className="block text-xs mb-1">Position</label>
            <div className="flex">
              {["top", "middle", "bottom"].map((position) => (
                <button
                  key={position}
                  className={`flex-1 py-1.5 text-sm ${
                    activeSubtitle.position === position
                      ? isDarkMode
                        ? "bg-blue-600 text-white"
                        : "bg-blue-500 text-white"
                      : isDarkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  } ${
                    position === "top"
                      ? "rounded-l-md"
                      : position === "bottom"
                        ? "rounded-r-md"
                        : ""
                  }`}
                  onClick={() => handleUpdatePosition(position as any)}
                >
                  {position.charAt(0).toUpperCase() + position.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Style controls */}
          <AnimatePresence>
            {showFontPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-4"
              >
                {/* Apply to all toggle */}
                <div className="mb-4 flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Apply style changes to:
                  </span>
                  <Tooltip
                    title={
                      applyStyleToAll
                        ? "Style changes will apply to all subtitles"
                        : "Style changes will only apply to this subtitle"
                    }
                  >
                    <div>
                      <Switch
                        checked={applyStyleToAll}
                        onChange={setApplyStyleToAll}
                        checkedChildren="All subtitles"
                        unCheckedChildren="This subtitle"
                      />
                    </div>
                  </Tooltip>
                </div>

                {/* Font Family */}
                <div className="mb-3">
                  <label className="block text-xs mb-1">Font</label>
                  <Select
                    className="w-full"
                    value={activeSubtitle.style.fontFamily}
                    onChange={(value) => handleUpdateStyle("fontFamily", value)}
                    options={fontFamilies}
                    size="middle"
                    dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* Font Size */}
                  <div>
                    <label className="block text-xs mb-1">
                      Size: {activeSubtitle.style.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="36"
                      step="1"
                      value={activeSubtitle.style.fontSize}
                      onChange={(e) =>
                        handleUpdateStyle("fontSize", Number(e.target.value))
                      }
                      className="w-full accent-blue-500"
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <label className="block text-xs mb-1">
                      Opacity: {Math.round(activeSubtitle.style.opacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={activeSubtitle.style.opacity}
                      onChange={(e) =>
                        handleUpdateStyle("opacity", Number(e.target.value))
                      }
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>

                {/* Text Color and Background Color */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Text Color */}
                  <div>
                    <label className="block text-xs mb-1">Text Color</label>
                    <div className="flex items-center">
                      <div
                        className="w-6 h-6 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                        style={{ backgroundColor: activeSubtitle.style.color }}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                      ></div>
                      <div className="ml-2 flex-1">
                        <select
                          value={activeSubtitle.style.color}
                          onChange={(e) =>
                            handleUpdateStyle("color", e.target.value)
                          }
                          className={`w-full px-2 py-1 text-xs rounded-md ${
                            isDarkMode
                              ? "bg-gray-700 text-white border-gray-600"
                              : "bg-white text-gray-900 border-gray-300"
                          } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        >
                          {colorPresets.map((color) => (
                            <option key={color} value={color}>
                              {color === "#FFFFFF"
                                ? "White"
                                : color === "#000000"
                                  ? "Black"
                                  : color === "#FFFF00"
                                    ? "Yellow"
                                    : color === "#FF0000"
                                      ? "Red"
                                      : color === "#00FF00"
                                        ? "Green"
                                        : color === "#0000FF"
                                          ? "Blue"
                                          : color === "#FF00FF"
                                            ? "Magenta"
                                            : color}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {showColorPicker && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {colorPresets.map((color) => (
                          <div
                            key={color}
                            className="w-5 h-5 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              handleUpdateStyle("color", color);
                              setShowColorPicker(false);
                            }}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-xs mb-1">Background</label>
                    <div className="flex items-center">
                      <div
                        className="w-6 h-6 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer checkerboard-bg"
                        style={{
                          backgroundColor: activeSubtitle.style.backgroundColor,
                        }}
                        onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                      ></div>
                      <div className="ml-2 flex-1">
                        <select
                          value={activeSubtitle.style.backgroundColor}
                          onChange={(e) =>
                            handleUpdateStyle("backgroundColor", e.target.value)
                          }
                          className={`w-full px-2 py-1 text-xs rounded-md ${
                            isDarkMode
                              ? "bg-gray-700 text-white border-gray-600"
                              : "bg-white text-gray-900 border-gray-300"
                          } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        >
                          {bgColorPresets.map((color, index) => (
                            <option key={color} value={color}>
                              {index === 0
                                ? "Semi-black"
                                : index === 1
                                  ? "Dark black"
                                  : index === 2
                                    ? "Transparent"
                                    : index === 3
                                      ? "Semi-white"
                                      : index === 4
                                        ? "Semi-blue"
                                        : index === 5
                                          ? "Semi-red"
                                          : color}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {showBgColorPicker && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {bgColorPresets.map((color) => (
                          <div
                            key={color}
                            className="w-5 h-5 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer checkerboard-bg"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              handleUpdateStyle("backgroundColor", color);
                              setShowBgColorPicker(false);
                            }}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-3">
                  <label className="block text-xs mb-1">Preview</label>
                  <div
                    className="relative h-16 bg-gray-800 rounded-md overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundImage:
                        "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xNkRpr/UAAABESURBVDhPY/j//z8K9vf3/w9kwcDAwICA+XBxmDxYDz5ArIaBgQE4g6Gl0Q1A10CUF0YNoDIg8TRBIjBVDQBRrACmzwMA5f1wKy5o/dQAAAAASUVORK5CYII=')",
                    }}
                  >
                    <div
                      className="px-4 py-1 rounded-md text-center"
                      style={{
                        fontFamily: activeSubtitle.style.fontFamily,
                        fontSize: `${activeSubtitle.style.fontSize}px`,
                        color: activeSubtitle.style.color,
                        backgroundColor: activeSubtitle.style.backgroundColor,
                        opacity: activeSubtitle.style.opacity,
                        maxWidth: "90%",
                      }}
                    >
                      {editingText || "Sample Subtitle Text"}
                    </div>
                  </div>
                </div>

                {/* Style message */}
                {applyStyleToAll && (
                  <div className="mt-2 text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 rounded p-2 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Style changes will be applied to all subtitles
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative p-6 rounded-lg shadow-xl max-w-sm w-full ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h3
                className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                Delete Subtitle?
              </h3>
              <p
                className={`mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                Are you sure you want to delete this subtitle? This action
                cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  className={`px-4 py-2 rounded-md text-sm ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-sm text-white ${
                    isDarkMode
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                  onClick={handleDeleteSubtitle}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for checker pattern background */}
      <style>{`
        .checkerboard-bg {
          background-color: #ffffff;
          background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%);
          background-size: 8px 8px;
          background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
        }
      `}</style>
    </div>
  );
});

export default SubtitlePanel;
