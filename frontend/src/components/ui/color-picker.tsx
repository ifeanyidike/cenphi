// // src/components/ui/color-picker.tsx
// import React, { useState, useEffect, useRef } from "react";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Slider } from "@/components/ui/slider";
// import { Input } from "@/components/ui/input";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { cn } from "@/lib/utils";
// import { Palette, Check } from "lucide-react";

// interface ColorPickerProps {
//   color: string;
//   onChange: (color: string) => void;
//   className?: string;
// }

// interface ColorSwatchProps {
//   color: string;
//   active?: boolean;
//   onClick: () => void;
//   tooltip?: string;
//   size?: "sm" | "md" | "lg";
// }

// interface RGBColor {
//   r: number;
//   g: number;
//   b: number;
// }

// interface HSLColor {
//   h: number;
//   s: number;
//   l: number;
// }

// // Common brand colors
// const presetColors = [
//   "#0EA5E9", // blue
//   "#6366F1", // indigo
//   "#8B5CF6", // violet
//   "#D946EF", // fuchsia
//   "#EC4899", // pink
//   "#F43F5E", // rose
//   "#EF4444", // red
//   "#F97316", // orange
//   "#F59E0B", // amber
//   "#84CC16", // lime
//   "#10B981", // emerald
//   "#14B8A6", // teal
// ];

// // Convert hex to RGB
// const hexToRgb = (hex: string): RGBColor | null => {
//   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//   return result
//     ? {
//         r: parseInt(result[1], 16),
//         g: parseInt(result[2], 16),
//         b: parseInt(result[3], 16),
//       }
//     : null;
// };

// // Convert RGB to hex
// const rgbToHex = (r: number, g: number, b: number): string => {
//   return `#${[r, g, b]
//     .map((x) => {
//       const hex = Math.round(x).toString(16);
//       return hex.length === 1 ? "0" + hex : hex;
//     })
//     .join("")}`;
// };

// // Convert RGB to HSL
// const rgbToHsl = (r: number, g: number, b: number): HSLColor => {
//   r /= 255;
//   g /= 255;
//   b /= 255;

//   const max = Math.max(r, g, b);
//   const min = Math.min(r, g, b);
//   let h,
//     s,
//     l = (max + min) / 2;

//   if (max === min) {
//     h = s = 0; // achromatic
//   } else {
//     const d = max - min;
//     s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

//     switch (max) {
//       case r:
//         h = (g - b) / d + (g < b ? 6 : 0);
//         break;
//       case g:
//         h = (b - r) / d + 2;
//         break;
//       case b:
//         h = (r - g) / d + 4;
//         break;
//       default:
//         h = 0;
//     }

//     h /= 6;
//   }

//   return { h: h * 360, s: s * 100, l: l * 100 };
// };

// // Convert HSL to RGB
// const hslToRgb = (h: number, s: number, l: number): RGBColor => {
//   h /= 360;
//   s /= 100;
//   l /= 100;

//   let r, g, b;

//   if (s === 0) {
//     r = g = b = l; // achromatic
//   } else {
//     const hue2rgb = (p: number, q: number, t: number) => {
//       if (t < 0) t += 1;
//       if (t > 1) t -= 1;
//       if (t < 1 / 6) return p + (q - p) * 6 * t;
//       if (t < 1 / 2) return q;
//       if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
//       return p;
//     };

//     const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
//     const p = 2 * l - q;

//     r = hue2rgb(p, q, h + 1 / 3);
//     g = hue2rgb(p, q, h);
//     b = hue2rgb(p, q, h - 1 / 3);
//   }

//   return { r: r * 255, g: g * 255, b: b * 255 };
// };

// // Color Swatch Component
// export const ColorSwatch: React.FC<ColorSwatchProps> = ({
//   color,
//   active = false,
//   onClick,
//   tooltip,
//   size = "md",
// }) => {
//   const sizes = {
//     sm: "h-6 w-6",
//     md: "h-8 w-8",
//     lg: "h-10 w-10",
//   };

