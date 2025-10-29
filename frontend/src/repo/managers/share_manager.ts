// repo/managers/share_manager.ts
import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { authStore } from "@/stores/authStore";

export interface PublicShare {
  id: string;
  workspace_id: string;
  share_type: "testimonial" | "artifact";
  testimonial_id?: string;
  artifact_id?: string;
  is_public: boolean;
  is_active: boolean;
  password_protected: boolean;
  expires_at?: string;
  custom_branding?: Record<string, any>;
  created_at: string;
  updated_at: string;
  metrics?: PublicShareMetrics;
}

export interface PublicShareMetrics {
  id: string;
  public_share_id: string;
  view_count: number;
  unique_visitor_count: number;
  play_count: number;
  download_count: number;
  copy_link_count: number;
  linkedin_share_count: number;
  twitter_share_count: number;
  facebook_share_count: number;
  whatsapp_share_count: number;
  email_share_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateShareRequest {
  workspace_id: string;
  share_type: "testimonial" | "artifact";
  testimonial_id?: string;
  artifact_id?: string;
  description?: string;
  expires_at?: string;
  custom_branding?: Record<string, any>;
}

export interface TrackEventRequest {
  event_type:
    | "view"
    | "play"
    | "download"
    | "copy_link"
    | "share_linkedin"
    | "share_twitter"
    | "share_facebook"
    | "share_whatsapp"
    | "share_email";
  visitor_id?: string;
  referrer?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

/**
 * Manages public share operations
 */
export class ShareManager {
  shares: PublicShare[] = [];
  currentShare: PublicShare | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  private baseUrl = import.meta.env.VITE_API_URL;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Get public share URL for displaying
   */
  getPublicShareUrl(shareId: string): string {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${appUrl}/share/${shareId}/view`;
  }

  /**
   * Create a new public share
   */
  async createShare(request: CreateShareRequest): Promise<PublicShare> {
    try {
      const { token } = await authStore.getToken();

      const response = await axios.post(
        `${this.baseUrl}/shares`,
        request,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        const share = response.data.share;
        runInAction(() => {
          this.shares.push(share);
        });
        return share;
      }

      throw new Error("Failed to create share");
    } catch (error: any) {
      console.error("Error creating share:", error);
      throw new Error(error.response?.data?.message || "Failed to create share");
    }
  }

  /**
   * Get share by ID
   */
  async getShare(shareId: string): Promise<PublicShare> {
    try {
      const { token } = await authStore.getToken();

      const response = await axios.get(
        `${this.baseUrl}/shares/${shareId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const share = response.data.share;
        runInAction(() => {
          this.currentShare = share;
        });
        return share;
      }

      throw new Error("Share not found");
    } catch (error: any) {
      console.error("Error fetching share:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch share");
    }
  }

  /**
   * Get all shares for a testimonial
   */
  async getTestimonialShares(testimonialId: string): Promise<PublicShare[]> {
    try {
      const { token } = await authStore.getToken();

      const response = await axios.get(
        `${this.baseUrl}/testimonials/${testimonialId}/shares`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const shares = response.data.shares || [];
        runInAction(() => {
          this.shares = shares;
        });
        return shares;
      }

      throw new Error("Failed to fetch shares");
    } catch (error: any) {
      console.error("Error fetching testimonial shares:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch testimonial shares"
      );
    }
  }

  /**
   * Get all shares for an artifact
   */
  async getArtifactShares(artifactId: string): Promise<PublicShare[]> {
    try {
      const { token } = await authStore.getToken();

      const response = await axios.get(
        `${this.baseUrl}/artifacts/${artifactId}/shares`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const shares = response.data.shares || [];
        runInAction(() => {
          this.shares = shares;
        });
        return shares;
      }

      throw new Error("Failed to fetch shares");
    } catch (error: any) {
      console.error("Error fetching artifact shares:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch artifact shares"
      );
    }
  }

  /**
   * Get or create share for testimonial
   * Returns existing active share or creates new one
   */
  async getOrCreateTestimonialShare(
    testimonialId: string,
    workspaceId: string
  ): Promise<PublicShare> {
    try {
      // Try to get existing shares
      const shares = await this.getTestimonialShares(testimonialId);

      // Find active, non-expired share
      const activeShare = shares.find(
        (share) =>
          share.is_active &&
          (!share.expires_at || new Date(share.expires_at) > new Date())
      );

      if (activeShare) {
        return activeShare;
      }

      // Create new share
      return await this.createShare({
        workspace_id: workspaceId,
        share_type: "testimonial",
        testimonial_id: testimonialId,
      });
    } catch (error: any) {
      console.error("Error getting or creating testimonial share:", error);
      throw error;
    }
  }

  /**
   * Get or create share for artifact
   */
  async getOrCreateArtifactShare(
    artifactId: string,
    workspaceId: string
  ): Promise<PublicShare> {
    try {
      // Try to get existing shares
      const shares = await this.getArtifactShares(artifactId);

      // Find active, non-expired share
      const activeShare = shares.find(
        (share) =>
          share.is_active &&
          (!share.expires_at || new Date(share.expires_at) > new Date())
      );

      if (activeShare) {
        return activeShare;
      }

      // Create new share
      return await this.createShare({
        workspace_id: workspaceId,
        share_type: "artifact",
        artifact_id: artifactId,
      });
    } catch (error: any) {
      console.error("Error getting or creating artifact share:", error);
      throw error;
    }
  }

  /**
   * Track a share event (public endpoint, no auth required)
   */
  async trackEvent(shareId: string, request: TrackEventRequest): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/share/${shareId}/track`,
        request,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error tracking event:", error);
      // Don't throw - tracking failures shouldn't break user experience
    }
  }

  /**
   * Get metrics for a share
   */
  async getMetrics(shareId: string): Promise<PublicShareMetrics> {
    try {
      const { token } = await authStore.getToken();

      const response = await axios.get(
        `${this.baseUrl}/shares/${shareId}/metrics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        return response.data.metrics;
      }

      throw new Error("Failed to fetch metrics");
    } catch (error: any) {
      console.error("Error fetching metrics:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch metrics");
    }
  }

  /**
   * Update share settings
   */
  async updateShare(
    shareId: string,
    updates: {
      is_active?: boolean;
      is_public?: boolean;
      expires_at?: string;
      custom_branding?: Record<string, any>;
    }
  ): Promise<PublicShare> {
    try {
      const { token } = await authStore.getToken();

      const response = await axios.put(
        `${this.baseUrl}/shares/${shareId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        const share = response.data.share;
        runInAction(() => {
          this.currentShare = share;
          // Update in shares array
          const index = this.shares.findIndex((s) => s.id === shareId);
          if (index !== -1) {
            this.shares[index] = share;
          }
        });
        return share;
      }

      throw new Error("Failed to update share");
    } catch (error: any) {
      console.error("Error updating share:", error);
      throw new Error(error.response?.data?.message || "Failed to update share");
    }
  }

  /**
   * Delete a share
   */
  async deleteShare(shareId: string): Promise<void> {
    try {
      const { token } = await authStore.getToken();

      await axios.delete(`${this.baseUrl}/shares/${shareId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      runInAction(() => {
        this.shares = this.shares.filter((s) => s.id !== shareId);
        if (this.currentShare?.id === shareId) {
          this.currentShare = null;
        }
      });
    } catch (error: any) {
      console.error("Error deleting share:", error);
      throw new Error(error.response?.data?.message || "Failed to delete share");
    }
  }
}

// Export singleton instance
export const shareManager = new ShareManager();
