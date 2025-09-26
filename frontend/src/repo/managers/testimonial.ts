// repositories/managers/TestimonialManager.ts

import { Testimonial } from "@/types/testimonial";
import { makeAutoObservable, runInAction } from "mobx";
import { WorkspaceOrchestrator } from "../workspace_hub";
import { MemberManager } from "./member";
import axios from "axios";
import { authStore } from "@/stores/authStore";

/**
 * Manages testimonial-related operations within a workspace.
 * This class handles fetching testimonials and maintaining their state.
 */
export class TestimonialManager {
  testimonials: Testimonial[] | null = null;
  testimonial: Testimonial | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  private server_addr = import.meta.env.VITE_API_URL + "/testimonials";

  loading_testimonials = false;

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
      // const workspaceID = this.memberManager.member?.workspace_id;
      // console.log("getting workspace id", workspaceID);
      // if (!workspaceID) {
      //   throw new Error("No workspace ID found");
      // }

      // console.log("workspaceID", workspaceID);

      // const url = `${this.workspaceOrchestrator.server}/${workspaceID}/testimonials`;
      const { token } = await authStore.getToken();

      // const response = await fetch(this.server_addr, {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      // });
      const response = await axios.get(this.server_addr, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        // const data = await response.json();
        const data = response.data?.response?.testimonials;
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
      this.loading_testimonials = false;
    }
  }

  // setTestimonial(testimonial: Testimonial) {
  //   this.testimonial = testimonial;
  // }

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
    console.log("testimonialId", id);
    this.isLoading = true;
    try {
      if (!id) return;

      const url = `${this.server_addr}/${id}`;
      const { token } = await authStore.getToken();

      // const response = await fetch(url, {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      // });
      console.log("making request", url);
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("response", response);

      if (response.status == 200) {
        // const data = await response.json();
        const data = response.data;
        console.log("data", data);
        runInAction(() => {
          this.testimonial = data.testimonial;
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

  /**
   * Gets artifacts that were created from multiple testimonials
   * (content_generation, text_polishing, translation)
   */
  getMultiTestimonialArtifacts() {
    if (!this.testimonials) return [];

    const multiTypes = ["content_generation", "text_polishing", "translation"];
    const allArtifacts = this.testimonials.flatMap(testimonial =>
      (testimonial.artifacts || []).filter(artifact =>
        multiTypes.includes(artifact.processing_type) &&
        artifact.data &&
        typeof artifact.data === 'object' &&
        'testimonial_ids' in artifact.data &&
        Array.isArray((artifact.data as any).testimonial_ids) &&
        (artifact.data as any).testimonial_ids.length > 0
      )
    );

    // Remove duplicates by ID
    const uniqueArtifacts = allArtifacts.filter((artifact, index, self) =>
      index === self.findIndex(a => a.id === artifact.id)
    );

    return uniqueArtifacts;
  }
}
