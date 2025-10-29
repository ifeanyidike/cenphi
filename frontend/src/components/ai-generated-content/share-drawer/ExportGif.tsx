// components/ai-generated-content/ShareDrawer.tsx
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Image,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authStore } from "@/stores/authStore";
import { workspaceHub } from "@/repo/workspace_hub";
import { EnhancedArtifact } from "../ContentCategorization";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";

type Props = {
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  artifact: EnhancedArtifact;
};
const ExportGif = ({ setError, artifact }: Props) => {
  const currentWorkspace = workspaceHub.workspace;
  const serverAddr = import.meta.env.VITE_API_URL;

  // GIF Export state
  const [isExportingGIF, setIsExportingGIF] = useState(false);
  const [gifExportResult, setGifExportResult] = useState<{
    url: string;
    size: number;
  } | null>(null);
  const [gifStartTime, setGifStartTime] = useState(0);
  const [gifDuration, setGifDuration] = useState(5);
  const [gifWidth, setGifWidth] = useState(480);
  const [gifFPS, setGifFPS] = useState(15);
  const [gifQuality, setGifQuality] = useState<"high" | "medium" | "low">(
    "medium"
  );

  const handleGIFExport = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setIsExportingGIF(true);
    setError(null);
    setGifExportResult(null);

    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(`${serverAddr}/export/gif`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          artifact_id: artifact.id,
          start_time: gifStartTime,
          duration: gifDuration,
          width: gifWidth,
          fps: gifFPS,
          quality: gifQuality,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export GIF");
      }

      const data = await response.json();
      setGifExportResult({
        url: data.gif_url,
        size: data.size_bytes,
      });
    } catch (err) {
      console.error("Failed to export GIF:", err);
      setError(err instanceof Error ? err.message : "Failed to export GIF");
    } finally {
      setIsExportingGIF(false);
    }
  }, [
    currentWorkspace?.id,
    serverAddr,
    artifact.id,
    gifStartTime,
    gifDuration,
    gifWidth,
    gifFPS,
    gifQuality,
  ]);

  return (
    <motion.div
      key="gif"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/50 bg-gradient-to-br from-white via-purple-50/20 to-blue-50/20 p-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 blur-3xl" />
        <div
          className={cn(
            "relative text-center",
            gifExportResult && " flex items-center justify-center"
          )}
        >
          {" "}
          {gifExportResult?.url ? (
            <img src={gifExportResult.url} />
          ) : (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-200/50 shadow-sm mb-3">
                <Image className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                Export as GIF
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed max-w-md mx-auto">
                Convert your video to an optimized GIF for easy sharing on
                social media and messaging platforms
              </p>
            </>
          )}{" "}
        </div>
      </div>

      {/* Configuration Section */}
      <div className="space-y-4 p-5 rounded-xl border border-slate-200/50 bg-white/50">
        {/* Time Range */}
        <div className="space-y-2.5">
          <Label className="text-[11px] font-semibold text-slate-900">
            Time Range
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] text-slate-600">
                Start Time (seconds)
              </Label>
              <Input
                type="number"
                min={0}
                value={gifStartTime}
                onChange={(e) => setGifStartTime(Number(e.target.value))}
                className="h-9 text-[10px]"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] text-slate-600">
                Duration (seconds)
              </Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={gifDuration}
                onChange={(e) => setGifDuration(Number(e.target.value))}
                className="h-9 text-[10px]"
                placeholder="5"
              />
            </div>
          </div>
          <p className="text-[9px] text-slate-500">
            Select the portion of the video to convert (max 30 seconds)
          </p>
        </div>

        {/* Width Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-semibold text-slate-900">
              Width
            </Label>
            <span className="text-[10px] text-slate-600 font-medium px-2 py-0.5 rounded bg-slate-100">
              {gifWidth}px
            </span>
          </div>
          <input
            type="range"
            min={240}
            max={720}
            step={80}
            value={gifWidth}
            onChange={(e) => setGifWidth(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>240px</span>
            <span>480px</span>
            <span>720px</span>
          </div>
        </div>

        {/* FPS & Quality */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-900">
              Frame Rate
            </Label>
            <Select
              value={gifFPS.toString()}
              onValueChange={(value) => setGifFPS(Number(value))}
            >
              <SelectTrigger className="h-9 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-[10px]">
                  10 FPS (Smaller)
                </SelectItem>
                <SelectItem value="15" className="text-[10px]">
                  15 FPS (Balanced)
                </SelectItem>
                <SelectItem value="20" className="text-[10px]">
                  20 FPS (Smooth)
                </SelectItem>
                <SelectItem value="30" className="text-[10px]">
                  30 FPS (Smoothest)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-900">
              Quality
            </Label>
            <Select
              value={gifQuality}
              onValueChange={(value: "high" | "medium" | "low") =>
                setGifQuality(value)
              }
            >
              <SelectTrigger className="h-9 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high" className="text-[10px]">
                  High Quality
                </SelectItem>
                <SelectItem value="medium" className="text-[10px]">
                  Medium Quality
                </SelectItem>
                <SelectItem value="low" className="text-[10px]">
                  Low Quality
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleGIFExport}
          disabled={isExportingGIF}
          className="w-full h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg text-[11px] font-medium"
        >
          {isExportingGIF ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting GIF...
            </>
          ) : (
            <>
              <Image className="h-4 w-4 mr-2" />
              Export to GIF
            </>
          )}
        </Button>
      </div>

      {/* Export Result */}
      {gifExportResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-gradient-to-br from-emerald-50 to-green-50/30 border border-emerald-200/50 rounded-xl space-y-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-900">
                GIF exported successfully!
              </p>
              {gifExportResult.size && (
                <p className="text-[9px] text-emerald-700">
                  File size: {(gifExportResult.size / 1024 / 1024).toFixed(2)}{" "}
                  MB
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => window.open(gifExportResult.url, "_blank")}
            className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-medium"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download GIF
          </Button>
        </motion.div>
      )}

      {/* Info Section */}
      <div className="p-4 rounded-lg border border-blue-200/50 bg-blue-50/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-blue-900">
              GIF Export Tips
            </p>
            <ul className="text-[9px] text-blue-700 space-y-0.5 list-disc list-inside">
              <li>Keep duration under 10 seconds for best results</li>
              <li>Lower FPS and width reduce file size</li>
              <li>High quality works best for detailed scenes</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default observer(ExportGif);
