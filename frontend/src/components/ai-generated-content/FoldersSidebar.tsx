// components/ai-generated-content/FoldersSidebar.tsx
import React, { memo } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderPlus,
  MoreVertical,
  Edit2,
  Trash2,
  Sparkles,
  Archive,
  FolderArchiveIcon,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContentFolder } from "@/services/folderService";

interface FoldersSidebarProps {
  folders: ContentFolder[];
  isLoading: boolean;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: ContentFolder) => void;
  onDeleteFolder: (folder: ContentFolder) => void;
  onDownloadFolder: (folder: ContentFolder) => void;
  downloadingFolders: Set<string>;
  totalContentCount: number;
  className?: string;
}

const FoldersSidebar: React.FC<FoldersSidebarProps> = memo(
  ({
    folders,
    isLoading,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onEditFolder,
    onDeleteFolder,
    onDownloadFolder,
    downloadingFolders,
    totalContentCount,
    className = "",
  }) => {
    const getFolderIcon = (icon?: string) => {
      switch (icon) {
        case "sparkles":
          return Sparkles;
        case "archive":
          return Archive;
        default:
          return Folder;
      }
    };

    if (isLoading) {
      return (
        <div className={`space-y-1.5 ${className}`}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 bg-slate-100 rounded-md animate-pulse"
            />
          ))}
        </div>
      );
    }

    return (
      <div className={`space-y-1.5 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
            Collections
          </h3>
          <Button
            onClick={onCreateFolder}
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-slate-100 rounded-sm transition-all"
          >
            <FolderPlus className="h-2.5 w-2.5 text-slate-500 hover:text-slate-700" />
          </Button>
        </div>

        {/* All Content View */}
        <button
          onClick={() => onSelectFolder(null)}
          className={`
          group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-[10.5px]
          transition-all duration-200 relative
          ${
            selectedFolderId === null
              ? "bg-slate-900 text-white shadow-sm"
              : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
          }
        `}
        >
          <div
            className={`
          flex items-center justify-center w-5 h-5 rounded-md transition-all
          ${selectedFolderId === null ? "bg-white/10" : "bg-transparent"}
        `}
          >
            <FolderArchiveIcon
              className={`h-3 w-3 ${selectedFolderId === null ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}
            />
          </div>
          <span className="flex-1 truncate font-semibold tracking-tight">
            All Content
          </span>
          <Badge
            variant="secondary"
            className={`text-[8.5px] h-4 px-1.5 font-medium rounded-full ${
              selectedFolderId === null
                ? "bg-white/15 text-white border-white/20 border"
                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
            }`}
          >
            {totalContentCount}
          </Badge>
        </button>

        {/* Folders List */}
        {folders?.length > 0 && (
          <div className="space-y-0.5 pt-1">
            <AnimatePresence mode="popLayout">
              {folders
                .filter((folder) => !folder.is_default) // Filter out default folders like "Uncategorized"
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((folder) => {
                  const IconComponent = getFolderIcon(folder.icon);
                  const isSelected = selectedFolderId === folder.id;

                  return (
                    <div key={folder.id} className="group relative">
                      <button
                        onClick={() => onSelectFolder(folder.id)}
                        className={`
                        w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-[10.5px]
                        transition-all duration-200 relative
                        ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-sm"
                            : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                        }
                      `}
                      >
                        {/* Folder Icon with color accent */}
                        <div
                          className={`flex items-center justify-center w-5 h-5 rounded-md flex-shrink-0 transition-all`}
                          style={{
                            backgroundColor: isSelected
                              ? `${folder.color || "#64748b"}20`
                              : "transparent",
                            borderWidth: isSelected ? "0" : "1px",
                            borderColor: isSelected ? "transparent" : "#e2e8f0",
                          }}
                        >
                          <IconComponent
                            className={`h-2.5 w-2.5 ${
                              isSelected
                                ? "text-white"
                                : "text-slate-500 group-hover:text-slate-700"
                            }`}
                            style={{
                              color: isSelected
                                ? folder.color || "#fff"
                                : undefined,
                            }}
                          />
                        </div>

                        {/* Folder Name */}
                        <span className="flex-1 truncate font-semibold tracking-tight">
                          {folder.name}
                        </span>

                        {/* Item Count */}
                        <Badge
                          variant="secondary"
                          className={`text-[8.5px] h-4 px-1.5 font-medium rounded-full transition-all ${
                            isSelected
                              ? "bg-white/15 text-white border-white/20 border"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          }`}
                        >
                          {folder.item_count}
                        </Badge>

                        {/* Download Button - visible on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadFolder(folder);
                          }}
                          disabled={downloadingFolders.has(folder.id)}
                          className={`
                            h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex items-center justify-center
                            hover:bg-slate-200 rounded-sm transition-all
                            ${isSelected ? "opacity-100 hover:bg-white/15" : ""}
                            ${downloadingFolders.has(folder.id) ? "opacity-100" : ""}
                          `}
                          title={
                            downloadingFolders.has(folder.id)
                              ? "Downloading..."
                              : "Download folder as ZIP"
                          }
                        >
                          {downloadingFolders.has(folder.id) ? (
                            <Loader2
                              className={`h-3 w-3 animate-spin ${isSelected ? "text-white" : "text-slate-600"}`}
                            />
                          ) : (
                            <Download
                              className={`h-3 w-3 ${isSelected ? "text-white" : "text-slate-600"}`}
                            />
                          )}
                        </button>

                        {/* Actions Menu - all folders now have actions since we filter out defaults */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className={`
                              h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex items-center justify-center
                              hover:bg-slate-200 rounded-sm transition-all
                              ${isSelected ? "opacity-100 hover:bg-white/15" : ""}
                            `}
                            >
                              <MoreVertical
                                className={`h-3 w-3 ${isSelected ? "text-white" : "text-slate-600"}`}
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditFolder(folder);
                              }}
                              className="text-[10.5px] cursor-pointer"
                            >
                              <Edit2 className="h-3 w-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDownloadFolder(folder);
                              }}
                              className="text-[10.5px] cursor-pointer"
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFolder(folder);
                              }}
                              className="text-[10.5px] text-red-600 focus:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </button>
                    </div>
                  );
                })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {folders.length === 0 && (
          <div className="text-center py-8 px-4">
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-slate-100 flex items-center justify-center">
              <Folder className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-600 mb-4 leading-relaxed max-w-[140px] mx-auto">
              Create collections to organize your content
            </p>
            <Button
              onClick={onCreateFolder}
              size="sm"
              className="h-7 px-3.5 text-[10px] bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            >
              <FolderPlus className="h-3 w-3 mr-1.5" />
              New Collection
            </Button>
          </div>
        )}
      </div>
    );
  }
);

FoldersSidebar.displayName = "FoldersSidebar";

export default FoldersSidebar;
