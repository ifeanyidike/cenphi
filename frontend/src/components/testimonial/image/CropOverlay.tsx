import React, { useState } from "react";
import { Button } from "../UI";
import { X, Crop } from "../UI/icons";

interface Point {
  x: number;
  y: number;
}

interface CropPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropOverlayProps {
  cropPosition: CropPosition;
  setCropPosition: React.Dispatch<React.SetStateAction<CropPosition>>;
  applyCrop: () => void;
  cancelCrop: () => void;
}

const CropOverlay: React.FC<CropOverlayProps> = ({
  cropPosition,
  setCropPosition,
  applyCrop,
  cancelCrop,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);

  // Crop functionality
  const startCropDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });

    setIsDragging(true);
  };

  const handleCropDrag = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;

    e.stopPropagation();
    e.preventDefault();

    // Get delta movement in percentage terms
    const parentElement = e.currentTarget.parentElement;
    if (!parentElement) return;

    const containerRect = parentElement.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / containerRect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / containerRect.height) * 100;

    setCropPosition({
      ...cropPosition,
      x: Math.max(
        0,
        Math.min(100 - cropPosition.width, cropPosition.x + deltaX)
      ),
      y: Math.max(
        0,
        Math.min(100 - cropPosition.height, cropPosition.y + deltaY)
      ),
    });

    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleCropResize = (e: React.MouseEvent, corner: string) => {
    if (!isDragging || !dragStart) return;

    e.stopPropagation();
    e.preventDefault();

    const parentElement = e.currentTarget.parentElement?.parentElement;
    if (!parentElement) return;

    const containerRect = parentElement.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / containerRect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / containerRect.height) * 100;

    const newPos = { ...cropPosition };

    switch (corner) {
      case "topLeft":
        newPos.x = Math.max(
          0,
          Math.min(newPos.x + newPos.width - 10, newPos.x + deltaX)
        );
        newPos.y = Math.max(
          0,
          Math.min(newPos.y + newPos.height - 10, newPos.y + deltaY)
        );
        newPos.width = Math.max(10, newPos.width - deltaX);
        newPos.height = Math.max(10, newPos.height - deltaY);
        break;
      case "topRight":
        newPos.y = Math.max(
          0,
          Math.min(newPos.y + newPos.height - 10, newPos.y + deltaY)
        );
        newPos.width = Math.max(
          10,
          Math.min(100 - newPos.x, newPos.width + deltaX)
        );
        newPos.height = Math.max(10, newPos.height - deltaY);
        break;
      case "bottomLeft":
        newPos.x = Math.max(
          0,
          Math.min(newPos.x + newPos.width - 10, newPos.x + deltaX)
        );
        newPos.width = Math.max(10, newPos.width - deltaX);
        newPos.height = Math.max(
          10,
          Math.min(100 - newPos.y, newPos.height + deltaY)
        );
        break;
      case "bottomRight":
        newPos.width = Math.max(
          10,
          Math.min(100 - newPos.x, newPos.width + deltaX)
        );
        newPos.height = Math.max(
          10,
          Math.min(100 - newPos.y, newPos.height + deltaY)
        );
        break;
    }

    setCropPosition(newPos);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const endCropDrag = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <div
      className="absolute inset-0 bg-black bg-opacity-60 z-20"
      onMouseUp={endCropDrag}
      onMouseLeave={endCropDrag}
    >
      <div
        className="absolute border-2 border-white cursor-move"
        style={{
          left: `${cropPosition.x}%`,
          top: `${cropPosition.y}%`,
          width: `${cropPosition.width}%`,
          height: `${cropPosition.height}%`,
        }}
        onMouseDown={(e) => startCropDrag(e)}
        onMouseMove={isDragging ? handleCropDrag : undefined}
      >
        {/* Overlay instructions */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs py-1 px-3 rounded whitespace-nowrap">
          Drag to move, drag corners to resize
        </div>

        {/* Control buttons */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={cancelCrop}
              className="border-gray-600 text-gray-300 bg-black bg-opacity-50"
              icon={<X size={14} />}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="xs"
              onClick={applyCrop}
              icon={<Crop size={14} />}
            >
              Apply Crop
            </Button>
          </div>
        </div>

        {/* Improved resize handles with tooltips */}
        <div
          className="absolute -top-2 -left-2 w-5 h-5 bg-white rounded-full cursor-nwse-resize shadow-md flex items-center justify-center hover:scale-110 transition-transform"
          onMouseDown={(e) => {
            startCropDrag(e);
            const onMouseMove = (e: MouseEvent) =>
              handleCropResize(e as any, "topLeft");
            const onMouseUp = () => {
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);
              endCropDrag();
            };
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
          }}
        >
          <span className="text-gray-500 text-xs">↖</span>
        </div>

        <div
          className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full cursor-nesw-resize shadow-md flex items-center justify-center hover:scale-110 transition-transform"
          onMouseDown={(e) => {
            startCropDrag(e);
            const onMouseMove = (e: MouseEvent) =>
              handleCropResize(e as any, "topRight");
            const onMouseUp = () => {
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);
              endCropDrag();
            };
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
          }}
        >
          <span className="text-gray-500 text-xs">↗</span>
        </div>

        <div
          className="absolute -bottom-2 -left-2 w-5 h-5 bg-white rounded-full cursor-nesw-resize shadow-md flex items-center justify-center hover:scale-110 transition-transform"
          onMouseDown={(e) => {
            startCropDrag(e);
            const onMouseMove = (e: MouseEvent) =>
              handleCropResize(e as any, "bottomLeft");
            const onMouseUp = () => {
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);
              endCropDrag();
            };
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
          }}
        >
          <span className="text-gray-500 text-xs">↙</span>
        </div>

        <div
          className="absolute -bottom-2 -right-2 w-5 h-5 bg-white rounded-full cursor-nwse-resize shadow-md flex items-center justify-center hover:scale-110 transition-transform"
          onMouseDown={(e) => {
            startCropDrag(e);
            const onMouseMove = (e: MouseEvent) =>
              handleCropResize(e as any, "bottomRight");
            const onMouseUp = () => {
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);
              endCropDrag();
            };
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
          }}
        >
          <span className="text-gray-500 text-xs">↘</span>
        </div>
      </div>
    </div>
  );
};

export default CropOverlay;
