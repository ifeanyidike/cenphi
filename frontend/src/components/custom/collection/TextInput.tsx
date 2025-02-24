// src/components/custom/collection/TextInput.tsx
import React, { useState, useRef, useCallback, KeyboardEvent } from "react";
import { AlertCircle, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_TEXT_LENGTH } from "./constants";
import { Textarea } from "@/components/ui/textarea";

interface TextInputProps {
  onSubmit: (text: string) => void;
  maxLength?: number;
}

export const TextInput: React.FC<TextInputProps> = ({
  onSubmit,
  maxLength = MAX_TEXT_LENGTH,
}) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle submission (trims text)
  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  }, [text, onSubmit]);

  // Keyboard shortcut: Ctrl/Cmd+Enter submits, Escape clears
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setText("");
    }
  };

  // Compute character count color and progress bar color
  const getCountColor = () => {
    const percentage = (text.length / maxLength) * 100;
    if (percentage >= 90) return "#ef4444"; // red-500
    if (percentage >= 75) return "#facc15"; // yellow-400
    return "#60a5fa"; // blue-400
  };

  const countColor = getCountColor();
  const progressWidth = Math.min((text.length / maxLength) * 100, 100);

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      {/* Textarea with animated character counter */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share your thoughts..."
          maxLength={maxLength}
          className="min-h-[200px] resize-y p-4 border border-gray-700
             bg-gradient-to-br from-gray-800 to-gray-900 text-white
             rounded-lg shadow-md hover:shadow-xl
             focus:outline-none focus:ring-2 focus:ring-blue-500
             transition-all duration-300 placeholder-gray-400"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <span className="text-sm" style={{ color: countColor }}>
            {text.length}/{maxLength}
          </span>
          {text.length >= maxLength * 0.9 && (
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="w-full relative">
        <div className="bg-gray-300 rounded-full h-3 shadow-inner overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressWidth}%`,
              backgroundColor: countColor,
            }}
          />
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Submit Response
        </Button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <ShortcutsHelp />
    </div>
  );
};

// Component to display keyboard shortcuts help overlay
const ShortcutsHelp: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [lastUsed] = useState<string | null>(null);

  // Predefined shortcuts (matching the ones in the audio recorder example)
  const shortcuts = [
    { key: "Ctrl+Enter", label: "Submit", description: "Submit testimonial" },
    { key: "Escape", label: "Clear", description: "Clear input" },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
      >
        <Keyboard className="w-4 h-4" />
        Keyboard Shortcuts
      </Button>
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Keyboard Shortcuts</h2>
            <ul className="space-y-2">
              {shortcuts.map((sc) => (
                <li key={sc.key} className="flex justify-between">
                  <span className="text-gray-700">{sc.description}</span>
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">
                    {sc.key}
                  </kbd>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setShowDialog(false)}
                variant="default"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      {lastUsed && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow animate-fade-out">
          Last Shortcut: {lastUsed}
        </div>
      )}
    </>
  );
};

export default TextInput;
