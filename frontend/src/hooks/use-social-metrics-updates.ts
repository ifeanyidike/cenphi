import { useEffect, useRef } from "react";
import { socialManager } from "@/repo/managers/social_manager";
import { workspaceHub } from "@/repo/workspace_hub";

interface UseSocialMetricsUpdatesOptions {
  enabled?: boolean;
  interval?: number; // in milliseconds
  onUpdate?: (postId: string) => void;
  onError?: (error: Error) => void;
}

export const useSocialMetricsUpdates = ({
  enabled = true,
  interval = 30000, // 30 seconds
  onUpdate,
  onError,
}: UseSocialMetricsUpdatesOptions = {}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);

  const syncAllMetrics = async () => {
    if (isUpdatingRef.current || !workspaceHub.workspace?.id) {
      return;
    }

    isUpdatingRef.current = true;

    try {
      // Get all posts for the workspace
      const posts = await socialManager.getPosts(workspaceHub.workspace.id, 100);

      // Filter to only sync published posts that haven't been synced recently
      const postsToSync = posts.filter(post => {
        if (post.status !== "published") return false;

        // Only sync if last sync was more than 5 minutes ago or never synced
        if (!post.last_metrics_sync) return true;

        const lastSync = new Date(post.last_metrics_sync);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return lastSync < fiveMinutesAgo;
      });

      // Sync metrics for each post (with rate limiting)
      for (const post of postsToSync.slice(0, 5)) { // Limit to 5 posts per update cycle
        try {
          await socialManager.syncPostMetrics(post.id);
          onUpdate?.(post.id);

          // Small delay between requests to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`Failed to sync metrics for post ${post.id}:`, error);
          onError?.(error as Error);
        }
      }
    } catch (error) {
      console.error("Failed to sync social metrics:", error);
      onError?.(error as Error);
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const startUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial sync
    syncAllMetrics();

    // Set up interval for regular updates
    intervalRef.current = setInterval(() => {
      syncAllMetrics();
    }, interval);
  };

  const stopUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isUpdatingRef.current = false;
  };

  const forceUpdate = async (postId?: string) => {
    if (postId) {
      try {
        await socialManager.syncPostMetrics(postId);
        onUpdate?.(postId);
      } catch (error) {
        onError?.(error as Error);
      }
    } else {
      await syncAllMetrics();
    }
  };

  useEffect(() => {
    if (enabled && workspaceHub.workspace?.id) {
      startUpdates();
    } else {
      stopUpdates();
    }

    return () => {
      stopUpdates();
    };
  }, [enabled, interval, workspaceHub.workspace?.id]);

  return {
    forceUpdate,
    startUpdates,
    stopUpdates,
    isUpdating: isUpdatingRef.current,
  };
};