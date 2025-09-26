// components/TestimonialDetail/PlatformOptimization.tsx
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Target,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  Globe,
  Video,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestimonialArtifact } from "@/types/testimonial";
import { ServiceType } from "@/types/ai-service";

// Platform configurations
const PLATFORM_CONFIGS = {
  instagram_reel: { aspect: "9:16", icon: Instagram, name: "Instagram Reel" },
  instagram_feed: { aspect: "1:1", icon: Instagram, name: "Instagram Feed" },
  instagram_story: { aspect: "9:16", icon: Instagram, name: "Instagram Story" },
  facebook_post: { aspect: "16:9", icon: Facebook, name: "Facebook Post" },
  tiktok: { aspect: "9:16", icon: Video, name: "TikTok" },
  youtube_short: { aspect: "9:16", icon: Youtube, name: "YouTube Short" },
  youtube_standard: { aspect: "16:9", icon: Youtube, name: "YouTube Standard" },
  linkedin_video: { aspect: "16:9", icon: Linkedin, name: "LinkedIn Video" },
  twitter_video: { aspect: "16:9", icon: Twitter, name: "Twitter Video" },
} as const;

interface PlatformOptimizationProps {
  artifacts: TestimonialArtifact[];
  onGenerateMore: () => void;
  onDownload: (url: string, filename: string) => void;
  onCopyToClipboard: (text: string, id: string) => void;
  copiedItems: Set<string>;
  onProcessArtifact?: (artifact: any, serviceType: ServiceType) => void;
}

// Get aspect ratio container styles
const getAspectRatioStyles = (aspectRatio: string) => {
  switch (aspectRatio) {
    case "9:16":
      return {
        container: "aspect-[9/16] max-w-[280px] mx-auto",
        description: "Vertical Video",
      };
    case "1:1":
      return {
        container: "aspect-square max-w-[320px] mx-auto",
        description: "Square Video",
      };
    case "16:9":
    default:
      return {
        container: "aspect-video w-full",
        description: "Landscape Video",
      };
  }
};

const hasProcessingType = (
  appliedServices: string[] | undefined,
  serviceType: string
): boolean => {
  return appliedServices?.includes(serviceType) || false;
};

