// repositories/managers/testimonialManager.ts
import { WorkspaceRepository } from "../workspaceRepository";
import { Testimonial } from "@/types/testimonial";
import { MembersManager } from "./memberManager";

import { makeAutoObservable, runInAction } from "mobx";

export class TestimonialManager {
  testimonials: Testimonial[] | null = null;
  loading_testimonials = true;
  private workspaceRepository: WorkspaceRepository;
  private membersManager: MembersManager;

  constructor(workspaceRepository: WorkspaceRepository) {
    this.workspaceRepository = workspaceRepository;
    this.membersManager = workspaceRepository.membersManager;
    makeAutoObservable(this); // Make all properties observable
  }

  async getTestimonials() {
    // Start loading
    this.loading_testimonials = true;

    try {
      const workspaceID = this.membersManager.member?.workspace_id;
      if (!workspaceID) {
        throw new Error("No workspace ID found");
      }

      const url = `${this.workspaceRepository.server}/${workspaceID}/testimonials`;
      const { token } = await this.workspaceRepository.getToken();

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
