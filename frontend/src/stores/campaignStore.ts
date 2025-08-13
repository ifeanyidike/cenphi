// frontend/src/stores/campaignStore.ts
import { makeAutoObservable, runInAction } from "mobx";
import { useApiClient } from "../services/apiClient";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  brand_id: string;
  widget_config: {
    primaryColor: string;
    buttonText: string;
    position: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  campaign_id: string;
  author_id: string;
  title: string;
  raw_content: string;
  polished_content: string;
  status: string;
  media_type: string;
  raw_media_url: string;
  processed_media_url: string;
  transcript: string;
  sentiment_score: number;
  sentiment_analysis: any;
  highlights: any;
  tags: string[];
  created_at: string;
  updated_at: string;
  author?: {
    name: string;
    email: string;
    company: string;
    position: string;
  };
}

class CampaignStore {
  campaigns: Campaign[] = [];
  currentCampaign: Campaign | null = null;
  testimonials: Record<string, Testimonial[]> = {};
  isLoading: boolean = false;
  error: string | null = null;
  apiClient = useApiClient();

  constructor() {
    makeAutoObservable(this);
  }

  // Reset store state
  reset() {
    this.campaigns = [];
    this.currentCampaign = null;
    this.testimonials = {};
    this.isLoading = false;
    this.error = null;
  }

  // Fetch all campaigns
  async fetchCampaigns() {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await this.apiClient.get<Campaign[]>("/api/campaigns");

      runInAction(() => {
        this.campaigns = data;
        this.isLoading = false;
      });

      return data;
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to fetch campaigns";
        this.isLoading = false;
      });

      throw err;
    }
  }

  // Fetch a single campaign
  async fetchCampaign(id: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await this.apiClient.get<Campaign>(`/api/campaigns/${id}`);

      runInAction(() => {
        this.currentCampaign = data;
        this.isLoading = false;
      });

      return data;
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to fetch campaign";
        this.isLoading = false;
      });

      throw err;
    }
  }

  // Fetch testimonials for a campaign
  async fetchTestimonials(campaignId: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await this.apiClient.get<Testimonial[]>(
        `/api/campaigns/${campaignId}/testimonials`
      );

      runInAction(() => {
        this.testimonials[campaignId] = data;
        this.isLoading = false;
      });

      return data;
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to fetch testimonials";
        this.isLoading = false;
      });

      throw err;
    }
  }

  // Create a new campaign
  async createCampaign(campaign: Partial<Campaign>) {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await this.apiClient.post<Campaign>(
        "/api/campaigns",
        campaign
      );

      runInAction(() => {
        this.campaigns.push(data);
        this.isLoading = false;
      });

      return data;
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to create campaign";
        this.isLoading = false;
      });

      throw err;
    }
  }

  // Update a campaign
  async updateCampaign(id: string, campaign: Partial<Campaign>) {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await this.apiClient.put<Campaign>(
        `/api/campaigns/${id}`,
        campaign
      );

      runInAction(() => {
        // Update in campaigns list
        const index = this.campaigns.findIndex((c) => c.id === id);
        if (index !== -1) {
          this.campaigns[index] = data;
        }

        // Update current campaign if it's the same
        if (this.currentCampaign && this.currentCampaign.id === id) {
          this.currentCampaign = data;
        }

        this.isLoading = false;
      });

      return data;
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to update campaign";
        this.isLoading = false;
      });

      throw err;
    }
  }

  // Delete a campaign
  async deleteCampaign(id: string) {
    this.isLoading = true;
    this.error = null;

    try {
      await this.apiClient.del(`/api/campaigns/${id}`);

      runInAction(() => {
        this.campaigns = this.campaigns.filter((c) => c.id !== id);

        // Clear current campaign if it's the same
        if (this.currentCampaign && this.currentCampaign.id === id) {
          this.currentCampaign = null;
        }

        // Remove testimonials
        delete this.testimonials[id];

        this.isLoading = false;
      });

      return true;
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : "Failed to delete campaign";
        this.isLoading = false;
      });

      throw err;
    }
  }
}

// Create singleton instance
const campaignStore = new CampaignStore();

// Hook to use the store
export const useCampaignStore = () => campaignStore;

export default campaignStore;
