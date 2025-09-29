import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  FileText,
  Video,
  File,
  Calendar,
  Download,
  Loader2,
  FileSpreadsheet,
  FileImage,
  Music,
  Archive,
  Code,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { workspaceHub } from "@/repo/workspace_hub";

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: number;
  thumbnailLink?: string;
  webViewLink?: string;
}

interface ImportJob {
  id: string;
  fileId: string;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  testimonialsCreated?: number;
  error?: string;
}

interface GoogleDriveImportModalProps {
  open: boolean;
  onClose: () => void;
  source?: {
    id: string;
    name: string;
  };
}

const GoogleDriveImportModal: React.FC<GoogleDriveImportModalProps> = ({
  open,
  onClose,
  source,
}) => {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [, setImportJobs] = useState<ImportJob[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const filesPerPage = 10;

  useEffect(() => {
    if (open) {
      loadFiles();
    } else {
      // Reset state when modal closes
      setFiles([]);
      setSearchTerm("");
      setSelectedFiles(new Set());
      setImportJobs([]);
      setCurrentPage(1);
    }
  }, [open]);

  const loadFiles = async (page = 1, search = "") => {
    if (!workspaceHub.workspace?.id) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: filesPerPage.toString(),
        ...(search && { search }),
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/google/workspaces/${workspaceHub.workspace.id}/drive/files?${params}`
      );

      if (!response.ok) {
        throw new Error("Failed to load files");
      }

      const data = await response.json();

      if (page === 1) {
        setFiles(data.files || []);
      } else {
        setFiles((prev) => [...prev, ...(data.files || [])]);
      }

      setHasMore(data.hasMore || false);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to load Google Drive files:", error);
      toast({
        title: "Failed to load files",
        description:
          "Could not load your Google Drive files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    loadFiles(1, term);
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((file) => file.id)));
    }
  };

  const getFileIcon = (mimeType: string, fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    // Video files
    if (
      mimeType.includes("video") ||
      ["mp4", "mov", "avi", "mkv", "webm"].includes(extension || "")
    ) {
      return <Video className="h-4 w-4 text-red-600" />;
    }

    // Image files
    if (
      mimeType.includes("image") ||
      ["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(extension || "")
    ) {
      return <FileImage className="h-4 w-4 text-green-600" />;
    }

    // Document files
    if (
      mimeType.includes("document") ||
      mimeType.includes("pdf") ||
      mimeType.includes("text") ||
      ["doc", "docx", "pdf", "txt", "rtf"].includes(extension || "")
    ) {
      return <FileText className="h-4 w-4 text-blue-600" />;
    }

    // Spreadsheet files
    if (
      mimeType.includes("spreadsheet") ||
      ["xls", "xlsx", "csv"].includes(extension || "")
    ) {
      return <FileSpreadsheet className="h-4 w-4 text-green-700" />;
    }

    // Audio files
    if (
      mimeType.includes("audio") ||
      ["mp3", "wav", "flac", "aac"].includes(extension || "")
    ) {
      return <Music className="h-4 w-4 text-purple-600" />;
    }

    // Archive files
    if (["zip", "rar", "7z", "tar", "gz"].includes(extension || "")) {
      return <Archive className="h-4 w-4 text-orange-600" />;
    }

    // Code files
    if (
      [
        "js",
        "ts",
        "jsx",
        "tsx",
        "py",
        "java",
        "cpp",
        "c",
        "html",
        "css",
      ].includes(extension || "")
    ) {
      return <Code className="h-4 w-4 text-indigo-600" />;
    }

    return <File className="h-4 w-4 text-gray-600" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleImport = async () => {
    if (selectedFiles.size === 0 || !workspaceHub.workspace?.id) return;

    setImporting(true);
    const selectedFileIds = Array.from(selectedFiles);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/collection/workspaces/${workspaceHub.workspace.id}/testimonials/import/google-drive`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileIds: selectedFileIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Import failed");
      }

      const result = await response.json();

      toast({
        title: "Import successful",
        description: `Successfully imported ${selectedFiles.size} file${selectedFiles.size !== 1 ? "s" : ""}. Processing ${result.testimonialsCreated || selectedFiles.size} testimonial${(result.testimonialsCreated || selectedFiles.size) !== 1 ? "s" : ""}.`,
      });

      // Clear selection and close modal
      setSelectedFiles(new Set());
      onClose();
    } catch (error) {
      console.error("Failed to import files:", error);
      toast({
        title: "Import failed",
        description: "Failed to import selected files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const getFileTypeLabel = (mimeType: string, fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    if (
      mimeType.includes("video") ||
      ["mp4", "mov", "avi", "mkv", "webm"].includes(extension || "")
    ) {
      return "Video";
    }
    if (
      mimeType.includes("image") ||
      ["jpg", "jpeg", "png", "gif", "bmp"].includes(extension || "")
    ) {
      return "Image";
    }
    if (
      mimeType.includes("document") ||
      ["doc", "docx"].includes(extension || "")
    ) {
      return "Document";
    }
    if (mimeType.includes("pdf") || extension === "pdf") {
      return "PDF";
    }
    if (
      mimeType.includes("spreadsheet") ||
      ["xls", "xlsx", "csv"].includes(extension || "")
    ) {
      return "Spreadsheet";
    }
    if (mimeType.includes("text") || extension === "txt") {
      return "Text";
    }
    if (
      mimeType.includes("audio") ||
      ["mp3", "wav", "flac", "aac"].includes(extension || "")
    ) {
      return "Audio";
    }

    return extension?.toUpperCase() || "File";
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Import from {source?.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Select files to import as testimonials
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Search and Controls */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {files.length > 0 && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedFiles.size === files.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  {selectedFiles.size > 0 && (
                    <span className="text-xs text-gray-500">
                      {selectedFiles.size} selected
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto">
            {loading && files.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                <span className="text-xs text-gray-600">Loading files...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No files found</p>
                <p className="text-xs text-gray-400">
                  Try adjusting your search or check your Google Drive
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {files.map((file) => {
                  const isSelected = selectedFiles.has(file.id);

                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 transition-all cursor-pointer hover:bg-gray-50 ${
                        isSelected
                          ? "bg-blue-50 border-l-2 border-l-blue-500"
                          : ""
                      }`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="flex-shrink-0">
                            {getFileIcon(file.mimeType, file.name)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {file.name}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {getFileTypeLabel(file.mimeType, file.name)}
                              </span>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(file.modifiedTime)}</span>
                              </div>
                              <span>{formatFileSize(file.size)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                              isSelected
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Load More */}
                {hasMore && (
                  <div className="text-center p-4">
                    <Button
                      variant="outline"
                      onClick={() => loadFiles(currentPage + 1, searchTerm)}
                      disabled={loading}
                      size="sm"
                      className="text-xs h-7"
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      ) : null}
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {selectedFiles.size > 0 && (
                <span>
                  {selectedFiles.size} file{selectedFiles.size !== 1 ? "s" : ""}{" "}
                  selected
                </span>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                size="sm"
                className="text-xs h-7"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedFiles.size === 0 || importing}
                size="sm"
                className="text-xs h-7"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3 mr-2" />
                    Import Selected ({selectedFiles.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GoogleDriveImportModal;
