// repositories/managers/TestimonialManager.ts

import { Testimonial } from "@/types/testimonial";
import { makeAutoObservable, runInAction } from "mobx";
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

  // Track whether cached testimonials include artifacts
  private testimonialsIncludeArtifacts: boolean = false;

  /**
   * Initializes the TestimonialManager with the provided workspace orchestrator.
   * @param workspaceRepository - The workspace orchestrator instance.
   */
  constructor() {
    makeAutoObservable(this); // Make all properties observable
  }

  /**
   * Fetches testimonials for the current workspace.
   *
   * @param excludeArtifacts - If true, excludes artifacts from response for faster loading (default: false)
   * @returns A promise that resolves to an array of testimonials.
   * @throws Error if the workspace ID is missing or the request fails.
   */
  async getTestimonials(excludeArtifacts: boolean = false, refresh = false) {
    // If we have cached data and it matches what we need, return it
    if (this.testimonials && this.testimonials.length > 0 && !refresh) {
      if (excludeArtifacts || this.testimonialsIncludeArtifacts) {
        // Cached data is sufficient
        console.log("[TestimonialManager] Using cached testimonials:", {
          count: this.testimonials.length,
          includesArtifacts: this.testimonialsIncludeArtifacts,
          requestedExclude: excludeArtifacts,
        });
        return this.testimonials;
      }
      // Need full data but only have lightweight - refetch
      console.log(
        "[TestimonialManager] Cached data lacks artifacts, refetching..."
      );
    }

    // Start loading
    this.loading_testimonials = true;

    try {
      const { token } = await authStore.getToken();

      const params = new URLSearchParams();
      if (excludeArtifacts) {
        params.append("exclude_artifacts", "true");
      }

      const url = `${this.server_addr}${params.toString() ? `?${params.toString()}` : ""}`;

      console.log("[TestimonialManager] Fetching testimonials:", {
        excludeArtifacts,
        url,
      });

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        const data = response.data?.response?.testimonials;
        runInAction(() => {
          this.testimonials = data;
          this.testimonialsIncludeArtifacts = !excludeArtifacts;
        });
        console.log("[TestimonialManager] Fetched testimonials:", {
          count: data.length,
          includesArtifacts: !excludeArtifacts,
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

  async fetchTestimonial(id: string, excludeArtifacts: boolean = false) {
    console.log("testimonialId", id);
    if (this.testimonial?.id === id && !excludeArtifacts) {
      // Only use cached if it has full data (not excluded artifacts)
      this.isLoading = false;
      return this.testimonial;
    }

    this.isLoading = true;
    try {
      if (!id) return;

      const params = new URLSearchParams();
      if (excludeArtifacts) {
        params.append("exclude_artifacts", "true");
      }

      const url = `${this.server_addr}/${id}${params.toString() ? `?${params.toString()}` : ""}`;
      const { token } = await authStore.getToken();

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("response", response);

      if (response.status == 200) {
        const data = response.data;
        console.log("data", data);
        runInAction(() => {
          // Only cache if it's full data
          if (!excludeArtifacts) {
            this.testimonial = data.testimonial;
          }
          this.isLoading = false;
        });
        return data.testimonial; // Return the testimonial object, not the wrapper
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
   * Deletes a testimonial by ID
   * @param id - The testimonial ID to delete
   * @returns Promise<boolean> - True if deletion was successful
   */
  async deleteTestimonial(id: string): Promise<boolean> {
    try {
      const { token } = await authStore.getToken();
      const url = `${this.server_addr}/${id}`;

      const response = await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        // Remove the testimonial from local state
        runInAction(() => {
          if (this.testimonials) {
            this.testimonials = this.testimonials.filter(
              (testimonial) => testimonial.id !== id
            );
          }
          // Clear the current testimonial if it's the one being deleted
          if (this.testimonial?.id === id) {
            this.testimonial = null;
          }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      throw error;
    }
  }

  /**
   * Gets artifacts that were created from multiple testimonials
   * (content_generation, text_polishing, translation)
   */
  getMultiTestimonialArtifacts() {
    if (!this.testimonials) return [];

    const multiTypes = ["content_generation", "text_polishing", "translation"];
    const allArtifacts = this.testimonials.flatMap((testimonial) =>
      (testimonial.artifacts || []).filter(
        (artifact) =>
          multiTypes.includes(artifact.processing_type) &&
          artifact.data &&
          typeof artifact.data === "object" &&
          "testimonial_ids" in artifact.data &&
          Array.isArray((artifact.data as any).testimonial_ids) &&
          (artifact.data as any).testimonial_ids.length > 0
      )
    );

    // Remove duplicates by ID
    const uniqueArtifacts = allArtifacts.filter(
      (artifact, index, self) =>
        index === self.findIndex((a) => a.id === artifact.id)
    );

    return uniqueArtifacts;
  }

  /**
   * Invalidates cached testimonial data to force refetch
   * @param testimonialId - Optional specific testimonial ID to invalidate, if not provided clears all
   */
  invalidateCache(testimonialId?: string) {
    runInAction(() => {
      if (testimonialId) {
        // Clear specific testimonial from cache
        if (this.testimonial?.id === testimonialId) {
          console.log("[TestimonialManager] Invalidating cached testimonial:", testimonialId);
          this.testimonial = null;
        }
        // Clear testimonials list to force refetch with updated artifacts
        console.log("[TestimonialManager] Invalidating testimonials list cache");
        this.testimonials = null;
        this.testimonialsIncludeArtifacts = false;
      } else {
        // Clear all cache
        console.log("[TestimonialManager] Clearing all cached testimonial data");
        this.testimonial = null;
        this.testimonials = null;
        this.testimonialsIncludeArtifacts = false;
      }
    });
  }

  /**
   * Creates a video testimonial with upload and processing
   * @param params - Testimonial creation parameters
   * @returns Promise<{testimonial_id: string, job_id: string}>
   */
  async createVideoTestimonial(params: {
    workspace_id: string;
    collection_id?: string;
    author_name: string;
    author_email: string;
    author_company?: string;
    rating: number;
    content?: string;
    videoBlob: Blob;
  }): Promise<{ testimonial_id?: string; job_id?: string }> {
    try {
      const formData = new FormData();
      formData.append(
        "video",
        params.videoBlob,
        `testimonial_${Date.now()}.${params.videoBlob.type.includes("webm") ? "webm" : "mp4"}`
      );
      formData.append("author_name", params.author_name);
      formData.append("author_email", params.author_email);
      formData.append("author_company", params.author_company || "");
      formData.append("rating", params.rating.toString());
      formData.append("content", params.content || "");
      formData.append("collection_method", "form");

      if (params.collection_id) {
        formData.append("collection_id", params.collection_id);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/collection/workspaces/${params.workspace_id}/testimonials/upload/video/queue`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed with status ${response.status}`
        );
      }

      const result = await response.json();

      return {
        testimonial_id: result.testimonial_id,
        job_id: result.job_id,
      };
    } catch (error) {
      console.error("Error creating video testimonial:", error);
      throw error;
    }
  }
}
