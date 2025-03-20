// repositories/managers/TestimonialManager.ts
import { Testimonial } from "@/types/testimonial";

import { makeAutoObservable, runInAction } from "mobx";
import { WorkspaceOrchestrator } from "../workspace_hub";
import { MemberManager } from "./member";

export class TestimonialManager {
  testimonials: Testimonial[] | null = null;
  loading_testimonials = true;
  private workspaceOrchestrator: WorkspaceOrchestrator;
  private memberManager: MemberManager;

  constructor(workspaceRepository: WorkspaceOrchestrator) {
    this.workspaceOrchestrator = workspaceRepository;
    this.memberManager = workspaceRepository.memberManager;
    makeAutoObservable(this); // Make all properties observable
  }

  async getTestimonials() {
    // Start loading
    this.loading_testimonials = true;

    try {
      const workspaceID = this.memberManager.member?.workspace_id;
      if (!workspaceID) {
        throw new Error("No workspace ID found");
      }

      const url = `${this.workspaceOrchestrator.server}/${workspaceID}/testimonials`;
      const { token } = await this.workspaceOrchestrator.getToken();

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Use runInAction for updating observable state after async operations
        runInAction(() => {
          this.testimonials = data;
        });
        return data;
      }

      throw new Error("Could not get testimonials");
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      throw error;
    } finally {
      // Mark loading as complete
      runInAction(() => {
        this.loading_testimonials = false;
      });
    }
  }
}
