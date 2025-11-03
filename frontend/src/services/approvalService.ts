// services/approvalService.ts

import { authStore } from "@/stores/authStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface ApprovalStatusUpdate {
  status: "draft" | "pending" | "approved" | "rejected";
}

export interface BulkApprovalRequest {
  artifact_ids: string[];
  status: "draft" | "pending" | "approved" | "rejected";
}

export class ApprovalService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { token } = await authStore.getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async updateApprovalStatus(
    workspaceId: string,
    artifactId: string,
    status: string
  ): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/artifacts/${artifactId}/approve`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update approval status");
    }

    return response.json();
  }

  async bulkUpdateApprovalStatus(
    workspaceId: string,
    artifactIds: string[],
    status: string
  ): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/artifacts/bulk-approve`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ artifact_ids: artifactIds, status }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to bulk update approval status");
    }

    return response.json();
  }

  async getArtifactsByStatus(
    workspaceId: string,
    status: string
  ): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/artifacts/by-status?status=${encodeURIComponent(
        status
      )}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch artifacts by status");
    }

    return response.json();
  }
}

export const approvalService = new ApprovalService();
