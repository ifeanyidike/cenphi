// components/settings/GoogleDriveImport.tsx
import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  Upload,
  FileText,
  Video,
  Image,
  File,
  Loader2,
  Check,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";

interface GoogleDriveFile {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  download_url: string;
  web_view_link: string;
  created_time: string;
  modified_time: string;
}

const GoogleDriveImport: React.FC = observer(() => {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [importedFiles, setImportedFiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    if (!workspaceHub.workspace?.id) return;

    setLoading(true);
    const tokenInfo = await authStore.getToken();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/google/workspaces/${workspaceHub.workspace.id}/drive/testimonial-files`,
        {
          headers: {
            Authorization: `Bearer ${tokenInfo.token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else {
        throw new Error("Failed to load files");
      }
    } catch (error) {
      console.error("Failed to load Google Drive files:", error);
      toast({
        title: "Failed to load files",
        description:
          "Unable to load files from Google Drive. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const importFile = async (file: GoogleDriveFile) => {
    if (!workspaceHub.workspace?.id) return;

    setImporting(file.id);
    const tokenInfo = await authStore.getToken();
    const fileTypeInfo = getFileTypeInfo(file);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/google-drive/import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenInfo.token}`,
          },
          body: JSON.stringify({
            workspace_id: workspaceHub.workspace.id,
            file_id: file.id,
            file_name: file.name,
            mime_type: file.mime_type,
          }),
        }
      );

      if (response.ok) {
        // const result = await response.json();
        setImportedFiles((prev) => new Set([...prev, file.id]));

        // Create more informative success message based on file type
        let description = "";
        if (fileTypeInfo.type === "CSV" || fileTypeInfo.type === "Excel") {
          description = `${file.name} processed successfully. Multiple testimonials may have been imported.`;
        } else {
          description = `${file.name} imported as a testimonial.`;
        }

        toast({
          title: "Import successful",
          description,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import file");
      }
    } catch (error) {
      console.error("Failed to import file:", error);

      let errorMessage = `Failed to import ${file.name}. Please try again.`;
      if (error instanceof Error) {
        if (error.message.includes("reconnect")) {
          errorMessage =
            "Please reconnect your Google Drive account and try again.";
        } else if (error.message.includes("not found")) {
          errorMessage = `File ${file.name} not found or no longer accessible.`;
        }
      }

      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("video/"))
      return <Video className="h-3 w-3 text-red-600" />;
    if (mimeType.startsWith("image/"))
      return <Image className="h-3 w-3 text-green-600" />;
    if (
      mimeType.includes("text") ||
      mimeType.includes("document") ||
      mimeType.includes("pdf")
    )
      return <FileText className="h-3 w-3 text-blue-600" />;
    if (
      mimeType.includes("csv") ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel")
    )
      return <FileText className="h-3 w-3 text-green-700" />;
    return <File className="h-3 w-3 text-gray-600" />;
  };

  const getFileTypeInfo = (file: GoogleDriveFile) => {
    const mimeType = file.mime_type.toLowerCase();
    const name = file.name.toLowerCase();

    if (mimeType.startsWith("video/")) {
      return {
        type: "Video",
        description: "Single testimonial",
        color: "text-red-600",
      };
    }
    if (mimeType.includes("csv") || name.endsWith(".csv")) {
      return {
        type: "CSV",
        description: "Multiple testimonials",
        color: "text-green-700",
      };
    }
    if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls")
    ) {
      return {
        type: "Excel",
        description: "Multiple testimonials",
        color: "text-green-700",
      };
    }
    if (mimeType.includes("pdf") || name.endsWith(".pdf")) {
      return {
        type: "PDF",
        description: "Single testimonial",
        color: "text-blue-600",
      };
    }
    if (
      mimeType.includes("document") ||
      name.endsWith(".docx") ||
      name.endsWith(".doc")
    ) {
      return {
        type: "Doc",
        description: "Single testimonial",
        color: "text-blue-600",
      };
    }
    if (mimeType.includes("text") || name.endsWith(".txt")) {
      return {
        type: "Text",
        description: "Single testimonial",
        color: "text-blue-600",
      };
    }
    return { type: "File", description: "Unknown", color: "text-gray-600" };
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isTestimonialFile = (file: GoogleDriveFile) => {
    const name = file.name.toLowerCase();
    const mimeType = file.mime_type.toLowerCase();

    return (
      name.includes("testimonial") ||
      name.includes("review") ||
      name.includes("feedback") ||
      mimeType.startsWith("video/") ||
      mimeType.includes("csv") ||
      mimeType.includes("spreadsheet")
    );
  };

  const testimonialFiles = files.filter(isTestimonialFile);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-400" />
          <span className="text-xs text-gray-600">
            Loading Google Drive files...
          </span>
        </div>
      </div>
    );
  }

  if (testimonialFiles.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Google Drive Import
          </h3>
        </div>
        <div className="text-center p-6">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Upload className="h-4 w-4 text-gray-500" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            No testimonial files found
          </h4>
          <p className="text-xs text-gray-500 mb-4">
            No files matching testimonial patterns were found in your Google
            Drive.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadFiles}
            className="text-xs h-7"
          >
            Refresh Files
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Google Drive Import
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Import testimonial files from your connected Google Drive
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadFiles}
            disabled={loading}
            className="text-xs h-7 px-2"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <p className="text-xs text-gray-600">
            Found {testimonialFiles.length} testimonial file
            {testimonialFiles.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {testimonialFiles.map((file) => {
            const isImported = importedFiles.has(file.id);
            const isImporting = importing === file.id;
            const fileTypeInfo = getFileTypeInfo(file);

            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(file.mime_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-medium text-gray-900 truncate">
                        {file.name}
                      </h4>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${fileTypeInfo.color} bg-gray-50`}
                      >
                        {fileTypeInfo.type}
                      </span>
                      {isImported && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 bg-green-50 text-green-700 border-green-200 h-4"
                        >
                          <Check className="h-2 w-2 mr-0.5" />
                          Imported
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{fileTypeInfo.description}</span>
                      <span>•</span>
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>Modified {formatDate(file.modified_time)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.web_view_link, "_blank")}
                    className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                  >
                    <Download className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => importFile(file)}
                    disabled={isImported || isImporting}
                    className="text-xs h-6 px-3"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Importing...
                      </>
                    ) : isImported ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Imported
                      </>
                    ) : (
                      "Import"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* File Type Support Information */}
        <div className="mt-4 p-3 bg-gray-50 rounded border">
          <h4 className="text-xs font-medium text-gray-900 mb-2">
            Supported File Types
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Video className="h-3 w-3 text-red-600" />
              <span>Videos (.mp4, .mov, .avi)</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-blue-600" />
              <span>Documents (.pdf, .docx, .txt)</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-green-700" />
              <span>Spreadsheets (.csv, .xlsx)</span>
            </div>
            <div className="text-xs text-gray-500">
              CSV/Excel files process multiple testimonials per file
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default GoogleDriveImport;
