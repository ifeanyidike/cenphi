import { auth } from "@/config/firebase";
import { Plan } from "@/types/workspace";
import { flow, makeAutoObservable, reaction, runInAction } from "mobx";

/**
 * AppService handles application-wide operations such as server health checks and user onboarding.
 * It maintains the health status of the backend service and provides utility methods to start/stop health monitoring.
 */
class AppService {
  private server = import.meta.env.VITE_API_URL;
  healthy = true;
  healthInterval: number | null = null;

  constructor() {
    makeAutoObservable(this);

    // React to changes in health status
    reaction(
      () => this.healthy,
      (healthy: boolean) => {
        console.log("Health changed:", healthy);
      }
    );
  }

  /**
   * Checks the health of the backend server.
   * This method uses a MobX flow to perform asynchronous operations.
   *
   * @returns A generator that yields the fetch promise and updates the healthy status.
   */
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

  /**
   * Starts the periodic health check for the backend server.
   *
   * @param interval - The time interval in milliseconds between health checks (default is 60000ms).
   */
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

  /**
   * Stops the periodic health check if it is running.
   */
  stopHealthCheck(): void {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
  }

  /**
   * Returns the current health status as a string.
   *
   * @returns "Healthy" if the backend is healthy, otherwise "Unhealthy".
   */
  get healthStatus(): string {
    return this.healthy ? "Healthy" : "Unhealthy";
  }

  /**
   * Indicates whether the health check is currently running.
   *
   * @returns True if a health check interval is active, false otherwise.
   */
  get isHealthRunning(): boolean {
    return this.healthInterval !== null;
  }

  /**
   * Onboards a user partially by creating a new workspace and team member.
   *
   * @param user_id - The Firebase user ID.
   * @param plan - The selected plan for the workspace.
   * @returns A promise that resolves to a boolean indicating whether the onboard operation succeeded.
   * @throws An error if the authentication token is missing or the request fails.
   */
  async onboard_partial(user_id: string, plan: Plan) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Token not found, Unauthorized!");
    console.log("user_id", user_id);
    try {
      const response = await fetch(`${this.server}/onboard/partial`, {
        method: "POST",
        body: JSON.stringify({
          firebase_uid: user_id,
          workspace: {
            id: crypto.randomUUID(),
            plan,
            industry: "",
            name: "",
            website_url: "",
          },
          team_member: { id: crypto.randomUUID(), role: "owner" },
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const responseJson = await response.json();
      console.log("response JSON", responseJson);
      return response.ok;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }
}

export const appService = new AppService();
