import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "@/repo/workspace_hub";

interface Point {
  x: number;
  y: number;
}

interface DrawPath {
  id: string;
  path: Array<Point>;
  strokeWidth: number;
  color: string;
}

interface DrawingCanvasProps {
  isDrawing: boolean;
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>;
  currentPath: Array<Point>;
  setCurrentPath: React.Dispatch<React.SetStateAction<Array<Point>>>;
  imageRef: React.RefObject<HTMLImageElement |null>;
  saveChanges: () => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = observer(
  ({
    isDrawing,
    setIsDrawing,
    currentPath,
    setCurrentPath,
    imageRef,
    saveChanges,
  }) => {
    const imageEditorManager = workspaceHub.imageEditorManager;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawingPaths, setDrawingPaths] = useState<DrawPath[]>([]);
    const [currentDrawingSettings, setCurrentDrawingSettings] = useState({
      strokeWidth: 5, // Increased default stroke width for better visibility
      color: "#FF0000",
    });

    // Drawing functions
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (imageEditorManager.selectedTool !== "draw" || !canvasRef.current)
        return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    };

    const continueDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (
        !isDrawing ||
        imageEditorManager.selectedTool !== "draw" ||
        !canvasRef.current
      )
        return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setCurrentPath((prev) => [...prev, { x, y }]);
      drawOnCanvas();
    };

    const endDrawing = () => {
      if (!isDrawing || currentPath.length < 2) {
        setIsDrawing(false);
        setCurrentPath([]);
        return;
      }

      const newPath: DrawPath = {
        id: `path-${Date.now()}`,
        path: currentPath,
        strokeWidth: currentDrawingSettings.strokeWidth,
        color: currentDrawingSettings.color,
      };

      setDrawingPaths((prev) => [...prev, newPath]);
      setIsDrawing(false);
      setCurrentPath([]);
      savePathToImage(newPath);
    };

    const drawOnCanvas = () => {
      if (!canvasRef.current || currentPath.length < 2) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      // Clear canvas completely to prevent ghosting
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all existing paths
      drawingPaths.forEach((path) => {
        drawPath(ctx, path);
      });

      // Draw current path with consistent styling
      ctx.beginPath();
      ctx.strokeStyle = currentDrawingSettings.color;
      ctx.lineWidth = currentDrawingSettings.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Ensure no transparency
      ctx.globalAlpha = 1.0;
      // Use source-over composition
      ctx.globalCompositeOperation = "source-over";

      const startPoint = currentPath[0];
      ctx.moveTo(
        (startPoint.x * canvas.width) / 100,
        (startPoint.y * canvas.height) / 100
      );

      for (let i = 1; i < currentPath.length; i++) {
        const point = currentPath[i];
        ctx.lineTo(
          (point.x * canvas.width) / 100,
          (point.y * canvas.height) / 100
        );
      }

      ctx.stroke();
    };

    const drawPath = (ctx: CanvasRenderingContext2D, path: DrawPath) => {
      // Set consistent drawing style
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "source-over";

      const startPoint = path.path[0];
      ctx.moveTo(
        (startPoint.x * ctx.canvas.width) / 100,
        (startPoint.y * ctx.canvas.height) / 100
      );

      for (let i = 1; i < path.path.length; i++) {
        const point = path.path[i];
        ctx.lineTo(
          (point.x * ctx.canvas.width) / 100,
          (point.y * ctx.canvas.height) / 100
        );
      }

      ctx.stroke();
    };

    const savePathToImage = (path: DrawPath) => {
      if (!imageRef.current || !path || path.path.length < 2) return;

      // Create a temporary canvas to draw the path
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width =
        imageRef.current.naturalWidth || imageRef.current.width;
      tempCanvas.height =
        imageRef.current.naturalHeight || imageRef.current.height;

      const tempCtx = tempCanvas.getContext("2d", {
        alpha: true,
        willReadFrequently: true,
      });

      if (!tempCtx) return;

      // First, draw the current image onto the canvas
      if (imageEditorManager.currentBlob) {
        const img = new Image();

        img.onload = () => {
          // Draw the current image state
          tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

          // Draw the path with identical settings to the preview
          tempCtx.beginPath();
          tempCtx.strokeStyle = path.color;
          tempCtx.lineWidth = path.strokeWidth;
          tempCtx.lineCap = "round";
          tempCtx.lineJoin = "round";
          tempCtx.globalAlpha = 1.0; // Ensure no transparency
          tempCtx.globalCompositeOperation = "source-over";

          const startPoint = path.path[0];
          tempCtx.moveTo(
            (startPoint.x * tempCanvas.width) / 100,
            (startPoint.y * tempCanvas.height) / 100
          );

          for (let i = 1; i < path.path.length; i++) {
            const point = path.path[i];
            tempCtx.lineTo(
              (point.x * tempCanvas.width) / 100,
              (point.y * tempCanvas.height) / 100
            );
          }

          // Draw with full opacity
          tempCtx.stroke();

          // Convert to blob with high quality
          tempCanvas.toBlob(
            (blob) => {
              if (blob) {
                // Clear both canvases to prevent ghosting
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

                if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext("2d");
                  if (ctx) {
                    ctx.clearRect(
                      0,
                      0,
                      canvasRef.current.width,
                      canvasRef.current.height
                    );
                  }
                }

                // Load the new image with drawing into the editor
                imageEditorManager.loadImage(blob).then(() => {
                  // Add to history after loading
                  imageEditorManager.addToHistory(blob);
                });
              }
            },
            "image/png",
            1.0
          ); // Use PNG for best quality
        };

        // Use the current edited image URL
        img.src = imageEditorManager.editedImageUrl || "";

        // Prevent memory leaks
        img.onerror = () => {
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          console.error("Error loading image for drawing");
        };
      }

      // Also save using the store method
      saveChanges();
    };

    // Make sure canvas size matches the image
    useEffect(() => {
      if (canvasRef.current && imageRef.current) {
        // Set exact dimensions to match the image
        canvasRef.current.width = imageRef.current.width;
        canvasRef.current.height = imageRef.current.height;
      }
    }, [imageRef.current?.width, imageRef.current?.height]);

    // Update canvas when tool changes
    useEffect(() => {
      // Clear drawing state when changing tools
      if (imageEditorManager.selectedTool !== "draw") {
        setIsDrawing(false);
        setCurrentPath([]);
      }

      if (canvasRef.current && imageRef.current) {
        const canvas = canvasRef.current;
        canvas.width = imageRef.current.width;
        canvas.height = imageRef.current.height;

        // Redraw all paths
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawingPaths.forEach((path) => {
            drawPath(ctx, path);
          });
        }
      }
    }, [imageEditorManager.selectedTool]);

    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 20 }}
      >
        {/* Overlay with escape instructions */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs py-1 px-3 rounded whitespace-nowrap z-10">
          Drawing Mode - Click toolbar icons to exit
        </div>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          width={imageRef.current?.width || 800}
          height={imageRef.current?.height || 600}
          onMouseDown={(e) => {
            // Only start drawing if we're within the image bounds
            if (imageRef.current) {
              const rect = imageRef.current.getBoundingClientRect();
              if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
              ) {
                startDrawing(e);
              }
            }
          }}
          onMouseMove={continueDrawing}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
        />

        {/* Drawing controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 px-3 py-2 rounded-lg flex items-center space-x-3">
          <div className="flex items-center">
            <label className="text-white text-xs mr-2">Color:</label>
            <input
              type="color"
              value={currentDrawingSettings.color}
              onChange={(e) =>
                setCurrentDrawingSettings({
                  ...currentDrawingSettings,
                  color: e.target.value,
                })
              }
              className="w-6 h-6 rounded cursor-pointer border-0"
            />
          </div>

          <div className="flex items-center">
            <label className="text-white text-xs mr-2">Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={currentDrawingSettings.strokeWidth}
              onChange={(e) =>
                setCurrentDrawingSettings({
                  ...currentDrawingSettings,
                  strokeWidth: parseInt(e.target.value),
                })
              }
              className="w-24"
            />
            <span className="text-white text-xs ml-1">
              {currentDrawingSettings.strokeWidth}px
            </span>
          </div>
        </div>
      </div>
    );
  }
);

export default DrawingCanvas;
