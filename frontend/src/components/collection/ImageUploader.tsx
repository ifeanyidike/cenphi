import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  Crop,
  RotateCw,
  PanelLeft,
  Sliders,
  CheckCircle,
  AlertCircle,
  ImagePlus,
  UploadCloud,
  Filter,
  Sparkles,
  RefreshCcw,
  Loader,
  MoveHorizontal,
  MoveVertical,
  Plus,
  Minus,
  Palette,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ffmpegImageUtils } from "@/services/ffmpeg-image-utils";
import { app } from "@/stores/appStore";
import { observer } from "mobx-react-lite";

interface ImageUploaderProps {
  onImageSelected: (blob: Blob) => void;
  primaryColor: string;
  maxSizeMB?: number;
  aspectRatio?: number;
  allowedTypes?: string[];
}

// Helper function to adjust color brightness
const adjustBrightness = (hex: string, percent: number) => {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  // Adjust brightness
  r = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
  g = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
  b = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

// Available filter types
const filters = [
  { id: "none", name: "Original", icon: ImageIcon },
  { id: "brighten", name: "Brighten", icon: Sparkles },
  { id: "contrast", name: "Contrast", icon: Sliders },
  { id: "grayscale", name: "B&W", icon: Palette },
  { id: "sepia", name: "Sepia", icon: Filter },
  { id: "vintage", name: "Vintage", icon: PanelLeft },
];

const ImageUploader: React.FC<ImageUploaderProps> = observer(
  ({
    onImageSelected,
    primaryColor,
    maxSizeMB = 10,
    // aspectRatio,
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"],
  }) => {
    const [dragActive, setDragActive] = useState(false);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("upload");
    const [editMode, setEditMode] = useState<"crop" | "filter" | null>(null);
    const [currentFilter, setCurrentFilter] = useState("none");
    const [filterIntensity, setFilterIntensity] = useState(100);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(100);
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
    const [useFFmpeg, setUseFFmpeg] = useState(true);
    const [processingProgress, setProcessingProgress] = useState(0);

    const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
      null
    );
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
    const [isProcessed, setIsProcessed] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    }, []);

    // Handle dropped files
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    }, []);

    // Handle file input change
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        if (e.target.files && e.target.files[0]) {
          handleFiles(e.target.files);
        }
      },
      []
    );

    // Handle files from input or drop
    const handleFiles = (files: FileList) => {
      setEditMode(null);
      setActiveTab("edit");
      setError(null);

      const file = files[0];

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        setError(
          `Invalid file type. Please use: ${allowedTypes
            .map((t) => t.replace("image/", ""))
            .join(", ")}`
        );
        return;
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File size too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      setProcessing(true);

      // Create URL for the image
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      // Load the image to get dimensions
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setProcessing(false);

        // Reset editing parameters
        setCurrentFilter("none");
        setFilterIntensity(100);
        setBrightness(100);
        setContrast(100);
        setRotation(0);
        setZoom(100);
        setCropOffset({ x: 0, y: 0 });
      };
      img.onerror = () => {
        setProcessing(false);
        setError("Failed to load image. Please try another file.");
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };

    // Trigger file input click
    const handleSelectFile = () => {
      fileInputRef.current?.click();
    };

    const applyEdits = async () => {
      if (!image || !canvasRef.current) return;

      setProcessing(true);
      setProcessingProgress(0);

      try {
        if (useFFmpeg && app.ffmpegLoaded) {
          // Process image using FFmpeg
          await processWithFFmpeg();
        } else {
          // Fallback to Canvas API processing
          processWithCanvas();
        }
      } catch (error) {
        console.error("Image processing error:", error);
        setError(
          "Failed to process image. Falling back to browser processing."
        );

        // Fallback to canvas processing if FFmpeg fails
        if (useFFmpeg) {
          processWithCanvas();
        } else {
          setProcessing(false);
        }
      }
    };

    // Process the image using FFmpeg
    const processWithFFmpeg = async () => {
      if (!image || !imageUrl) return;

      try {
        // Create a blob from the image URL
        const response = await fetch(imageUrl);
        const imageBlob = await response.blob();

        // Update progress (simulated for now)
        setProcessingProgress(30);

        // Process the image with FFmpeg
        const newProcessedBlob = await ffmpegImageUtils.processImage(
          imageBlob,
          {
            brightness,
            contrast,
            zoom,
            rotation,
            cropOffset,
            filter: currentFilter,
            filterIntensity,
          }
        );

        setProcessingProgress(90);

        // Create a URL for the processed image
        if (processedImageUrl) {
          URL.revokeObjectURL(processedImageUrl);
        }
        const newProcessedUrl = URL.createObjectURL(newProcessedBlob);
        setImageUrl(newProcessedUrl); //optional
        console.log("newProcessedUrl", newProcessedUrl);

        // Update state with processed image
        setProcessedBlob(newProcessedBlob);
        setProcessedImageUrl(newProcessedUrl);
        setIsProcessed(true);

        setProcessingProgress(100);
        setProcessing(false);
      } catch (error) {
        console.error("FFmpeg processing error:", error);
        throw error; // Re-throw to trigger fallback
      }
    };

    // Apply current edits and generate final image
    const processWithCanvas = () => {
      if (!image || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setError("Canvas context not available");
        setProcessing(false);
        return;
      }

      // Set canvas dimensions
      const width = image.width;
      const height = image.height;
      canvas.width = width;
      canvas.height = height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Apply rotation if needed
      if (rotation !== 0) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-width / 2, -height / 2);
      }

      // Draw image with zoom and offset
      const zoomFactor = zoom / 100;
      const offsetX = (cropOffset.x / 100) * width;
      const offsetY = (cropOffset.y / 100) * height;

      ctx.drawImage(
        image,
        -offsetX,
        -offsetY,
        width * zoomFactor,
        height * zoomFactor
      );

      // Reset transformation if rotation was applied
      if (rotation !== 0) {
        ctx.restore();
      }

      // Apply filters
      if (currentFilter !== "none" || brightness !== 100 || contrast !== 100) {
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Apply filters
        for (let i = 0; i < data.length; i += 4) {
          // Apply brightness
          if (brightness !== 100) {
            const brightnessValue = brightness / 100;
            data[i] = Math.min(255, data[i] * brightnessValue);
            data[i + 1] = Math.min(255, data[i + 1] * brightnessValue);
            data[i + 2] = Math.min(255, data[i + 2] * brightnessValue);
          }

          // Apply contrast
          if (contrast !== 100) {
            const contrastValue = contrast / 100;
            const factor =
              (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
            data[i] = Math.min(
              255,
              Math.max(0, factor * (data[i] - 128) + 128)
            );
            data[i + 1] = Math.min(
              255,
              Math.max(0, factor * (data[i + 1] - 128) + 128)
            );
            data[i + 2] = Math.min(
              255,
              Math.max(0, factor * (data[i + 2] - 128) + 128)
            );
          }

          // Apply filter effects
          const intensity = filterIntensity / 100;

          switch (currentFilter) {
            case "grayscale": {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i] = data[i] * (1 - intensity) + avg * intensity;
              data[i + 1] = data[i + 1] * (1 - intensity) + avg * intensity;
              data[i + 2] = data[i + 2] * (1 - intensity) + avg * intensity;
              break;
            }

            case "sepia": {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              data[i] = Math.min(
                255,
                r * (1 - intensity) +
                  (r * 0.393 + g * 0.769 + b * 0.189) * intensity
              );
              data[i + 1] = Math.min(
                255,
                g * (1 - intensity) +
                  (r * 0.349 + g * 0.686 + b * 0.168) * intensity
              );
              data[i + 2] = Math.min(
                255,
                b * (1 - intensity) +
                  (r * 0.272 + g * 0.534 + b * 0.131) * intensity
              );
              break;
            }

            case "vintage":
              // Red shift and slight desaturation
              data[i] = Math.min(255, data[i] * 1.1);
              data[i + 1] = data[i + 1] * 0.9;
              data[i + 2] = data[i + 2] * 0.8;
              break;
          }
        }

        // Put modified image data back
        ctx.putImageData(imageData, 0, 0);
      }

      // Simulate progress
      setProcessingProgress(50);

      // Convert canvas to blob
      canvas?.toBlob(
        (blob) => {
          if (blob) {
            // Create a URL for the processed image
            if (processedImageUrl) {
              URL.revokeObjectURL(processedImageUrl);
            }
            const newProcessedUrl = URL.createObjectURL(blob);

            // Update state with processed image
            setProcessedBlob(blob);
            setProcessedImageUrl(newProcessedUrl);
            setImageUrl(newProcessedUrl); //optional
            setIsProcessed(true);

            setProcessingProgress(100);
            setProcessing(false);
          } else {
            setError("Failed to process image");
            setProcessing(false);
          }
        },
        "image/jpeg",
        0.92
      );
    };

    const saveProcessedImage = () => {
      if (processedBlob) {
        onImageSelected(processedBlob);
        // setActiveTab("upload");
        setEditMode(null);
      } else {
        setError("No processed image to save");
      }
    };

    // Reset all edits
    const resetEdits = () => {
      setCurrentFilter("none");
      setFilterIntensity(100);
      setBrightness(100);
      setContrast(100);
      setRotation(0);
      setZoom(100);
      setCropOffset({ x: 0, y: 0 });
    };

    // Remove current image
    const removeImage = () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImage(null);
      setImageUrl(null);
      setEditMode(null);
      setActiveTab("upload");
      resetEdits();
    };

    return (
      <div className="w-full max-w-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" disabled={!image && !processing}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="edit" disabled={!image}>
              <Sliders className="h-4 w-4 mr-2" />
              Edit
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent
            value="upload"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 transition-all",
                dragActive
                  ? `border-[${primaryColor}] bg-[${primaryColor}]/5`
                  : "border-slate-200 hover:border-slate-300"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="mb-4"
                >
                  <div
                    className={cn(
                      "rounded-full p-4",
                      `bg-[${primaryColor}]/10 text-[${primaryColor}]`
                    )}
                    style={{
                      backgroundColor: `${adjustBrightness(primaryColor, -90)}20`,
                      color: primaryColor,
                    }}
                  >
                    <UploadCloud className="h-10 w-10" />
                  </div>
                </motion.div>

                <h3 className="text-lg font-medium mb-2">
                  {processing ? "Processing image..." : "Upload Your Image"}
                </h3>

                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  {processing
                    ? "Please wait while we prepare your image..."
                    : "Drag and drop an image file, or click to browse"}
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {processing ? (
                  <div className="flex items-center justify-center w-full mb-6">
                    <Loader className="h-8 w-8 text-muted-foreground animate-spin" />
                  </div>
                ) : (
                  <Button
                    onClick={handleSelectFile}
                    className="relative group"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    <span>Select Image</span>
                    <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-3 w-3 text-black" />
                    </span>
                  </Button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={allowedTypes.join(",")}
                  className="hidden"
                  onChange={handleChange}
                  disabled={processing}
                />

                <div className="w-full mt-6 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span>Accepted formats: JPG, PNG, WebP, HEIC</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span>Maximum file size: {maxSizeMB}MB</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span>Images will be optimized automatically</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent
            value="edit"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            {image && imageUrl && (
              <div className="space-y-4">
                {/* Image Preview */}
                <div
                  ref={imageContainerRef}
                  className="relative w-full bg-slate-50 border rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ height: "320px" }}
                >
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="object-contain transform transition-transform"
                      style={{
                        filter: `
                        brightness(${brightness}%) 
                        contrast(${contrast}%)
                        ${
                          currentFilter === "grayscale"
                            ? `grayscale(${filterIntensity}%)`
                            : ""
                        }
                        ${
                          currentFilter === "sepia"
                            ? `sepia(${filterIntensity}%)`
                            : ""
                        }
                      `,
                        transform: `
                        rotate(${rotation}deg)
                        scale(${zoom / 100})
                        translate(${cropOffset.x / 10}%, ${cropOffset.y / 10}%)
                      `,
                        maxHeight: "100%",
                        maxWidth: "100%",
                      }}
                    />
                  </div>

                  {editMode === "crop" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Crop guides */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border-2 border-dashed border-white opacity-70"></div>
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                          {[...Array(9)].map((_, i) => (
                            <div
                              key={i}
                              className="border border-white opacity-40"
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls Panels */}
                <div className="space-y-4">
                  {/* Top controls */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        variant={editMode === "crop" ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setEditMode(editMode === "crop" ? null : "crop")
                        }
                        style={
                          editMode === "crop"
                            ? { backgroundColor: primaryColor }
                            : {}
                        }
                      >
                        <Crop className="h-4 w-4 mr-1" />
                        <span>Crop</span>
                      </Button>
                      <Button
                        variant={editMode === "filter" ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setEditMode(editMode === "filter" ? null : "filter")
                        }
                        style={
                          editMode === "filter"
                            ? { backgroundColor: primaryColor }
                            : {}
                        }
                      >
                        <Filter className="h-4 w-4 mr-1" />
                        <span>Filter</span>
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={resetEdits}>
                        <RefreshCcw className="h-4 w-4 mr-1" />
                        <span>Reset</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>

                  {/* Processing engine selector */}
                  <div className="flex justify-between items-center mt-2 mb-4">
                    <div className="text-sm text-muted-foreground">
                      Processing Engine:
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUseFFmpeg(false)}
                        className={cn(
                          "px-3 py-1 text-sm rounded-md transition-colors",
                          !useFFmpeg
                            ? `bg-[${primaryColor}] text-white`
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                        style={
                          !useFFmpeg ? { backgroundColor: primaryColor } : {}
                        }
                      >
                        Browser
                      </button>
                      <button
                        onClick={() => setUseFFmpeg(true)}
                        className={cn(
                          "px-3 py-1 text-sm rounded-md transition-colors",
                          useFFmpeg
                            ? `bg-[${primaryColor}] text-white`
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                        style={
                          useFFmpeg ? { backgroundColor: primaryColor } : {}
                        }
                        disabled={!app.ffmpegLoaded}
                      >
                        FFmpeg
                      </button>
                    </div>
                  </div>

                  {/* Main controls */}
                  <AnimatePresence mode="wait">
                    {editMode === "crop" && (
                      <motion.div
                        key="crop-controls"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                          <h3 className="font-medium text-base flex items-center gap-2">
                            <Crop className="h-4 w-4" />
                            <span>Crop & Adjust</span>
                          </h3>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Zoom</Label>
                              <div className="flex items-center gap-2">
                                <Minus className="h-3 w-3 text-slate-400" />
                                <Slider
                                  min={100}
                                  max={200}
                                  step={1}
                                  value={[zoom]}
                                  onValueChange={([value]) => setZoom(value)}
                                />
                                <Plus className="h-3 w-3 text-slate-400" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Rotation</Label>
                              <div className="flex items-center gap-2">
                                <RotateCw className="h-3 w-3 text-slate-400" />
                                <Slider
                                  min={-180}
                                  max={180}
                                  step={1}
                                  value={[rotation]}
                                  onValueChange={([value]) =>
                                    setRotation(value)
                                  }
                                />
                                <Badge
                                  variant="outline"
                                  className="ml-2 px-1.5 py-0 text-xs"
                                >
                                  {rotation}°
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">
                                Horizontal Position
                              </Label>
                              <div className="flex items-center gap-2">
                                <MoveHorizontal className="h-3 w-3 text-slate-400" />
                                <Slider
                                  min={-100}
                                  max={100}
                                  step={1}
                                  value={[cropOffset.x]}
                                  onValueChange={([value]) =>
                                    setCropOffset({ ...cropOffset, x: value })
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">
                                Vertical Position
                              </Label>
                              <div className="flex items-center gap-2">
                                <MoveVertical className="h-3 w-3 text-slate-400" />
                                <Slider
                                  min={-100}
                                  max={100}
                                  step={1}
                                  value={[cropOffset.y]}
                                  onValueChange={([value]) =>
                                    setCropOffset({ ...cropOffset, y: value })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {editMode === "filter" && (
                      <motion.div
                        key="filter-controls"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                          <h3 className="font-medium text-base flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <span>Filters & Effects</span>
                          </h3>

                          <div className="grid grid-cols-6 gap-2">
                            {filters.map((filter) => {
                              const Icon = filter.icon;
                              return (
                                <div
                                  key={filter.id}
                                  className={cn(
                                    "flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-all",
                                    currentFilter === filter.id
                                      ? `border bg-[${primaryColor}]/10 border-[${primaryColor}]/50`
                                      : "border border-transparent hover:bg-slate-100"
                                  )}
                                  style={
                                    currentFilter === filter.id
                                      ? {
                                          backgroundColor: `${adjustBrightness(
                                            primaryColor,
                                            -90
                                          )}15`,
                                          borderColor: `${adjustBrightness(
                                            primaryColor,
                                            -30
                                          )}50`,
                                        }
                                      : {}
                                  }
                                  onClick={() => setCurrentFilter(filter.id)}
                                >
                                  <div
                                    className={cn(
                                      "p-2 rounded-md",
                                      currentFilter === filter.id
                                        ? `bg-[${primaryColor}]/20 text-[${primaryColor}]`
                                        : "bg-slate-200 text-slate-600"
                                    )}
                                    style={
                                      currentFilter === filter.id
                                        ? {
                                            backgroundColor: `${adjustBrightness(
                                              primaryColor,
                                              -80
                                            )}25`,
                                            color: primaryColor,
                                          }
                                        : {}
                                    }
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <span className="text-xs">{filter.name}</span>
                                </div>
                              );
                            })}
                          </div>

                          <Separator />

                          <div className="grid grid-cols-1 gap-4">
                            {currentFilter !== "none" && (
                              <div className="space-y-2">
                                <Label className="text-sm">
                                  Effect Intensity
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Slider
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={[filterIntensity]}
                                    onValueChange={([value]) =>
                                      setFilterIntensity(value)
                                    }
                                  />
                                  <Badge
                                    variant="outline"
                                    className="ml-2 px-1.5 py-0 text-xs"
                                  >
                                    {filterIntensity}%
                                  </Badge>
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label className="text-sm">Brightness</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  min={50}
                                  max={150}
                                  step={1}
                                  value={[brightness]}
                                  onValueChange={([value]) =>
                                    setBrightness(value)
                                  }
                                />
                                <Badge
                                  variant="outline"
                                  className="ml-2 px-1.5 py-0 text-xs"
                                >
                                  {brightness}%
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Contrast</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  min={50}
                                  max={150}
                                  step={1}
                                  value={[contrast]}
                                  onValueChange={([value]) =>
                                    setContrast(value)
                                  }
                                />
                                <Badge
                                  variant="outline"
                                  className="ml-2 px-1.5 py-0 text-xs"
                                >
                                  {contrast}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Final submit button with progress indicator */}
                  {/* Action buttons */}
                  <div className="pt-4 flex flex-col gap-3">
                    {/* Apply edits button */}
                    {!isProcessed ? (
                      <Button
                        onClick={applyEdits}
                        disabled={processing}
                        className="w-full"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {processing ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            <span>Processing... {processingProgress}%</span>
                          </>
                        ) : (
                          <>
                            <Sliders className="h-4 w-4 mr-2" />
                            <span>Apply Edits</span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setIsProcessed(false);
                            if (processedImageUrl) {
                              URL.revokeObjectURL(processedImageUrl);
                              setProcessedImageUrl(null);
                            }
                            setProcessedBlob(null);
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          <span>Edit Again</span>
                        </Button>
                        <Button
                          onClick={saveProcessedImage}
                          className="flex-1"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>Save Image</span>
                        </Button>
                      </div>
                    )}

                    {processing && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${processingProgress}%`,
                            backgroundColor: primaryColor,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hidden canvas for image processing */}
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);

export default ImageUploader;
