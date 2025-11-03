// components/ai-generated-content/ContentHubHeader.tsx
import React from "react";
import { X, CheckSquare, FolderPlus, Folder as FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContentFolder } from "@/services/folderService";

interface ContentHubHeaderProps {
  selectedFolderId: string | null;
  folders: ContentFolder[];
  filteredCount: number;
  totalCount: number;
  selectionMode: boolean;
  selectedItemsCount: number;
  onToggleSelectionMode: () => void;
  onCreateFolder: () => void;
  onAddToFolder: (folderId: string, artifactIds: string[]) => void;
  selectedItems: Set<string>;
}

const ContentHubHeader: React.FC<ContentHubHeaderProps> = ({
  selectedFolderId,
  folders,
  filteredCount,
  totalCount,
  selectionMode,
  selectedItemsCount,
  onToggleSelectionMode,
  onCreateFolder,
  onAddToFolder,
  selectedItems,
}) => {
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="mb-6 pb-4 border-b border-slate-200">
      {/* Title Section */}
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Content Hub
          </h1>
          {selectedFolder && (
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 font-medium bg-slate-100 w-fit"
            >
              <FolderIcon className="h-2.5 w-2.5 mr-1" />
              {selectedFolder.name}
            </Badge>
          )}
        </div>
        <p className="text-[11px] sm:text-[12px] text-slate-500">
          {filteredCount} of {totalCount} items
          {selectedFolder && ` in ${selectedFolder.name}`}
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Mobile Folder Button */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateFolder}
            className="lg:hidden h-8 px-3 text-[11px]"
          >
            <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
            New Folder
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Add to Folder Dropdown - Only in selection mode */}
          {selectionMode && selectedItemsCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3 text-[11px] bg-slate-900 hover:bg-slate-800"
                >
                  <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
                  Add to Folder ({selectedItemsCount})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() =>
                      onAddToFolder(folder.id, Array.from(selectedItems))
                    }
                    className="text-[11px] cursor-pointer"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded mr-2 flex-shrink-0"
                      style={{ backgroundColor: folder.color || "#64748b" }}
                    />
                    <span className="flex-1 truncate">{folder.name}</span>
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[9px] h-4 px-1.5"
                    >
                      {folder.item_count}
                    </Badge>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onClick={onCreateFolder}
                  className="text-[11px] border-t mt-1 pt-2 cursor-pointer"
                >
                  <FolderPlus className="h-3 w-3 mr-2" />
                  New Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Selection Mode Toggle */}
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelectionMode}
            className={`h-8 px-3 text-[11px] ${
              selectionMode
                ? "bg-slate-900 hover:bg-slate-800"
                : ""
            }`}
          >
            {selectionMode ? (
              <>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </>
            ) : (
              <>
                <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                Select
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContentHubHeader;
