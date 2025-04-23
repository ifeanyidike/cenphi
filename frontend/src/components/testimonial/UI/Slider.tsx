// UI/Slider.tsx
import React, { useState, useEffect, useRef } from "react";

interface SliderProps {
  min: number;
  max: number;
  value: number;
  step?: number;
  onChange: (value: number) => void;
  onChangeEnd?: () => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  value,
  step = 1,
  onChange,
  onChangeEnd,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newValue = min + clickPosition * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    onChange(clampedValue);
    if (onChangeEnd) onChangeEnd();
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (onChangeEnd) onChangeEnd();
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const dragPosition = (e.clientX - rect.left) / rect.width;
    const newValue = min + dragPosition * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    onChange(clampedValue);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging]);

  return (
    <div className={`relative h-6 flex items-center ${className}`}>
      <div
        ref={trackRef}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer"
        onClick={handleTrackClick}
      >
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div
        className="absolute w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow-md transform -translate-y-1/2 cursor-grab active:cursor-grabbing"
        style={{ left: `calc(${percentage}% - 8px)`, top: "50%" }}
        onMouseDown={handleDragStart}
      ></div>
    </div>
  );
};
