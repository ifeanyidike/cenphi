// components/ai-generated-content/FolderDialog.tsx
import React, { useState, useEffect } from "react";
import { Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContentFolder } from "@/services/folderService";

interface FolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; color?: string; icon?: string }) => Promise<void>;
  folder?: ContentFolder | null;
  mode: "create" | "edit";
}

const PRESET_COLORS = [
  { name: "Slate", value: "#64748b" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Green", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
];

const FolderDialog: React.FC<FolderDialogProps> = ({
  open,
  onClose,
  onSave,
  folder,
  mode,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (folder && mode === "edit") {
      setName(folder.name);
      setDescription(folder.description || "");
      setColor(folder.color || PRESET_COLORS[0].value);
    } else {
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[0].value);
    }
  }, [folder, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon: "folder",
      });
      onClose();
    } catch (error) {
      console.error("Failed to save folder:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {mode === "create" ? "Create Folder" : "Edit Folder"}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-slate-500">
              Organize your content by creating custom folders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Folder Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[12px] font-semibold text-slate-700">
                Folder Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Social Media Posts, Blog Content"
                className="text-[12px] h-9"
                required
                autoFocus
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[12px] font-semibold text-slate-700">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a brief description to help identify this folder"
                className="text-[12px] min-h-[60px] resize-none"
                rows={2}
                maxLength={200}
              />
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-slate-700">
                Folder Color
              </Label>
              <div className="grid grid-cols-10 gap-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor.value}
                    type="button"
                    onClick={() => setColor(presetColor.value)}
                    className={`
                      w-8 h-8 rounded-md transition-all
                      ${
                        color === presetColor.value
                          ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                          : "hover:scale-105"
                      }
                    `}
                    style={{ backgroundColor: presetColor.value }}
                    title={presetColor.name}
                  >
                    {color === presetColor.value && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="pt-3 border-t border-slate-200">
              <Label className="text-[12px] font-semibold text-slate-700 mb-2 block">
                Preview
              </Label>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-900 w-fit">
                <div
                  className="flex items-center justify-center w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                >
                  <Folder className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-[11px] font-medium text-white">
                  {name || "Folder Name"}
                </span>
                {description && (
                  <span className="text-[9px] text-slate-400 ml-1 max-w-[200px] truncate">
                    • {description}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
              className="text-[12px] h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="text-[12px] h-9 bg-slate-900 hover:bg-slate-800"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </span>
              ) : (
                <span>{mode === "create" ? "Create Folder" : "Save Changes"}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FolderDialog;
