import { app } from "@/stores/appStore";
import { AudioFormats } from "@/types/audio";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

/**
 * FFmpeg provides methods to load the FFmpeg core, split and trim media files,
 * extract audio from videos, and merge media blobs.
 */
class FFmpeg {
  // Use the ESM build URL for Vite compatibility.
  private ffmpegBaseUrl = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

  /**
   * Loads the FFmpeg core and associated WASM module.
   * Bypasses CORS restrictions by converting URLs to Blob URLs.
   *
   * @returns {Promise<void>} Resolves when FFmpeg is loaded.
   */
  public async load() {
    app.ffmpeg.on("log", ({ message }) => {
      console.log("ffmpeg loaded", message);
    });
    await app.ffmpeg.load({
      coreURL: await toBlobURL(
        `${this.ffmpegBaseUrl}/ffmpeg-core.js`,
        "text/javascript"
      ),
      wasmURL: await toBlobURL(
        `${this.ffmpegBaseUrl}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    app.ffmpegLoaded = true;
  }

  /**
   * Splits a media file into two parts at a given time.
   *
   * @param source - The source URL of the media file.
   * @param splitTime - The time (in seconds) at which to split the file.
   * @param input - The input file name (default: "input.mp4").
   * @param output1 - The output file name for the first part (default: "part1.mp4").
   * @param output2 - The output file name for the second part (default: "part2.mp4").
   * @param format - The media MIME type (default: "video/mp4").
   * @returns {Promise<{ part1: { url: string; blob: Blob }; part2: { url: string; blob: Blob } }>}
   *          An object containing Blob URLs and Blob data for the two parts.
   */
  async split(
    source: string,
    splitTime: number,
    input = "input.mp4",
    output1 = "part1.mp4",
    output2 = "part2.mp4",
    format = "video/mp4"
  ) {
    if (!app.ffmpegLoaded || !app.ffmpeg) return;

    // Load the media file into FFmpeg.
    await app.ffmpeg.writeFile(input, await fetchFile(source));

    // Execute FFmpeg command to extract the first part.
    await app.ffmpeg.exec([
      "-i",
      input,
      "-t",
      `${splitTime}`,
      "-c",
      "copy",
      output1,
    ]);

    // Execute FFmpeg command to extract the second part.
    await app.ffmpeg.exec([
      "-i",
      input,
      "-ss",
      `${splitTime}`,
      "-c",
      "copy",
      output2,
    ]);

    // Read output files from FFmpeg's virtual filesystem.
    const part1Data = (await app.ffmpeg.readFile(output1)) as any;
    const part2Data = (await app.ffmpeg.readFile(output2)) as any;

    // Create blobs and URLs for each part.
    const part1_blob = new Blob([part1Data.buffer], { type: format });
    const part2_blob = new Blob([part2Data.buffer], { type: format });
    const part1_url = URL.createObjectURL(part1_blob);
    const part2_url = URL.createObjectURL(part2_blob);
    console.log("part1Data", part1Data);
    console.log("part2Data", part2Data);
    console.log("part1 blob", part1_blob);

    return {
      part1: {
        url: part1_url,
        blob: part1_blob,
      },
      part2: {
        url: part2_url,
        blob: part2_blob,
      },
    };
  }

  /**
   * Splits a video file at a specified time.
   *
   * @param source - The source URL of the video.
   * @param splitTime - The time (in seconds) at which to split the video.
   * @returns {Promise<ReturnType<FFmpeg["split"]>>} The result from the split method.
   */
  async splitVideo(source: string, splitTime: number) {
    return this.split(source, splitTime);
  }

  /**
   * Splits an audio file at a specified time.
   * Adapts file names and MIME types based on the audio format.
   *
   * @param source - The source URL of the audio file.
   * @param _format - The format of the audio ("mp3", "wav", or "ogg").
   * @param splitTime - The time (in seconds) at which to split the audio.
   * @returns {Promise<ReturnType<FFmpeg["split"]>>} The result from the split method.
   */
  async splitAudio(source: string, _format: AudioFormats, splitTime: number) {
    let input = "input.mp3";
    let part1 = "part1.mp3";
    let part2 = "part2.mp3";
    let format = "audio/mpeg";

    switch (_format) {
      case "mp3":
        input = "input.mp3";
        part1 = "part1.mp3";
        part2 = "part2.mp3";
        format = "audio/mpeg";
        break;
      case "wav":
        input = "input.wav";
        part1 = "part1.wav";
        part2 = "part2.wav";
        format = "audio/wav";
        break;
      case "ogg":
        input = "input.ogg";
        part1 = "part1.ogg";
        part2 = "part2.ogg";
        format = "audio/ogg";
        break;
    }
    return this.split(source, splitTime, input, part1, part2, format);
  }

  /**
   * Trims a video file between the specified start and end times.
   *
   * @param startTime - The starting time (in seconds) for the trim.
   * @param endTime - The ending time (in seconds) for the trim.
   * @param src - The source URL of the video.
   * @returns {Promise<string>} A Blob URL of the trimmed video.
   */
  async trimVideo(startTime: number, endTime: number, src: string) {
    if (!app.ffmpegLoaded || !app.ffmpeg) return;

    // Load the video file into FFmpeg.
    await app.ffmpeg.writeFile("input.mp4", await fetchFile(src));

    // Execute FFmpeg command to trim the video.
    await app.ffmpeg.exec([
      "-i",
      "input.mp4",
      "-ss",
      `${startTime}`, // Start time
      "-to",
      `${endTime}`, // End time
      "-c",
      "copy", // Copy codec to prevent re-encoding
      "output.mp4", // Output file
    ]);

    const data = (await app.ffmpeg.readFile("output.mp4")) as any;
    return URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
  }

  /**
   * Extracts audio from a video file.
   *
   * @param inputVideo - The source URL of the video file.
   * @returns {Promise<{ url: string; blob: Blob }>} An object containing the audio's Blob URL and Blob data.
   */
  async extractAudio(inputVideo: string) {
    await app.ffmpeg.writeFile("input.mp4", await fetchFile(inputVideo));
    await app.ffmpeg.exec([
      "-i",
      "input.mp4",
      "-q:a",
      "0",
      "-map",
      "a",
      "output.mp3",
    ]);
    const audioData = (await app.ffmpeg.readFile("output.mp3")) as any;
    const blob = new Blob([audioData.buffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    return { url, blob };
  }

  /**
   * Merges multiple audio blobs into a single audio file.
   *
   * @param audioBlobs - An array of audio Blob objects to merge.
   * @param outputFormat - The MIME type for the output audio (default: "audio/webm").
   * @returns {Promise<Blob>} A Blob representing the merged audio.
   */
  async mergeAudioBlobs(
    audioBlobs: Blob[],
    outputFormat: string = "audio/webm"
  ): Promise<Blob> {
    // Build a file list and write each blob to FFmpeg's virtual filesystem.
    let listContent = "";
    for (let i = 0; i < audioBlobs.length; i++) {
      const fileName = `audio${i}.webm`;
      await app.ffmpeg.writeFile(fileName, await fetchFile(audioBlobs[i]));
      listContent += `file '${fileName}'\n`;
    }
    await app.ffmpeg.writeFile("fileList.txt", listContent);

    // Execute FFmpeg to concatenate the files using stream copy.
    await app.ffmpeg.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "fileList.txt",
      "-c",
      "copy",
      "mergedAudio.webm",
    ]);

    const data = (await app.ffmpeg.readFile("mergedAudio.webm")) as any;
    return new Blob([data.buffer], { type: outputFormat });
  }

  /**
   * Merges multiple audio blobs into a single AudioBuffer using the Web Audio API.
   *
   * @param audioBlobs - An array of audio Blob objects to merge.
   * @returns {Promise<AudioBuffer>} The merged AudioBuffer.
   */
  async mergeAudioWithWebAudio(audioBlobs: Blob[]): Promise<AudioBuffer> {
    // Create an AudioContext (with fallback for older browsers).
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // Decode each Blob into an AudioBuffer.
    const buffers: AudioBuffer[] = await Promise.all(
      audioBlobs.map((blob) =>
        blob
          .arrayBuffer()
          .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      )
    );

    // Calculate total length (in samples) for the output buffer.
    const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
    const numChannels = buffers[0].numberOfChannels;

    // Create an output AudioBuffer with the same sample rate.
    const outputBuffer = audioContext.createBuffer(
      numChannels,
      totalLength,
      audioContext.sampleRate
    );

    let offset = 0;
    for (const buffer of buffers) {
      for (let channel = 0; channel < numChannels; channel++) {
        outputBuffer
          .getChannelData(channel)
          .set(buffer.getChannelData(channel), offset);
      }
      offset += buffer.length;
    }

    return outputBuffer;
  }

  /**
   * Merges multiple video blobs into a single video file.
   *
   * @param blobs - An array of video Blob objects to merge.
   * @returns {Promise<Blob>} A Blob representing the merged video in WebM format.
   */
  async mergeVideoBlobs(blobs: Blob[]) {
    for (let i = 0; i < blobs.length; i++) {
      await app.ffmpeg.writeFile(`input${i}.webm`, await fetchFile(blobs[i]));
    }

    // Create a file list for FFmpeg's concat demuxer.
    const fileList = blobs.map((_, i) => `file input${i}.webm`).join("\n");
    await app.ffmpeg.writeFile("fileList.txt", fileList);

    await app.ffmpeg.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "fileList.txt",
      "-c",
      "copy",
      "output.webm",
    ]);

    const data = (await app.ffmpeg.readFile("output.webm")) as any;
    return new Blob([data.buffer], { type: "video/webm" });
  }
}

export const ffmpeg_util = new FFmpeg();
