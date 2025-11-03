// services/showcaseService.ts
import { authStore } from "@/stores/authStore";
import { Workspace, TestimonialArtifact } from "@/types/testimonial";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface ShowcaseSettings {
  enabled: boolean;
  slug?: string;
  settings?: Record<string, any>;
}

export interface ShowcaseResponse {
  workspace: Workspace;
  artifacts: TestimonialArtifact[];
}

export class ShowcaseService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { token } = await authStore.getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async updateShowcaseSettings(
    workspaceId: string,
    settings: ShowcaseSettings
  ): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/showcase-settings`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(settings),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update showcase settings");
    }

    return response.json();
  }

  async checkSlugAvailability(slug: string): Promise<boolean> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/showcase/check-slug?slug=${encodeURIComponent(
        slug
      )}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to check slug availability");
    }

    const data = await response.json();
    return data.available;
  }

  async getPublicShowcase(slug: string): Promise<ShowcaseResponse> {
    const response = await fetch(`${API_BASE_URL}/public/showcase/${slug}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Showcase not found");
    }

    return response.json();
  }
}

export const showcaseService = new ShowcaseService();
