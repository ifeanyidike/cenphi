// components/ai-studio/ClipSelector.tsx
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Play, CheckSquare, Wand2, Film, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface ClipData {
  url: string;
  theme: string;
  title: string;
  end_time: number;
  start_time: number;
  duration: number;
  engagement_score: number;
  transcript?: string;
}

interface ClipSelectorProps {
  testimonialId: string;
  clippingArtifacts: any[];
  onProceedToAIStudio: (selectedClips: SelectedClip[]) => void;
  className?: string;
}

interface SelectedClip {
  id: string;
  testimonial_id: string;
  artifact_id: string;
  clip_data: ClipData;
  clip_index: number;
}

const ClipSelector: React.FC<ClipSelectorProps> = ({
  testimonialId,
  clippingArtifacts,
  onProceedToAIStudio,
  className = "",
}) => {
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());

  // Extract all clips from artifacts
  const allClips = useMemo(() => {
    const clips: Array<{
      id: string;
      artifact_id: string;
      clip_index: number;
      clip_data: ClipData;
    }> = [];

    clippingArtifacts.forEach((artifact) => {
      const data = artifact.data as any;
      const artifactClips = data?.generated_clips?.clips || [];

      artifactClips.forEach((clip: ClipData, index: number) => {
        clips.push({
          id: `${artifact.id}_${index}`,
          artifact_id: artifact.id,
          clip_index: index,
          clip_data: clip,
        });
      });
    });

    return clips;
  }, [clippingArtifacts]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClipToggle = (clipId: string) => {
    const newSelection = new Set(selectedClips);
    if (newSelection.has(clipId)) {
      newSelection.delete(clipId);
    } else {
      newSelection.add(clipId);
    }
    setSelectedClips(newSelection);
  };

  const handleSelectAll = () => {
    setSelectedClips(new Set(allClips.map((c) => c.id)));
  };

  const handleClearSelection = () => {
    setSelectedClips(new Set());
  };

  const handleProceedToAI = () => {
    const selectedClipData: SelectedClip[] = allClips
      .filter((clip) => selectedClips.has(clip.id))
      .map((clip) => ({
        id: clip.id,
        testimonial_id: testimonialId,
        artifact_id: clip.artifact_id,
        clip_data: clip.clip_data,
        clip_index: clip.clip_index,
      }));

    onProceedToAIStudio(selectedClipData);
  };

  if (allClips.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Film className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Clips Available
          </h3>
          <p className="text-gray-600">
            Generate clips first to enable individual clip processing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-purple-600" />
            Select Clips for AI Processing
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              Select All ({allClips.length})
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearSelection}>
              Clear
            </Button>
          </div>
        </div>
        {selectedClips.size > 0 && (
          <p className="text-sm text-gray-600">
            {selectedClips.size} of {allClips.length} clips selected
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Available Services Info */}
        {selectedClips.size > 0 && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                Available AI Services for Selected Clips
              </span>
            </div>
            <div className="flex gap-2 text-xs">
              <Badge variant="secondary">Enhancement</Badge>
              <Badge variant="secondary">Platform Optimization</Badge>
              <Badge variant="secondary">Story Mode</Badge>
            </div>
          </div>
        )}

        {/* Clips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allClips.map((clip) => {
            const isSelected = selectedClips.has(clip.id);

            return (
              <motion.div
                key={clip.id}
                layout
                className={`border rounded-xl overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? "border-purple-500 bg-purple-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => handleClipToggle(clip.id)}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleClipToggle(clip.id)}
                    className="bg-white border-2 border-gray-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                </div>

                {/* Video Preview */}
                <div className="aspect-video bg-gray-900 relative">
                  <video
                    src={clip.clip_data.url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center group">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        const video = e.currentTarget
                          .closest(".aspect-video")
                          ?.querySelector("video");
                        if (video) {
                          if (video.paused) {
                            video.play();
                          } else {
                            video.pause();
                          }
                        }
                      }}
                    >
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {/* Clip Info */}
                <div className="p-4 space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm leading-tight">
                    {clip.clip_data.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className="text-xs">
                      {clip.clip_data.theme}
                    </Badge>
                    <span className="text-gray-500">
                      {formatTime(clip.clip_data.duration)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Engagement: {Math.round(clip.clip_data.engagement_score)}%
                    </span>
                    <span>
                      {formatTime(clip.clip_data.start_time)} -{" "}
                      {formatTime(clip.clip_data.end_time)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Area */}
        {selectedClips.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {selectedClips.size} clips ready for AI processing
                </p>
                <p className="text-sm text-gray-600">
                  Enhance, optimize, or combine into story video
                </p>
              </div>
            </div>

            <Button
              onClick={handleProceedToAI}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Process with AI
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClipSelector;
