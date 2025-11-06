// frontend/src/hooks/useFolders.ts
import { useState, useEffect, useCallback, useRef } from "react";
import {
  useFolderService,
  type ContentFolder,
  type CreateFolderRequest,
  type UpdateFolderRequest,
} from "@/services/folderService";
import { workspaceHub } from "@/repo/workspace_hub";

export const useFolders = () => {
  const folderService = useFolderService();
  const workspaceId = workspaceHub.workspace?.id || "";

  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasFetchedRef = useRef(false);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await folderService.listFolders(workspaceId);
      setFolders(data);
    } catch (err) {
      setError(err as Error);
      console.error("Failed to fetch folders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, folderService.listFolders]);

  // Load folders on mount and workspace change - only once
  useEffect(() => {
    if (!hasFetchedRef.current && workspaceId) {
      fetchFolders();
      hasFetchedRef.current = true;
    }
  }, [workspaceId]);

  // Create folder
  const createFolder = useCallback(
    async (data: CreateFolderRequest) => {
      try {
        const newFolder = await folderService.createFolder(workspaceId, data);
        setFolders((prev) => [...prev, newFolder]);
        return newFolder;
      } catch (err) {
        console.error("Failed to create folder:", err);
        throw err;
      }
    },
    [workspaceId, folderService.createFolder]
  );

  // Update folder
  const updateFolder = useCallback(
    async (folderId: string, data: UpdateFolderRequest) => {
      try {
        const updatedFolder = await folderService.updateFolder(
          workspaceId,
          folderId,
          data
        );
        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? updatedFolder : f))
        );
        return updatedFolder;
      } catch (err) {
        console.error("Failed to update folder:", err);
        throw err;
      }
    },
    [workspaceId, folderService.updateFolder]
  );

  // Delete folder
  const deleteFolder = useCallback(
    async (folderId: string) => {
      try {
        await folderService.deleteFolder(workspaceId, folderId);
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
      } catch (err) {
        console.error("Failed to delete folder:", err);
        throw err;
      }
    },
    [workspaceId, folderService.deleteFolder]
  );

  // Add items to folder
  const addItemsToFolder = useCallback(
    async (folderId: string, artifactIds: string[]) => {
      try {
        await folderService.addItemsToFolder(
          workspaceId,
          folderId,
          artifactIds
        );
        // Refresh to get updated item counts
        await fetchFolders();
      } catch (err) {
        console.error("Failed to add items to folder:", err);
        throw err;
      }
    },
    [workspaceId, folderService.addItemsToFolder, fetchFolders]
  );

  // Remove item from folder
  const removeItemFromFolder = useCallback(
    async (folderId: string, artifactId: string) => {
      try {
        await folderService.removeItemFromFolder(
          workspaceId,
          folderId,
          artifactId
        );
        // Refresh to get updated item counts
        await fetchFolders();
      } catch (err) {
        console.error("Failed to remove item from folder:", err);
        throw err;
      }
    },
    [workspaceId, folderService.removeItemFromFolder, fetchFolders]
  );

  // Get folder items
  const getFolderItems = useCallback(
    async (folderId: string) => {
      try {
        return await folderService.getFolderItems(workspaceId, folderId);
      } catch (err) {
        console.error("Failed to get folder items:", err);
        throw err;
      }
    },
    [workspaceId, folderService.getFolderItems]
  );

  // Download folder as zip
  const downloadFolderAsZip = useCallback(
    async (folderId: string) => {
      try {
        await folderService.downloadFolderAsZip(workspaceId, folderId);
      } catch (err) {
        console.error("Failed to download folder:", err);
        throw err;
      }
    },
    [workspaceId, folderService.downloadFolderAsZip]
  );

  // Download clip collection as zip
  const downloadClipCollectionAsZip = useCallback(
    async (artifactId: string) => {
      try {
        await folderService.downloadClipCollectionAsZip(workspaceId, artifactId);
      } catch (err) {
        console.error("Failed to download clip collection:", err);
        throw err;
      }
    },
    [workspaceId, folderService.downloadClipCollectionAsZip]
  );

  return {
    folders,
    isLoading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    addItemsToFolder,
    removeItemFromFolder,
    getFolderItems,
    downloadFolderAsZip,
    downloadClipCollectionAsZip,
    refetch: fetchFolders,
  };
};
