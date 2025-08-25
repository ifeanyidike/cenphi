import { oauthService } from './oauthService';

export interface LinkedInShareData {
  content: string;
  post_type: 'text' | 'image' | 'video';
  media_urls?: string[];
  hashtags?: string[];
  testimonial_id?: string;
}

export interface LinkedInShareResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class LinkedInShareService {
  private server: string;

  constructor() {
    // Use a type assertion to handle Vite's import.meta.env
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Vite provides import.meta.env at runtime
    this.server = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  }

  /**
   * Share a testimonial to LinkedIn
   */
  async shareTestimonial(data: LinkedInShareData): Promise<LinkedInShareResponse> {
    try {
      // First check if LinkedIn is connected
      const isConnected = await this.checkLinkedInConnection();
      if (!isConnected) {
        return {
          success: false,
          message: 'LinkedIn not connected. Please connect your LinkedIn account first.',
          error: 'NOT_CONNECTED'
        };
      }

      const workspaceId = this.getWorkspaceId();
      const authToken = this.getAuthToken();

      if (!workspaceId || !authToken) {
        return {
          success: false,
          message: 'Authentication required. Please log in again.',
          error: 'AUTH_REQUIRED'
        };
      }

      const response = await fetch(`${this.server}/api/workspaces/${workspaceId}/social/linkedin/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Failed to share to LinkedIn: ${response.statusText}`,
          error: errorData.error || 'API_ERROR'
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        message: 'Testimonial shared successfully to LinkedIn!',
        data: result
      };
    } catch (error) {
      console.error('Error sharing to LinkedIn:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to share to LinkedIn',
        error: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Check if LinkedIn is connected
   */
  async checkLinkedInConnection(): Promise<boolean> {
    try {
      // This would typically check the backend for connection status
      // For now, we'll use a simple check
      const token = localStorage.getItem('linkedin_access_token');
      return !!token;
    } catch (error) {
      console.error('Error checking LinkedIn connection:', error);
      return false;
    }
  }

  /**
   * Connect to LinkedIn
   */
  async connectLinkedIn(): Promise<LinkedInShareResponse> {
    try {
      await oauthService.connectProvider('linkedin');
      return {
        success: true,
        message: 'LinkedIn connected successfully!'
      };
    } catch (error) {
      console.error('Error connecting to LinkedIn:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to LinkedIn',
        error: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Get LinkedIn connection status
   */
  async getConnectionStatus(): Promise<{ isConnected: boolean; expiresAt?: Date }> {
    try {
      const token = localStorage.getItem('linkedin_access_token');
      const expiresAt = localStorage.getItem('linkedin_token_expires');
      
      if (!token) {
        return { isConnected: false };
      }

      if (expiresAt) {
        const expiryDate = new Date(expiresAt);
        if (expiryDate < new Date()) {
          // Token expired, clear it
          localStorage.removeItem('linkedin_access_token');
          localStorage.removeItem('linkedin_token_expires');
          return { isConnected: false };
        }
      }

      return { 
        isConnected: true, 
        expiresAt: expiresAt ? new Date(expiresAt) : undefined 
      };
    } catch (error) {
      console.error('Error getting LinkedIn connection status:', error);
      return { isConnected: false };
    }
  }

  /**
   * Disconnect from LinkedIn
   */
  async disconnectLinkedIn(): Promise<LinkedInShareResponse> {
    try {
      // Clear local storage
      localStorage.removeItem('linkedin_access_token');
      localStorage.removeItem('linkedin_token_expires');
      localStorage.removeItem('linkedin_refresh_token');
      
      return {
        success: true,
        message: 'LinkedIn disconnected successfully!'
      };
    } catch (error) {
      console.error('Error disconnecting from LinkedIn:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to disconnect from LinkedIn',
        error: 'DISCONNECTION_ERROR'
      };
    }
  }

  /**
   * Get workspace ID from URL or localStorage
   */
  private getWorkspaceId(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('workspace_id') || localStorage.getItem('workspace_id') || '';
  }

  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  /**
   * Generate hashtags from testimonial tags
   */
  generateHashtags(tags?: string[]): string[] {
    if (!tags || tags.length === 0) {
      return ['testimonial', 'customerfeedback', 'successstory'];
    }
    
    return tags.map(tag => tag.replace(/\s+/g, '').toLowerCase());
  }

  /**
   * Format content for LinkedIn
   */
  formatContent(content: string, authorName?: string, authorCompany?: string, rating?: number, hashtags?: string[]): string {
    let formattedContent = content;

    // Add author info if available
    if (authorName) {
      formattedContent += `\n\n- ${authorName}`;
      if (authorCompany) {
        formattedContent += `, ${authorCompany}`;
      }
    }

    // Add rating if available
    if (rating) {
      const stars = '⭐'.repeat(rating);
      formattedContent += `\n${stars}`;
    }

    // Add hashtags
    const allHashtags = [...(hashtags || []), 'testimonial', 'customerfeedback'];
    if (allHashtags.length > 0) {
      formattedContent += `\n\n${allHashtags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ')}`;
    }

    return formattedContent;
  }
}

export const linkedInShareService = new LinkedInShareService();
