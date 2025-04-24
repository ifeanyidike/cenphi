import {
  Dispatch,
  FC,
  RefObject,
  SetStateAction,
  useRef,
  useState,
  useEffect,
} from "react";
import Draggable from "react-draggable";
import { TextOverlay } from "../../../repo/managers/image_editor";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "@/repo/workspace_hub";

type ImageCanvasElementProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  overlay: TextOverlay;
  setIsAnyOverlayDragging: Dispatch<SetStateAction<boolean>>;
  editTextOverlay: (overlay: TextOverlay) => void;
  isSelected: boolean;
};

const ImageCanvasElement: FC<ImageCanvasElementProps> = ({
  containerRef,
  overlay,
  setIsAnyOverlayDragging,
  editTextOverlay,
  isSelected,
}) => {
  const imageEditorManager = workspaceHub.imageEditorManager;
  const [containerWidth, setContainerWidth] = useState(
    containerRef.current?.offsetWidth || 100
  );
  const [containerHeight, setContainerHeight] = useState(
    containerRef.current?.offsetHeight || 100
  );

  // Track drag position internally instead of relying on controlled position
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Update container dimensions when window resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };

    window.addEventListener("resize", updateDimensions);
    updateDimensions(); // Initial call

    return () => window.removeEventListener("resize", updateDimensions);
  }, [containerRef]);

  // Update drag position when overlay position changes (unless we're currently dragging)
  useEffect(() => {
    if (!isDragging) {
      setDragPosition({
        x: (overlay.x / 100) * containerWidth,
        y: (overlay.y / 100) * containerHeight,
      });
    }
  }, [overlay.x, overlay.y, containerWidth, containerHeight, isDragging]);

  // Keep track of the drag distance to distinguish between clicks and drags
  const dragDistance = useRef({ x: 0, y: 0 });
  // Store the start position to calculate distance
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleTextDragStop = (id: string, x: number, y: number) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = (x / containerRect.width) * 100;
    const relativeY = (y / containerRect.height) * 100;

    // Update position in store
    imageEditorManager.updateTextOverlay(id, {
      x: Math.max(0, Math.min(100, relativeX)),
      y: Math.max(0, Math.min(100, relativeY)),
    });

    // Save changes to ensure they're added to history
    // imageEditorManager.applyTextOverlays().then(() => {
    //   if (imageEditorManager.currentBlob) {
    //     imageEditorManager.addToHistory(imageEditorManager.currentBlob);
    //   }
    // });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    imageEditorManager.setTool("select");

    imageEditorManager.selectedTextOverlayId = overlay.id;
    setTimeout(() => {
      editTextOverlay(overlay);
    }, 20);
  };

  const isSelectMode = imageEditorManager.selectedTool === "select";

  // Enhanced visual styling to make selection state clearer
  const borderStyle = isSelected
    ? "border-blue-500 bg-blue-500 bg-opacity-10"
    : isSelectMode
      ? "border-transparent"
      : "border-transparent";

  return (
    <Draggable
      key={overlay.id}
      // Use position with internal state to make dragging work properly
      position={dragPosition}
      onStart={(e, data) => {
        // Don't allow dragging unless in select mode
        if (!isSelectMode) {
          return false;
        }

        // Automatically select the overlay when starting a drag
        imageEditorManager.selectedTextOverlayId = overlay.id;

        // Record start position
        dragStartPos.current = { x: data.x, y: data.y };
        // Set both local and global dragging state
        setIsDragging(true);
        setIsAnyOverlayDragging(true);
        // Important: Stop propagation to prevent image click
        e.stopPropagation();
      }}
      onDrag={(e, data) => {
        // Update the drag position in state
        setDragPosition({ x: data.x, y: data.y });

        // Calculate and update drag distance
        dragDistance.current = {
          x: Math.abs(data.x - dragStartPos.current.x),
          y: Math.abs(data.y - dragStartPos.current.y),
        };
        // Important: Stop propagation to prevent image click
        e.stopPropagation();
      }}
      onStop={(e, data) => {
        // Important: Stop propagation to prevent image click
        e.stopPropagation();

        // Only update position if we've dragged more than a tiny amount
        if (dragDistance.current.x > 3 || dragDistance.current.y > 3) {
          handleTextDragStop(overlay.id, data.x, data.y);
        } else {
          // If it was just a small movement or a click, select the text
          imageEditorManager.selectedTextOverlayId = overlay.id;
        }

        // Reset drag states
        setIsDragging(false);
        setIsAnyOverlayDragging(false);
        dragDistance.current = { x: 0, y: 0 };
      }}
      bounds="parent"
      // Disable dragging when not in select mode
      disabled={!isSelectMode}
    >
      <div
        className={`absolute z-10 select-none rounded-sm ${
          isSelectMode
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default"
        } group transform -translate-x-1/2 -translate-y-1/2 p-2 border-2 ${borderStyle}
            ${isSelectMode ? "hover:border-blue-500 hover:bg-blue-500 hover:bg-opacity-5" : ""}`}
        onClick={(e) => {
          e.stopPropagation(); // Prevent clicking through to the image
          // Only trigger selection in select mode
          if (isSelectMode) {
            imageEditorManager.selectedTextOverlayId = overlay.id;
          } else if (imageEditorManager.selectedTool === "text") {
            // If in text mode, switch to select mode and edit this text
            imageEditorManager.setTool("select");
            imageEditorManager.selectedTextOverlayId = overlay.id;
            editTextOverlay(overlay);
          }
        }}
        onDoubleClick={handleDoubleClick}
        style={{
          // These transforms are used for internal positioning within the draggable wrapper
          // The draggable component manages the overall position
          transform: `rotate(${overlay.rotation}deg)`,
          // Setting top/left to 0 because Draggable will position the element
          top: 0,
          left: 0,
        }}
      >
        <div
          className="text-center relative"
          style={{
            fontSize: `${overlay.fontSize}px`,
            fontFamily: overlay.fontFamily,
            fontWeight: overlay.isBold ? "bold" : "normal",
            fontStyle: overlay.isItalic ? "italic" : "normal",
            color: overlay.color,
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            userSelect: "none",
          }}
        >
          {overlay.text}

          {/* Edit/Delete controls that appear on hover or when selected */}
          {isSelectMode && (isSelected || true) && (
            <div
              className={`absolute -top-8 left-1/2 transform -translate-x-1/2 
                  ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} 
                  transition-opacity flex space-x-1 bg-black bg-opacity-75 p-1 rounded shadow-lg`}
            >
              <button
                className="p-1 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  imageEditorManager.setTool("select");
                  imageEditorManager.selectedTextOverlayId = overlay.id;

                  setTimeout(() => {
                    editTextOverlay(overlay);
                  }, 50);
                }}
                title="Edit text"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                className="p-1 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  imageEditorManager.deleteTextOverlay(overlay.id);
                }}
                title="Delete text"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 6h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};

export default observer(ImageCanvasElement);
