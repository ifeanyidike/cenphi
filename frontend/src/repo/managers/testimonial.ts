// repositories/managers/TestimonialManager.ts

import { Testimonial } from "@/types/testimonial";
import { makeAutoObservable, runInAction } from "mobx";
import { WorkspaceOrchestrator } from "../workspace_hub";
import { MemberManager } from "./member";
import { mockTestimonials } from "@/utils/mock";

/**
 * Manages testimonial-related operations within a workspace.
 * This class handles fetching testimonials and maintaining their state.
 */
export class TestimonialManager {
  testimonials: Testimonial[] | null = null;
  testimonial: Testimonial | null = null;
  isLoading: boolean = false;
  error: string | null = null;

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

  setTestimonial(testimonial: Testimonial) {
    this.testimonial = testimonial;
  }

  // async fetchTestimonial(id: string) {
  //   this.isLoading = true;
  //   this.error = null;

  //   try {
  //     await new Promise((resolve) => setTimeout(resolve, 800));
  //     const mockTestimonial = this.getMockTestimonial(id);

  //     runInAction(() => {
  //       this.testimonial = mockTestimonial!;
  //       this.isLoading = false;
  //     });
  //   } catch (error) {
  //     runInAction(() => {
  //       this.error =
  //         error instanceof Error ? error.message : "Unknown error occurred";
  //       this.isLoading = false;
  //     });
  //   }
  // }

  async fetchTestimonial(id: string) {
    this.isLoading = true;
    try {
      const workspaceID = this.memberManager.member?.workspace_id;
      if (!id || !workspaceID) return;

      const url = `${this.workspaceOrchestrator.server}/${workspaceID}/testimonials/${id}`;
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
        console.log("data", data);
        runInAction(() => {
          this.testimonial = data;
          this.isLoading = false;
        });
        return data;
      }

      throw new Error("Could not get testimonials");
    } catch (error: any) {
      runInAction(() => {
        this.isLoading = false;
        console.log("error", error.message);
      });
    }
  }

  getMockTestimonial(id: string) {
    // Mock data generation based on ID
    // In a real app, this would come from your API
    const type = id.includes("video")
      ? "video"
      : id.includes("audio")
        ? "audio"
        : id.includes("image")
          ? "image"
          : "text";
    return mockTestimonials.find((m) => m.format === type);
  }
}
