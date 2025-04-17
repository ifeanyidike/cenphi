import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import useOnClickOutside from "@/hooks/use-click-outside";
import { Copy, Check, X } from "lucide-react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { brandGuideStore } from "@/stores/brandGuideStore";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";
import { FaEyeDropper } from "react-icons/fa";

export interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  label?: string;
  previewClassName?: string;
  showHexInput?: boolean;
  showCopyButton?: boolean;
  showEyeDropper?: boolean;
  disabled?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  presetColors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#607d8b",
  ],
  label,
  previewClassName = "h-10 w-10",
  showHexInput = true,
  showCopyButton = true,
  showEyeDropper = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColor, setLocalColor] = useState(color);
  const [isCopied, setIsCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([color]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { recentColors, addRecentColor } = brandGuideStore;

  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  useOnClickOutside(popoverRef, () => {
    if (isOpen) {
      finishEditing();
    }
  });

  const finishEditing = () => {
    onChange(localColor);
    setIsOpen(false);
    addRecentColor(localColor);
  };

  const handleColorChange = (newColor: string) => {
    setLocalColor(newColor);

    // Add to history if different from last
    if (history[history.length - 1] !== newColor) {
      const newHistory = [...history.slice(0, historyIndex + 1), newColor];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLocalColor(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLocalColor(history[historyIndex + 1]);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localColor);
    setIsCopied(true);
    toast({
      title: "Color copied!",
      description: `${localColor} has been copied to your clipboard.`,
      duration: 3000,
    });
    setTimeout(() => setIsCopied(false), 1000);
  };

  const useEyeDropper = async () => {
    // Check if the EyeDropper API is available
    if (!(window as any).EyeDropper) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support the EyeDropper API.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      // @ts-ignore - EyeDropper API is not yet in TypeScript DOM definitions
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      handleColorChange(result.sRGBHex);
    } catch (error) {
      // User canceled the eye dropper
      console.log("EyeDropper was canceled");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <div className="flex flex-col gap-1.5">
          {label && (
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          <div
            className={cn(
              "rounded-md border cursor-pointer",
              previewClassName,
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ backgroundColor: color }}
            onClick={() => !disabled && setIsOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent ref={popoverRef} className="w-auto p-0" sideOffset={5}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="p-3"
        >
          <div className="flex flex-col gap-3 min-w-[240px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-6 w-6 rounded-md border"
                  style={{ backgroundColor: localColor }}
                />
                {showHexInput && (
                  <HexColorInput
                    className="bg-transparent w-20 border-0 p-0 focus:ring-0 text-sm focus:outline-none uppercase"
                    color={localColor}
                    onChange={handleColorChange}
                    prefixed
                  />
                )}
              </div>
              <div className="flex items-center gap-1">
                {showEyeDropper && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={useEyeDropper}
                        >
                          <FaEyeDropper className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Pick color from screen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {showCopyButton && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={copyToClipboard}
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Copy hex value</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleUndo}
                        disabled={historyIndex === 0}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 7v6h6" />
                          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Undo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleRedo}
                        disabled={historyIndex === history.length - 1}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 7v6h-6" />
                          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Redo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <HexColorPicker
              color={localColor}
              onChange={handleColorChange}
              className="w-full !h-[180px]"
            />

            {/* Recent Colors */}
            {recentColors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Recent
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recentColors.map((recentColor, index) => (
                    <div
                      key={`${recentColor}-${index}`}
                      className="h-6 w-6 rounded-md border cursor-pointer transition-transform hover:scale-110"
                      style={{ backgroundColor: recentColor }}
                      onClick={() => handleColorChange(recentColor)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Preset Colors */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Presets
              </p>
              <div className="flex flex-wrap gap-1.5">
                {presetColors.map((presetColor) => (
                  <div
                    key={presetColor}
                    className="h-6 w-6 rounded-md border cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: presetColor }}
                    onClick={() => handleColorChange(presetColor)}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-2 mt-1 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={finishEditing}
                className="px-4 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Apply
              </Button>
            </div>
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
};

export default observer(ColorPicker);
