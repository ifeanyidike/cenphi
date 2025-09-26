// components/ai-generated-content/AIGeneratedContent.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import {
  FileText,
  Download,
  Copy,
  Check,
  Clock,
  Users,
  Sparkles,
  MessageSquare,
  Filter,
  Search,
  Languages,
  Edit3,
  Brain,
  Eye,
  ExternalLink,
  Grid3X3,
  List,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { workspaceHub } from "@/repo/workspace_hub";
import { TestimonialArtifact, Testimonial } from "@/types/testimonial";
import { formatDistanceToNow } from "date-fns";

interface AIGeneratedContentProps {
  className?: string;
}

const AIGeneratedContent: React.FC<AIGeneratedContentProps> = observer(
  ({ className }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [loading, setLoading] = useState(true);

    // Fetch testimonials and artifacts
    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          await workspaceHub.testimonialManager.getTestimonials();
        } catch (error) {
          console.error("Failed to fetch testimonials:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, []);

    const testimonials = workspaceHub.testimonialManager.testimonials || [];
    const multiArtifacts =
      workspaceHub.testimonialManager.getMultiTestimonialArtifacts();

    // Get testimonial info by ID
    const getTestimonialInfo = (
      testimonialId: string
    ): Testimonial | undefined => {
      return testimonials.find((t) => t.id === testimonialId);
    };

    // Copy to clipboard functionality
    const handleCopyToClipboard = async (
      content: string,
      artifactId: string
    ) => {
      try {
        await navigator.clipboard.writeText(content);
        setCopiedItems((prev) => new Set([...prev, artifactId]));
        setTimeout(() => {
          setCopiedItems((prev) => {
            const next = new Set(prev);
            next.delete(artifactId);
            return next;
          });
        }, 2000);
      } catch (err) {
        console.error("Failed to copy content:", err);
      }
    };

    // Download functionality
    const handleDownload = (content: string, filename: string) => {
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    // Filter artifacts based on search and type
    const filteredArtifacts = multiArtifacts.filter((artifact) => {
      const data = artifact.data as any;
      const content = data?.content || "";

      const matchesSearch =
        searchQuery === "" ||
        content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.processing_type
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesType =
        selectedType === "all" || artifact.processing_type === selectedType;

      return matchesSearch && matchesType;
    });

    // Group artifacts by type
    const groupedArtifacts = filteredArtifacts.reduce(
      (acc, artifact) => {
        const type = artifact.processing_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(artifact);
        return acc;
      },
      {} as Record<string, TestimonialArtifact[]>
    );

    const getTypeConfig = (type: string) => {
      switch (type) {
        case "content_generation":
          return {
            label: "Generated Content",
            color: "bg-purple-100 text-purple-800 border-purple-200",
            icon: Brain,
            description: "AI-generated marketing content",
          };
        case "text_polishing":
          return {
            label: "Polished Text",
            color: "bg-blue-100 text-blue-800 border-blue-200",
            icon: Edit3,
            description: "Enhanced and refined text",
          };
        case "translation":
          return {
            label: "Translation",
            color: "bg-green-100 text-green-800 border-green-200",
            icon: Languages,
            description: "Translated content",
          };
        default:
          return {
            label: type,
            color: "bg-gray-100 text-gray-800 border-gray-200",
            icon: FileText,
            description: "AI-processed content",
          };
      }
    };

    const renderArtifactCard = (artifact: TestimonialArtifact) => {
      const data = artifact.data as any;
      const content = data?.content || "";
      const testimonialIds = data?.testimonial_ids || [];
      const sourceTestimonials = testimonialIds
        .map(getTestimonialInfo)
        .filter(Boolean) as Testimonial[];

      const typeConfig = getTypeConfig(artifact.processing_type);
      const TypeIcon = typeConfig.icon;

      return (
        <motion.div
          key={artifact.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-2 rounded-lg ${typeConfig.color} shadow-sm`}
                    >
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <Badge
                        variant="outline"
                        className={`${typeConfig.color} border-current font-medium`}
                      >
                        {typeConfig.label}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {typeConfig.description}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-700"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {sourceTestimonials.length} source
                      {sourceTestimonials.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    Created{" "}
                    {formatDistanceToNow(new Date(artifact.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(content, artifact.id)}
                    className="h-9 w-9 p-0 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                    title="Copy to clipboard"
                  >
                    {copiedItems.has(artifact.id) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDownload(
                        content,
                        `${typeConfig.label}-${Date.now()}.md`
                      )
                    }
                    className="h-9 w-9 p-0 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                    title="Download as markdown"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              {/* Source testimonials */}
              {sourceTestimonials.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">
                      Source Testimonials
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sourceTestimonials.map((testimonial) => (
                      <Button
                        key={testimonial.id}
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/detail/${testimonial.id}`)}
                        className="h-8 text-xs hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 border-gray-200 transition-colors"
                      >
                        <MessageSquare className="h-3 w-3 mr-1.5" />
                        {testimonial.author_name || "Unknown Author"}
                        <ExternalLink className="h-3 w-3 ml-1.5" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Content preview */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">
                    Generated Content
                  </p>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {content.length > 300
                      ? `${content.substring(0, 300)}...`
                      : content}
                  </p>
                </div>
                {content.length > 300 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-auto p-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                    onClick={() => {
                      // Could open a modal or expand inline
                      console.log("Show full content:", artifact.id);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1.5" />
                    View complete content
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    };

    const renderEmptyState = () => (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-dashed border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No AI-Generated Content Yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-lg text-sm mx-auto leading-relaxed">
              Transform your testimonials into powerful marketing content!
              Select multiple testimonials in AI Studio and use our intelligent
              services for content generation, text polishing, or translation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/studio")}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Creating Content
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="border-gray-300 hover:bg-gray-50"
                size="lg"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );

    const renderContent = () => {
      if (loading) {
        return (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      }

      if (filteredArtifacts.length === 0) {
        return renderEmptyState();
      }

      return (
        <Tabs defaultValue="all" className="space-y-8">
          <div className="flex items-center justify-between">
            <TabsList className="bg-gray-100 p-1 rounded-lg">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                All Content ({filteredArtifacts.length})
              </TabsTrigger>
              {Object.entries(groupedArtifacts).map(([type, artifacts]) => {
                const config = getTypeConfig(type);
                return (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    {config.label} ({artifacts.length})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-6">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-6"
              }
            >
              {filteredArtifacts.map(renderArtifactCard)}
            </div>
          </TabsContent>

          {Object.entries(groupedArtifacts).map(([type, artifacts]) => (
            <TabsContent key={type} value={type} className="mt-6">
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-6"
                }
              >
                {artifacts.map(renderArtifactCard)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      );
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`space-y-8 ${className}`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                AI-Generated Content
              </h1>
              <p className="text-gray-600 mt-1">
                Marketing content created from multiple testimonials using AI
                services
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm px-3 py-1">
              <FileText className="h-3 w-3 mr-1" />
              {filteredArtifacts.length} items
            </Badge>
            <div className="flex items-center bg-gray-50 rounded-lg p-1 border">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Filter className="h-4 w-4" />
                Filters
              </div>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search content, prompts, or types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-52 bg-gray-50 border-gray-200 focus:bg-white">
                  <SelectValue placeholder="Filter by content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content Types</SelectItem>
                  <SelectItem value="content_generation">
                    Generated Content
                  </SelectItem>
                  <SelectItem value="text_polishing">Polished Text</SelectItem>
                  <SelectItem value="translation">Translations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {renderContent()}
      </motion.div>
    );
  }
);

export default AIGeneratedContent;
