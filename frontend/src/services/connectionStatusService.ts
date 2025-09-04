import { oauthService } from './oauthService';

export interface ConnectionStatus {
  isConnected: boolean;
  provider: string;
  accountEmail?: string;
  accountName?: string;
  lastSync?: Date;
  expiresAt?: Date;
}

class ConnectionStatusService {
  private connectionCache: Map<string, ConnectionStatus> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Load connection status from localStorage
   */
  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('connectionStatus');
      console.log('ConnectionStatusService: Loading from localStorage:', stored);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([provider, status]: [string, any]) => {
          this.connectionCache.set(provider, {
            ...status,
            lastSync: status.lastSync ? new Date(status.lastSync) : undefined,
            expiresAt: status.expiresAt ? new Date(status.expiresAt) : undefined,
          });
        });
        console.log('ConnectionStatusService: Loaded cache:', this.connectionCache);
      }
    } catch (error) {
      console.error('Error loading connection status from localStorage:', error);
    }
  }

  /**
   * Save connection status to localStorage
   */
  private saveToLocalStorage() {
    try {
      const data: Record<string, any> = {};
      this.connectionCache.forEach((status, provider) => {
        data[provider] = status;
      });
      localStorage.setItem('connectionStatus', JSON.stringify(data));
      console.log('ConnectionStatusService: Saved to localStorage:', data);
    } catch (error) {
      console.error('Error saving connection status to localStorage:', error);
    }
  }

  /**
   * Check if a provider is connected
   */
  async isConnected(provider: string): Promise<boolean> {
    const status = await this.getConnectionStatus(provider);
    return status.isConnected;
  }

  /**
   * Get connection status for a provider
   */
  async getConnectionStatus(provider: string): Promise<ConnectionStatus> {
    const now = Date.now();
    const cached = this.connectionCache.get(provider);
    const expiry = this.cacheExpiry.get(provider);

    // Return cached result if still valid
    if (cached && expiry && now < expiry) {
      console.log(`ConnectionStatusService: Returning cached status for ${provider}:`, cached);
      return cached;
    }

    try {
      let status: ConnectionStatus;

      switch (provider) {
        case 'google':
        case 'google_drive':
          status = await this.checkGoogleDriveStatus();
          break;
        case 'linkedin':
          status = await this.checkLinkedInStatus();
          break;
        default:
          status = {
            isConnected: false,
            provider,
          };
      }

      // Cache the result
      this.connectionCache.set(provider, status);
      this.cacheExpiry.set(provider, now + this.CACHE_DURATION);
      
      // Save to localStorage for persistence
      this.saveToLocalStorage();

      return status;
    } catch (error) {
      console.error(`Error checking ${provider} connection status:`, error);
      return {
        isConnected: false,
        provider,
      };
    }
  }

  /**
   * Check Google Drive connection status
   */
  private async checkGoogleDriveStatus(): Promise<ConnectionStatus> {
    try {
      // Always try to check via API first to get the most current status
      try {
        await oauthService.getGoogleDriveFiles();
        
        const status = {
          isConnected: true,
          provider: 'google_drive',
          accountEmail: 'Connected',
          lastSync: new Date(),
        };
        
        console.log('ConnectionStatusService: Google Drive is connected via API check');
        return status;
      } catch (error: any) {
        console.log('ConnectionStatusService: Google Drive API check failed:', error.message);
        
        if (error.message?.includes('not connected') || error.message?.includes('401') || error.message?.includes('authentication expired')) {
          return {
            isConnected: false,
            provider: 'google_drive',
          };
        }
        // If it's a different error, assume not connected
        return {
          isConnected: false,
          provider: 'google_drive',
        };
      }
    } catch (error: any) {
      console.error('Error in checkGoogleDriveStatus:', error);
      return {
        isConnected: false,
        provider: 'google_drive',
      };
    }
  }

  /**
   * Check LinkedIn connection status
   */
  private async checkLinkedInStatus(): Promise<ConnectionStatus> {
    try {
      // Try to check LinkedIn connection via API
      try {
        // For now, we'll check if there's a cached LinkedIn connection status
        // In the future, you can implement an actual API call to verify the connection
        const cached = this.connectionCache.get('linkedin');
        if (cached && cached.isConnected) {
          console.log('ConnectionStatusService: LinkedIn is connected (from cache)');
          return cached;
        }
        
        // If no cached status, assume not connected
        return {
          isConnected: false,
          provider: 'linkedin',
        };
      } catch (error: any) {
        console.log('ConnectionStatusService: LinkedIn API check failed:', error.message);
        
        if (error.message?.includes('not connected') || error.message?.includes('401') || error.message?.includes('authentication expired')) {
          return {
            isConnected: false,
            provider: 'linkedin',
          };
        }
        // If it's a different error, assume not connected
        return {
          isConnected: false,
          provider: 'linkedin',
        };
      }
    } catch (error: any) {
      console.error('Error in checkLinkedInStatus:', error);
      return {
        isConnected: false,
        provider: 'linkedin',
      };
    }
  }

  /**
   * Clear connection status cache
   */
  clearCache(provider?: string) {
    if (provider) {
      this.connectionCache.delete(provider);
      this.cacheExpiry.delete(provider);
    } else {
      this.connectionCache.clear();
      this.cacheExpiry.clear();
    }
    
    // Update localStorage
    this.saveToLocalStorage();
  }

  /**
   * Force refresh connection status (for testing)
   */
  async forceRefresh(provider: string): Promise<ConnectionStatus> {
    // Clear cache for this provider
    this.clearCache(provider);
    
    // Get fresh status
    return await this.getConnectionStatus(provider);
  }

  /**
   * Disconnect a provider (clear connection status)
   */
  disconnectProvider(provider: string) {
    // Clear the cache expiry so the disconnected status doesn't expire
    this.cacheExpiry.delete(provider);
    
    this.updateConnectionStatus(provider, {
      isConnected: false,
      provider,
    });
    
    // For Google Drive, also clear related providers
    if (provider === 'google_drive') {
      this.cacheExpiry.delete('google');
      this.updateConnectionStatus('google', {
        isConnected: false,
        provider: 'google',
      });
    }
    
    console.log(`ConnectionStatusService: Disconnected ${provider}`);
  }

  /**
   * Update connection status (called after successful OAuth)
   */
  updateConnectionStatus(provider: string, status: Partial<ConnectionStatus>) {
    const existing = this.connectionCache.get(provider) || {
      isConnected: false,
      provider,
    };

    const updated = { ...existing, ...status };
    this.connectionCache.set(provider, updated);
    
    // Only set expiry for connected status, not for disconnected status
    if (updated.isConnected) {
      this.cacheExpiry.set(provider, Date.now() + this.CACHE_DURATION);
    } else {
      // For disconnected status, remove expiry so it persists
      this.cacheExpiry.delete(provider);
    }
    
    console.log(`ConnectionStatusService: Updated ${provider} status:`, updated);
    
    // Save to localStorage for persistence
    this.saveToLocalStorage();
  }
}

export const connectionStatusService = new ConnectionStatusService();