//   return (
//     <TooltipProvider>
//       <Tooltip delayDuration={300}>
//         <TooltipTrigger asChild>
//           <button
//             type="button"
//             className={cn(
//               sizes[size],
//               "rounded-full relative transition-all duration-200",
//               active ? "ring-2 ring-offset-2 ring-slate-400" : "hover:scale-110"
//             )}
//             style={{ backgroundColor: color }}
//             onClick={onClick}
//           >
//             {active && (
//               <span className="absolute inset-0 flex items-center justify-center">
//                 <Check className="h-4 w-4 text-white drop-shadow-md" />
//               </span>
//             )}
//           </button>
//         </TooltipTrigger>
//         {tooltip && (
//           <TooltipContent side="top">
//             <p className="text-xs">{tooltip}</p>
//           </TooltipContent>
//         )}
//       </Tooltip>
//     </TooltipProvider>
//   );
// };

// // Main Color Picker Component
// export const ColorPicker: React.FC<ColorPickerProps> = ({
//   color,
//   onChange,
//   className,
// }) => {
//   const [activeTab, setActiveTab] = useState<string>("picker");
//   const [rgbValues, setRgbValues] = useState<RGBColor>({ r: 0, g: 0, b: 0 });
//   const [hslValues, setHslValues] = useState<HSLColor>({ h: 0, s: 0, l: 0 });
//   const [hexValue, setHexValue] = useState<string>("#000000");
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const colorWheelRef = useRef<HTMLDivElement>(null);

//   // Initialize colors
//   useEffect(() => {
//     const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };
//     const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

//     setRgbValues(rgb);
//     setHslValues(hsl);
//     setHexValue(color);

//     if (canvasRef.current) {
//       drawColorWheel();
//     }
//   }, [color]);

//   // Draw the color wheel
//   const drawColorWheel = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     const width = canvas.width;
//     const height = canvas.height;
//     const centerX = width / 2;
//     const centerY = height / 2;
//     const radius = Math.min(centerX, centerY) - 5;

//     ctx.clearRect(0, 0, width, height);

//     // Draw color wheel
//     for (let angle = 0; angle < 360; angle += 1) {
//       const startAngle = ((angle - 1) * Math.PI) / 180;
//       const endAngle = (angle * Math.PI) / 180;

//       ctx.beginPath();
//       ctx.moveTo(centerX, centerY);
//       ctx.arc(centerX, centerY, radius, startAngle, endAngle);
//       ctx.closePath();

//       // Set color based on HSL
//       const hue = angle;
//       const saturation = 100;
//       const lightness = 50;

//       const rgb = hslToRgb(hue, saturation, lightness);
//       ctx.fillStyle = rgbToHex(rgb.r, rgb.g, rgb.b);
//       ctx.fill();
//     }

//     // Draw saturation/lightness gradient
//     const gradientSize = 150;
//     const gradientX = (width - gradientSize) / 2;
//     const gradientY = centerY + radius + 20;

//     // Create horizontal gradient (saturation)
//     const saturationGradient = ctx.createLinearGradient(
//       gradientX,
//       gradientY,
//       gradientX + gradientSize,
//       gradientY
//     );
//     saturationGradient.addColorStop(0, `hsl(${hslValues.h}, 0%, 50%)`);
//     saturationGradient.addColorStop(1, `hsl(${hslValues.h}, 100%, 50%)`);

//     ctx.fillStyle = saturationGradient;
//     ctx.fillRect(gradientX, gradientY, gradientSize, 20);

//     // Create vertical gradient (lightness)
//     const lightnessGradient = ctx.createLinearGradient(
//       gradientX,
//       gradientY + 30,
//       gradientX + gradientSize,
//       gradientY + 30
//     );
//     lightnessGradient.addColorStop(
//       0,
//       `hsl(${hslValues.h}, ${hslValues.s}%, 0%)`
//     );
//     lightnessGradient.addColorStop(
//       0.5,
//       `hsl(${hslValues.h}, ${hslValues.s}%, 50%)`
//     );
//     lightnessGradient.addColorStop(
//       1,
//       `hsl(${hslValues.h}, ${hslValues.s}%, 100%)`
//     );

//     ctx.fillStyle = lightnessGradient;
//     ctx.fillRect(gradientX, gradientY + 30, gradientSize, 20);
//   };

//   // Update color when wheel is clicked
//   const handleColorWheelClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const rect = canvas.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     const centerX = canvas.width / 2;
//     const centerY = canvas.height / 2;

//     // Calculate distance from center
//     const dx = x - centerX;
//     const dy = y - centerY;
//     const distance = Math.sqrt(dx * dx + dy * dy);

//     // Check if click is within the color wheel
//     if (distance <= Math.min(centerX, centerY) - 5) {
//       // Calculate angle (hue)
//       let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
//       if (angle < 0) angle += 360;

