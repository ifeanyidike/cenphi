import { flow, makeAutoObservable, reaction, runInAction } from "mobx";

class AppService {
  private server = import.meta.env.VITE_API_URL;
  healthy = true;
  healthInterval: number | null = null;

  constructor() {
    makeAutoObservable(this);

    reaction(
      () => this.healthy,
      (healthy: boolean) => {
      console.log("Health changed:", healthy);
      // You could trigger notifications, update other state, etc.
      }
    );
  }

  checkHealth = flow(function* (this: AppService) {
    try {
      const response: Response = yield fetch(`${this.server}/health`);
      const result: string = yield response.text();
      runInAction(() => {
        this.healthy = result.trim() === "Healthy";
      });
    } catch (error: any) {
      console.log("error", error);
      runInAction(() => (this.healthy = false));
    }
  });

  startHealthCheck(interval = 60000): void {
    if (!this.isHealthRunning) {
      this.checkHealth();
      this.healthInterval = setInterval(() => {
        this.checkHealth();
      }, interval);
    } else {
      console.log("Health check already running, ignoring duplicate start");
    }
  }

  stopHealthCheck(): void {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
  }

  get healthStatus(): string {
    return this.healthy ? "Healthy" : "Unhealthy";
  }

  get isHealthRunning(): boolean {
    return this.healthInterval !== null;
  }
}
export const appService = new AppService();
