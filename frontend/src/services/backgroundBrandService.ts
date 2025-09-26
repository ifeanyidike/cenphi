// services/backgroundBrandService.ts
import { authStore } from "@/stores/authStore";

export interface BrandExtractionResult {
  id: string;
  workspaceId: string;
  name?: string;
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
  industry?: string;
  description?: string;
  website?: string;
  socialMedia?: {
    [platform: string]: string;
  };
  extractedAt: string;
  status: "extracting" | "completed" | "error";
  confidence: number;
  error?: string;
}

export interface BrandExtractionOptions {
  websiteUrl?: string;
  companyName?: string;
  forceRefresh?: boolean;
  timeout?: number;
}

class BackgroundBrandService {
  private readonly baseUrl: string;
  private extractionCache = new Map<string, BrandExtractionResult>();
  private ongoingExtractions = new Set<string>();

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL;
  }

  /**
   * Start background brand extraction for a workspace
   */
  async startExtraction(
    workspaceId: string,
    options: BrandExtractionOptions = {}
  ): Promise<string> {
    const extractionId = `${workspaceId}-${Date.now()}`;

    if (this.ongoingExtractions.has(workspaceId)) {
      console.log(
        "Brand extraction already in progress for workspace:",
        workspaceId
      );
      return extractionId;
    }

    this.ongoingExtractions.add(workspaceId);

    try {
      // Initial cache entry
      const initialResult: BrandExtractionResult = {
        id: extractionId,
        workspaceId,
        extractedAt: new Date().toISOString(),
        status: "extracting",
        confidence: 0,
      };

      this.extractionCache.set(workspaceId, initialResult);

      // Start extraction process (fire and forget)
      this.performExtraction(workspaceId, options).finally(() => {
        this.ongoingExtractions.delete(workspaceId);
      });

      return extractionId;
    } catch (error) {
      this.ongoingExtractions.delete(workspaceId);
      throw error;
    }
  }

  /**
   * Get current brand extraction status
   */
  async getExtractionStatus(
    workspaceId: string
  ): Promise<BrandExtractionResult | null> {
    // Check cache first
    const cached = this.extractionCache.get(workspaceId);
    if (cached) {
      return cached;
    }

    // Fetch from backend
    try {
      const token = await authStore.user?.getIdToken();
      if (!token) return null;

      const response = await fetch(
        `${this.baseUrl}/workspaces/${workspaceId}/brand-context`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        this.extractionCache.set(workspaceId, result);
        return result;
      }
    } catch (error) {
      console.error("Failed to fetch brand extraction status:", error);
    }

    return null;
  }

  /**
   * Wait for extraction to complete (with timeout)
   */
  async waitForCompletion(
    workspaceId: string,
    timeoutMs: number = 30000
  ): Promise<BrandExtractionResult | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getExtractionStatus(workspaceId);

      if (status && status.status !== "extracting") {
        return status;
      }

      // Wait 2 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return null; // Timeout
  }

  /**
   * Subscribe to brand extraction updates via callback
   */
  subscribeToUpdates(
    workspaceId: string,
    callback: (result: BrandExtractionResult) => void,
    intervalMs: number = 3000
  ): () => void {
    const interval = setInterval(async () => {
      const status = await this.getExtractionStatus(workspaceId);
      if (status) {
        callback(status);

        // Stop polling if completed or error
        if (status.status !== "extracting") {
          clearInterval(interval);
        }
      }
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Perform the actual brand extraction
   */
  private async performExtraction(
    workspaceId: string,
    options: BrandExtractionOptions
  ): Promise<BrandExtractionResult> {
    try {
      const token = await authStore.user?.getIdToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Attempt to detect website URL from user's email domain
      let websiteUrl = options.websiteUrl;
      if (!websiteUrl && authStore.user?.email) {
        const domain = authStore.user.email.split("@")[1];
        if (domain && !this.isGenericDomain(domain)) {
          websiteUrl = `https://${domain}`;
        }
      }

      const requestBody = {
        websiteUrl,
        companyName: options.companyName,
        forceRefresh: options.forceRefresh || false,
        timeout: options.timeout || 60000,
      };

      console.log(
        "Starting brand extraction for workspace:",
        workspaceId,
        requestBody
      );

      const response = await fetch(
        `${this.baseUrl}/workspaces/${workspaceId}/brand-context/extract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      let result: BrandExtractionResult;

      if (response.ok) {
        const data = await response.json();
        result = {
          id: `${workspaceId}-${Date.now()}`,
          workspaceId,
          ...data,
          extractedAt: new Date().toISOString(),
          status: "completed" as const,
        };

        console.log("Brand extraction completed:", result);
      } else {
        const errorData = await response.text();
        result = {
          id: `${workspaceId}-${Date.now()}`,
          workspaceId,
          extractedAt: new Date().toISOString(),
          status: "error" as const,
          confidence: 0,
          error: errorData || "Brand extraction failed",
        };

        console.error("Brand extraction failed:", errorData);
      }

      // Update cache
      this.extractionCache.set(workspaceId, result);
      return result;
    } catch (error) {
      console.error("Brand extraction error:", error);

      const errorResult: BrandExtractionResult = {
        id: `${workspaceId}-${Date.now()}`,
        workspaceId,
        extractedAt: new Date().toISOString(),
        status: "error",
        confidence: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      this.extractionCache.set(workspaceId, errorResult);
      return errorResult;
    }
  }

  /**
   * Check if domain is a generic email provider
   */
  private isGenericDomain(domain: string): boolean {
    const genericDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "aol.com",
      "icloud.com",
      "protonmail.com",
      "mail.com",
      "yandex.com",
      "zoho.com",
      "fastmail.com",
    ];

    return genericDomains.includes(domain.toLowerCase());
  }

  /**
   * Clear cache for a workspace
   */
  clearCache(workspaceId: string): void {
    this.extractionCache.delete(workspaceId);
  }

  /**
   * Get cached result without API call
   */
  getCachedResult(workspaceId: string): BrandExtractionResult | null {
    return this.extractionCache.get(workspaceId) || null;
  }
}

// Export singleton instance
export const backgroundBrandService = new BackgroundBrandService();
