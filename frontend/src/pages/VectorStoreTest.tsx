import React, { useState, useEffect } from "react";
import {
  Upload,
  Trash2,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Database,
  File,
  MessageSquare,
  Server,
  RotateCcw,
  ArrowUpCircle,
} from "lucide-react";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";
import { Testimonial } from "@/types/testimonial";
import { authStore } from "@/stores/authStore";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface VectorStoreFile {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename?: string;
  purpose: string;
  status: string;
  status_details?: string;
}

interface VectorStoreResponse {
  files: VectorStoreFile[];
  count: number;
}

interface TestimonialVectorData {
  testimonial: Testimonial;
  isInVectorStore: boolean;
  vectorFileId?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const VectorStoreTest: React.FC = observer(() => {
  const [files, setFiles] = useState<VectorStoreFile[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialVectorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [uploadingTestimonials, setUploadingTestimonials] = useState<
    Set<string>
  >(new Set());
  const [isTestUploading, setIsTestUploading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const workspace = workspaceHub.workspace;

  useEffect(() => {
    if (workspace?.id) {
      loadFiles();
      loadTestimonials();
    }
  }, [workspace?.id]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const testUpload = async () => {
    if (!workspace?.id) {
      setError("No workspace selected");
      return;
    }

    setIsTestUploading(true);
    clearMessages();

    try {
      const tokenInfo = await authStore.getToken();
      console.log("Test upload - Token info:", {
        hasToken: !!tokenInfo?.token,
        tokenLength: tokenInfo?.token?.length
      });

      const response = await fetch(
        `${API_BASE_URL}/vector-store/${workspace.id}/test-upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenInfo.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Test upload response:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Test upload error:", response.status, errorText);
        throw new Error(`Test upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Test upload successful:", data);
      setSuccess(`Test file uploaded successfully! File ID: ${data.fileId}`);

      // Refresh files after successful upload
      await loadFiles();
    } catch (err) {
      console.error("Test upload failed:", err);
      setError(err instanceof Error ? err.message : "Test upload failed");
    } finally {
      setIsTestUploading(false);
    }
  };

  const loadFiles = async () => {
    if (!workspace?.id) {
      setError("No workspace selected");
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const tokenInfo = await authStore.getToken();
      console.log("Token info for vector store request:", {
        hasToken: !!tokenInfo?.token,
        tokenLength: tokenInfo?.token?.length
      });

      const response = await fetch(
        `${API_BASE_URL}/vector-store/${workspace.id}/files`,
        {
          headers: {
            Authorization: `Bearer ${tokenInfo.token}`,
          },
        }
      );

      console.log("Vector store API response:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Vector store API error:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data: VectorStoreResponse = await response.json();
      console.log("Vector store data received:", data);
      setFiles(data.files || []);
    } catch (err) {
      console.error("Failed to load files:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load vector store files"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadTestimonials = async () => {
    if (!workspace?.id) {
      setError("No workspace selected");
      return;
    }

    setIsLoadingTestimonials(true);
    clearMessages();

    try {
      const testimonialResponse =
        await workspaceHub.testimonialManager.getTestimonials();

      const testimonialData: TestimonialVectorData[] = testimonialResponse.map(
        (testimonial: Testimonial) => {
          const isInVectorStore =
            testimonial.metadata &&
            testimonial.metadata.vector_file_id &&
            files.some((f) => f.id === testimonial.metadata?.vector_file_id);

          return {
            testimonial,
            isInVectorStore: !!isInVectorStore,
            vectorFileId: testimonial.metadata?.vector_file_id as string,
          };
        }
      );

      setTestimonials(testimonialData);
    } catch (err) {
      console.error("Failed to load testimonials:", err);
      setError("Failed to load testimonials");
    } finally {
      setIsLoadingTestimonials(false);
    }
  };

  const uploadTestimonialToVector = async (testimonialId: string) => {
    if (!workspace?.id) {
      setError("No workspace selected");
      return;
    }

    setUploadingTestimonials((prev) => new Set(prev).add(testimonialId));
    clearMessages();

    try {
      const tokenInfo = await authStore.getToken();
      const response = await fetch(
        `${API_BASE_URL}/testimonials/${testimonialId}/upload-to-vector`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenInfo.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload testimonial: ${response.status}`);
      }

      setSuccess("Testimonial uploaded to vector store successfully");
      // Refresh data
      await loadFiles();
      await loadTestimonials();
    } catch (err) {
      console.error("Failed to upload testimonial:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload testimonial"
      );
    } finally {
      setUploadingTestimonials((prev) => {
        const newSet = new Set(prev);
        newSet.delete(testimonialId);
        return newSet;
      });
    }
  };

  const batchUploadTestimonials = async () => {
    if (!workspace?.id) {
      setError("No workspace selected");
      return;
    }

    const testimonialsToUpload = testimonials.filter((t) => !t.isInVectorStore);

    if (testimonialsToUpload.length === 0) {
      setError(
        "No testimonials to upload. All testimonials are already in vector store."
      );
      return;
    }

    setIsBatchUploading(true);
    clearMessages();

    try {
      // Upload testimonials in parallel for faster processing
      const tokenInfo = await authStore.getToken();

      const uploadPromises = testimonialsToUpload.map(
        async (testimonialData) => {
          const response = await fetch(
            `${API_BASE_URL}/testimonials/${testimonialData.testimonial.id}/upload-to-vector`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${tokenInfo.token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to upload testimonial ${testimonialData.testimonial.id}`
            );
          }

          return testimonialData.testimonial.id;
        }
      );

      await Promise.all(uploadPromises);

      setSuccess(
        `Successfully uploaded ${testimonialsToUpload.length} testimonials to vector store`
      );
      // Refresh data
      await loadFiles();
      await loadTestimonials();
    } catch (err) {
      console.error("Batch upload failed:", err);
      setError(err instanceof Error ? err.message : "Batch upload failed");
    } finally {
      setIsBatchUploading(false);
    }
  };

  const clearAllVectorStore = () => {
    if (!workspace?.id) {
      setError("No workspace selected");
      return;
    }
    setShowClearConfirm(true);
  };

  const confirmClearAll = async () => {
    setIsClearing(true);
    setShowClearConfirm(false);
    clearMessages();

    try {
      const tokenInfo = await authStore.getToken();

      // Delete all files one by one
      const deletePromises = files.map(async (file) => {
        const response = await fetch(
          `${API_BASE_URL}/vector-store/${workspace.id}/files/${file.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${tokenInfo.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete file ${file.id}`);
        }
      });

      await Promise.all(deletePromises);

      setSuccess(
        `Successfully cleared ${files.length} files from vector store`
      );
      // Refresh data
      await loadFiles();
      await loadTestimonials();
    } catch (err) {
      console.error("Clear all failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to clear vector store"
      );
    } finally {
      setIsClearing(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!workspace?.id) {
      setError("No workspace selected");
      return;
    }

    setDeletingFileId(fileId);
    clearMessages();

    const tokenInfo = await authStore.getToken();

    try {
      const response = await fetch(
        `${API_BASE_URL}/vector-store/${workspace.id}/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenInfo.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccess("File deleted successfully!");

      // Reload files after successful deletion
      await loadFiles();
      await loadTestimonials();
    } catch (err) {
      console.error("Failed to delete file:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete file from vector store"
      );
    } finally {
      setDeletingFileId(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const testimonialsInVector = testimonials.filter(
    (t) => t.isInVectorStore
  ).length;
  const testimonialsNotInVector = testimonials.filter(
    (t) => !t.isInVectorStore
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900">
              Vector Store
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Manage testimonials in AI vector database
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">
                  Total Files
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {files.length}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">
                  Total Testimonials
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {testimonials.length}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">
                  In Vector Store
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {testimonialsInVector}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium text-gray-600">
                  Not Uploaded
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {testimonialsNotInVector}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testUpload}
              disabled={isTestUploading}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isTestUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Test Upload
            </button>

            <button
              onClick={batchUploadTestimonials}
              disabled={isBatchUploading || testimonialsNotInVector === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBatchUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpCircle className="h-4 w-4" />
              )}
              Batch Upload ({testimonialsNotInVector})
            </button>

            <button
              onClick={clearAllVectorStore}
              disabled={isClearing || files.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Clear All
            </button>

            <button
              onClick={() => {
                loadFiles();
                loadTestimonials();
              }}
              disabled={isLoading || isLoadingTestimonials}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading || isLoadingTestimonials ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Testimonials Management */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Testimonials Management
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload individual testimonials to the vector store
              </p>
            </div>
            <div className="p-4">
              {isLoadingTestimonials ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">
                    Loading testimonials...
                  </span>
                </div>
              ) : testimonials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No testimonials found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testimonials.map((data) => (
                    <div
                      key={data.testimonial.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {data.testimonial.author_name || "Anonymous"}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              data.isInVectorStore
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {data.isInVectorStore
                              ? "In Vector Store"
                              : "Not Uploaded"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {data.testimonial.type} •{" "}
                          {formatDate(
                            new Date(data.testimonial.created_at).getTime() /
                              1000
                          )}
                        </p>
                      </div>
                      {!data.isInVectorStore && (
                        <button
                          onClick={() =>
                            uploadTestimonialToVector(data.testimonial.id)
                          }
                          disabled={uploadingTestimonials.has(
                            data.testimonial.id
                          )}
                          className="ml-3 flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {uploadingTestimonials.has(data.testimonial.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          Upload
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vector Store Files */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Server className="h-5 w-5" />
                Vector Store Files
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Files currently stored in the vector database
              </p>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Loading files...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <File className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No files in vector store</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {file.filename || file.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatBytes(file.bytes)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(file.created_at)}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              file.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {file.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteFile(file.id)}
                        disabled={deletingFileId === file.id}
                        className="ml-3 flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingFileId === file.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearAll}
        title="Clear All Vector Store Files"
        message="Are you sure you want to clear all files from the vector store? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        variant="danger"
        isLoading={isClearing}
      />
    </div>
  );
});

export default VectorStoreTest;
