// repositories/managers/SocialManager.ts

import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { authStore } from "@/stores/authStore";

export interface SocialAccount {
  id: string;
  workspace_id: string;
  user_id: string;
  platform: string;
  platform_user_id: string;
  platform_username?: string;
  platform_email?: string;
  account_name?: string;
  account_type?: string;
  status: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  workspace_id: string;
  testimonial_id?: string;
  testimonial_ids: string[];
  social_account_id: string;
  content: string;
  post_type: string;
  media_urls: string[];
  hashtags: string[];
  platform: string;
  platform_post_id?: string;
  platform_url?: string;
  status: string;
  scheduled_at?: string;
  published_at?: string;
  ai_best_time?: string;
  ai_best_time_score?: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  retry_count: number;
  max_retries: number;
  last_metrics_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePostRequest {
  content: string;
  testimonial_id?: string;
  testimonial_ids?: string[];
  social_account_id?: string;
  post_type?: string;
  media_urls?: string[];
  hashtags?: string[];
  scheduled_at?: string;
  ai_pick_best_time?: boolean;
}

export interface PostAnalytics {
  post_id: string;
  platform: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  engagement: {
    total_engagement: number;
    engagement_rate: number;
  };
  last_updated: string;
}

export class SocialManager {
  accounts: SocialAccount[] = [];
  posts: SocialPost[] = [];
  analytics: Map<string, PostAnalytics> = new Map();
  isLoading: boolean = false;
  error: string | null = null;

  private server_addr = import.meta.env.VITE_API_URL;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Get connected social accounts for the workspace
   */
  async getAccounts(workspaceId: string): Promise<SocialAccount[]> {
    this.isLoading = true;
    this.error = null;

    try {
      const { token } = await authStore.getToken();
      const response = await axios.get(
        `${this.server_addr}/workspaces/${workspaceId}/social/accounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      runInAction(() => {
        this.accounts = response.data.data || [];
        this.isLoading = false;
      });

      return this.accounts;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Failed to fetch social accounts";
        this.isLoading = false;
      });
      throw error;
    }
  }

  /**
   * Get OAuth authorization URL for connecting social accounts
   */
  async getAuthURL(workspaceId: string, platform: string, returnUrl?: string): Promise<string> {
    try {
      const { token } = await authStore.getToken();

      // Build URL with optional return_url parameter
      let url = `${this.server_addr}/workspaces/${workspaceId}/social/auth/${platform}`;
      if (returnUrl) {
        url += `?return_url=${encodeURIComponent(returnUrl)}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data.auth_url;
    } catch (error: any) {
      this.error = error.response?.data?.message || "Failed to get authorization URL";
      throw error;
    }
  }

  /**
   * Create a new social media post
   */
  async createPost(
    workspaceId: string,
    platform: string,
    postData: CreatePostRequest
  ): Promise<SocialPost> {
    this.isLoading = true;
    this.error = null;

    try {
      const { token } = await authStore.getToken();
      const response = await axios.post(
        `${this.server_addr}/workspaces/${workspaceId}/social/${platform}/posts`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const newPost = response.data.data;

      runInAction(() => {
        this.posts.unshift(newPost);
        this.isLoading = false;
      });

      return newPost;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Failed to create social post";
        this.isLoading = false;
      });
      throw error;
    }
  }

  /**
   * Get social media posts for the workspace
   */
  async getPosts(workspaceId: string, limit: number = 20, offset: number = 0): Promise<SocialPost[]> {
    this.isLoading = true;
    this.error = null;

    try {
      const { token } = await authStore.getToken();
      const response = await axios.get(
        `${this.server_addr}/workspaces/${workspaceId}/social/posts?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      runInAction(() => {
        this.posts = response.data.data || [];
        this.isLoading = false;
      });

      return this.posts;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Failed to fetch social posts";
        this.isLoading = false;
      });
      throw error;
    }
  }

  /**
   * Publish a post immediately
   */
  async publishPost(postId: string): Promise<void> {
    try {
      const { token } = await authStore.getToken();
      await axios.post(
        `${this.server_addr}/social/posts/${postId}/publish`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      runInAction(() => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.status = "published";
          post.published_at = new Date().toISOString();
        }
      });
    } catch (error: any) {
      this.error = error.response?.data?.message || "Failed to publish post";
      throw error;
    }
  }

  /**
   * Schedule a post for later publishing
   */
  async schedulePost(
    postId: string,
    scheduledAt?: string,
    aiPickBestTime?: boolean
  ): Promise<void> {
    try {
      const { token } = await authStore.getToken();
      const payload: any = {};

      if (scheduledAt) payload.scheduled_at = scheduledAt;
      if (aiPickBestTime) payload.ai_pick_best_time = aiPickBestTime;

      await axios.post(
        `${this.server_addr}/social/posts/${postId}/schedule`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state
      runInAction(() => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.status = "scheduled";
          if (scheduledAt) post.scheduled_at = scheduledAt;
        }
      });
    } catch (error: any) {
      this.error = error.response?.data?.message || "Failed to schedule post";
      throw error;
    }
  }

  /**
   * Get analytics for a specific post
   */
  async getPostAnalytics(postId: string): Promise<PostAnalytics> {
    try {
      const { token } = await authStore.getToken();
      const response = await axios.get(
        `${this.server_addr}/social/posts/${postId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const analytics = response.data.data;

      runInAction(() => {
        this.analytics.set(postId, analytics);
      });

      return analytics;
    } catch (error: any) {
      this.error = error.response?.data?.message || "Failed to fetch post analytics";
      throw error;
    }
  }

  /**
   * Sync metrics for a specific post
   */
  async syncPostMetrics(postId: string): Promise<void> {
    try {
      const { token } = await authStore.getToken();
      await axios.post(
        `${this.server_addr}/social/posts/${postId}/sync-metrics`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      this.error = error.response?.data?.message || "Failed to sync post metrics";
      throw error;
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(
    postId: string,
    updateData: Partial<CreatePostRequest>
  ): Promise<SocialPost> {
    this.isLoading = true;
    this.error = null;

    try {
      const { token } = await authStore.getToken();
      const response = await axios.put(
        `${this.server_addr}/social/posts/${postId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedPost = response.data.data;

      runInAction(() => {
        const index = this.posts.findIndex(p => p.id === postId);
        if (index !== -1) {
          this.posts[index] = updatedPost;
        }
        this.isLoading = false;
      });

      return updatedPost;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Failed to update post";
        this.isLoading = false;
      });
      throw error;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const { token } = await authStore.getToken();
      await axios.delete(
        `${this.server_addr}/social/posts/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      runInAction(() => {
        this.posts = this.posts.filter(p => p.id !== postId);
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Failed to delete post";
        this.isLoading = false;
      });
      throw error;
    }
  }

  /**
   * Get posts filtered by testimonial ID
   */
  getPostsByTestimonial(testimonialId: string): SocialPost[] {
    return this.posts.filter(
      post =>
        post.testimonial_id === testimonialId ||
        post.testimonial_ids.includes(testimonialId)
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.accounts = [];
    this.posts = [];
    this.analytics.clear();
    this.error = null;
    this.isLoading = false;
  }
}

export const socialManager = new SocialManager();