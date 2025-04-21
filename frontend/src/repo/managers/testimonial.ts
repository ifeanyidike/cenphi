// repositories/managers/TestimonialManager.ts

import { Testimonial } from "@/types/testimonial";
import { makeAutoObservable, runInAction } from "mobx";
import { WorkspaceOrchestrator } from "../workspace_hub";
import { MemberManager } from "./member";

/**
 * Manages testimonial-related operations within a workspace.
 * This class handles fetching testimonials and maintaining their state.
 */
export class TestimonialManager {
  testimonials: Testimonial[] | null = null;

  loading_testimonials = true;

  private workspaceOrchestrator: WorkspaceOrchestrator;
  private memberManager: MemberManager;

  /**
   * Initializes the TestimonialManager with the provided workspace orchestrator.
   * @param workspaceRepository - The workspace orchestrator instance.
   */
  constructor(workspaceRepository: WorkspaceOrchestrator) {
    this.workspaceOrchestrator = workspaceRepository;
    this.memberManager = workspaceRepository.memberManager;
    makeAutoObservable(this); // Make all properties observable
  }

  /**
   * Fetches testimonials for the current workspace.
   *
   * @returns A promise that resolves to an array of testimonials.
   * @throws Error if the workspace ID is missing or the request fails.
   */
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
      runInAction(() => {
        this.loading_testimonials = false;
      });
    }
  }
}
