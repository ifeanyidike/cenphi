import { FFmpeg } from "@ffmpeg/ffmpeg";
import { makeAutoObservable } from "mobx";

class AppStore {
  public ffmpeg = new FFmpeg();
  public ffmpegLoaded = false;

  constructor() {
    makeAutoObservable(this);
  }
}

export const app = new AppStore();
