// frontend/src/services/folderService.ts
import { useApiClient } from "./apiClient";
import { useCallback } from "react";
import { authStore } from "@/stores/authStore";

export interface ContentFolder {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_default: boolean;
  sort_order: number;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
}

export interface AddItemsToFolderRequest {
  artifact_ids: string[];
}

export const useFolderService = () => {
  const api = useApiClient();

  const listFolders = useCallback(
    async (workspaceId: string): Promise<ContentFolder[]> => {
      return api.get<ContentFolder[]>(
        `/workspaces/${workspaceId}/folders`
      );
    },
    [api]
  );

  const getFolder = useCallback(
    async (workspaceId: string, folderId: string): Promise<ContentFolder> => {
      return api.get<ContentFolder>(
        `/workspaces/${workspaceId}/folders/${folderId}`
      );
    },
    [api]
  );

  const createFolder = useCallback(
    async (
      workspaceId: string,
      data: CreateFolderRequest
    ): Promise<ContentFolder> => {
      return api.post<ContentFolder>(
        `/workspaces/${workspaceId}/folders`,
        data
      );
    },
    [api]
  );

  const updateFolder = useCallback(
    async (
      workspaceId: string,
      folderId: string,
      data: UpdateFolderRequest
    ): Promise<ContentFolder> => {
      return api.put<ContentFolder>(
        `/workspaces/${workspaceId}/folders/${folderId}`,
        data
      );
    },
    [api]
  );

  const deleteFolder = useCallback(
    async (workspaceId: string, folderId: string): Promise<void> => {
      return api.del(`/workspaces/${workspaceId}/folders/${folderId}`);
    },
    [api]
  );

  const addItemsToFolder = useCallback(
    async (
      workspaceId: string,
      folderId: string,
      artifactIds: string[]
    ): Promise<{ message: string; count: number }> => {
      return api.post(
        `/workspaces/${workspaceId}/folders/${folderId}/items`,
        { artifact_ids: artifactIds }
      );
    },
    [api]
  );

  const removeItemFromFolder = useCallback(
    async (
      workspaceId: string,
      folderId: string,
      artifactId: string
    ): Promise<void> => {
      return api.del(
        `/workspaces/${workspaceId}/folders/${folderId}/items/${artifactId}`
      );
    },
    [api]
  );

  const getFolderItems = useCallback(
    async (workspaceId: string, folderId: string): Promise<any[]> => {
      return api.get(
        `/workspaces/${workspaceId}/folders/${folderId}/items`
      );
    },
    [api]
  );

  const getFolderWithItems = useCallback(
    async (workspaceId: string, folderId: string): Promise<any> => {
      return api.get(
        `/workspaces/${workspaceId}/folders/${folderId}/details`
      );
    },
    [api]
  );

  const downloadFolderAsZip = useCallback(
    async (workspaceId: string, folderId: string): Promise<void> => {
      // Use api.downloadFile method (we'll need to add this method to apiClient)
      // For now, use direct fetch with proper base URL
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const url = `${baseUrl}/workspaces/${workspaceId}/folders/${folderId}/download`;

      // Get token using authStore
      const { token } = await authStore.getToken();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download folder');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'folder.zip';

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    },
    []
  );

  const downloadClipCollectionAsZip = useCallback(
    async (workspaceId: string, artifactId: string): Promise<void> => {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const url = `${baseUrl}/workspaces/${workspaceId}/artifacts/${artifactId}/clips/download`;

      // Get token using authStore
      const { token } = await authStore.getToken();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download clip collection');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'clips.zip';

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    },
    []
  );

  return {
    listFolders,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    addItemsToFolder,
    removeItemFromFolder,
    getFolderItems,
    getFolderWithItems,
    downloadFolderAsZip,
    downloadClipCollectionAsZip,
  };
};
