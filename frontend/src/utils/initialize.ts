import { workspaceHub } from "@/repo/workspace_hub";
import { audioProcessor } from "../services/AudioProcessor";
import { canvasCoordinator } from "../services/CanvasCoordinator";
// import { initVideoEditorStore } from "../stores/videoEditorManager";

/**
 * Initializes the video editor application and all its dependencies.
 * This should be called once at the application startup.
 */
export function initializeVideoEditor() {
  // Make canvas coordinator available globally
  if (typeof window !== "undefined") {
    window.canvasCoordinator = canvasCoordinator;

    // Add feature detection
    detectBrowserFeatures();
  }

  console.log("Video editor initialized");

  return {
    videoEditorManager: workspaceHub.videoEditorManager,
    canvasCoordinator,
  };
}

/**
 * Initialize audio editor and its dependencies
 * This ensures all necessary components are properly loaded
 * before the audio editor is used
 */
export const initializeAudioEditor = async (): Promise<void> => {
  console.log("Initializing audio editor...");

  // Check browser compatibility first
  const capabilities = checkAudioCapabilities();

  try {
    // Pre-load audio processor
    console.log("Loading audio processor");
    await audioProcessor.load();
    console.log("Audio processor initialized successfully");
  } catch (error) {
    console.error("Failed to initialize audio processor:", error);
    // Continue without failing - we'll use fallbacks where needed
  }

  // Log initialization completion
  console.log("Audio editor initialization complete");
  console.log("Audio capabilities:", capabilities);
};

/**
 * Detect browser features and capabilities for optimizations
 */
function detectBrowserFeatures() {
  const features = {
    webgl: false,
    webgl2: false,
    canvas2d: false,
    videoDecoding: false,
    hardwareAcceleration: false,
    touchSupport: false,
    lowMemory: false,
  };

  // Check WebGL support
  try {
    const canvas = document.createElement("canvas");
    features.webgl = !!canvas.getContext("webgl");
    features.webgl2 = !!canvas.getContext("webgl2");
    features.canvas2d = !!canvas.getContext("2d");
  } catch (e) {
    console.warn("WebGL detection failed", e);
  }

  // Check for video decoding capabilities
  if (typeof document !== "undefined") {
    const video = document.createElement("video");
    features.videoDecoding =
      video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== "" ||
      video.canPlayType('video/webm; codecs="vp8, vorbis"') !== "";
  }

  // Check for hardware acceleration
  features.hardwareAcceleration =
    features.webgl ||
    window.navigator.hardwareConcurrency > 2 ||
    !!(window.navigator as any).deviceMemory;

  // Check for touch support
  features.touchSupport =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  // Check for low memory devices
  features.lowMemory =
    (navigator as any).deviceMemory !== undefined &&
    (navigator as any).deviceMemory < 4;

  // Set initial quality settings based on device capabilities
  if (window.canvasCoordinator) {
    if (features.lowMemory || !features.hardwareAcceleration) {
      // Low-end device - use lower quality
      workspaceHub.videoEditorManager.setPreviewQuality("low");
      workspaceHub.videoEditorManager.setCacheFrames(true);
      console.log("Using low quality mode for device compatibility");
    } else if (features.touchSupport) {
      // Mobile device with good specs - balanced quality
      workspaceHub.videoEditorManager.setPreviewQuality("balanced");
      workspaceHub.videoEditorManager.setCacheFrames(true);
      console.log("Using balanced quality mode with frame caching for mobile");
    } else {
      // Desktop - high quality
      workspaceHub.videoEditorManager.setPreviewQuality("high");
      workspaceHub.videoEditorManager.setCacheFrames(false);
      console.log("Using high quality mode for desktop");
    }
  }

  // Log detected features
  console.log("Browser features detected:", features);

  return features;
}

/**
 * Check browser capabilities for audio playback and processing
 * This allows us to provide fallbacks or warnings for unsupported features
 */
