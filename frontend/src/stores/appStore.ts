import { FFmpeg } from "@ffmpeg/ffmpeg";
import { makeAutoObservable } from "mobx";

class AppStore {
  public ffmpeg = new FFmpeg();
  public ffmpegLoaded = false;

  constructor() {
    makeAutoObservable(this);
    this.ffmpeg = new FFmpeg();
  }
  async initialize() {
    try {
      // Check if FFmpeg is already loaded
      if (!this.ffmpegLoaded) {
        // Create a worker URL
        // const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

        // FFmpeg will be loaded on-demand when needed
        console.log("FFmpeg worker initialized");
      }
    } catch (error) {
      console.error("Failed to initialize application:", error);
    }
  }
}

export const app = new AppStore();
