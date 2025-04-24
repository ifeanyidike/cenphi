import React from "react";
import { X, Check } from "../UI/icons";
import { Button } from "../UI";

interface TextInputState {
  isActive: boolean;
  id: string | null;
  text: string;
  position: { x: number; y: number };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    isBold: boolean;
    isItalic: boolean;
    rotation: number;
  };
}

interface TextOverlayEditorProps {
  textInput: TextInputState;
  setTextInput: React.Dispatch<React.SetStateAction<TextInputState>>;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  showTextControls: boolean;
  confirmTextOverlay: () => void;
  cancelTextOverlay: () => void;
}

const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({
  textInput,
  setTextInput,
  textAreaRef,
  showTextControls,
  confirmTextOverlay,
  cancelTextOverlay,
}) => {
  // Safe way to update text input state
  const updateTextStyle = (updates: Partial<TextInputState["style"]>) => {
    setTextInput((prevState) => ({
      ...prevState,
      style: {
        ...prevState.style,
        ...updates,
      },
    }));
  };

  // Safe handlers for form controls
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTextStyle({ fontFamily: e.target.value });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTextStyle({ fontSize: parseInt(e.target.value) || 16 });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTextStyle({ color: e.target.value });
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTextStyle({ rotation: parseInt(e.target.value) || 0 });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput((prevState) => ({
      ...prevState,
      text: e.target.value,
    }));
  };

  const toggleBold = () => {
    updateTextStyle({ isBold: !textInput.style.isBold });
  };

  const toggleItalic = () => {
    updateTextStyle({ isItalic: !textInput.style.isItalic });
  };

  return (
    <>
      {/* Text Input Area */}
      <div
        className="absolute z-20"
        style={{
          left: `${textInput.position.x}%`,
          top: `${textInput.position.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <textarea
          ref={textAreaRef}
          value={textInput.text}
          onChange={handleTextChange}
          className="bg-transparent outline-dashed outline-2 outline-white p-2 text-center min-w-[100px] min-h-[40px] resize-none"
          style={{
            fontSize: `${textInput.style.fontSize}px`,
            fontFamily: textInput.style.fontFamily,
            fontWeight: textInput.style.isBold ? "bold" : "normal",
            fontStyle: textInput.style.isItalic ? "italic" : "normal",
            transform: `rotate(${textInput.style.rotation}deg)`,
            color: textInput.style.color,
          }}
        />
      </div>

      {/* Controls Panel */}
      {showTextControls && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 backdrop-blur-sm p-4 rounded-lg z-30 flex flex-wrap gap-3 items-center shadow-lg max-w-2xl w-auto">
          <div className="flex flex-col w-full md:w-auto">
            <label className="text-xs text-gray-300 mb-1">Font Family</label>
            <select
              value={textInput.style.fontFamily}
              onChange={handleFontFamilyChange}
              className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 w-full md:w-36"
            >
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>

          <div className="flex flex-col w-20">
            <label className="text-xs text-gray-300 mb-1">Size</label>
            <input
              type="number"
              value={textInput.style.fontSize}
              onChange={handleFontSizeChange}
              min="8"
              max="72"
              className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-300 mb-1">Color</label>
            <input
              type="color"
              value={textInput.style.color}
              onChange={handleColorChange}
              className="bg-transparent h-8 w-10 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-300 mb-1">Style</label>
            <div className="flex space-x-1">
              <button
                onClick={toggleBold}
                className={`p-1.5 rounded ${textInput.style.isBold ? "bg-blue-500" : "bg-gray-700 hover:bg-gray-600"} transition-colors`}
                aria-label="Bold"
                title="Bold"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 12H14C16.2091 12 18 10.2091 18 8C18 5.79086 16.2091 4 14 4H6V12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 12H15C17.2091 12 19 13.7909 19 16C19 18.2091 17.2091 20 15 20H6V12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                onClick={toggleItalic}
                className={`p-1.5 rounded ${textInput.style.isItalic ? "bg-blue-500" : "bg-gray-700 hover:bg-gray-600"} transition-colors`}
                aria-label="Italic"
                title="Italic"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 4H10M14 20H5M15 4L9 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col w-20">
            <label className="text-xs text-gray-300 mb-1">Rotation</label>
            <input
              type="number"
              value={textInput.style.rotation}
              onChange={handleRotationChange}
              min="-180"
              max="180"
              step="5"
              className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700"
            />
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="xs"
              onClick={cancelTextOverlay}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              icon={<X size={14} />}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="xs"
              onClick={() => {
                // Use a try-catch to handle any potential errors
                try {
                  confirmTextOverlay();
                } catch (err) {
                  console.error("Error confirming text overlay:", err);
                  // Provide fallback recovery
                  cancelTextOverlay();
                }
              }}
              icon={<Check size={14} />}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default TextOverlayEditor;