// Individual platform card component
const PlatformCard = ({
  artifact,
  onDownload,
  onCopyToClipboard,
  copiedItems,
  onProcessArtifact,
}: {
  artifact: TestimonialArtifact;
  onDownload: (url: string, filename: string) => void;
  onCopyToClipboard: (text: string, id: string) => void;
  copiedItems: Set<string>;
  onProcessArtifact?: (artifact: any, serviceType: ServiceType) => void;
}) => {
  const { data } = artifact;
  const platformConfig = PLATFORM_CONFIGS[
    data.platform as keyof typeof PLATFORM_CONFIGS
  ] || { aspect: "9:16", icon: Globe, name: data.platform || "Instagram Reel" };
  const PlatformIcon = platformConfig.icon;
  const aspectStyles = getAspectRatioStyles(
    data.aspect_ratio || platformConfig.aspect
  );

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg shadow-slate-100 bg-gradient-to-br from-white to-slate-50/30">
      <CardContent className="p-0">
        {/* Platform Header */}
        <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center ring-1 ring-slate-100">
                <PlatformIcon className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-lg">
                  {platformConfig.name}
                </h4>
                <p className="text-sm text-slate-600 font-medium">
                  {aspectStyles.description} •{" "}
                  {data.aspect_ratio || platformConfig.aspect}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="p-6">
          <div
            className={`bg-black rounded-2xl overflow-hidden relative group shadow-lg ${aspectStyles.container}`}
          >
            <video
              src={data.optimized_url}
              controls
              className="w-full h-full object-cover"
              poster=""
            />
            {/* <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <FileVideo className="h-6 w-6 text-white" />
              </div>
            </div> */}
          </div>

          {/* Platform Content */}
          <div className="mt-6 space-y-5">
            {/* Caption */}
            <div className="p-4 bg-white/60 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {data.text}
              </p>
            </div>

            {/* Hashtags */}
            {data.hashtags && data.hashtags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Hashtags
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.hashtags.slice(0, 5).map((tag: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs px-3 py-1 bg-slate-100 text-slate-700 border-0 font-medium"
                    >
                      #{tag}
                    </Badge>
                  ))}
                  {data.hashtags.length > 5 && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-3 py-1 bg-slate-100 text-slate-500 border-0"
                    >
                      +{data.hashtags.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Platform Insights */}
            {(data.optimal_posting_time || data.target_audience) && (
              <div className="grid grid-cols-1 gap-3">
                {data.optimal_posting_time && (
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Optimal Time
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {data.optimal_posting_time}
                      </p>
                    </div>
                  </div>
                )}
                {data.target_audience && (
                  <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                      <Target className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Target Audience
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {data.target_audience}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {/* <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <Button
                size="sm"
                onClick={() =>
                  onDownload(
                    data.optimized_url,
                    `${data.platform}-optimized.mp4`
                  )
                }
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-md"
              >
                <Download className="h-3 w-3 mr-2" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onCopyToClipboard(
                    data.optimized_url,
                    `platform-${artifact.id}`
                  )
                }
                className="border-slate-200 hover:bg-slate-50"
              >
                {copiedItems.has(`platform-${artifact.id}`) ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(data.optimized_url, "_blank")}
                className="border-slate-200 hover:bg-slate-50"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div> */}

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <Button
                size="sm"
                onClick={() =>
                  onDownload(
                    data.optimized_url,
                    `${data.platform}-optimized.mp4`
                  )
                }
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-md"
              >
                <Download className="h-3 w-3 mr-2" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onCopyToClipboard(
                    data.optimized_url,
                    `platform-${artifact.id}`
                  )
                }
                className="border-slate-200 hover:bg-slate-50"
              >
                {copiedItems.has(`platform-${artifact.id}`) ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(data.optimized_url, "_blank")}
                className="border-slate-200 hover:bg-slate-50"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              {/* NEW ENHANCEMENT BUTTON */}
              {!hasProcessingType(data?.applied_services, "enhancement") &&
                onProcessArtifact && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onProcessArtifact(artifact, "enhancement")}
                    className="border-purple-200 hover:bg-purple-50 text-purple-600"
                  >
                    <Sparkles className="h-3 w-3" />
                  </Button>
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main component
const PlatformOptimization = ({
  artifacts,
  onGenerateMore,
  onDownload,
  onCopyToClipboard,
  copiedItems,
  onProcessArtifact,
}: PlatformOptimizationProps) => {
  if (artifacts.length === 0) {
    return (
      <Card className="border-0 shadow-lg shadow-slate-100 bg-gradient-to-br from-white to-slate-50/30">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Globe className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">
            No Platform Content
          </h3>
          <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
            Optimize this testimonial for different social media platforms with
            platform-specific aspect ratios, captions, and hashtags.
          </p>
          <Button
            onClick={onGenerateMore}
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg px-8 py-3"
          >
            <Globe className="h-4 w-4 mr-2" />
            Optimize for Platforms
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {artifacts.map((artifact) => (
          <PlatformCard
            key={artifact.id}
            artifact={artifact}
            onDownload={onDownload}
            onCopyToClipboard={onCopyToClipboard}
            copiedItems={copiedItems}
            onProcessArtifact={onProcessArtifact}
          />
        ))}
      </div>

      {/* Generate More Button */}
      <div className="text-center">
        <Button
          onClick={onGenerateMore}
          variant="outline"
          className="border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3"
        >
          <Globe className="h-4 w-4 mr-2" />
          Generate More Platforms
        </Button>
      </div>
    </div>
  );
};

export default PlatformOptimization;
