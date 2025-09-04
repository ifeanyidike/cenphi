import React, { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { TextOverlay } from "../../../repo/managers/image_editor";
import TextOverlayEditor from "./TextOverlayEditor";
import CropOverlay from "./CropOverlay";
import DrawingCanvas from "./DrawingCanvas";
import AnnotationMarker from "./AnnotationMarker";
import ImageCanvasElement from "./ImageCanvasElement";
import { workspaceHub } from "@/repo/workspace_hub";

interface ImageCanvasProps {
  imageUrl: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  alt: string;
}

const ImageCanvas: React.FC<ImageCanvasProps> = observer(
  ({ imageUrl, containerRef, alt }) => {
    const { imageEditorManager } = workspaceHub;
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Text editing state
    const [textInput, setTextInput] = useState({
      isActive: false,
      id: null as string | null,
      text: "Add text here",
      position: { x: 50, y: 50 },
      style: {
        fontSize: 24,
        fontFamily: "Arial",
        color: "#ffffff",
        isBold: false,
        isItalic: false,
        rotation: 0,
      },
    });
    const [showTextControls, setShowTextControls] = useState(false);

    // Crop state
    const [showCropOverlay, setShowCropOverlay] = useState(false);
    const [cropPosition, setCropPosition] = useState({
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<
      Array<{ x: number; y: number }>
    >([]);

    // Draw text on image with improved draggable handling
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Handle auto-save when making adjustments
    const debouncedSave = useRef<number | null>(null);

    // Tracks if we're in text editing mode to prevent accidental clicks
    const [, setIsTextEditingMode] = useState(false);

    const saveChanges = () => {
      if (debouncedSave.current) {
        clearTimeout(debouncedSave.current);
      }
      debouncedSave.current = window.setTimeout(() => {
        imageEditorManager.applyAdjustments();
      }, 500);
    };

    // Update canvas when image loads or tool changes
    useEffect(() => {
      if (canvasRef.current && imageRef.current) {
        const canvas = canvasRef.current;
        canvas.width = imageRef.current.width;
        canvas.height = imageRef.current.height;
      }
    }, [imageEditorManager.editedImageUrl, imageEditorManager.selectedTool]);

    // Update text editing mode based on selected tool
    useEffect(() => {
      setIsTextEditingMode(imageEditorManager.selectedTool === "text");

      // Clear text input state when switching away from text tool
      if (imageEditorManager.selectedTool !== "text") {
        cancelTextOverlay();
      }
    }, [imageEditorManager.selectedTool]);

    useEffect(() => {
      return () => {
        // Reset text editing state when component unmounts
        setTextInput({
          isActive: false,
          id: null,
          text: "Add text here",
          position: { x: 50, y: 50 },
          style: {
            fontSize: 24,
            fontFamily: "Arial",
            color: "#ffffff",
            isBold: false,
            isItalic: false,
            rotation: 0,
          },
        });
        setShowTextControls(false);
      };
    }, []);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // If Escape is pressed while editing text, cancel
        if (e.key === "Escape" && textInput.isActive) {
          cancelTextOverlay();
        }

        // If Enter is pressed while editing text (with Ctrl/Cmd), confirm
        if (
          e.key === "Enter" &&
          (e.ctrlKey || e.metaKey) &&
          textInput.isActive
        ) {
          confirmTextOverlay();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [textInput.isActive]);

    // Track whether any overlay is being dragged to prevent image click events
    const [isAnyOverlayDragging, setIsAnyOverlayDragging] = useState(false);

    // Check if a point is near any existing text overlay
    const findOverlayAtPosition = (x: number, y: number) => {
      // Convert percentages to actual sizes
      if (!containerRef.current) return null;

      const containerRect = containerRef.current.getBoundingClientRect();
      const absoluteX = (x / 100) * containerRect.width;
      const absoluteY = (y / 100) * containerRect.height;

      // Check each overlay with a reasonable hit area
      const hitRadius = 30; // px

      return imageEditorManager.textOverlays.find((overlay) => {
        const overlayX = (overlay.x / 100) * containerRect.width;
        const overlayY = (overlay.y / 100) * containerRect.height;

        // Calculate distance
        const distance = Math.sqrt(
          Math.pow(absoluteX - overlayX, 2) + Math.pow(absoluteY - overlayY, 2)
        );

        return distance < hitRadius;
      });
    };

    // Handle image click based on active tool
    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
      // Don't process clicks if we're dragging text overlays
      if (isAnyOverlayDragging || !imageRef.current) return;

      if (textInput.isActive) return;

      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      switch (imageEditorManager.selectedTool) {
        case "annotate":
          imageEditorManager.addAnnotation(
            x,
            y,
            `Note ${imageEditorManager.annotations.length + 1}`
          );
          saveChanges();
          break;
        case "text": {
          // First check if we're clicking on or near an existing text overlay
          const existingOverlay = findOverlayAtPosition(x, y);

          if (existingOverlay) {
            // If there's text nearby, select it instead of creating new text
            imageEditorManager.setTool("select");
            editTextOverlay(existingOverlay);
          } else {
            // Otherwise create new text
            setTextInput({
              ...textInput,
              isActive: true,
              id: null,
              position: { x, y },
              text: "Add text here",
            });
            setShowTextControls(true);
            setTimeout(() => {
              if (textAreaRef.current) {
                textAreaRef.current.focus();
                textAreaRef.current.select();
              }
            }, 50);
          }
          break;
        }
        case "crop":
          setShowCropOverlay(true);
          setCropPosition({
            x: Math.max(0, x - 40),
            y: Math.max(0, y - 40),
            width: 80,
            height: 80,
          });
          break;
        case "zoom": {
          // Handle zoom on click - increment zoom at click point
          const newZoom = Math.min(300, imageEditorManager.zoom + 20);
          imageEditorManager.applyQuickAdjustment("zoom", newZoom);
          saveChanges();
          break;
        }
      }
    };

    // Edit existing text overlay
    const editTextOverlay = (overlay: TextOverlay) => {
      imageEditorManager.selectedTextOverlayId = overlay.id;

      setTextInput({
        isActive: true,
        id: overlay.id,
        text: overlay.text,
        position: { x: overlay.x, y: overlay.y },
        style: {
          fontSize: overlay.fontSize,
          fontFamily: overlay.fontFamily,
          color: overlay.color,
          isBold: overlay.isBold,
          isItalic: overlay.isItalic,
          rotation: overlay.rotation,
        },
      });
      setShowTextControls(true);
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          textAreaRef.current.select();
        }
      }, 50);
    };

    // Text overlay functionality
    // const confirmTextOverlay = () => {
    //   if (textInput.text.trim()) {
    //     if (textInput.id) {
    //       // Update existing overlay
    //       imageEditorManager.updateTextOverlay(textInput.id, {
    //         text: textInput.text,
    //         x: textInput.position.x,
    //         y: textInput.position.y,
    //         fontSize: textInput.style.fontSize,
    //         fontFamily: textInput.style.fontFamily,
    //         color: textInput.style.color,
    //         isBold: textInput.style.isBold,
    //         isItalic: textInput.style.isItalic,
    //         rotation: textInput.style.rotation,
    //       });
    //     } else {
    //       // Create new overlay
    //       const overlayId = imageEditorManager.addTextOverlay(
    //         textInput.position.x,
    //         textInput.position.y,
    //         textInput.text
    //       );

    //       imageEditorManager.updateTextOverlay(overlayId, {
    //         fontSize: textInput.style.fontSize,
    //         fontFamily: textInput.style.fontFamily,
    //         color: textInput.style.color,
    //         isBold: textInput.style.isBold,
    //         isItalic: textInput.style.isItalic,
    //         rotation: textInput.style.rotation,
    //       });
    //     }

    //     // Apply changes and add to history
    //     imageEditorManager.applyTextOverlays().then(() => {
    //       // Ensure history is updated after applying changes
    //       if (imageEditorManager.currentBlob) {
    //         imageEditorManager.addToHistory(imageEditorManager.currentBlob);
    //       }
    //     });
    //   }

    //   // Clear the editing state
    //   setTextInput({
    //     ...textInput,
    //     isActive: false,
    //     id: null,
    //     text: "Add text here",
    //   });

    //   setShowTextControls(false);

    //   // Automatically switch to select mode after adding text
    //   if (imageEditorManager.selectedTool === "text") {
    //     imageEditorManager.setTool("select");
    //   }
    // };

    // Text overlay functionality
    const confirmTextOverlay = () => {
      if (textInput.text.trim()) {
        if (textInput.id) {
          // Update existing overlay
          imageEditorManager.updateTextOverlay(textInput.id, {
            text: textInput.text,
            x: textInput.position.x,
            y: textInput.position.y,
            fontSize: textInput.style.fontSize,
            fontFamily: textInput.style.fontFamily,
            color: textInput.style.color,
            isBold: textInput.style.isBold,
            isItalic: textInput.style.isItalic,
            rotation: textInput.style.rotation,
          });
        } else {
          // Create new overlay
          const overlayId = imageEditorManager.addTextOverlay(
            textInput.position.x,
            textInput.position.y,
            textInput.text
          );

          imageEditorManager.updateTextOverlay(overlayId, {
            fontSize: textInput.style.fontSize,
            fontFamily: textInput.style.fontFamily,
            color: textInput.style.color,
            isBold: textInput.style.isBold,
            isItalic: textInput.style.isItalic,
            rotation: textInput.style.rotation,
          });
        }

        // Apply changes and add to history
        // NOTE: We're no longer adding to history inside of this function
        // because applyTextOverlays already does that
        // imageEditorManager.applyTextOverlays();
      }

      // Clear the editing state
      setTextInput({
        ...textInput,
        isActive: false,
        id: null,
        text: "Add text here",
      });

      setShowTextControls(false);

      // Automatically switch to select mode after adding text
      if (imageEditorManager.selectedTool === "text") {
        imageEditorManager.setTool("select");
      }
    };

    const cancelTextOverlay = () => {
      setTextInput({
        ...textInput,
        isActive: false,
        id: null,
        text: "Add text here",
      });

      setShowTextControls(false);
    };

    // For crop functionality
    const applyCrop = () => {
      imageEditorManager.setCropArea({
        x: cropPosition.x,
        y: cropPosition.y,
        width: cropPosition.width,
        height: cropPosition.height,
      });

      imageEditorManager.applyCrop();
      setShowCropOverlay(false);
    };

    const cancelCrop = () => {
      setShowCropOverlay(false);
    };

    // Calculate filter style based on adjustments
    const getFilterStyle = () => {
      let filterString = "";

      if (imageEditorManager.filter !== "none") {
        filterString += `${imageEditorManager.filter} `;
      }

      filterString += `brightness(${imageEditorManager.brightness}%) contrast(${imageEditorManager.contrast}%) saturate(${imageEditorManager.saturation}%)`;

      return filterString;
    };

    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ aspectRatio: "16/9" }}
      >
        {/* Loading overlay */}
        {imageEditorManager.processingImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
            <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-md flex flex-col items-center">
              <div className="animate-spin h-10 w-10 text-blue-500 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <p className="text-white text-sm font-medium">
                Processing image...
              </p>
            </div>
          </div>
        )}

        {/* The actual image */}
        <img
          ref={imageRef}
          src={imageEditorManager.editedImageUrl || imageUrl}
          alt={alt}
          className={`w-full h-full object-contain transition-transform duration-300 ${
            imageEditorManager.selectedTool === "text"
              ? "cursor-text"
              : imageEditorManager.selectedTool === "select"
                ? "cursor-default"
                : "cursor-pointer"
          }`}
          style={{
            transform: `scale(${imageEditorManager.zoom / 100}) rotate(${imageEditorManager.rotation}deg)`,
            filter: getFilterStyle(),
          }}
          onClick={handleImageClick}
        />

        {/* Text tool hint overlay */}
        {imageEditorManager.selectedTool === "text" && !textInput.isActive && (
          <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
            <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
              Click anywhere to add text or click on existing text to edit
            </div>
          </div>
        )}

        {/* Canvas for drawing - separated into different approaches */}
        {/* This canvas shows existing drawings but doesn't capture events */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `scale(${imageEditorManager.zoom / 100}) rotate(${imageEditorManager.rotation}deg)`,
            filter: getFilterStyle(),
          }}
        />

        {/* Drawing canvas component */}
        {imageEditorManager.selectedTool === "draw" && (
          <DrawingCanvas
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            currentPath={currentPath}
            setCurrentPath={setCurrentPath}
            imageRef={imageRef}
            saveChanges={saveChanges}
          />
        )}

        {/* Text overlay input component */}
        {textInput.isActive && (
          <TextOverlayEditor
            textInput={textInput}
            setTextInput={setTextInput}
            textAreaRef={textAreaRef}
            showTextControls={showTextControls}
            confirmTextOverlay={confirmTextOverlay}
            cancelTextOverlay={cancelTextOverlay}
          />
        )}

        {/* Improved crop overlay component */}
        {showCropOverlay && (
          <CropOverlay
            cropPosition={cropPosition}
            setCropPosition={setCropPosition}
            applyCrop={applyCrop}
            cancelCrop={cancelCrop}
          />
        )}

        {/* Display annotations */}
        {imageEditorManager.annotations.map((anno) => (
          <AnnotationMarker key={anno.id} annotation={anno} />
        ))}

        {/* Display text overlays with draggable support */}
        {imageEditorManager.textOverlays.map((overlay) => (
          <ImageCanvasElement
            key={overlay.id}
            containerRef={containerRef}
            editTextOverlay={editTextOverlay}
            overlay={overlay}
            setIsAnyOverlayDragging={setIsAnyOverlayDragging}
            isSelected={imageEditorManager.selectedTextOverlayId === overlay.id}
          />
        ))}
      </div>
    );
  }
);

export default ImageCanvas;
