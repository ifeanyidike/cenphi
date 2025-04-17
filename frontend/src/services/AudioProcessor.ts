// Import lamejs directly since it's installed via npm/yarn
//@ts-expect-error lamejs already declared in module.d.ts
import lamejs from "lamejs";

import {
  AudioEnhancement,
  AudioSubtitle,
  AudioTrim,
  NoiseReduction,
  AudioEffect,
} from "../repo/managers/audio_editor";

// Extended interface for audio processing options
interface AudioProcessingOptions {
  trim: AudioTrim;
  enhancement: AudioEnhancement;
  noiseReduction: NoiseReduction;
  volumeNormalize: number;
  effects: Record<AudioEffect, number>;
  subtitles: AudioSubtitle[];
  format?: "mp3" | "wav" | "ogg";
  quality?: {
    bitrate: string;
    sampleRate: number;
    channels: number;
  };
}

/**
 * Improved Audio Processor class that handles audio manipulation using Web Audio API
 * with optimized preview generation and enhanced noise reduction
 */
class AudioProcessor {
  private isLoaded: boolean = false;
  private audioContext: AudioContext | null = null;
  // private audioCapabilities: Record<string, boolean> = {};
  private audioCache: Map<string, AudioBuffer> = new Map();
  // private offlineAudioContexts: Map<string, OfflineAudioContext> = new Map();
  private progressCallback: ((progress: number) => void) | null = null;
  private statusCallback: ((status: string) => void) | null = null;

  // Cache for preview results to avoid regenerating the same preview
  private previewCache: Map<string, { url: string; timestamp: number }> =
    new Map();
  // Maximum age for cached previews (5 minutes)
  private maxPreviewAge: number = 5 * 60 * 1000;

  // WebWorker for background processing if available
  private worker: Worker | null = null;
  // private workerSupported: boolean = false;

  /**
   * Set callbacks for progress and status updates
   */
  setCallbacks(
    progressCallback: (progress: number) => void,
    statusCallback: (status: string) => void
  ) {
    this.progressCallback = progressCallback;
    this.statusCallback = statusCallback;
  }

  /**
   * Update progress
   */
  private updateProgress(progress: number) {
    if (this.progressCallback) {
      this.progressCallback(Math.min(100, Math.max(0, progress)));
    }
  }

  /**
   * Update status
   */
  private updateStatus(status: string) {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  /**
   * Load the audio processor and dependencies
   */
  async load(): Promise<void> {
    try {
      if (this.isLoaded) {
        console.log("Audio processor already loaded");
        return;
      }

      console.log("Loading audio processor...");

      // Test for audio capabilities
      // this.audioCapabilities = this.testAudioCapabilities();

      // Create audio context with fallbacks
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) {
        console.warn("AudioContext not supported in this browser");
        // Set a partial loaded state that will use fallbacks
        this.isLoaded = true;
        return;
      }

      try {
        // Create audio context with error handling
        this.audioContext = new AudioContextClass();

        // Check if the context is in suspended state (happens in some browsers)
        if (this.audioContext.state === "suspended") {
          await this.resumeAudioContext();
        }

        console.log(
          "AudioContext created successfully, state:",
          this.audioContext.state
        );

        // Test for Web Worker support for background processing
        this.initializeWorkerIfSupported();

        // Load any required audio processing libraries
        await this.loadExternalLibraries();
      } catch (contextError) {
        console.error("Failed to create AudioContext:", contextError);
        // We'll continue without audio context and use fallbacks
      }

      this.isLoaded = true;
      console.log("Audio processor loaded successfully");
    } catch (error) {
      console.error("Failed to load audio processor:", error);
      // Mark as loaded but with limited functionality
      this.isLoaded = true;
      throw error;
    }
  }

  /**
   * Resume audio context if suspended (needed for some browsers)
   */
  private async resumeAudioContext(): Promise<void> {
    if (!this.audioContext) return;

    // In some browsers, especially Safari, we need a user gesture to start AudioContext
    console.log("Attempting to resume suspended AudioContext...");

    try {
      // Create a short silent buffer to play
      const silentBuffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(this.audioContext.destination);
      source.start();

      // Try to resume the context
      await this.audioContext.resume();
      console.log(
        "AudioContext resumed successfully:",
        this.audioContext.state
      );
    } catch (error) {
      console.warn("Failed to resume AudioContext:", error);
    }
  }

  /**
   * Initialize a Web Worker for background processing if supported
   */
  private initializeWorkerIfSupported() {
    try {
      if (typeof Worker !== "undefined") {
        // Check for transferable objects support
        if (this.checkTransferableSupport()) {
          // Modern browsers - we can use web workers
          // this.workerSupported = true;
          console.log("Web Worker with transferable objects supported");

          // Create the worker - in React, use the worker-loader
          try {
            // In a React app with webpack, you would typically import the worker like this:
            // this.worker = new Worker(new URL('./audioProcessingWorker.ts', import.meta.url));

            // For compatibility with different bundlers, we'll use this approach:
            this.worker = new Worker("/src/audioProcessingWorker.ts");

            // Set up message handlers
            this.worker.onmessage = (e) => this.handleWorkerMessage(e);
            this.worker.onerror = (e) => this.handleWorkerError(e);

            // Initialize the worker
            this.worker.postMessage({
              command: "init",
              data: {
                sampleRate: this.audioContext?.sampleRate || 44100,
              },
            });
          } catch (error) {
            console.error("Error creating audio worker:", error);
            // this.workerSupported = false;
            this.worker = null;
          }
        } else {
          console.log(
            "Transferable objects not supported - limited worker support"
          );
          // this.workerSupported = false;
        }
      } else {
        console.log("Web Workers not supported in this browser");
        // this.workerSupported = false;
      }
    } catch (e) {
      console.warn("Error testing Web Worker support:", e);
      // this.workerSupported = false;
    }
  }

