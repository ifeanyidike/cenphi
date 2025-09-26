// src/repo/managers/optimized_service_lineage_manager.ts
import { makeAutoObservable, runInAction } from "mobx";
import { authStore } from "@/stores/authStore";

export interface ServiceNode {
  id: string;
  processing_type: string;
  created_at: string;
  asset_url?: string;
  text_content?: string;
  metadata?: Record<string, any>;
  children: ServiceNode[];
}

export interface SourceInfo {
  type: "testimonial" | "artifact" | "clip";
  id: string;
  title: string;
}

export interface LineageSummary {
  total_artifacts: number;
  services_applied: number;
  services_available: number;
  last_processed_at: string;
}

export interface LineageResult {
  source_info: SourceInfo;
  applied_services: string[];
  available_services: string[];
  service_tree: ServiceNode[];
  summary: LineageSummary;
  last_updated: string;
}

export type SourceType = "testimonial" | "artifact" | "clip";

/**
 * ServiceLineageManager provides efficient, cached service lineage management
 * with built-in duplicate prevention and smart server load management.
 */
export class ServiceLineageManager {
  private baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

  // Observable state
  public loading = false;
  public error: string | null = null;

  // In-memory cache with TTL
  private cache = new Map<string, CachedLineage>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  // Pending requests to prevent duplicate API calls
  private pendingRequests = new Map<string, Promise<LineageResult>>();

  constructor() {
    makeAutoObservable(this);

    // Clean up expired cache entries every minute
    setInterval(() => this.cleanupExpiredCache(), 60000);
  }

