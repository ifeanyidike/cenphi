// repo/managers/public_share_manager.ts
import { makeAutoObservable, runInAction } from "mobx";
import { authStore } from "@/stores/authStore";

const serverAddr = import.meta.env.VITE_API_URL;

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
  custom_branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
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
  expires_at?: string | null;
  custom_branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
}

export interface TrackEventRequest {
  event_type: string;
  visitor_id?: string;
  referrer?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

class PublicShareManager {
  shares: PublicShare[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Create a new public share
  async createShare(request: CreateShareRequest): Promise<PublicShare | null> {
    this.loading = true;
    this.error = null;

    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(`${serverAddr}/shares`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to create share");
      }

      const share = await response.json();

      runInAction(() => {
        this.shares.push(share);
        this.loading = false;
      });

      return share;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to create share";
        this.loading = false;
      });
      console.error("Create share error:", error);
      return null;
    }
  }

  // Get share by ID
  async getShare(shareId: string): Promise<PublicShare | null> {
    this.loading = true;
    this.error = null;

    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(`${serverAddr}/shares/${shareId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get share");
      }

      const share = await response.json();

      runInAction(() => {
        this.loading = false;
      });

      return share;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to get share";
        this.loading = false;
      });
      console.error("Get share error:", error);
      return null;
    }
  }

  // Get shares for workspace
  async getWorkspaceShares(workspaceId: string): Promise<PublicShare[]> {
    this.loading = true;
    this.error = null;

    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(
        `${serverAddr}/workspaces/${workspaceId}/shares`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get workspace shares");
      }

      const shares = await response.json();

      runInAction(() => {
        this.shares = shares;
        this.loading = false;
      });

      return shares;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to get workspace shares";
        this.loading = false;
      });
      console.error("Get workspace shares error:", error);
      return [];
    }
  }

  // Get shares for testimonial
  async getTestimonialShares(testimonialId: string): Promise<PublicShare[]> {
    this.loading = true;
    this.error = null;

    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(
        `${serverAddr}/testimonials/${testimonialId}/shares`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get testimonial shares");
      }

      const shares = await response.json();

      runInAction(() => {
        this.loading = false;
      });

      return shares;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to get testimonial shares";
        this.loading = false;
      });
      console.error("Get testimonial shares error:", error);
      return [];
    }
  }

  // Get shares for artifact
  async getArtifactShares(artifactId: string): Promise<PublicShare[]> {
    this.loading = true;
    this.error = null;

    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(
        `${serverAddr}/artifacts/${artifactId}/shares`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get artifact shares");
      }

      const shares = await response.json();

      runInAction(() => {
        this.loading = false;
      });

      return shares;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to get artifact shares";
        this.loading = false;
      });
      console.error("Get artifact shares error:", error);
      return [];
    }
  }

  // Update share
  async updateShare(
    shareId: string,
    updates: Partial<PublicShare>
  ): Promise<PublicShare | null> {
    this.loading = true;
    this.error = null;

    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(`${serverAddr}/shares/${shareId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update share");
      }

      const share = await response.json();

      runInAction(() => {
        const index = this.shares.findIndex((s) => s.id === shareId);
        if (index !== -1) {
          this.shares[index] = share;
        }
        this.loading = false;
      });

      return share;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to update share";
        this.loading = false;
      });
      console.error("Update share error:", error);
      return null;
    }
  }

  // Delete share
  async deleteShare(shareId: string): Promise<boolean> {
    this.loading = true;
    this.error = null;

    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(`${serverAddr}/shares/${shareId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete share");
      }

      runInAction(() => {
        this.shares = this.shares.filter((s) => s.id !== shareId);
        this.loading = false;
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to delete share";
        this.loading = false;
      });
      console.error("Delete share error:", error);
      return false;
    }
  }

  // Get share metrics
  async getMetrics(shareId: string): Promise<PublicShareMetrics | null> {
    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(`${serverAddr}/shares/${shareId}/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get metrics");
      }

      const metrics = await response.json();
      return metrics;
    } catch (error) {
      console.error("Get metrics error:", error);
      return null;
    }
  }

  // Get widget embed code
  async getWidgetEmbedCode(shareId: string): Promise<string | null> {
    try {
      const response = await fetch(`${serverAddr}/widget/embed/${shareId}`);

      if (!response.ok) {
        throw new Error("Failed to get widget embed code");
      }

      const embedCode = await response.text();
      return embedCode;
    } catch (error) {
      console.error("Get widget embed code error:", error);
      return null;
    }
  }

  // Track event (public - no auth required)
  async trackEvent(
    shareId: string,
    request: TrackEventRequest
  ): Promise<boolean> {
    try {
      const response = await fetch(`${serverAddr}/share/${shareId}/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      return response.ok;
    } catch (error) {
      console.error("Track event error:", error);
      return false;
    }
  }
}

export const publicShareManager = new PublicShareManager();