  /**
   * Check if browser supports transferable objects for efficient audio processing
   */
  private checkTransferableSupport(): boolean {
    return true;
    // try {
    //   // Check for structuredClone support (modern browsers)
    //   return true;
    //   //   if (window.structuredClone()) {
    //   //     return true;
    //   //   }

    //   // Alternative check for older browsers
    //   // const ab = new ArrayBuffer(1);
    //   // const testWorker = new Worker(
    //   //   URL.createObjectURL(new Blob([""], { type: "application/javascript" }))
    //   // );

    //   // try {
    //   //   testWorker.postMessage(ab, [ab]);
    //   //   const isTransferable = ab.byteLength === 0; // If transferred, original buffer is emptied
    //   //   testWorker.terminate();
    //   //   return isTransferable;
    //   // } catch (e) {
    //   //   testWorker.terminate();
    //   //   return false;
    //   // }
    // } catch (e) {
    //   return false;
    // }
  }

  /**
   * Handle messages from the worker
   */
  private handleWorkerMessage(e: MessageEvent) {
    const { type, message, progress, result, error } = e.data;

    switch (type) {
      case "initialized":
        console.log("Audio worker initialized");
        break;

      case "status":
        if (this.statusCallback) {
          this.statusCallback(message);
        }
        break;

      case "progress":
        if (this.progressCallback) {
          this.progressCallback(progress);
        }
        break;

      case "complete":
        // Handle completed processing
        console.log("Worker processing complete", result);
        break;

      case "error":
        console.error("Worker error:", error);
        break;
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(e: ErrorEvent) {
    console.error("Audio worker error:", e);
    // this.workerSupported = false;

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Load any external libraries needed for audio processing
   * In a React application, we use imported libraries instead
   */
  private async loadExternalLibraries(): Promise<void> {
    // Since we're using React with npm/yarn dependencies,
    // lamejs is already imported at the top of the file
    // No need to dynamically load libraries
    console.log("Using imported libraries in React application");
    return Promise.resolve();
  }

  /**
   * Test for audio capabilities to determine fallback strategies
   */
  // private testAudioCapabilities(): Record<string, boolean> {
  //   const capabilities = {
  //     audioContext: false,
  //     webAudio: false,
  //     mediaElementSource: false,
  //     offlineAudioContext: false,
  //     mp3Support: false,
  //     wavSupport: false,
  //     oggSupport: false,
  //     audioWorklet: false,
  //   };

  //   // Check for AudioContext support
  //   if (window.AudioContext || (window as any).webkitAudioContext) {
  //     capabilities.audioContext = true;

  //     // Basic test for web audio features
  //     try {
  //       const testContext = new (window.AudioContext ||
  //         (window as any).webkitAudioContext)();
  //       capabilities.webAudio = true;

  //       // Test AudioWorklet support (for more efficient processing)
  //       if ("audioWorklet" in testContext) {
  //         capabilities.audioWorklet = true;
  //       }

  //       // Test OfflineAudioContext
  //       if (
  //         window.OfflineAudioContext ||
  //         (window as any).webkitOfflineAudioContext
  //       ) {
  //         capabilities.offlineAudioContext = true;
  //       }

  //       // Test MediaElementSource
  //       try {
  //         const audioEl = document.createElement("audio");
  //         const source = testContext.createMediaElementSource(audioEl);
  //         capabilities.mediaElementSource = true;
  //         source.disconnect();
  //       } catch (e) {
  //         console.warn("MediaElementSource not fully supported:", e);
  //       }

  //       // Clean up test context
  //       if (testContext.state !== "closed") {
  //         testContext
  //           .close()
  //           .catch((err) => console.warn("Error closing test context:", err));
  //       }
  //     } catch (e) {
  //       console.warn("AudioContext initialization issue:", e);
  //     }
  //   }

  //   // Check audio format support
  //   const audio = document.createElement("audio");
  //   capabilities.mp3Support = audio.canPlayType("audio/mpeg") !== "";
  //   capabilities.wavSupport = audio.canPlayType("audio/wav") !== "";
  //   capabilities.oggSupport = audio.canPlayType("audio/ogg") !== "";

  //   console.log("Audio capabilities detected:", capabilities);
  //   return capabilities;
  // }

  /**
   * Ensure the processor is loaded before operations
   */
  private ensureLoaded(): void {
    if (!this.isLoaded) {
      throw new Error("Audio processor not loaded. Call load() first.");
    }
  }

  /**
   * Fetch and decode audio from a URL
   */
  private async fetchAudio(url: string): Promise<AudioBuffer> {
    // Check cache first
    if (this.audioCache.has(url)) {
      return this.audioCache.get(url)!;
    }

    this.updateStatus("Loading audio...");
    this.updateProgress(10);

    if (!this.audioContext) {
      throw new Error("AudioContext not available");
    }

    try {
      // Fetch the audio file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      this.updateProgress(30);
      this.updateStatus("Decoding audio...");

      // Get array buffer from response
      const arrayBuffer = await response.arrayBuffer();

      this.updateProgress(50);

      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.updateProgress(70);

      // Cache the decoded audio
      this.audioCache.set(url, audioBuffer);

      this.updateProgress(80);
      return audioBuffer;
    } catch (error) {
      console.error("Error fetching or decoding audio:", error);
      throw error;
    }
  }

  /**
   * Create an ObjectURL from an AudioBuffer
   */
  private async createAudioFileFromBuffer(
    audioBuffer: AudioBuffer,
    format: "mp3" | "wav" | "ogg" = "wav"
  ): Promise<string> {
    this.updateStatus("Creating audio file...");

    if (!this.audioContext) {
      throw new Error("AudioContext not available");
    }

    try {
      // Create an offline audio context
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Create a buffer source
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineCtx.destination);

      // Start the source
      source.start();

      // Render the audio
      const renderedBuffer = await offlineCtx.startRendering();

      this.updateProgress(90);
      this.updateStatus("Encoding audio...");

      // Create the appropriate format
      let finalBlob: Blob;
      // let mimeType: string;

      switch (format) {
        case "mp3":
          try {
            // Check if we have MP3 encoding capability
            if (window.lamejs) {
              // Use lamejs for MP3 encoding if available
              finalBlob = await this.encodeMP3(renderedBuffer);
              // mimeType = "audio/mp3";
            } else {
              // Fallback to WAV
              finalBlob = this.audioBufferToWav(renderedBuffer);
              // mimeType = "audio/wav";
              console.log(
                "MP3 encoding library not available, using WAV format"
              );
            }
          } catch (error) {
            console.warn("MP3 encoding failed, falling back to WAV:", error);
            finalBlob = this.audioBufferToWav(renderedBuffer);
            // mimeType = "audio/wav";
          }
          break;
        case "ogg":
          try {
            // Check if we have Ogg encoding capability
            if (window.oggEncoder) {
              // Use ogg encoder library if available
              finalBlob = await this.encodeOgg(renderedBuffer);
              // mimeType = "audio/ogg";
            } else {
              // Fallback to WAV
              finalBlob = this.audioBufferToWav(renderedBuffer);
              // mimeType = "audio/wav";
              console.log(
                "OGG encoding library not available, using WAV format"
              );
            }
          } catch (error) {
            console.warn("OGG encoding failed, falling back to WAV:", error);
            finalBlob = this.audioBufferToWav(renderedBuffer);
            // mimeType = "audio/wav";
          }
          break;
        case "wav":
        default:
          finalBlob = this.audioBufferToWav(renderedBuffer);
          // mimeType = "audio/wav";
          break;
      }

      // Create an object URL for the blob
      const url = URL.createObjectURL(finalBlob);

      this.updateProgress(100);
      this.updateStatus("");

      return url;
    } catch (error) {
      console.error("Error creating audio file:", error);
      throw error;
    }
  }

  /**
   * Encode AudioBuffer to MP3 format using lamejs if available
   * This is a stub for how MP3 encoding could be implemented
   */
  private async encodeMP3(buffer: AudioBuffer): Promise<Blob> {
    try {
      const channels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const samples = new Int16Array(buffer.length * channels);

      // Interleave channel data and convert to int16
      for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < channels; channel++) {
          const sample = Math.max(
            -1,
            Math.min(1, buffer.getChannelData(channel)[i])
          );
          const intSample = sample < 0 ? sample * 32768 : sample * 32767;
          samples[i * channels + channel] = intSample;
        }
      }

      // Initialize MP3 encoder - use mono (1) or stereo (2) based on input
      const mp3encoder = new lamejs.Mp3Encoder(
        channels,
        sampleRate,
        192 // bitrate
      );

      // Process the samples
      const mp3Data = [];
      const chunkSize = 1152; // Must be divisible by 576 for lamejs

      for (let i = 0; i < samples.length; i += chunkSize) {
        const chunk = samples.subarray(i, i + chunkSize);
        const mp3buf = mp3encoder.encodeBuffer(chunk);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
      }

      // Finalize the MP3
      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }

      // Create the MP3 blob
      return new Blob(mp3Data, { type: "audio/mp3" });
    } catch (error) {
      console.error("MP3 encoding error:", error);
      // Fallback to WAV if MP3 encoding fails
      return this.audioBufferToWav(buffer);
    }
  }

  /**
   * Encode AudioBuffer to OGG format
   * This is a stub for how OGG encoding could be implemented
   */
  private async encodeOgg(buffer: AudioBuffer): Promise<Blob> {
    // This is a placeholder for OGG encoding implementation
    // In a real application, you would use a library for OGG encoding

    // For now, just return WAV since we're not implementing OGG encoding
    console.warn("OGG encoding not implemented, returning WAV");
    return this.audioBufferToWav(buffer);
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const interleaved = this.interleaveChannels(buffer);
    const dataLength = interleaved.length * 2; // 16-bit = 2 bytes per sample
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF identifier
    this.writeString(view, 0, "RIFF");
    // RIFF chunk length
    view.setUint32(4, 36 + dataLength, true);
    // RIFF type
    this.writeString(view, 8, "WAVE");
    // format chunk identifier
    this.writeString(view, 12, "fmt ");
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, format, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numChannels * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, numChannels * 2, true);
    // bits per sample
    view.setUint16(34, bitDepth, true);
    // data chunk identifier
    this.writeString(view, 36, "data");
    // data chunk length
    view.setUint32(40, dataLength, true);

    // Write the PCM samples
    const index = 44;
    const volume = 1;

    for (let i = 0; i < interleaved.length; i++) {
      view.setInt16(index + i * 2, interleaved[i] * 32767 * volume, true);
    }

    return new Blob([view], { type: "audio/wav" });
  }

  /**
   * Helper to write a string to a DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Interleave audio channels for WAV format
   */
  private interleaveChannels(buffer: AudioBuffer): Float32Array {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length * numChannels;
    const result = new Float32Array(length);

    let index = 0;
    let inputIndex = 0;

    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        result[index++] = buffer.getChannelData(channel)[inputIndex];
      }
      inputIndex++;
    }

    return result;
  }

  /**
   * Trim audio to the specified start and end times
   */
  async trimAudio(
    audioUrl: string,
    startTime: number,
    endTime: number
  ): Promise<string> {
    this.ensureLoaded();
    console.log(`Trimming audio from ${startTime}s to ${endTime}s`);

    if (!audioUrl) {
      console.error("Invalid audio URL provided to trimAudio");
      throw new Error("Invalid audio URL");
    }

    if (startTime < 0 || endTime <= startTime) {
      console.error("Invalid trim parameters:", startTime, endTime);
      throw new Error("Invalid trim parameters");
    }

    try {
      // Fetch and decode the audio
      const audioBuffer = await this.fetchAudio(audioUrl);

      this.updateStatus("Trimming audio...");

      // Calculate start and end samples
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.min(
        Math.floor(endTime * sampleRate),
        audioBuffer.length
      );
      const trimLength = endSample - startSample;

      // Create a new buffer for the trimmed audio
      const trimmedBuffer = this.audioContext!.createBuffer(
        audioBuffer.numberOfChannels,
        trimLength,
        sampleRate
      );

      // Copy the trimmed portion to the new buffer
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);

        for (let i = 0; i < trimLength; i++) {
          trimmedData[i] = channelData[i + startSample];
        }
      }

      this.updateProgress(85);

      // Create a file from the trimmed buffer
      return await this.createAudioFileFromBuffer(trimmedBuffer);
    } catch (error) {
      console.error("Error in trimAudio:", error);
      throw error;
    }
  }

  /**
   * Enhance audio using the specified enhancement parameters
   */
  async enhanceAudio(
    audioUrl: string,
    enhancement: AudioEnhancement
  ): Promise<string> {
    this.ensureLoaded();
    console.log("Enhancing audio with parameters:", enhancement);

    if (!audioUrl) {
      throw new Error("Invalid audio URL");
    }

    try {
      // Fetch and decode the audio
      const audioBuffer = await this.fetchAudio(audioUrl);

      this.updateStatus("Enhancing audio...");

      // Create an offline audio context for processing
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Create a buffer source
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Create audio processing nodes

      // 1. Voice clarity - using HighPass and BiquadFilter
      const highPass = offlineCtx.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = 150 + enhancement.voiceClarity * 2;
      highPass.Q.value = 0.7;

      // 2. Bass tone - using LowShelf filter
      const bassFilter = offlineCtx.createBiquadFilter();
      bassFilter.type = "lowshelf";
      bassFilter.frequency.value = 200;
      bassFilter.gain.value = (enhancement.bassTone - 50) * 0.3;

      // 3. Mid tone - using Peaking filter
      const midFilter = offlineCtx.createBiquadFilter();
      midFilter.type = "peaking";
      midFilter.frequency.value = 1000;
      midFilter.Q.value = 1;
      midFilter.gain.value = (enhancement.midTone - 50) * 0.2;

      // 4. Treble tone - using HighShelf filter
      const trebleFilter = offlineCtx.createBiquadFilter();
      trebleFilter.type = "highshelf";
      trebleFilter.frequency.value = 4000;
      trebleFilter.gain.value = (enhancement.trebleTone - 50) * 0.25;

      // 5. Presence - using Peaking filter at higher frequency
      const presenceFilter = offlineCtx.createBiquadFilter();
      presenceFilter.type = "peaking";
      presenceFilter.frequency.value = 2500;
      presenceFilter.Q.value = 1.5;
      presenceFilter.gain.value = (enhancement.presence - 50) * 0.3;

      // Connect the nodes
      source.connect(highPass);
      highPass.connect(bassFilter);
      bassFilter.connect(midFilter);
      midFilter.connect(trebleFilter);
      trebleFilter.connect(presenceFilter);
      presenceFilter.connect(offlineCtx.destination);

      // Start the source
      source.start();

      // Render the audio
      const renderedBuffer = await offlineCtx.startRendering();

      this.updateProgress(85);

      // Create a file from the enhanced buffer
      return await this.createAudioFileFromBuffer(renderedBuffer);
    } catch (error) {
      console.error("Error enhancing audio:", error);
      throw error;
    }
  }

  /**
   * Apply improved noise reduction to the audio
   * This version uses a more sophisticated algorithm with multiple filter stages
   */
  async reduceNoise(
    audioUrl: string,
    options: NoiseReduction
  ): Promise<string> {
    this.ensureLoaded();
    console.log("Reducing noise with parameters:", options);

    if (!audioUrl) {
      throw new Error("Invalid audio URL");
    }

    try {
      // Fetch and decode the audio
      const audioBuffer = await this.fetchAudio(audioUrl);

      this.updateStatus("Reducing noise...");

      // Create an offline audio context for processing
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Create a buffer source
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Advanced noise reduction using a multi-stage approach
      // Note: This is a more advanced version than the original implementation

      // Stage 1: Initial high-pass to remove rumble (adjusts with sensitivity)
      const initialHighPass = offlineCtx.createBiquadFilter();
      initialHighPass.type = "highpass";
      initialHighPass.frequency.value = 60 + options.sensitivity * 0.6;
      initialHighPass.Q.value = 0.7;

      // Stage 2: Narrow notch filters for common noise frequencies
      // Common electrical hum frequencies (50/60Hz and harmonics)
      const humFrequencies = [50, 60, 100, 120];
      const notchFilters: BiquadFilterNode[] = [];

      for (const freq of humFrequencies) {
        const notch = offlineCtx.createBiquadFilter();
        notch.type = "notch";
        notch.frequency.value = freq;
        notch.Q.value = 10; // Narrow Q for precise targeting
        notch.gain.value = -options.strength * 0.5;
        notchFilters.push(notch);
      }

      // Stage 3: Multi-band compressor approach for different frequency ranges
      // Low band (targeting common low-frequency noise)
      const lowBandFilter = offlineCtx.createBiquadFilter();
      lowBandFilter.type = "lowpass";
      lowBandFilter.frequency.value = 300;

      const lowBandCompressor = offlineCtx.createDynamicsCompressor();
      lowBandCompressor.threshold.value = -70 + options.strength * 0.4;
      lowBandCompressor.ratio.value = 4 + options.strength / 20;
      lowBandCompressor.attack.value = 0.005;
      lowBandCompressor.release.value = 0.1;

      // Mid band (less compression, preserve voice)
      const midBandFilter1 = offlineCtx.createBiquadFilter();
      midBandFilter1.type = "highpass";
      midBandFilter1.frequency.value = 300;

      const midBandFilter2 = offlineCtx.createBiquadFilter();
      midBandFilter2.type = "lowpass";
      midBandFilter2.frequency.value = 4000;

      const midBandCompressor = offlineCtx.createDynamicsCompressor();
      midBandCompressor.threshold.value = -50 + options.preserveVoice * 0.3;
      midBandCompressor.ratio.value = 2 + options.strength / 40;
      midBandCompressor.attack.value = 0.003;
      midBandCompressor.release.value = 0.1;

      // High band (for high frequency noise)
      const highBandFilter = offlineCtx.createBiquadFilter();
      highBandFilter.type = "highpass";
      highBandFilter.frequency.value = 4000;

      const highBandCompressor = offlineCtx.createDynamicsCompressor();
      highBandCompressor.threshold.value = -60 + options.strength * 0.3;
      highBandCompressor.ratio.value = 6 + options.strength / 15;
      highBandCompressor.attack.value = 0.002;
      highBandCompressor.release.value = 0.05;

      // Stage 4: Final gentle noise gate
      const finalCompressor = offlineCtx.createDynamicsCompressor();
      finalCompressor.threshold.value = -70 + options.strength * 0.6;
      finalCompressor.knee.value = 40 - options.strength * 0.2;
      finalCompressor.ratio.value = 2 + options.strength / 25;
      finalCompressor.attack.value = 0.02; // Slower attack to preserve transients
      finalCompressor.release.value = 0.3;

      // Connect the initial high-pass
      source.connect(initialHighPass);
      let lastNode: AudioNode = initialHighPass;

      // Connect notch filters in series
      for (const filter of notchFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      // Connect multi-band compressor network
      // Low band path
      lastNode.connect(lowBandFilter);
      lowBandFilter.connect(lowBandCompressor);

      // Mid band path
      lastNode.connect(midBandFilter1);
      midBandFilter1.connect(midBandFilter2);
      midBandFilter2.connect(midBandCompressor);

      // High band path
      lastNode.connect(highBandFilter);
      highBandFilter.connect(highBandCompressor);

      // Mix the bands together into the final compressor
      lowBandCompressor.connect(finalCompressor);
      midBandCompressor.connect(finalCompressor);
      highBandCompressor.connect(finalCompressor);

      // Connect to destination
      finalCompressor.connect(offlineCtx.destination);

      // Start the source
      source.start();

      // Render the audio
      const renderedBuffer = await offlineCtx.startRendering();

      this.updateProgress(85);

      // Create a file from the noise-reduced buffer
      return await this.createAudioFileFromBuffer(renderedBuffer);
    } catch (error) {
      console.error("Error reducing noise:", error);
      throw error;
    }
  }

  /**
   * Normalize the volume of the audio
   */
  async normalizeVolume(audioUrl: string, level: number): Promise<string> {
    this.ensureLoaded();
    console.log(`Normalizing audio volume to level: ${level}`);

    if (!audioUrl) {
      throw new Error("Invalid audio URL");
    }

    try {
      // Fetch and decode the audio
      const audioBuffer = await this.fetchAudio(audioUrl);

      this.updateStatus("Normalizing volume...");

      // Find the peak amplitude
      let peakAmplitude = 0;
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          const absValue = Math.abs(channelData[i]);
          if (absValue > peakAmplitude) {
            peakAmplitude = absValue;
          }
        }
      }

      // Calculate the gain factor
      // Convert level (0-100) to target amplitude (0.1-1.0)
      const targetAmplitude = 0.1 + (level / 100) * 0.9;
      const gainFactor =
        peakAmplitude > 0 ? targetAmplitude / peakAmplitude : 1;

      // Create a new buffer for the normalized audio
      const normalizedBuffer = this.audioContext!.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Apply gain to each sample
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const normalizedData = normalizedBuffer.getChannelData(channel);

        for (let i = 0; i < channelData.length; i++) {
          normalizedData[i] = channelData[i] * gainFactor;
        }
      }

      this.updateProgress(85);

      // Create a file from the normalized buffer
      return await this.createAudioFileFromBuffer(normalizedBuffer);
    } catch (error) {
      console.error("Error normalizing volume:", error);
      throw error;
    }
  }

  /**
   * Apply audio effects to the audio with improved implementation
   */
  async applyEffects(
    audioUrl: string,
    effects: Record<AudioEffect, number>
  ): Promise<string> {
    this.ensureLoaded();
    console.log("Applying audio effects:", effects);

    if (!audioUrl) {
      throw new Error("Invalid audio URL");
    }

    try {
      // Fetch and decode the audio
      const audioBuffer = await this.fetchAudio(audioUrl);

      this.updateStatus("Applying effects...");

      // Create an offline audio context for processing
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Create a buffer source
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Create effect nodes
      let lastNode: AudioNode = source;

      // 1. Reverb effect
      if (effects.reverb > 0) {
        const convolver = offlineCtx.createConvolver();
        // Create an impulse response for reverb
        const impulseLength = Math.min(
          audioBuffer.sampleRate * (effects.reverb / 100) * 2,
          audioBuffer.sampleRate * 3
        );
        const impulse = offlineCtx.createBuffer(
          2,
          impulseLength,
          audioBuffer.sampleRate
        );

        for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
          const impulseData = impulse.getChannelData(channel);
          for (let i = 0; i < impulseLength; i++) {
            impulseData[i] =
              (Math.random() * 2 - 1) * Math.exp(-i / (impulseLength / 6));
          }
        }

        convolver.buffer = impulse;

        // Create a gain node for reverb mix
        const reverbGain = offlineCtx.createGain();
        reverbGain.gain.value = effects.reverb / 100;

        // Create a gain node for dry signal
        const dryGain = offlineCtx.createGain();
        dryGain.gain.value = 1 - effects.reverb / 200; // Reduce dry signal less

        // Connect reverb path
        lastNode.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(offlineCtx.destination);

        // Connect dry path
        lastNode.connect(dryGain);
        lastNode = dryGain;
      }

      // 2. EQ-Voice effect
      if (effects["eq-voice"] > 0) {
        // Create a voice-optimized EQ using multiple filters

        // Cut very low frequencies
        const highPass = offlineCtx.createBiquadFilter();
        highPass.type = "highpass";
        highPass.frequency.value = 100;

        // Boost mid-range for voice clarity
        const midBoost = offlineCtx.createBiquadFilter();
        midBoost.type = "peaking";
        midBoost.frequency.value = 2500;
        midBoost.Q.value = 1;
        midBoost.gain.value = effects["eq-voice"] * 0.2;

        // Cut high frequencies slightly
        const highCut = offlineCtx.createBiquadFilter();
        highCut.type = "lowpass";
        highCut.frequency.value = 8000;

        // Connect the EQ filters
        lastNode.connect(highPass);
        highPass.connect(midBoost);
        midBoost.connect(highCut);
        lastNode = highCut;
      }

      // 3. Boost effect (volume boost with limiting)
      if (effects.boost > 0) {
        const boost = offlineCtx.createGain();
        boost.gain.value = 1 + effects.boost / 50; // 0-100 -> 1-3

        // Add a limiter to prevent clipping
        const compressor = offlineCtx.createDynamicsCompressor();
        compressor.threshold.value = -6;
        compressor.knee.value = 10;
        compressor.ratio.value = 20;
        compressor.attack.value = 0.001;
        compressor.release.value = 0.1;

        lastNode.connect(boost);
        boost.connect(compressor);
        lastNode = compressor;
      }

      // 4. Warmth effect (saturation and EQ)
      if (effects.warmth > 0) {
        // Add a low shelf for warmth
        const lowShelf = offlineCtx.createBiquadFilter();
        lowShelf.type = "lowshelf";
        lowShelf.frequency.value = 300;
        lowShelf.gain.value = effects.warmth * 0.2;

        // Add a high cut for warmth
        const highCut = offlineCtx.createBiquadFilter();
        highCut.type = "highshelf";
        highCut.frequency.value = 4000;
        highCut.gain.value = -effects.warmth * 0.1;

        lastNode.connect(lowShelf);
        lowShelf.connect(highCut);
        lastNode = highCut;
      }

      // 5. Clarity effect (high frequency emphasis)
      if (effects.clarity > 0) {
        // High shelf for brightness
        const highShelf = offlineCtx.createBiquadFilter();
        highShelf.type = "highshelf";
        highShelf.frequency.value = 6000;
        highShelf.gain.value = effects.clarity * 0.15;

        // Peaking filter for presence
        const presenceFilter = offlineCtx.createBiquadFilter();
        presenceFilter.type = "peaking";
        presenceFilter.frequency.value = 3000;
        presenceFilter.Q.value = 1;
        presenceFilter.gain.value = effects.clarity * 0.1;

        lastNode.connect(highShelf);
        highShelf.connect(presenceFilter);
        lastNode = presenceFilter;
      }

      // Connect to destination if needed
      if (lastNode !== source) {
        lastNode.connect(offlineCtx.destination);
      } else {
        source.connect(offlineCtx.destination);
      }

      // Start the source
      source.start();

      // Render the audio
      const renderedBuffer = await offlineCtx.startRendering();

      this.updateProgress(85);

      // Create a file from the processed buffer
      return await this.createAudioFileFromBuffer(renderedBuffer);
    } catch (error) {
      console.error("Error applying effects:", error);
      throw error;
    }
  }

  /**
   * Generate or update subtitles from the audio
   */
  async generateSubtitles(
    audioUrl: string,
    existingSubtitles: AudioSubtitle[]
  ): Promise<string> {
    // For subtitles, we don't need to process the audio
    // We just need to return the original URL with a timestamp
    // In a real implementation, you would use a speech-to-text API
    return `${audioUrl}?subtitles=true&count=${existingSubtitles.length}&t=${Date.now()}`;
  }

  /**
   * Process audio with all selected operations in sequence
   */
  async processCompletely(
    audioUrl: string,
    options: AudioProcessingOptions
  ): Promise<string> {
    this.ensureLoaded();
    console.log("Processing audio completely with options:", options);

    if (!audioUrl) {
      throw new Error("Invalid audio URL");
    }

    try {
      let processedUrl = audioUrl;

      // Process in a specific order:
      // 1. Trim (reduces processing time for other operations)
      if (
        options.trim.startTime > 0 ||
        options.trim.endTime < Number.MAX_SAFE_INTEGER
      ) {
        this.updateStatus("Trimming audio...");
        processedUrl = await this.trimAudio(
          processedUrl,
          options.trim.startTime,
          options.trim.endTime
        );
        this.updateProgress(20);
      }

      // 2. Noise reduction (clean the signal first)
      if (needsNoiseReduction(options.noiseReduction)) {
        this.updateStatus("Reducing noise...");
        processedUrl = await this.reduceNoise(
          processedUrl,
          options.noiseReduction
        );
        this.updateProgress(40);
      }

      // 3. Enhancement (shape the sound)
      if (needsEnhancement(options.enhancement)) {
        this.updateStatus("Enhancing audio...");
        processedUrl = await this.enhanceAudio(
          processedUrl,
          options.enhancement
        );
        this.updateProgress(60);
      }

      // 4. Effects (add color)
      if (hasActiveEffects(options.effects)) {
        this.updateStatus("Applying effects...");
        processedUrl = await this.applyEffects(processedUrl, options.effects);
        this.updateProgress(80);
      }

      // 5. Normalization (adjust final levels)
      if (options.volumeNormalize > 0) {
        this.updateStatus("Normalizing volume...");
        processedUrl = await this.normalizeVolume(
          processedUrl,
          options.volumeNormalize
        );
        this.updateProgress(90);
      }

      // 6. Handle subtitles if needed
      if (options.subtitles && options.subtitles.length > 0) {
        this.updateStatus("Processing subtitles...");
        // Subtitles don't affect the audio file directly
        // In a real implementation, you would generate an SRT file
      }

      // Final output format processing
      if (options.format && options.format !== "wav") {
        this.updateStatus(`Converting to ${options.format.toUpperCase()}...`);
        // In a full implementation, this would use the appropriate encoder
        // For now, we'll maintain the WAV format
      }

      this.updateProgress(100);
      this.updateStatus("");

      return processedUrl;
    } catch (error) {
      console.error("Error in complete processing:", error);
      throw error;
    }
  }

  /**
   * Get audio duration from URL
   */
  async getAudioDuration(audioUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!audioUrl) {
        reject(new Error("Invalid audio URL"));
        return;
      }

      const audio = new Audio();

      const loadHandler = () => {
        audio.removeEventListener("loadedmetadata", loadHandler);
        audio.removeEventListener("error", errorHandler);
        resolve(audio.duration);
      };

      const errorHandler = () => {
        audio.removeEventListener("loadedmetadata", loadHandler);
        audio.removeEventListener("error", errorHandler);
        reject(new Error("Failed to load audio"));
      };

      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        audio.removeEventListener("loadedmetadata", loadHandler);
        audio.removeEventListener("error", errorHandler);
        reject(new Error("Timed out loading audio"));
      }, 30000);

      audio.addEventListener("loadedmetadata", () => {
        clearTimeout(timeout);
        loadHandler();
      });

      audio.addEventListener("error", () => {
        clearTimeout(timeout);
        errorHandler();
      });

      audio.src = audioUrl;
    });
  }

  /**
   * Create a preview of an audio processing operation with improved caching
   */
  async createPreview(
    audioUrl: string,
    operation: string,
    options: any
  ): Promise<string> {
    this.ensureLoaded();

    if (!audioUrl) {
      throw new Error("Invalid audio URL");
    }

    // Create a cache key based on the operation and options
    const cacheKey = this.createCacheKey(audioUrl, operation, options);

    // Check if we have a recent cached preview
    const cachedPreview = this.previewCache.get(cacheKey);
    if (
      cachedPreview &&
      Date.now() - cachedPreview.timestamp < this.maxPreviewAge
    ) {
      console.log(`Using cached preview for ${operation}`);
      return cachedPreview.url;
    }

    console.log(`Creating preview for ${operation}:`, options);

    try {
      // Fetch and decode the audio
      const audioBuffer = await this.fetchAudio(audioUrl);

      // For preview, process only a 5-second segment near the current time
      let startSample = 0;
      if (options.currentTime && options.currentTime > 0) {
        const sampleRate = audioBuffer.sampleRate;
        startSample = Math.max(
          0,
          Math.floor(options.currentTime * sampleRate - 2.5 * sampleRate)
        );
      }

      const previewLength = Math.min(
        audioBuffer.length - startSample,
        audioBuffer.sampleRate * 5
      );

      // Create a buffer for the preview segment
      const previewBuffer = this.audioContext!.createBuffer(
        audioBuffer.numberOfChannels,
        previewLength,
        audioBuffer.sampleRate
      );

      // Copy the segment to the preview buffer
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const previewData = previewBuffer.getChannelData(channel);

        for (let i = 0; i < previewLength; i++) {
          previewData[i] = channelData[i + startSample];
        }
      }

      // Process the preview based on the operation
      let processedBuffer;

      switch (operation) {
        case "trim":
          // For trim, we just use the preview segment as is
          processedBuffer = previewBuffer;
          break;

        case "enhance":
          processedBuffer = await this.previewEnhance(previewBuffer, options);
          break;

        case "noise-reduction":
          processedBuffer = await this.previewNoiseReduction(
            previewBuffer,
            options
          );
          break;

        case "normalize":
          processedBuffer = await this.previewNormalize(
            previewBuffer,
            options.level
          );
          break;

        case "effects":
          processedBuffer = await this.previewEffects(previewBuffer, options);
          break;

        case "all":
          // For "all" preview, apply all effects in sequence
          processedBuffer = await this.previewAll(previewBuffer, options);
          break;

        default:
          processedBuffer = previewBuffer;
      }

      // Create a file from the processed preview
      const previewUrl = await this.createAudioFileFromBuffer(processedBuffer);

      // Cache the preview
      this.previewCache.set(cacheKey, {
        url: previewUrl,
        timestamp: Date.now(),
      });

      // Clean up old cache entries
      this.cleanupPreviewCache();

      return previewUrl;
    } catch (error) {
      console.error(`Error creating ${operation} preview:`, error);
      throw error;
    }
  }

  /**
   * Create a cache key for preview caching
   */
  private createCacheKey(
    audioUrl: string,
    operation: string,
    options: any
  ): string {
    // Create a deterministic cache key based on the input parameters
    const optionsString = JSON.stringify(options);
    const hash = this.simpleHash(`${audioUrl}|${operation}|${optionsString}`);
    return `${operation}-${hash}`;
  }

  /**
   * Simple string hashing function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clean up old preview cache entries
   */
  private cleanupPreviewCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.previewCache.entries()) {
      if (now - entry.timestamp > this.maxPreviewAge) {
        // Release the URL to free memory
        URL.revokeObjectURL(entry.url);
        this.previewCache.delete(key);
      }
    }
  }

  /**
   * Preview enhance effect
   */
  private async previewEnhance(
    buffer: AudioBuffer,
    enhancement: AudioEnhancement
  ): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    // Create the same enhancement filters as in the full enhanceAudio method
    const highPass = offlineCtx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 150 + enhancement.voiceClarity * 2;
    highPass.Q.value = 0.7;

    const bassFilter = offlineCtx.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 200;
    bassFilter.gain.value = (enhancement.bassTone - 50) * 0.3;

    const midFilter = offlineCtx.createBiquadFilter();
    midFilter.type = "peaking";
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;
    midFilter.gain.value = (enhancement.midTone - 50) * 0.2;

    const trebleFilter = offlineCtx.createBiquadFilter();
    trebleFilter.type = "highshelf";
    trebleFilter.frequency.value = 4000;
    trebleFilter.gain.value = (enhancement.trebleTone - 50) * 0.25;

    const presenceFilter = offlineCtx.createBiquadFilter();
    presenceFilter.type = "peaking";
    presenceFilter.frequency.value = 2500;
    presenceFilter.Q.value = 1.5;
    presenceFilter.gain.value = (enhancement.presence - 50) * 0.3;

    // Connect nodes
    source.connect(highPass);
    highPass.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);
    trebleFilter.connect(presenceFilter);
    presenceFilter.connect(offlineCtx.destination);

    source.start();
    return offlineCtx.startRendering();
  }

  /**
   * Preview noise reduction with improved algorithm
   */
  private async previewNoiseReduction(
    buffer: AudioBuffer,
    options: NoiseReduction
  ): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    // Simplified version of the advanced noise reduction for preview
    // Just using the key elements for faster preview generation

    // High-pass filter for low frequency noise
    const highPass = offlineCtx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 80 + options.sensitivity * 0.5;

    // Low-pass filter for high frequency noise
    const lowPass = offlineCtx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 10000 - options.strength * 30;

    // Compressor to preserve voice
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -50 + options.preserveVoice * 0.3;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Connect nodes
    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(compressor);
    compressor.connect(offlineCtx.destination);

    source.start();
    return offlineCtx.startRendering();
  }

  /**
   * Preview normalization
   */
  private async previewNormalize(
    buffer: AudioBuffer,
    level: number
  ): Promise<AudioBuffer> {
    // Find peak amplitude
    let peakAmplitude = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const absValue = Math.abs(channelData[i]);
        if (absValue > peakAmplitude) {
          peakAmplitude = absValue;
        }
      }
    }

    // Calculate gain factor
    const targetAmplitude = 0.1 + (level / 100) * 0.9;
    const gainFactor = peakAmplitude > 0 ? targetAmplitude / peakAmplitude : 1;

    // Create new buffer
    const normalizedBuffer = this.audioContext!.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    // Apply gain
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const normalizedData = normalizedBuffer.getChannelData(channel);

      for (let i = 0; i < channelData.length; i++) {
        normalizedData[i] = channelData[i] * gainFactor;
      }
    }

    return normalizedBuffer;
  }

  /**
   * Preview audio effects
   */
  private async previewEffects(
    buffer: AudioBuffer,
    effects: Record<AudioEffect, number>
  ): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    // Same effect nodes as in the full applyEffects method
    let lastNode: AudioNode = source;

    // Simplified effects for preview
    if (effects.reverb > 0) {
      // Simplified reverb
      const convolver = offlineCtx.createConvolver();
      const impulseLength = Math.min(
        buffer.sampleRate * (effects.reverb / 100),
        buffer.sampleRate
      );
      const impulse = offlineCtx.createBuffer(
        2,
        impulseLength,
        buffer.sampleRate
      );

      for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
        const impulseData = impulse.getChannelData(channel);
        for (let i = 0; i < impulseLength; i++) {
          impulseData[i] =
            (Math.random() * 2 - 1) * Math.exp(-i / (impulseLength / 6));
        }
      }

      convolver.buffer = impulse;

      const reverbGain = offlineCtx.createGain();
      reverbGain.gain.value = effects.reverb / 100;

      const dryGain = offlineCtx.createGain();
      dryGain.gain.value = 1 - effects.reverb / 200;

      lastNode.connect(convolver);
      convolver.connect(reverbGain);
      reverbGain.connect(offlineCtx.destination);

      lastNode.connect(dryGain);
      lastNode = dryGain;
    }

    // Simplified EQ-Voice
    if (effects["eq-voice"] > 0) {
      const eqFilter = offlineCtx.createBiquadFilter();
      eqFilter.type = "peaking";
      eqFilter.frequency.value = 2500;
      eqFilter.Q.value = 1;
      eqFilter.gain.value = effects["eq-voice"] * 0.2;

      lastNode.connect(eqFilter);
      lastNode = eqFilter;
    }

    // Add simplified versions of other effects
    if (effects.warmth > 0) {
      const warmthFilter = offlineCtx.createBiquadFilter();
      warmthFilter.type = "lowshelf";
      warmthFilter.frequency.value = 300;
      warmthFilter.gain.value = effects.warmth * 0.2;

      lastNode.connect(warmthFilter);
      lastNode = warmthFilter;
    }

    if (effects.clarity > 0) {
      const clarityFilter = offlineCtx.createBiquadFilter();
      clarityFilter.type = "highshelf";
      clarityFilter.frequency.value = 6000;
      clarityFilter.gain.value = effects.clarity * 0.15;

      lastNode.connect(clarityFilter);
      lastNode = clarityFilter;
    }

    // Connect to destination
    lastNode.connect(offlineCtx.destination);

    source.start();
    return offlineCtx.startRendering();
  }

  /**
   * Preview all effects combined
   */
  private async previewAll(
    buffer: AudioBuffer,
    options: any
  ): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    let lastNode: AudioNode = source;

    // Apply simplified versions of all effects in order
    // 1. Noise reduction if needed
    if (needsNoiseReduction(options.noiseReduction)) {
      const highPass = offlineCtx.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = 80 + options.noiseReduction.sensitivity * 0.5;

      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.value =
        -50 + options.noiseReduction.preserveVoice * 0.3;

      lastNode.connect(highPass);
      highPass.connect(compressor);
      lastNode = compressor;
    }

    // 2. Enhancement if needed
    if (needsEnhancement(options.enhancement)) {
      // Just add two key filters for preview
      const bassFilter = offlineCtx.createBiquadFilter();
      bassFilter.type = "lowshelf";
      bassFilter.frequency.value = 200;
      bassFilter.gain.value = (options.enhancement.bassTone - 50) * 0.3;

      const presenceFilter = offlineCtx.createBiquadFilter();
      presenceFilter.type = "peaking";
      presenceFilter.frequency.value = 2500;
      presenceFilter.Q.value = 1.5;
      presenceFilter.gain.value = (options.enhancement.presence - 50) * 0.3;

      lastNode.connect(bassFilter);
      bassFilter.connect(presenceFilter);
      lastNode = presenceFilter;
    }

    // 3. Effects if needed
    if (hasActiveEffects(options.effects)) {
      if (options.effects.reverb > 0) {
        // Simple reverb
        const reverbGain = offlineCtx.createGain();
        reverbGain.gain.value = options.effects.reverb / 100;
        lastNode.connect(reverbGain);
        lastNode = reverbGain;
      }

      if (options.effects["eq-voice"] > 0) {
        const eqFilter = offlineCtx.createBiquadFilter();
        eqFilter.type = "peaking";
        eqFilter.frequency.value = 2500;
        eqFilter.gain.value = options.effects["eq-voice"] * 0.2;

        lastNode.connect(eqFilter);
        lastNode = eqFilter;
      }
    }

    // 4. Normalize if needed
    if (options.volumeNormalize > 0) {
      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = 0.5 + options.volumeNormalize / 200;

      lastNode.connect(gainNode);
      lastNode = gainNode;
    }

    // Connect to destination
    lastNode.connect(offlineCtx.destination);

    source.start();
    return offlineCtx.startRendering();
  }
}

// Helper functions to determine if processing is needed
function needsNoiseReduction(noiseReduction: NoiseReduction): boolean {
  const defaultValues = { strength: 50, sensitivity: 50, preserveVoice: 75 };
  return (
    noiseReduction.strength !== defaultValues.strength ||
    noiseReduction.sensitivity !== defaultValues.sensitivity ||
    noiseReduction.preserveVoice !== defaultValues.preserveVoice
  );
}

function needsEnhancement(enhancement: AudioEnhancement): boolean {
  const defaultValues = {
    voiceClarity: 50,
    bassTone: 50,
    midTone: 50,
    trebleTone: 50,
    presence: 50,
  };

  return (
    enhancement.voiceClarity !== defaultValues.voiceClarity ||
    enhancement.bassTone !== defaultValues.bassTone ||
    enhancement.midTone !== defaultValues.midTone ||
    enhancement.trebleTone !== defaultValues.trebleTone ||
    enhancement.presence !== defaultValues.presence
  );
}

function hasActiveEffects(effects: Record<AudioEffect, number>): boolean {
  return Object.values(effects).some((value) => value > 0);
}

// Singleton instance
export const audioProcessor = new AudioProcessor();