//       // Update HSL values
//       const newHslValues = { ...hslValues, h: angle };
//       setHslValues(newHslValues);

//       // Convert to RGB and update
//       const rgb = hslToRgb(angle, hslValues.s, hslValues.l);
//       const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

//       setRgbValues(rgb);
//       setHexValue(hex);
//       onChange(hex);
//     } else {
//       // Check if click is on the saturation gradient
//       const gradientSize = 150;
//       const gradientX = (canvas.width - gradientSize) / 2;
//       const gradientY = centerY + (Math.min(centerX, centerY) - 5) + 20;

//       if (
//         x >= gradientX &&
//         x <= gradientX + gradientSize &&
//         y >= gradientY &&
//         y <= gradientY + 20
//       ) {
//         // Calculate saturation percentage
//         const saturation = ((x - gradientX) / gradientSize) * 100;

//         // Update HSL values
//         const newHslValues = { ...hslValues, s: saturation };
//         setHslValues(newHslValues);

//         // Convert to RGB and update
//         const rgb = hslToRgb(hslValues.h, saturation, hslValues.l);
//         const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

//         setRgbValues(rgb);
//         setHexValue(hex);
//         onChange(hex);
//       }

//       // Check if click is on the lightness gradient
//       if (
//         x >= gradientX &&
//         x <= gradientX + gradientSize &&
//         y >= gradientY + 30 &&
//         y <= gradientY + 50
//       ) {
//         // Calculate lightness percentage
//         const lightness = ((x - gradientX) / gradientSize) * 100;

//         // Update HSL values
//         const newHslValues = { ...hslValues, l: lightness };
//         setHslValues(newHslValues);

//         // Convert to RGB and update
//         const rgb = hslToRgb(hslValues.h, hslValues.s, lightness);
//         const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

//         setRgbValues(rgb);
//         setHexValue(hex);
//         onChange(hex);
//       }
//     }
//   };

//   // Update drawing when HSL values change
//   useEffect(() => {
//     drawColorWheel();
//   }, [hslValues]);

//   // Handle hex input change
//   const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setHexValue(value);

//     // Validate and update colors
//     if (/^#[0-9A-F]{6}$/i.test(value)) {
//       const rgb = hexToRgb(value) || { r: 0, g: 0, b: 0 };
//       const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

//       setRgbValues(rgb);
//       setHslValues(hsl);
//       onChange(value);
//     }
//   };

//   // Handle RGB slider change
//   const handleRgbChange = (channel: keyof RGBColor, value: number) => {
//     const newRgbValues = { ...rgbValues, [channel]: value };
//     setRgbValues(newRgbValues);

//     const hex = rgbToHex(newRgbValues.r, newRgbValues.g, newRgbValues.b);
//     const hsl = rgbToHsl(newRgbValues.r, newRgbValues.g, newRgbValues.b);

//     setHexValue(hex);
//     setHslValues(hsl);
//     onChange(hex);
//   };

//   // Handle HSL slider change
//   const handleHslChange = (channel: keyof HSLColor, value: number) => {
//     const newHslValues = { ...hslValues, [channel]: value };
//     setHslValues(newHslValues);

//     const rgb = hslToRgb(newHslValues.h, newHslValues.s, newHslValues.l);
//     const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

//     setRgbValues(rgb);
//     setHexValue(hex);
//     onChange(hex);
//   };

//   return (
//     <div className={cn("p-4 border rounded-lg bg-white", className)}>
//       <Tabs value={activeTab} onValueChange={setActiveTab}>
//         <TabsList className="mb-4 grid grid-cols-3 w-full">
//           <TabsTrigger value="picker" className="flex items-center gap-1.5">
//             <Palette className="h-4 w-4" />
//             <span>Picker</span>
//           </TabsTrigger>
//           <TabsTrigger value="rgb">RGB</TabsTrigger>
//           <TabsTrigger value="hsl">HSL</TabsTrigger>
//         </TabsList>

//         <TabsContent value="picker" className="space-y-4">
//           <div className="flex flex-col items-center">
//             <div ref={colorWheelRef} className="relative">
//               <canvas
//                 ref={canvasRef}
//                 width={250}
//                 height={280}
//                 onClick={handleColorWheelClick}
//                 className="cursor-crosshair"
//               />

//               <div
//                 className="absolute top-4 left-4 right-4 bottom-4 pointer-events-none flex items-center justify-center"
//                 style={{
//                   background: hexValue,
//                   borderRadius: "50%",
//                   opacity: 0.3,
//                 }}
//               />
//             </div>

