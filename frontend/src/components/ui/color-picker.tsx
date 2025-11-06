// src/components/ui/color-picker.tsx
import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { hexToRgb, rgbToHex } from "@/utils/color-utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ColorPicker({
  color,
  onChange,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [internal, setInternal] = useState(color);

  // Update internal state when color prop changes
  React.useEffect(() => {
    setInternal(color);
  }, [color]);

  // Handle hex input changes
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInternal(value);

    // Only trigger onChange when we have a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            aria-label="Open color picker"
            className={cn(
              "h-9 w-9 rounded-md border border-slate-200 shadow-sm",
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:ring-1 hover:ring-slate-300 cursor-pointer"
            )}
            style={{ backgroundColor: internal }}
          />
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-auto p-4">
          <div className="space-y-3">
            {/* Color picker canvas */}
            <ColorCanvas
              color={internal}
              onChange={setInternal}
              onChangeComplete={onChange}
            />

            {/* Hex input */}
            <div className="space-y-1">
              <Label htmlFor="hex-input" className="text-xs">
                Hex
              </Label>
              <Input
                id="hex-input"
                value={internal}
                onChange={handleHexChange}
                className="h-8 font-mono"
              />
            </div>

            {/* RGB sliders */}
            <RGBSliders
              color={internal}
              onChange={setInternal}
              onChangeComplete={onChange}
            />
          </div>
        </PopoverContent>
      </Popover>

      <Input
        value={internal}
        onChange={handleHexChange}
        className={cn("font-mono", disabled && "opacity-50 cursor-not-allowed")}
        disabled={disabled}
      />
    </div>
  );
}

// Color canvas component for hue/saturation picking
function ColorCanvas({
  color,
  onChange,
  onChangeComplete,
}: {
  color: string;
  onChange: (color: string) => void;
  onChangeComplete: (color: string) => void;
}) {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleColorSelect(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleColorSelect(e);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onChangeComplete(color);
    }
  };

  const handleColorSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const y = Math.min(Math.max(0, e.clientY - rect.top), rect.height);

    // Convert position to HSV, then to RGB
    const hue = (x / rect.width) * 360;
    const saturation = (y / rect.height) * 100;
    const value = 100; // Always use max value for vibrant colors

    const rgb = hsvToRgb(hue, saturation, value);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    onChange(hex);
  };

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        onChangeComplete(color);
      };

      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isDragging, color, onChangeComplete]);

  return (
    <div className="relative">
      <div
        ref={canvasRef}
        className="h-40 w-60 rounded-md cursor-crosshair"
        style={{
          background:
            "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className="absolute inset-0 rounded-md"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, #000 100%)",
          }}
        />
      </div>
    </div>
  );
}

// RGB slider controls
function RGBSliders({
  color,
  onChange,
  onChangeComplete,
}: {
  color: string;
  onChange: (color: string) => void;
  onChangeComplete: (color: string) => void;
}) {
  const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };

  const handleChange = (component: "r" | "g" | "b", value: number) => {
    const newRgb = { ...rgb, [component]: value };
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleBlur = () => {
    onChangeComplete(color);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <Label htmlFor="r-slider">R</Label>
          <span>{rgb.r}</span>
        </div>
        <input
          id="r-slider"
          type="range"
          min="0"
          max="255"
          value={rgb.r}
          onChange={(e) => handleChange("r", parseInt(e.target.value))}
          onBlur={handleBlur}
          className="w-full accent-red-500"
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <Label htmlFor="g-slider">G</Label>
          <span>{rgb.g}</span>
        </div>
        <input
          id="g-slider"
          type="range"
          min="0"
          max="255"
          value={rgb.g}
          onChange={(e) => handleChange("g", parseInt(e.target.value))}
          onBlur={handleBlur}
          className="w-full accent-green-500"
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <Label htmlFor="b-slider">B</Label>
          <span>{rgb.b}</span>
        </div>
        <input
          id="b-slider"
          type="range"
          min="0"
          max="255"
          value={rgb.b}
          onChange={(e) => handleChange("b", parseInt(e.target.value))}
          onBlur={handleBlur}
          className="w-full accent-blue-500"
        />
      </div>
    </div>
  );
}

// Helper function to convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number) {
  h = h % 360;
  s = s / 100;
  v = v / 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// Color swatch component
interface ColorSwatchProps {
  color: string;
  active?: boolean;
  onClick?: () => void;
  tooltip?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ColorSwatch({
  color,
  active = false,
  onClick,
  tooltip,
  className,
  size = "md",
}: ColorSwatchProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const swatch = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border shadow-sm transition-all duration-200",
        active
          ? "ring-2 ring-offset-2 ring-indigo-500 border-transparent"
          : "border-slate-200 hover:ring-1 hover:ring-slate-300",
        sizeClasses[size],
        onClick ? "cursor-pointer" : "cursor-default",
        className
      )}
      style={{ backgroundColor: color }}
      aria-label={tooltip || `Select color ${color}`}
    />
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{swatch}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return swatch;
}
