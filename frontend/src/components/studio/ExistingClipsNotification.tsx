import React from "react";
import { Info, ExternalLink, CheckCircle } from "lucide-react";

interface ExistingClip {
  id: string;
  title: string;
  url: string;
  theme?: string;
  duration?: number;
}

interface ExistingClipsNotificationProps {
  existingCount: number;
  newCount: number;
  totalRequested: number;
  message: string;
  existingClips: ExistingClip[];
  onViewClips?: () => void;
  onContinue?: () => void;
}

export const ExistingClipsNotification: React.FC<ExistingClipsNotificationProps> = ({
  existingCount,
  newCount,
  totalRequested,
  message,
  existingClips,
  onViewClips,
  onContinue,
}) => {
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds);
    const secs = Math.floor((seconds % 1) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900">
            Clips Already Generated
          </h3>
          <p className="text-xs text-blue-700 mt-1">{message}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3 pl-8">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-slate-700">
            {existingCount} existing
          </span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-700">
            {newCount} to generate
          </span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">
            {totalRequested} total requested
          </span>
        </div>
      </div>

      {/* Existing Clips List */}
      {existingClips.length > 0 && (
        <div className="pl-8 mb-4">
          <p className="text-xs font-medium text-slate-600 mb-2">
            Previously generated clips:
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {existingClips.map((clip) => (
              <div
                key={clip.id}
                className="flex items-center gap-2 p-2 rounded bg-white border border-slate-200 hover:border-blue-300 transition-colors group"
              >
                {/* Video thumbnail placeholder */}
                <div className="flex-shrink-0 w-12 h-8 bg-slate-900 rounded overflow-hidden">
                  {clip.url ? (
                    <video
                      src={clip.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800" />
                  )}
                </div>

                {/* Clip info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {clip.title || "Untitled Clip"}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    {clip.duration && (
                      <span>{formatDuration(clip.duration)}</span>
                    )}
                    {clip.theme && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="capitalize">{clip.theme}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* View link */}
                {clip.url && (
                  <a
                    href={clip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Open clip"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pl-8">
        {onViewClips && (
          <button
            onClick={onViewClips}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded-md transition-colors"
          >
            View All Clips
          </button>
        )}
        {newCount > 0 && onContinue && (
          <button
            onClick={onContinue}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Continue with {newCount} New {newCount === 1 ? "Clip" : "Clips"}
          </button>
        )}
        {newCount === 0 && (
          <p className="text-xs text-slate-500 italic">
            No new clips to generate
          </p>
        )}
      </div>
    </div>
  );
};
