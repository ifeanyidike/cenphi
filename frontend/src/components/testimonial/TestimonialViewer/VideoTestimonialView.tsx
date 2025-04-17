import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";
import Badge from "../UI/Badge";
import Button from "../UI/Button";
import VideoEditor from "../videoEditor";
import { Testimonial } from "@/types/testimonial";

interface VideoTestimonialProps {
  testimonial: Testimonial;
}

const VideoTestimonialView: React.FC<VideoTestimonialProps> = observer(
  ({ testimonial }) => {
    const { uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedOptions, setShowSpeedOptions] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showBookmarkPanel, setShowBookmarkPanel] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [loading, setLoading] = useState(true);
    const [videoError, setVideoError] = useState<string | null>(null);
    // const [quality, setQuality] = useState<string>("auto");
    const [bufferedPercentage, setBufferedPercentage] = useState(0);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<number | null>(null);

    if (testimonial.format !== "video") {
      return (
        <div
          className={`p-6 rounded-lg ${isDarkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-900"}`}
        >
          Invalid testimonial format: Expected 'video' but got '
          {testimonial.format}'
        </div>
      );
    }

    // Ensure video content has expected properties
    if (!testimonial.media_url) {
      return (
        <div
          className={`p-6 rounded-lg ${isDarkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-900"}`}
        >
          Error: Missing video URL in testimonial content
        </div>
      );
    }

    // Format duration as mm:ss
    const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Calculate progress percentage
    const progressPercentage = videoDuration
      ? (currentTime / videoDuration) * 100
      : 0;

    // Hide controls after a delay when not hovering
    useEffect(() => {
      const showControlsTemporarily = () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }

        if (!isHovering && isPlaying) {
          controlsTimeoutRef.current = setTimeout(() => {
            // Hide controls
          }, 3000);
        }
      };

      showControlsTemporarily();

      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }, [isHovering, isPlaying]);

    // Handle video element events
    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const updateTime = () => {
        setCurrentTime(videoElement.currentTime);
      };

      const updateBuffer = () => {
        if (videoElement.buffered.length > 0) {
          const buffered = videoElement.buffered.end(
            videoElement.buffered.length - 1
          );
          const duration = videoElement.duration;
          setBufferedPercentage((buffered / duration) * 100);
        }
      };

      const handleDurationChange = () => {
        setVideoDuration(videoElement.duration);
      };

      const handleVideoPlay = () => {
        setIsPlaying(true);
      };

      const handleVideoPause = () => {
        setIsPlaying(false);
      };

      const handleVideoError = (e: Event) => {
        console.error("Video error:", e);
        setVideoError("Failed to load video. Please try again later.");
        setLoading(false);
      };

      const handleLoadedMetadata = () => {
        setVideoDuration(videoElement.duration);
        setLoading(false);
      };

      const handleLoadedData = () => {
        setVideoDuration(videoElement.duration);
        setLoading(false);
      };

      videoElement.addEventListener("timeupdate", updateTime);
      videoElement.addEventListener("progress", updateBuffer);
      videoElement.addEventListener("play", handleVideoPlay);
      videoElement.addEventListener("pause", handleVideoPause);
      videoElement.addEventListener("error", handleVideoError);
      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.addEventListener("loadeddata", handleLoadedData);
      videoElement.addEventListener("durationchange", handleDurationChange);

      return () => {
        videoElement.removeEventListener("timeupdate", updateTime);
        videoElement.removeEventListener("progress", updateBuffer);
        videoElement.removeEventListener("play", handleVideoPlay);
        videoElement.removeEventListener("pause", handleVideoPause);
        videoElement.removeEventListener("error", handleVideoError);
        videoElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        videoElement.removeEventListener("loadeddata", handleLoadedData);
      };
    }, []);

    // Sync playback speed with video element
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.playbackRate = playbackSpeed;
      }
    }, [playbackSpeed]);

    // Sync play/pause state with video element
    useEffect(() => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.play().catch((error) => {
            console.error("Error playing video:", error);
            setIsPlaying(false);
          });
        } else {
          videoRef.current.pause();
        }
      }
    }, [isPlaying]);

    // Sync mute state with video element
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
      }
    }, [isMuted]);

    // Handle fullscreen
    useEffect(() => {
      const container = videoContainerRef.current;
      if (!container) return;

      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);

      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
      };
    }, []);

    // Toggles
    const togglePlay = () => {
      setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
      setIsMuted(!isMuted);
    };

    const toggleFullscreen = () => {
      if (!videoContainerRef.current) return;

      if (!document.fullscreenElement) {
        videoContainerRef.current.requestFullscreen().catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`
          );
        });
      } else {
        document.exitFullscreen();
      }
    };

    const toggleTranscript = () => {
      setShowTranscript(!showTranscript);
    };

    const toggleSpeedOptions = () => {
      setShowSpeedOptions(!showSpeedOptions);
    };

    const toggleBookmarkPanel = () => {
      setShowBookmarkPanel(!showBookmarkPanel);
    };

    // Handle seek
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current) return;

      const progressBar = e.currentTarget;
      const bounds = progressBar.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const width = bounds.width;
      const percentage = x / width;
      const newTime = percentage * videoRef.current.duration;

      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    };

    // Open Video Editor
    const openVideoEditor = () => {
      if (isPlaying) {
        setIsPlaying(false);
      }
      setShowEditor(true);
      workspaceHub.uiManager.toggleSidebar(true);
    };

    // Close Video Editor (called when editing is done)
    const closeVideoEditor = () => {
      setShowEditor(false);
      workspaceHub.uiManager.toggleSidebar(false);
    };

    // Handle updated testimonial after saving edits
    const handleSaveVideoEdit = (updatedTestimonial: Testimonial) => {
      console.log("Video edit saved:", updatedTestimonial.id);
    };

    // Animation variants
    const controlsVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    };

    const transcriptVariants = {
      hidden: { opacity: 0, height: 0 },
      visible: { opacity: 1, height: "auto" },
    };

    const speedMenuVariants = {
      hidden: { opacity: 0, scale: 0.9, originY: 0 },
      visible: { opacity: 1, scale: 1 },
    };

    // Calculate video quality for display
    const getDisplayQuality = (): string => {
      //   return quality === "auto" ? "HD" : quality;
      return "HD";
    };

    // Show video editor if in editing mode
    if (showEditor) {
      return (
        <VideoEditor
          testimonial={testimonial}
          onClose={closeVideoEditor}
          onSave={handleSaveVideoEdit}
        />
      );
    }

    // Get sample bookmarks for the video
    const getVideoBookmarks = () => [
      { time: Math.floor(videoDuration * 0.1), label: "Introduction" },
      { time: Math.floor(videoDuration * 0.4), label: "Key points" },
      { time: Math.floor(videoDuration * 0.7), label: "Conclusion" },
    ];

    return (
      <div
        className={`rounded-lg overflow-hidden shadow-lg ${isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"} transition-colors duration-300`}
      >
        <div className="mb-4 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Badge
              variant="solid"
              color="primary"
              shape="pill"
              icon={
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              }
            >
              Video Testimonial
            </Badge>
            <span
              className={`ml-3 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
            >
              {formatDuration(testimonial.media_duration || 0)} •{" "}
              {getDisplayQuality()}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              }
              onClick={openVideoEditor}
              className={
                isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              Edit Video
            </Button>

            <Button
              variant="outline"
              size="xs"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              }
              onClick={toggleBookmarkPanel}
              className={
                isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              Bookmarks
            </Button>

            <Button
              variant={showTranscript ? "primary" : "outline"}
              size="xs"
              icon={
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              onClick={toggleTranscript}
              className={
                !showTranscript && isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : ""
              }
            >
              Transcript
            </Button>
          </div>
        </div>

        <div
          ref={videoContainerRef}
          className={`relative overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 bg-black" : "mx-4 rounded-lg aspect-video shadow-xl"}`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <video
            ref={videoRef}
            poster={testimonial.thumbnail_url ?? undefined}
            className="w-full h-full object-cover rounded-lg"
            playsInline
            onClick={togglePlay}
            // onLoadedMetadata={(e) => {
            //   e.currentTarget.play();
            //   console.log("meta loaded");
            // }}
            onDoubleClick={toggleFullscreen}
          >
            <source src={testimonial.media_url} type="video/mp4" />
          </video>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
            </div>
          )}

          {/* Error Overlay */}
          {videoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 p-6 text-center">
              <svg
                className="w-16 h-16 text-red-500 mb-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">Video Error</h3>
              <p className="text-white mb-4">{videoError}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setVideoError(null);
                  setLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Play button overlay - only when paused */}
          <AnimatePresence>
            {!isPlaying && !loading && !videoError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-blue-500/30"
                  onClick={togglePlay}
                >
                  <svg
                    className="w-10 h-10"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating time indicator */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium">
            {formatDuration(currentTime)} / {formatDuration(videoDuration)}
          </div>

          {/* Video quality badge */}
          <div className="absolute top-4 left-4">
            <Badge variant="soft" color="info" shape="pill" size="xs">
              {getDisplayQuality()}
            </Badge>
          </div>

          {/* Edit video button - visible on hover */}
          <motion.div
            className="absolute top-4 left-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovering ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-1 text-sm font-medium flex items-center shadow-md"
              onClick={openVideoEditor}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit
            </motion.button>
          </motion.div>

          {/* Video controls overlay */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent px-6 pb-6 pt-16"
            variants={controlsVariants}
            initial="hidden"
            animate={isHovering || !isPlaying ? "visible" : "hidden"}
            transition={{ duration: 0.3 }}
          >
            {/* Progress bar */}
            <div className="mb-4 relative">
              <div
                className="h-1.5 bg-white bg-opacity-20 rounded-full cursor-pointer relative overflow-hidden group"
                onClick={handleSeek}
              >
                {/* Buffered indicator */}
                <div
                  className="absolute h-full bg-white bg-opacity-40 rounded-full"
                  style={{ width: `${bufferedPercentage}%` }}
                ></div>

                {/* Progress indicator */}
                <motion.div
                  className="absolute h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                  initial={false}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.1 }}
                ></motion.div>

                {/* Hover effect - progress bar gets taller on hover */}
                <div className="absolute inset-0 h-full rounded-full transition-all duration-200 group-hover:h-3 -mt-0.75 opacity-0 group-hover:opacity-100"></div>

                {/* Knob indicator */}
                <motion.div
                  className="absolute top-1/2 w-4 h-4 bg-white rounded-full -mt-2 shadow-md opacity-0 group-hover:opacity-100"
                  style={{ left: `calc(${progressPercentage}% - 8px)` }}
                  initial={false}
                  animate={{ left: `calc(${progressPercentage}% - 8px)` }}
                  transition={{ duration: 0.1 }}
                ></motion.div>
              </div>

              {/* Chapter markers */}
              <div className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none">
                {[0.1, 0.25, 0.45, 0.6, 0.8].map((pos, idx) => (
                  <div
                    key={idx}
                    className="absolute w-1 h-1.5 bg-white rounded-full"
                    style={{ left: `${pos * 100}%` }}
                    title={`Chapter ${idx + 1}`}
                  ></div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white focus:outline-none group"
                  onClick={() => {
                    if (videoRef.current) {
                      const newTime = Math.max(
                        0,
                        videoRef.current.currentTime - 10
                      );
                      videoRef.current.currentTime = newTime;
                      setCurrentTime(newTime);
                    }
                  }}
                >
                  <svg
                    className="w-6 h-6 group-hover:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">Rewind 10 seconds</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white focus:outline-none p-1 group"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <svg
                      className="w-8 h-8 group-hover:text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 group-hover:text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="sr-only">
                    {isPlaying ? "Pause" : "Play"}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white focus:outline-none group"
                  onClick={() => {
                    if (videoRef.current) {
                      const newTime = Math.min(
                        videoRef.current.duration,
                        videoRef.current.currentTime + 10
                      );
                      videoRef.current.currentTime = newTime;
                      setCurrentTime(newTime);
                    }
                  }}
                >
                  <svg
                    className="w-6 h-6 group-hover:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">Forward 10 seconds</span>
                </motion.button>

                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-white focus:outline-none group"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <svg
                        className="w-6 h-6 group-hover:text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 group-hover:text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span className="sr-only">
                      {isMuted ? "Unmute" : "Mute"}
                    </span>
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-white focus:outline-none group flex items-center"
                    onClick={toggleSpeedOptions}
                  >
                    <span className="text-sm mr-1 group-hover:text-blue-400">
                      {playbackSpeed}x
                    </span>
                    <svg
                      className="w-5 h-5 group-hover:text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.button>

                  <AnimatePresence>
                    {showSpeedOptions && (
                      <motion.div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black bg-opacity-80 backdrop-blur-sm rounded-lg py-1 px-1 w-20 shadow-lg border border-slate-700"
                        variants={speedMenuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2 }}
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button
                            key={speed}
                            className={`w-full text-center py-1 px-2 text-sm rounded-md transition-colors duration-200 ${
                              playbackSpeed === speed
                                ? "bg-blue-600 text-white"
                                : "text-white hover:bg-white/10"
                            }`}
                            onClick={() => {
                              setPlaybackSpeed(speed);
                              setShowSpeedOptions(false);
                            }}
                          >
                            {speed}x
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white focus:outline-none group"
                  onClick={toggleTranscript}
                >
                  <svg
                    className={`w-6 h-6 ${showTranscript ? "text-blue-400" : "group-hover:text-blue-400"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">Caption</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white focus:outline-none group"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <svg
                      className="w-6 h-6 group-hover:text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4a1 1 0 00-1 1v4a1 1 0 01-2 0V5a3 3 0 013-3h4a1 1 0 010 2H5zm10 8a1 1 0 001-1V7a1 1 0 112 0v4a3 3 0 01-3 3h-4a1 1 0 110-2h4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 group-hover:text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="sr-only">
                    {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Transcript */}
        <AnimatePresence>
          {showTranscript && testimonial.transcript && (
            <motion.div
              variants={transcriptVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.3 }}
              className={`mt-4 mx-4 mb-4 p-4 rounded-lg border overflow-hidden ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3
                  className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  Transcript
                </h3>
                <Badge variant="soft" color="success" size="xs" shape="pill">
                  AI Generated
                </Badge>
              </div>
              <p
                className={`text-sm leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                {testimonial.transcript}
              </p>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="xs"
                  icon={
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  }
                  className={
                    isDarkMode ? "border-slate-700 text-slate-300" : ""
                  }
                >
                  Edit Transcript
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookmarks Panel */}
        <AnimatePresence>
          {showBookmarkPanel && (
            <motion.div
              variants={transcriptVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.3 }}
              className={`mt-4 mx-4 mb-4 p-4 rounded-lg border overflow-hidden ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  Video Bookmarks
                </h3>
                <Button
                  variant="outline"
                  size="xs"
                  icon={
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                  className={
                    isDarkMode ? "border-slate-700 text-slate-300" : ""
                  }
                >
                  Add Bookmark
                </Button>
              </div>

              {/* Sample Bookmarks */}
              <div className="space-y-3">
                {getVideoBookmarks().map((bookmark, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                      isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                    }`}
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = (bookmark as any).time;
                        setCurrentTime((bookmark as any).time);
                        if (!isPlaying) {
                          setIsPlaying(true);
                        }
                      }
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                        isDarkMode ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    >
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        {(bookmark as any).label}
                      </p>
                      <p
                        className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {formatDuration((bookmark as any).time)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className={`p-1 rounded-full ${
                          isDarkMode
                            ? "hover:bg-slate-600"
                            : "hover:bg-slate-200"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Edit bookmark logic
                        }}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        className={`p-1 rounded-full ${
                          isDarkMode
                            ? "hover:bg-slate-600"
                            : "hover:bg-slate-200"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Delete bookmark logic
                        }}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
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
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

export default VideoTestimonialView;
