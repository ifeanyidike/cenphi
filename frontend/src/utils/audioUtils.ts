/**
 * Utility functions for audio processing and visualization
 */

/**
 * Creates a waveform visualization on a canvas element
 * @param canvas Canvas element to draw on
 * @param audioBuffer AudioBuffer or Float32Array of audio data
 * @param options Visualization options
 */
export function drawWaveform(
  canvas: HTMLCanvasElement,
  audioBuffer: AudioBuffer | Float32Array,
  options: {
    color?: string;
    backgroundColor?: string;
    barWidth?: number;
    barGap?: number;
    barRadius?: number;
    normalize?: boolean;
    isDarkMode?: boolean;
  } = {}
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Default options
  const {
    barWidth = 2,
    barGap = 1,
    barRadius = 0,
    normalize = true,
    isDarkMode = false,
  } = options;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set background
  const backgroundColor =
    options.backgroundColor ||
    (isDarkMode ? "rgba(17, 24, 39, 0.2)" : "rgba(243, 244, 246, 0.4)");
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Extract audio data
  let audioData: Float32Array;
  if (audioBuffer instanceof AudioBuffer) {
    // Get first channel data
    audioData = audioBuffer.getChannelData(0);
  } else {
    audioData = audioBuffer;
  }

  // Calculate how many samples to use based on canvas width and bar width/gap
  const totalSamples = audioData.length;
  const samplesPerBar = Math.max(
    1,
    Math.floor(totalSamples / (canvas.width / (barWidth + barGap)))
  );

  // Find peak value for normalization
  let peak = 0;
  if (normalize) {
    for (let i = 0; i < totalSamples; i++) {
      peak = Math.max(peak, Math.abs(audioData[i]));
    }
    // Avoid division by zero
    peak = peak || 1;
  } else {
    peak = 1;
  }

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (isDarkMode) {
    gradient.addColorStop(0, options.color || "rgba(79, 70, 229, 0.8)");
    gradient.addColorStop(1, options.color || "rgba(79, 70, 229, 0.3)");
  } else {
    gradient.addColorStop(0, options.color || "rgba(79, 70, 229, 0.6)");
    gradient.addColorStop(1, options.color || "rgba(79, 70, 229, 0.2)");
  }
  ctx.fillStyle = gradient;

  // Draw bars
  let x = 0;
  const centerY = canvas.height / 2;

  for (let i = 0; i < canvas.width / (barWidth + barGap); i++) {
    // Calculate average value for this bar
    let sum = 0;
    const startSample = i * samplesPerBar;
    const endSample = Math.min(startSample + samplesPerBar, totalSamples);

    if (startSample >= totalSamples) break;

    for (let j = startSample; j < endSample; j++) {
      sum += Math.abs(audioData[j]);
    }

    const average = sum / (endSample - startSample);
    const normalizedValue = average / peak;

    // Calculate bar height (use 80% of canvas height)
    const barHeight = normalizedValue * canvas.height * 0.8;

    // Draw centered bar
    if (barRadius > 0) {
      // Rounded bars
      const y = centerY - barHeight / 2;
      roundedRect(ctx, x, y, barWidth, barHeight, barRadius);
    } else {
      // Regular bars
      ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
    }

    x += barWidth + barGap;
  }
}

/**
 * Helper function to draw a rounded rectangle
 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Generate a fallback waveform when real audio data is not available
 * @param canvas Canvas element to draw on
 * @param isDarkMode Whether dark mode is enabled
 */
export function createFallbackWaveform(
  canvas: HTMLCanvasElement,
  isDarkMode: boolean = false
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  ctx.fillStyle = isDarkMode
    ? "rgba(17, 24, 39, 0.3)"
    : "rgba(243, 244, 246, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Generate sinusoidal waveform
  const centerY = canvas.height / 2;
  const amplitude = canvas.height * 0.3;

  ctx.beginPath();
  ctx.moveTo(0, centerY);

  // Draw top half
  for (let i = 0; i < canvas.width; i++) {
    // Create a sine wave with some random variation for natural look
    const progress = i / canvas.width;
    const sineValue = Math.sin(progress * Math.PI * 10) * 0.5; // Sine wave
    const slowSineValue = Math.sin(progress * Math.PI * 3) * 0.3; // Slower sine wave
    const combinedValue = sineValue + slowSineValue;
    const noise = (Math.random() - 0.5) * 0.1; // Small random variation

    const y = centerY + combinedValue * amplitude + noise * amplitude;
    ctx.lineTo(i, y);
  }

  // Create a gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (isDarkMode) {
    gradient.addColorStop(0, "rgba(79, 70, 229, 0.6)");
    gradient.addColorStop(1, "rgba(79, 70, 229, 0.2)");
  } else {
    gradient.addColorStop(0, "rgba(79, 70, 229, 0.4)");
    gradient.addColorStop(1, "rgba(79, 70, 229, 0.1)");
  }

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Decode an audio file to an AudioBuffer
 * @param audioContext AudioContext to use for decoding
 * @param arrayBuffer ArrayBuffer containing audio data
 * @returns Promise that resolves to an AudioBuffer
 */
export async function decodeAudioData(
  audioContext: AudioContext,
  arrayBuffer: ArrayBuffer
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(
      arrayBuffer,
      (buffer) => resolve(buffer),
      (error) => reject(error)
    );
  });
}

/**
 * Calculate average volume levels for audio visualization
 * @param audioBuffer AudioBuffer to analyze
 * @param numSegments Number of segments to divide the audio into
 * @returns Array of average volumes (0-1) for each segment
 */
export function calculateVolumeData(
  audioBuffer: AudioBuffer,
  numSegments: number = 100
): number[] {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const segmentSize = Math.floor(channelData.length / numSegments);
  const volumeData: number[] = [];

  let max = 0;

  // First pass: find max value for normalization
  for (let i = 0; i < channelData.length; i++) {
    max = Math.max(max, Math.abs(channelData[i]));
  }

  if (max === 0) max = 1; // Avoid division by zero

  // Second pass: calculate segment averages
  for (let i = 0; i < numSegments; i++) {
    const start = i * segmentSize;
    const end = start + segmentSize;
    let sum = 0;

    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j]);
    }

    const average = sum / segmentSize;
    volumeData.push(average / max); // Normalize
  }

  return volumeData;
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS format
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Create AudioContext with fallbacks for different browsers
 * @returns New AudioContext
 */
export function createAudioContext(): AudioContext {
  // Use standard AudioContext or browser-specific implementations
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("Web Audio API not supported in this browser");
  }

  return new AudioContextClass();
}
