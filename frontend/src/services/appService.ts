import { auth } from "@/config/firebase";
import { Plan } from "@/types/workspace";
import { flow, makeAutoObservable, reaction, runInAction } from "mobx";

class AppService {
  private server = import.meta.env.VITE_API_URL;
  healthy = true;
  healthInterval: number | null = null;

  constructor() {
    makeAutoObservable(this);

    reaction(
      () => this.healthy,
      (healthy) => {
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

  // async onboard(
  //   user_id: string,
  //   name: string,
  //   website_url: string,
  //   industry: string
  // ) {
  //   await fetch(`${this.server}/onboard/full`, {
  //     method: "POST",
  //     body: JSON.stringify({
  //       user_id,
  //       workspace: {
  //         name,
  //         website_url,
  //         industry,
  //         plan: "essentials",
  //       },
  //       team_member: {
  //         role: "owner",
  //       },
  //     }),
  //   });
  // }

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
