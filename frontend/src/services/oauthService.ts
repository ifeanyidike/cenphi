// import { auth } from "@/config/firebase";

export interface OAuthProvider {
  name: string;
  connected: boolean;
  expiresAt?: Date;
  displayName: string;
  icon: string;
  color: string;
}

export interface ConnectionStatus {
  success: boolean;
  message: string;
  provider: string;
  expiresAt?: Date;
}

class OAuthService {
  private server: string;

  constructor() {
    // Use a type assertion to handle Vite's import.meta.env
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Vite provides import.meta.env at runtime
    this.server = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  }

  /**
   * Connect to a provider (real implementation)
   */
  async connectProvider(provider: string): Promise<ConnectionStatus> {
    try {
      // Get the OAuth URL
      const authURL = await this.getAuthURL(provider);
      
      if (provider === 'google-drive' || provider === 'linkedin') {
        // For Google Drive and LinkedIn, redirect the current window to OAuth
        window.location.href = authURL;
        return {
          success: true,
          message: `Redirecting to ${provider} OAuth...`,
          provider: provider
        };
      } else {
        // For other providers, use popup window
        const authWindow = window.open(authURL, 'oauth', 'width=600,height=700');
        
        return new Promise((resolve, reject) => {
          const checkClosed = setInterval(() => {
            if (authWindow?.closed) {
              clearInterval(checkClosed);
              // Check if connection was successful by polling status
              this.checkConnectionStatus(provider).then(resolve).catch(reject);
            }
          }, 1000);

          // Listen for OAuth callback message
          const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'OAUTH_SUCCESS' && event.data.provider === provider) {
              clearInterval(checkClosed);
              window.removeEventListener('message', handleMessage);
              authWindow?.close();
              
              resolve({
                success: true,
                message: `Successfully connected to ${provider}`,
                provider,
                expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
              });
            } else if (event.data.type === 'OAUTH_ERROR') {
              clearInterval(checkClosed);
              window.removeEventListener('message', handleMessage);
              authWindow?.close();
              reject(new Error(event.data.error || 'OAuth failed'));
            }
          };

          window.addEventListener('message', handleMessage);
        });
      }
    } catch (error) {
      console.error('Error connecting to provider:', error);
      throw error;
    }
  }

  /**
   * Disconnect from a provider
   */
  async disconnectProvider(provider: string): Promise<void> {
    try {
      if (provider === 'google-drive') {
        // For Google Drive, we need to clear the connection status locally
        // since there's no backend disconnect endpoint implemented yet
        console.log('Disconnecting Google Drive - clearing local connection status');
        return;
      }
      
      // For other providers, try the backend endpoint
      const response = await fetch(`${this.server}/api/social/accounts/${provider}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to disconnect: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error disconnecting from provider:', error);
      throw error;
    }
  }

  // ===== GOOGLE DRIVE FUNCTIONS (FOR IMPORTING TESTIMONIALS) =====

  /**
   * Get Google Drive files (real API implementation)
   */
  async getGoogleDriveFiles(): Promise<any[]> {
    try {
      const response = await fetch(`${this.server}/api/google/workspaces/6fe5d4ae-3627-4103-af42-39fb40cc0a12/drive/files`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Google Drive not connected. Please connect your Google Drive account first.');
        }
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files || data;
    } catch (error) {
      console.error('Error fetching Google Drive files:', error);
      throw error;
    }
  }

  /**
   * Import files from Google Drive (real API implementation)
   */
  async importGoogleDriveFiles(fileIds: string[], workspaceId?: string): Promise<any> {
    try {
      const requestBody = {
        file_ids: fileIds,
        importType: 'google_drive'
      };
      
      console.log('Importing Google Drive files:', {
        url: `${this.server}/api/workspaces/${workspaceId || '6fe5d4ae-3627-4103-af42-39fb40cc0a12'}/testimonials/import/google-drive`,
        body: requestBody
      });

      const response = await fetch(`${this.server}/api/workspaces/${workspaceId || '6fe5d4ae-3627-4103-af42-39fb40cc0a12'}/testimonials/import/google-drive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Import response status:', response.status);
      console.log('Import response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Import error response:', errorText);
        
        // Handle specific error cases
        if (response.status === 401) {
          // Token expired or invalid - user needs to re-authenticate
          throw new Error('Google Drive authentication expired. Please reconnect your account.');
        }
        
        throw new Error(`Failed to import files: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Import success response:', data);
      
      return {
        success: true,
        message: `Successfully imported ${fileIds.length} files`,
        importedFiles: fileIds.length,
        data
      };
    } catch (error) {
      console.error('Error importing Google Drive files:', error);
      throw error;
    }
  }

  /**
   * Get Google Drive OAuth URL
   */
  async getGoogleDriveAuthURL(workspaceId: string = '6fe5d4ae-3627-4103-af42-39fb40cc0a12'): Promise<string> {
    try {
      const response = await fetch(`${this.server}/api/google/workspaces/${workspaceId}/drive/auth`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get Google Drive auth URL: ${response.statusText}`);
      }

      const data = await response.json();
      return data.auth_url;
    } catch (error) {
      console.error('Error getting Google Drive auth URL:', error);
      throw error;
    }
  }

  /**
   * Check Google Drive connection status
   */
  async checkGoogleDriveConnectionStatus(workspaceId: string = '6fe5d4ae-3627-4103-af42-39fb40cc0a12'): Promise<ConnectionStatus> {
    try {
      const response = await fetch(`${this.server}/api/google/workspaces/${workspaceId}/drive/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            message: 'Google Drive authentication expired',
            provider: 'google-drive'
          };
        }
        throw new Error(`Failed to check Google Drive status: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: data.connected,
        message: data.message,
        provider: 'google-drive',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
      };
    } catch (error) {
      console.error('Error checking Google Drive connection status:', error);
      return {
        success: false,
        message: 'Google Drive not connected',
        provider: 'google-drive'
      };
    }
  }

  // ===== LINKEDIN FUNCTIONS (FOR PUBLISHING TESTIMONIALS) =====

  /**
   * Publish testimonial to LinkedIn (real API implementation)
   */
  async publishLinkedInTestimonial(testimonialData: {
    type: 'recommendation' | 'endorsement' | 'company_testimonial';
    recipientId: string;
    content: string;
    relationship?: string;
    skills?: string[];
    companyId?: string;
    visibility?: 'public' | 'connections' | 'private';
  }): Promise<any> {
    try {
      const response = await fetch(`${this.server}/api/social/linkedin/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testimonialData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('LinkedIn not connected. Please connect your LinkedIn account first.');
        }
        throw new Error(`Failed to publish testimonial: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Testimonial published successfully',
        data
      };
    } catch (error) {
      console.error('Error publishing LinkedIn testimonial:', error);
      throw error;
    }
  }

  /**
   * Get LinkedIn connections for publishing testimonials
   */
  async getLinkedInConnections(): Promise<any[]> {
    try {
      const response = await fetch(`${this.server}/api/social/linkedin/connections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('LinkedIn not connected. Please connect your LinkedIn account first.');
        }
        throw new Error(`Failed to fetch connections: ${response.statusText}`);
      }

      const data = await response.json();
      return data.connections || data;
    } catch (error) {
      console.error('Error fetching LinkedIn connections:', error);
      throw error;
    }
  }

  /**
   * Get LinkedIn companies/pages for publishing testimonials
   */
  async getLinkedInCompanies(): Promise<any[]> {
    try {
      const response = await fetch(`${this.server}/api/social/linkedin/companies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('LinkedIn not connected. Please connect your LinkedIn account first.');
        }
        throw new Error(`Failed to fetch companies: ${response.statusText}`);
      }

      const data = await response.json();
      return data.companies || data;
    } catch (error) {
      console.error('Error fetching LinkedIn companies:', error);
      throw error;
    }
  }

  /**
   * Get LinkedIn skills for endorsements
   */
  async getLinkedInSkills(): Promise<any[]> {
    try {
      const response = await fetch(`${this.server}/api/social/linkedin/skills`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('LinkedIn not connected. Please connect your LinkedIn account first.');
        }
        throw new Error(`Failed to fetch skills: ${response.statusText}`);
      }

      const data = await response.json();
      return data.skills || data;
    } catch (error) {
      console.error('Error fetching LinkedIn skills:', error);
      throw error;
    }
  }

  /**
   * Draft a testimonial for LinkedIn (save without publishing)
   */
  async draftLinkedInTestimonial(testimonialData: {
    type: 'recommendation' | 'endorsement' | 'company_testimonial';
    recipientId: string;
    content: string;
    relationship?: string;
    skills?: string[];
    companyId?: string;
    visibility?: 'public' | 'connections' | 'private';
  }): Promise<any> {
    try {
      const response = await fetch(`${this.server}/api/social/linkedin/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testimonialData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('LinkedIn not connected. Please connect your LinkedIn account first.');
        }
        throw new Error(`Failed to save draft: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Draft saved successfully',
        data
      };
    } catch (error) {
      console.error('Error saving LinkedIn draft:', error);
      throw error;
    }
  }

  /**
   * Get drafted testimonials
   */
  async getLinkedInDrafts(): Promise<any[]> {
    try {
      const response = await fetch(`${this.server}/api/social/linkedin/drafts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('LinkedIn not connected. Please connect your LinkedIn account first.');
        }
        throw new Error(`Failed to fetch drafts: ${response.statusText}`);
      }

      const data = await response.json();
      return data.drafts || data;
    } catch (error) {
      console.error('Error fetching LinkedIn drafts:', error);
      throw error;
    }
  }

  // ===== GENERIC AUTH FUNCTIONS =====

  /**
   * Override getAuthURL to handle Google Drive specifically
   */
  async getAuthURL(provider: string, workspaceId: string = '6fe5d4ae-3627-4103-af42-39fb40cc0a12'): Promise<string> {
    if (provider === 'google-drive') {
      return this.getGoogleDriveAuthURL(workspaceId);
    }
    
    // Use the correct backend endpoint for social platforms
    try {
      const response = await fetch(`${this.server}/api/workspaces/${workspaceId}/social/auth/${provider}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get auth URL: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.auth_url || data.auth_url || data.authURL || data;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw new Error('Failed to get authentication URL');
    }
  }

  /**
   * Override checkConnectionStatus to handle Google Drive specifically
   */
  async checkConnectionStatus(provider: string, workspaceId: string = '6fe5d4ae-3627-4103-af42-39fb40cc0a12'): Promise<ConnectionStatus> {
    if (provider === 'google-drive') {
      return this.checkGoogleDriveConnectionStatus(workspaceId);
    }
    
    // Use the correct backend endpoint for social platforms
    try {
      const response = await fetch(`${this.server}/api/workspaces/${workspaceId}/social/accounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check connection status: ${response.statusText}`);
      }

      const responseData = await response.json();
      const accounts = responseData.data || responseData;
      const connectedAccount = accounts?.find((account: any) => account.platform === provider);

      if (connectedAccount) {
        return {
          success: true,
          message: `${provider} connected successfully`,
          provider,
          expiresAt: new Date(connectedAccount.expiresAt || Date.now() + 3600000)
        };
      } else {
        throw new Error(`${provider} not connected`);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      throw error;
    }
  }
}

export const oauthService = new OAuthService(); 