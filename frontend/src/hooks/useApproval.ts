// hooks/useApproval.ts
import { useState, useCallback } from "react";
import { approvalService } from "@/services/approvalService";
import { workspaceHub } from "@/repo/workspace_hub";

export const useApproval = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveArtifact = useCallback(
    async (artifactId: string, status: string) => {
      const workspaceId = workspaceHub.workspace?.id;
      if (!workspaceId) {
        setError("No workspace selected");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await approvalService.updateApprovalStatus(
          workspaceId,
          artifactId,
          status
        );
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to update approval status");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const bulkApprove = useCallback(
    async (artifactIds: string[], status: string) => {
      const workspaceId = workspaceHub.workspace?.id;
      if (!workspaceId) {
        setError("No workspace selected");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await approvalService.bulkUpdateApprovalStatus(
          workspaceId,
          artifactIds,
          status
        );
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to bulk update approval status");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getArtifactsByStatus = useCallback(async (status: string) => {
    const workspaceId = workspaceHub.workspace?.id;
    if (!workspaceId) {
      setError("No workspace selected");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const artifacts = await approvalService.getArtifactsByStatus(
        workspaceId,
        status
      );
      return artifacts;
    } catch (err: any) {
      setError(err.message || "Failed to fetch artifacts");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    approveArtifact,
    bulkApprove,
    getArtifactsByStatus,
  };
};