//             <div className="w-full flex items-center mt-4 gap-2">
//               <div
//                 className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
//                 style={{ backgroundColor: hexValue }}
//               />
//               <Input
//                 value={hexValue}
//                 onChange={handleHexChange}
//                 className="w-32 h-9"
//                 maxLength={7}
//               />
//             </div>
//           </div>

//           <div>
//             <h4 className="text-sm font-medium mb-2">Presets</h4>
//             <div className="grid grid-cols-6 gap-2">
//               {presetColors.map((presetColor) => (
//                 <ColorSwatch
//                   key={presetColor}
//                   color={presetColor}
//                   active={presetColor.toLowerCase() === hexValue.toLowerCase()}
//                   onClick={() => {
//                     const rgb = hexToRgb(presetColor) || { r: 0, g: 0, b: 0 };
//                     const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

//                     setRgbValues(rgb);
//                     setHslValues(hsl);
//                     setHexValue(presetColor);
//                     onChange(presetColor);
//                   }}
//                 />
//               ))}
//             </div>
//           </div>
//         </TabsContent>

//         <TabsContent value="rgb" className="space-y-4">
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <label className="text-sm font-medium">Red</label>
//                 <span className="text-sm text-gray-500">
//                   {Math.round(rgbValues.r)}
//                 </span>
//               </div>
//               <Slider
//                 value={[rgbValues.r]}
//                 min={0}
//                 max={255}
//                 step={1}
//                 onValueChange={(value) => handleRgbChange("r", value[0])}
//                 className="py-0"
//               />
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <label className="text-sm font-medium">Green</label>
//                 <span className="text-sm text-gray-500">
//                   {Math.round(rgbValues.g)}
//                 </span>
//               </div>
//               <Slider
//                 value={[rgbValues.g]}
//                 min={0}
//                 max={255}
//                 step={1}
//                 onValueChange={(value) => handleRgbChange("g", value[0])}
//                 className="py-0"
//               />
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <label className="text-sm font-medium">Blue</label>
//                 <span className="text-sm text-gray-500">
//                   {Math.round(rgbValues.b)}
//                 </span>
//               </div>
//               <Slider
//                 value={[rgbValues.b]}
//                 min={0}
//                 max={255}
//                 step={1}
//                 onValueChange={(value) => handleRgbChange("b", value[0])}
//                 className="py-0"
//               />
//             </div>
//           </div>

//           <div className="flex items-center gap-3 pt-2">
//             <div
//               className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
//               style={{ backgroundColor: hexValue }}
//             />
//             <Input
//               value={hexValue}
//               onChange={handleHexChange}
//               className="w-32 h-9"
//               maxLength={7}
//             />
//           </div>
//         </TabsContent>

//         <TabsContent value="hsl" className="space-y-4">
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <label className="text-sm font-medium">Hue</label>
//                 <span className="text-sm text-gray-500">
//                   {Math.round(hslValues.h)}°
//                 </span>
//               </div>
//               <Slider
//                 value={[hslValues.h]}
//                 min={0}
//                 max={360}
//                 step={1}
//                 onValueChange={(value) => handleHslChange("h", value[0])}
//                 className="py-0"
//               />
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <label className="text-sm font-medium">Saturation</label>
//                 <span className="text-sm text-gray-500">
//                   {Math.round(hslValues.s)}%
//                 </span>
//               </div>
//               <Slider
//                 value={[hslValues.s]}
//                 min={0}
//                 max={100}
//                 step={1}
//                 onValueChange={(value) => handleHslChange("s", value[0])}
//                 className="py-0"
//               />
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <label className="text-sm font-medium">Lightness</label>
//                 <span className="text-sm text-gray-500">
//                   {Math.round(hslValues.l)}%
//                 </span>
//               </div>
//               <Slider
//                 value={[hslValues.l]}
//                 min={0}
//                 max={100}
//                 step={1}
//                 onValueChange={(value) => handleHslChange("l", value[0])}
//                 className="py-0"
//               />
//             </div>
//           </div>

//           <div className="flex items-center gap-3 pt-2">
//             <div
//               className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
//               style={{ backgroundColor: hexValue }}
//             />
//             <Input
//               value={hexValue}
//               onChange={handleHexChange}
//               className="w-32 h-9"
//               maxLength={7}
//             />
//           </div>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

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