  /**
   * Get comprehensive service lineage with intelligent caching
   */
  async getLineage(
    sourceType: SourceType,
    sourceId: string
  ): Promise<LineageResult> {
    const cacheKey = `${sourceType}:${sourceId}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Return pending request if already in flight
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    // Create and cache the request promise
    const requestPromise = this.fetchLineageData(sourceType, sourceId);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache successful result
      this.setInCache(cacheKey, result);

      runInAction(() => {
        this.loading = false;
      });

      return result;
    } catch (error) {
      runInAction(() => {
        this.loading = false;
        this.error = error instanceof Error ? error.message : "Unknown error";
      });
      throw error;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fast service checking with cache-first approach
   */
  async checkServiceApplied(
    sourceType: SourceType,
    sourceId: string,
    serviceName: string
  ): Promise<boolean> {
    try {
      console.trace("in checkServiceApplied in service lineage manager");
      // Try to get from cached lineage data first
      const cacheKey = `${sourceType}:${sourceId}`;
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return cached.applied_services.includes(serviceName);
      }

      // If not cached, use fast check endpoint
      const result = await this.makeRequest<{
        service_applied: boolean;
        cached_response: boolean;
      }>(
        `/service-lineage/optimized/${sourceType}/${sourceId}/check/${serviceName}`
      );

      return result.service_applied;
    } catch (error) {
      console.warn(`Failed to check service application: ${error}`);
      return false;
    }
  }

  /**
   * Get available services for a source with caching
   */
  async getAvailableServices(
    sourceType: SourceType,
    sourceId: string
  ): Promise<{
    available_services: string[];
    applied_services: string[];
  }> {
    try {
      // Check cache first
      const cacheKey = `${sourceType}:${sourceId}`;
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return {
          available_services: cached.available_services,
          applied_services: cached.applied_services,
        };
      }

      // Fetch fresh data if not cached
      const lineageData = await this.getLineage(sourceType, sourceId);
      return {
        available_services: lineageData.available_services,
        applied_services: lineageData.applied_services,
      };
    } catch (error) {
      console.warn(`Failed to get available services: ${error}`);
      return { available_services: [], applied_services: [] };
    }
  }

  /**
   * Smart service application with built-in duplicate prevention
   */
  async applyServiceSafely(
    sourceType: SourceType,
    sourceId: string,
    serviceName: string,
    config?: Record<string, any>
  ): Promise<{
    success: boolean;
    message: string;
    alreadyApplied?: boolean;
    jobId?: string;
  }> {
    try {
      // Check if service is already applied
      const isApplied = await this.checkServiceApplied(
        sourceType,
        sourceId,
        serviceName
      );

      if (isApplied) {
        return {
          success: false,
          message: `${serviceName} has already been applied to this ${sourceType}`,
          alreadyApplied: true,
        };
      }

      // Check if service is available
      const availableServices = await this.getAvailableServices(
        sourceType,
        sourceId
      );
      if (!availableServices.available_services.includes(serviceName)) {
        return {
          success: false,
          message: `${serviceName} is not available for this ${sourceType}. Check service dependencies.`,
        };
      }

      // Apply the service
      const response = await this.makeRequest<{
        job_id: string;
        message: string;
      }>(`/ai/process/${serviceName}`, {
        method: "POST",
        body: JSON.stringify({
          source: {
            type: sourceType,
            id: sourceId,
          },
          config: config || {},
        }),
      });

      // Invalidate cache after successful application
      this.invalidateCache(sourceType, sourceId);

      return {
        success: true,
        message: response.message || `${serviceName} applied successfully`,
        jobId: response.job_id,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to apply service",
      };
    }
  }

  /**
   * Get processing history for a source
   */
  async getProcessingHistory(
    sourceType: SourceType,
    sourceId: string
  ): Promise<{
    timeline: ProcessingEvent[];
    total_processing_time: number;
    efficiency_score: number;
  }> {
    try {
      const lineageData = await this.getLineage(sourceType, sourceId);
      const timeline = this.buildProcessingTimeline(lineageData.service_tree);

      return {
        timeline,
        total_processing_time: this.calculateTotalProcessingTime(timeline),
        efficiency_score: this.calculateEfficiencyScore(timeline),
      };
    } catch (error) {
      console.warn(`Failed to get processing history: ${error}`);
      return {
        timeline: [],
        total_processing_time: 0,
        efficiency_score: 0,
      };
    }
  }

  /**
   * Find all derivatives of a specific node
   */
  async findDerivatives(
    sourceType: SourceType,
    sourceId: string,
    nodeId: string
  ): Promise<ServiceNode[]> {
    try {
      const lineageData = await this.getLineage(sourceType, sourceId);
      return this.findNodeDerivatives(lineageData.service_tree, nodeId);
    } catch (error) {
      console.warn(`Failed to find derivatives: ${error}`);
      return [];
    }
  }

  /**
   * Get clip reference (for clip sources)
   */
  getClipReference(artifactId: string, clipId: string): string {
    return `${artifactId}:${clipId}`;
  }

  /**
   * Parse clip reference back to components
   */
  parseClipReference(
    clipReference: string
  ): { artifactId: string; clipId: string } | null {
    const parts = clipReference.split(":");
    if (parts.length !== 2) return null;

    return {
      artifactId: parts[0],
      clipId: parts[1],
    };
  }

  /**
   * Invalidate cache for a specific source
   */
  invalidateCache(sourceType: SourceType, sourceId: string): void {
    const cacheKey = `${sourceType}:${sourceId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Clear error state
   */
  clearError(): void {
    runInAction(() => {
      this.error = null;
    });
  }

  // Private methods

  private async fetchLineageData(
    sourceType: SourceType,
    sourceId: string
  ): Promise<LineageResult> {
    return this.makeRequest<LineageResult>(
      `/service-lineage/optimized/${sourceType}/${sourceId}`
    );
  }

  private async makeRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const tokenData = await authStore.getToken();
    const token = tokenData.token;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private getFromCache(key: string): LineageResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    // Clean up expired entry
    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  private setInCache(key: string, data: LineageResult): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.cacheTTL,
    });
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now >= cached.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private buildProcessingTimeline(nodes: ServiceNode[]): ProcessingEvent[] {
    const events: ProcessingEvent[] = [];

    const processNode = (node: ServiceNode, depth: number = 0) => {
      events.push({
        id: node.id,
        processing_type: node.processing_type,
        timestamp: node.created_at,
        depth,
        metadata: node.metadata,
      });

      node.children.forEach((child) => processNode(child, depth + 1));
    };

    nodes.forEach((node) => processNode(node));

    return events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  private calculateTotalProcessingTime(timeline: ProcessingEvent[]): number {
    if (timeline.length === 0) return 0;

    const start = new Date(timeline[0].timestamp);
    const end = new Date(timeline[timeline.length - 1].timestamp);

    return end.getTime() - start.getTime();
  }

  private calculateEfficiencyScore(timeline: ProcessingEvent[]): number {
    // Simple efficiency calculation based on processing depth and time
    if (timeline.length === 0) return 0;

    const avgDepth =
      timeline.reduce((sum, event) => sum + event.depth, 0) / timeline.length;
    const timeSpan = this.calculateTotalProcessingTime(timeline);

    // Higher score for more processing in less time
    return Math.min(
      100,
      Math.max(0, timeline.length * 10 - avgDepth * 2 - timeSpan / 60000)
    );
  }

  private findNodeDerivatives(
    nodes: ServiceNode[],
    targetNodeId: string
  ): ServiceNode[] {
    for (const node of nodes) {
      if (node.id === targetNodeId) {
        return this.flattenNodeChildren(node.children);
      }

      const found = this.findNodeDerivatives(node.children, targetNodeId);
      if (found.length > 0) {
        return found;
      }
    }

    return [];
  }

  private flattenNodeChildren(nodes: ServiceNode[]): ServiceNode[] {
    const result: ServiceNode[] = [];

    const flatten = (nodeList: ServiceNode[]) => {
      for (const node of nodeList) {
        result.push(node);
        flatten(node.children);
      }
    };

    flatten(nodes);
    return result;
  }
}

// Supporting interfaces
interface CachedLineage {
  data: LineageResult;
  expiresAt: number;
}

interface ProcessingEvent {
  id: string;
  processing_type: string;
  timestamp: string;
  depth: number;
  metadata?: Record<string, any>;
}
