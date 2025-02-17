import { app } from "@/stores/appStore";
import { AudioFormats } from "@/types/audio";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

class FFmpeg {
  // private ffmpegBaseUrl = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"; - Doesnt work for vite
  private ffmpegBaseUrl = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm"; // works for vite
  public async load() {
    app.ffmpeg.on("log", ({ message }) => {
      console.log("ffmpeg loaded", message);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
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

  async split(
    source: string,
    splitTime: number,
    input = "input.mp4",
    output1 = "part1.mp4",
    output2 = "part2.mp4",
    format = "video/mp4"
  ) {
    if (!app.ffmpegLoaded || !app.ffmpeg) return;

    // Load the video file into FFmpeg
    await app.ffmpeg.writeFile(input, await fetchFile(source));

    await app.ffmpeg.exec([
      "-i",
      input,
      "-t",
      `${splitTime}`,
      "-c",
      "copy",
      output1,
    ]);

    await app.ffmpeg.exec([
      "-i",
      input,
      "-ss",
      `${splitTime}`,
      "-c",
      "copy",
      output2,
    ]);

    // Read the trimmed output and create a URL to display it
    // const data = await ffmpeg.readFile('output.mp4');
    const part1Data = (await app.ffmpeg.readFile(output1)) as any;
    const part2Data = (await app.ffmpeg.readFile(output2)) as any;

    const part1_blob = new Blob([part1Data.buffer], { type: format });
    const part2_blob = new Blob([part2Data.buffer], { type: format });
    const part1_url = URL.createObjectURL(
      new Blob([part1Data.buffer], { type: format })
    );
    const part2_url = URL.createObjectURL(
      new Blob([part2Data.buffer], { type: format })
    );
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

  async splitVideo(source: string, splitTime: number) {
    return this.split(source, splitTime);
  }

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

  async trimVideo(startTime: number, endTime: number, src: string) {
    if (!app.ffmpegLoaded || !app.ffmpeg) return;

    // Load the video file into FFmpeg
    await app.ffmpeg.writeFile("input.mp4", await fetchFile(src));

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
    const url = URL.createObjectURL(
      new Blob([audioData.buffer], { type: "audio/mpeg" })
    );
    return { url, blob };
  }

  async mergeAudioBlobs(
    audioBlobs: Blob[],
    outputFormat: string = "audio/webm"
  ): Promise<Blob> {
    // Build a file list and write each blob to the virtual FS.
    let listContent = "";
    for (let i = 0; i < audioBlobs.length; i++) {
      const fileName = `audio${i}.webm`;
      // Write the blob to ffmpeg's file system.
      await app.ffmpeg.writeFile(fileName, await fetchFile(audioBlobs[i]));
      // Append a line to the file list.
      listContent += `file '${fileName}'\n`;
    }
    // Write the file list that the concat demuxer will use.
    await app.ffmpeg.writeFile("fileList.txt", listContent);

    // Run ffmpeg to concatenate the files using stream copy.
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

    // Read the output file from the virtual FS.
    const data = (await app.ffmpeg.readFile("mergedAudio.webm")) as any;
    return new Blob([data.buffer], { type: outputFormat });
  }

  async mergeAudioWithWebAudio(audioBlobs: Blob[]): Promise<AudioBuffer> {
    // Create an AudioContext (with fallback for older browsers)
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

    // Calculate the total length (in samples) for the output buffer.
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

  async mergeVideoBlobs(blobs: Blob[]) {
    for (let i = 0; i < blobs.length; i++) {
      await app.ffmpeg.writeFile(`input${i}.webm`, await fetchFile(blobs[i]));
    }

    // Create a file list for FFmpeg’s concat demuxer.
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