export const checkAudioCapabilities = (): Record<string, boolean> => {
  const capabilities = {
    audioContext: false,
    webAudio: false,
    mediaElementSource: false,
    mp3Support: false,
    wavSupport: false,
    oggSupport: false,
  };

  // Check for AudioContext support
  if (window.AudioContext || (window as any).webkitAudioContext) {
    capabilities.audioContext = true;

    // Create a test audio context
    try {
      const testContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      capabilities.webAudio = true;

      // Test MediaElementSource
      try {
        const audioEl = document.createElement("audio");
        const source = testContext.createMediaElementSource(audioEl);
        capabilities.mediaElementSource = true;
        source.disconnect();
      } catch (e) {
        console.warn("MediaElementSource not fully supported:", e);
      }

      // Clean up test context
      if (testContext.state !== "closed") {
        testContext
          .close()
          .catch((err) => console.warn("Error closing test context:", err));
      }
    } catch (e) {
      console.warn("AudioContext initialization issue:", e);
    }
  }

  // Check audio format support
  const audio = document.createElement("audio");
  capabilities.mp3Support = audio.canPlayType("audio/mpeg") !== "";
  capabilities.wavSupport = audio.canPlayType("audio/wav") !== "";
  capabilities.oggSupport = audio.canPlayType("audio/ogg") !== "";

  return capabilities;
};

/**
 * Create a utility function to check if audio URLs are valid
 * This can be used throughout the app to verify audio sources
 */
export const isValidAudioUrl = (url: string): boolean => {
  if (!url) return false;

  // Basic URL validation
  try {
    new URL(url);
  } catch (e: any) {
    console.log("error message", e.message);
    // Handle relative URLs
    if (
      !url.startsWith("/") &&
      !url.startsWith("blob:") &&
      !url.startsWith("data:")
    ) {
      return false;
    }
  }

  // Check if URL ends with common audio extensions
  const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"];
  const hasAudioExtension = audioExtensions.some((ext) =>
    url.toLowerCase().endsWith(ext)
  );

  // Allow URLs with query parameters that might be processed audio
  const hasPossibleAudioQuery =
    url.includes("?") &&
    (url.includes("audio") ||
      url.includes("processed") ||
      url.includes("trimmed"));

  return hasAudioExtension || hasPossibleAudioQuery;
};

/**
 * Utility function to help create a fallback waveform when visualization fails
 */
export const createFallbackWaveform = (
  canvas: HTMLCanvasElement,
  isDarkMode: boolean = false
): void => {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background
  ctx.fillStyle = isDarkMode
    ? "rgba(15, 23, 42, 0.5)"
    : "rgba(241, 245, 249, 0.5)";
  ctx.fillRect(0, 0, width, height);

  // Draw decorative waveform
  const centerY = height / 2;
  const amplitude = height * 0.3;

  ctx.beginPath();
  ctx.moveTo(0, centerY);

  for (let x = 0; x < width; x++) {
    // Create a mild sine wave with random noise
    const progress = x / width;
    const sineWave = Math.sin(progress * 10) * amplitude * 0.5;
    const noise = (Math.random() - 0.5) * amplitude * 0.2;
    const y = centerY + sineWave + noise;
    ctx.lineTo(x, y);
  }

  // Add gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  if (isDarkMode) {
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.6)");
    gradient.addColorStop(1, "rgba(139, 92, 246, 0.3)");
  } else {
    gradient.addColorStop(0, "rgba(79, 70, 229, 0.4)");
    gradient.addColorStop(1, "rgba(109, 40, 217, 0.15)");
  }

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Add text
  ctx.font = "10px Arial";
  ctx.fillStyle = isDarkMode
    ? "rgba(255, 255, 255, 0.7)"
    : "rgba(0, 0, 0, 0.7)";
  ctx.textAlign = "center";
  ctx.fillText("Waveform visualization unavailable", width / 2, 20);
};
