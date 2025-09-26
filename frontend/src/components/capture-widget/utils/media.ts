// src/components/capture-widget/utils/media.ts

/**
 * Creates a media blob from recorded chunks
 * @param chunks - Array of recorded media chunks
 * @param mimeType - MIME type for the blob
 * @returns Media blob
 */
export const createMediaBlobFromChunks = (
  chunks: Blob[],
  mimeType: string
): Blob => {

  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    // Instead of returning an empty blob (which might not be usable),
    // throw an error that can be caught and handled
    throw new Error("Cannot create media from empty chunks");
  }

  try {

    // Check if we have valid data
    const validChunks = chunks.filter((chunk) => chunk.size > 0);

    if (validChunks.length === 0) {
      throw new Error("All recorded chunks have zero size");
    }

    // Create the blob from valid chunks only
    const blob = new Blob(validChunks, { type: mimeType });

    // Verify the blob is valid
    if (blob.size === 0) {
      throw new Error("Created blob has zero size");
    }

    return blob;
  } catch (error) {
    throw error; // Re-throw to allow proper error handling
  }
};

/**
 * Creates an object URL from a blob
 * @param blob - Media blob
 * @returns Object URL
 */
export const createObjectURL = (blob: Blob): string => {
  try {
    const url = URL.createObjectURL(blob);
    return url;
  } catch (error) {
    throw error;
  }
};

/**
 * Revokes an object URL to free up memory
 * @param url - Object URL to revoke
 */
export const revokeObjectURL = (url: string): void => {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    // Silently ignore revoke errors
  }
};

/**
 * Checks if the browser supports the specified MIME type for MediaRecorder
 * @param mimeType - MIME type to check
 * @returns Boolean indicating support
 */
export const isMediaRecorderMimeTypeSupported = (mimeType: string): boolean => {
  if (typeof MediaRecorder === "undefined") {
    return false;
  }
  return MediaRecorder.isTypeSupported(mimeType);
};

/**
 * Gets the optimal MIME type for video recording based on browser support
 * @returns Supported video MIME type
 */
export const getOptimalVideoMimeType = (): string => {
  const mimeTypes = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];

  for (const mimeType of mimeTypes) {
    if (isMediaRecorderMimeTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return "video/webm"; // Fallback
};

/**
 * Gets the optimal MIME type for audio recording based on browser support
 * @returns Supported audio MIME type
 */
export const getOptimalAudioMimeType = (): string => {
  const mimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];

  for (const mimeType of mimeTypes) {
    if (isMediaRecorderMimeTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return "audio/webm"; // Fallback
};

/**
 * Converts a data blob to a base64 string
 * @param blob - Data blob
 * @returns Promise resolving to base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Stops all tracks in a media stream
 * @param stream - Media stream
 */
export const stopMediaTracks = (stream: MediaStream | null): void => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
};

/**
 * Sets up audio visualization using Web Audio API
 * @param stream - Media stream
 * @param dataHandler - Handler function for visualization data
 * @returns Object with methods to control visualization
 */
// export const setupAudioVisualization = (
//   stream: MediaStream,
//   dataHandler: (dataArray: Uint8Array) => void
// ) => {
//   const audioContext = new AudioContext();
//   const source = audioContext.createMediaStreamSource(stream);
//   const analyser = audioContext.createAnalyser();

//   // Configure analyser
//   analyser.fftSize = 256;
//   source.connect(analyser);
//   const dataArray = new Uint8Array(analyser.frequencyBinCount);

//   let animationFrame: number | null = null;

//   // Update function
//   const update = () => {
//     analyser.getByteFrequencyData(dataArray);
//     dataHandler(dataArray);
//     animationFrame = requestAnimationFrame(update);
//   };

//   // Start visualization
//   const start = () => {
//     if (!animationFrame) {
//       animationFrame = requestAnimationFrame(update);
//     }
//   };

//   // Stop visualization
//   const stop = () => {
//     if (animationFrame) {
//       cancelAnimationFrame(animationFrame);
//       animationFrame = null;
//     }

//     // Close audio context
//     if (audioContext.state !== "closed") {
//       audioContext
//         .close()
//         .catch((err) => console.error("Error closing AudioContext:", err));
//     }
//   };

//   return {
//     start,
//     stop,
//     getAverageVolume: (): number => {
//       analyser.getByteFrequencyData(dataArray);
//       let sum = 0;
//       for (let i = 0; i < dataArray.length; i++) {
//         sum += dataArray[i];
//       }
//       return sum / dataArray.length;
//     },
//   };
// };

export const setupAudioVisualization = (
  stream: MediaStream,
  onDataAvailable: (dataArray: Uint8Array) => void
) => {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    // Connect the stream to the analyser
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    // Create data array for frequency data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let running = false;
    let animationFrame: number | null = null;
    let avgVolume = 0;

    // Function to update visualization
    const update = () => {
      if (!running) return;

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      avgVolume = sum / bufferLength;

      // Call callback with data
      onDataAvailable(dataArray);

      // Request next frame
      animationFrame = requestAnimationFrame(update);
    };

    return {
      start: () => {
        running = true;
        update();
      },
      stop: () => {
        running = false;
        if (animationFrame !== null) {
          cancelAnimationFrame(animationFrame);
        }
        // Clean up AudioContext
        try {
          source.disconnect();
          // Only close if not needed anymore
          if (audioContext.state !== "closed") {
            // Note: Don't actually close the context as it may be reused
            // audioContext.close();
          }
        } catch (err) {
          // Silently ignore cleanup errors
        }
      },
      getAverageVolume: () => avgVolume,
    };
  } catch (error) {
    // Return a dummy implementation that won't crash
    return {
      start: () => {},
      stop: () => {},
      getAverageVolume: () => 0,
    };
  }
};
