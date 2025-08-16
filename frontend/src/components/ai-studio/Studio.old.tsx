// // // // import React, { useState, useEffect } from "react";
// // // // import { observer } from "mobx-react-lite";
// // // // import { motion, AnimatePresence } from "framer-motion";
// // // // import {
// // // //   Sparkles,
// // // //   Video,
// // // //   Scissors,
// // // //   Palette,
// // // //   VolumeX,
// // // //   FileText,
// // // //   Languages,
// // // //   Wand2,
// // // //   Play,
// // // //   Settings,
// // // //   ArrowRight,
// // // //   CheckCircle,
// // // //   Clock,
// // // //   AlertCircle,
// // // //   X,
// // // //   Maximize2,
// // // //   Download,
// // // //   Share2,
// // // //   Upload,
// // // //   Eye,
// // // //   Zap,
// // // //   Award,
// // // //   Target,
// // // //   Music,
// // // //   Monitor,
// // // //   Image,
// // // //   Type,
// // // //   Globe,
// // // //   RefreshCw,
// // // //   ArrowLeft,
// // // //   Filter,
// // // //   Search,
// // // //   MoreVertical,
// // // //   Mic,
// // // //   Volume2,
// // // //   Sliders,
// // // //   Hash,
// // // //   BarChart3,
// // // //   TrendingUp,
// // // //   Heart,
// // // //   Lightbulb,
// // // //   AlertTriangle,
// // // //   Trophy,
// // // //   RotateCcw,
// // // //   ThumbsUp,
// // // // } from "lucide-react";

// // // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // // import { Button } from "@/components/ui/button";
// // // // import { Badge } from "@/components/ui/badge";
// // // // import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // // // import { Progress } from "@/components/ui/progress";
// // // // import { Input } from "@/components/ui/input";
// // // // import { Label } from "@/components/ui/label";
// // // // import { Textarea } from "@/components/ui/textarea";
// // // // import { Switch } from "@/components/ui/switch";
// // // // import {
// // // //   Select,
// // // //   SelectContent,
// // // //   SelectItem,
// // // //   SelectTrigger,
// // // //   SelectValue,
// // // // } from "@/components/ui/select";
// // // // import { Checkbox } from "@/components/ui/checkbox";
// // // // import { Slider } from "@/components/ui/slider";
// // // // import { workspaceHub } from "@/repo/workspace_hub";
// // // // import {
// // // //   HIGHLIGHT_TYPES,
// // // //   AVAILABLE_VOICES,
// // // //   type ServiceType,
// // // //   type HighlightType,
// // // // } from "@/repo/managers/ai_studio_manager";
// // // // import JobMonitor from "./JobMonitor";

// // // // // Service definitions with narration added
// // // // interface ServiceCard {
// // // //   id: string;
// // // //   title: string;
// // // //   description: string;
// // // //   icon: React.ComponentType<any>;
// // // //   gradient: string;
// // // //   features: string[];
// // // //   estimatedTime: string;
// // // //   category: "video" | "content" | "optimization" | "addon";
// // // //   popularity: number;
// // // //   isAddon?: boolean;
// // // // }

// // // // const AI_SERVICES: ServiceCard[] = [
// // // //   {
// // // //     id: "enhancement",
// // // //     title: "Video Enhancement",
// // // //     description:
// // // //       "Transform raw testimonials into professional-quality videos with AI-powered visual and audio enhancements.",
// // // //     icon: Sparkles,
// // // //     gradient: "from-purple-500 to-indigo-600",
// // // //     features: [
// // // //       "Professional Quality",
// // // //       "Noise Reduction",
// // // //       "Visual Enhancement",
// // // //       "Brand Integration",
// // // //     ],
// // // //     estimatedTime: "2-5 minutes",
// // // //     category: "video",
// // // //     popularity: 95,
// // // //   },
// // // //   {
// // // //     id: "story_mode",
// // // //     title: "Story Mode",
// // // //     description:
// // // //       "Intelligently combine highlight moments into compelling narrative videos with custom intro/outro.",
// // // //     icon: Video,
// // // //     gradient: "from-blue-500 to-cyan-600",
// // // //     features: [
// // // //       "Highlight Extraction",
// // // //       "Intelligent Editing",
// // // //       "Custom Branding",
// // // //       "Voice Over",
// // // //     ],
// // // //     estimatedTime: "3-7 minutes",
// // // //     category: "video",
// // // //     popularity: 88,
// // // //   },
// // // //   {
// // // //     id: "clipping",
// // // //     title: "Smart Clipping",
// // // //     description:
// // // //       "Automatically generate multiple engaging clips from testimonials based on emotional highlights.",
// // // //     icon: Scissors,
// // // //     gradient: "from-emerald-500 to-teal-600",
// // // //     features: [
// // // //       "Multiple Clips",
// // // //       "Emotional Detection",
// // // //       "Auto Branding",
// // // //       "Social Ready",
// // // //     ],
// // // //     estimatedTime: "1-3 minutes",
// // // //     category: "video",
// // // //     popularity: 92,
// // // //   },
// // // //   {
// // // //     id: "platform_optimizer",
// // // //     title: "Platform Optimizer",
// // // //     description:
// // // //       "Optimize testimonials for specific platforms with aspect ratios, captions, and content-aware cropping.",
// // // //     icon: Monitor,
// // // //     gradient: "from-orange-500 to-red-600",
// // // //     features: [
// // // //       "Multi-Platform",
// // // //       "Smart Cropping",
// // // //       "Auto Captions",
// // // //       "Platform Rules",
// // // //     ],
// // // //     estimatedTime: "1-2 minutes",
// // // //     category: "optimization",
// // // //     popularity: 85,
// // // //   },
// // // //   {
// // // //     id: "noise_removal",
// // // //     title: "Noise Removal",
// // // //     description:
// // // //       "Remove background noise and enhance audio quality while preserving natural voice characteristics.",
// // // //     icon: VolumeX,
// // // //     gradient: "from-indigo-500 to-purple-600",
// // // //     features: [
// // // //       "Professional Audio",
// // // //       "Voice Preservation",
// // // //       "Background Removal",
// // // //       "Crystal Clear",
// // // //     ],
// // // //     estimatedTime: "30 seconds",
// // // //     category: "video",
// // // //     popularity: 78,
// // // //   },
// // // //   {
// // // //     id: "content_generator",
// // // //     title: "Content Generator",
// // // //     description:
// // // //       "Generate high-ROI marketing content from testimonials: emails, blogs, case studies, and more.",
// // // //     icon: FileText,
// // // //     gradient: "from-pink-500 to-rose-600",
// // // //     features: [
// // // //       "Multiple Formats",
// // // //       "High ROI Content",
// // // //       "Brand Aligned",
// // // //       "Ready to Use",
// // // //     ],
// // // //     estimatedTime: "30-60 seconds",
// // // //     category: "content",
// // // //     popularity: 90,
// // // //   },
// // // //   {
// // // //     id: "text_polishing",
// // // //     title: "Text Polishing",
// // // //     description:
// // // //       "Enhance written testimonials while maintaining authenticity and original voice.",
// // // //     icon: Wand2,
// // // //     gradient: "from-violet-500 to-purple-600",
// // // //     features: [
// // // //       "Authenticity Preserved",
// // // //       "Professional Tone",
// // // //       "Grammar Perfect",
// // // //       "Engaging Copy",
// // // //     ],
// // // //     estimatedTime: "15 seconds",
// // // //     category: "content",
// // // //     popularity: 73,
// // // //   },
// // // //   {
// // // //     id: "translation",
// // // //     title: "Translation",
// // // //     description:
// // // //       "Translate testimonials to multiple languages while preserving tone and emotional impact.",
// // // //     icon: Languages,
// // // //     gradient: "from-teal-500 to-cyan-600",
// // // //     features: [
// // // //       "60+ Languages",
// // // //       "Tone Preservation",
// // // //       "Cultural Adaptation",
// // // //       "Native Quality",
// // // //     ],
// // // //     estimatedTime: "10-30 seconds",
// // // //     category: "content",
// // // //     popularity: 67,
// // // //   },
// // // //   {
// // // //     id: "narration",
// // // //     title: "AI Narration",
// // // //     description:
// // // //       "Convert text testimonials to professional audio using premium AI voices from ElevenLabs and OpenAI.",
// // // //     icon: Mic,
// // // //     gradient: "from-rose-500 to-pink-600",
// // // //     features: [
// // // //       "Premium AI Voices",
// // // //       "Multiple Providers",
// // // //       "Natural Speech",
// // // //       "Custom Settings",
// // // //     ],
// // // //     estimatedTime: "30-90 seconds",
// // // //     category: "addon",
// // // //     popularity: 65,
// // // //     isAddon: true,
// // // //   },
// // // // ];

// // // // // Highlight Type Selector Component
// // // // const HighlightTypeSelector = observer(
// // // //   ({
// // // //     selectedType,
// // // //     onTypeChange,
// // // //   }: {
// // // //     selectedType: HighlightType;
// // // //     onTypeChange: (type: HighlightType) => void;
// // // //   }) => {
// // // //     const getHighlightIcon = (type: HighlightType) => {
// // // //       const iconMap = {
// // // //         general: Sparkles,
// // // //         emotional: Heart,
// // // //         thematic: Target,
// // // //         before_after: RotateCcw,
// // // //         recommendation: ThumbsUp,
// // // //         metrics: BarChart3,
// // // //         results: Trophy,
// // // //         solution: Lightbulb,
// // // //         problem: AlertTriangle,
// // // //       };
// // // //       return iconMap[type] || Sparkles;
// // // //     };

// // // //     return (
// // // //       <div className="space-y-3">
// // // //         <Label className="text-sm font-medium">Highlight Detection Type</Label>
// // // //         <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
// // // //           {Object.entries(HIGHLIGHT_TYPES).map(([key, highlight]) => {
// // // //             const IconComponent = getHighlightIcon(key as HighlightType);
// // // //             const isSelected = selectedType === key;

// // // //             return (
// // // //               <div
// // // //                 key={key}
// // // //                 className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
// // // //                   isSelected
// // // //                     ? "border-purple-500 bg-purple-50"
// // // //                     : "border-gray-200 hover:border-gray-300"
// // // //                 }`}
// // // //                 onClick={() => onTypeChange(key as HighlightType)}
// // // //               >
// // // //                 <div className="flex items-center gap-3">
// // // //                   <IconComponent
// // // //                     className={`h-5 w-5 ${
// // // //                       isSelected ? "text-purple-600" : "text-gray-500"
// // // //                     }`}
// // // //                   />
// // // //                   <div className="flex-1">
// // // //                     <div className="font-medium text-sm">{highlight.name}</div>
// // // //                     <div className="text-xs text-gray-500">
// // // //                       {highlight.description}
// // // //                     </div>
// // // //                   </div>
// // // //                   {isSelected && (
// // // //                     <CheckCircle className="h-4 w-4 text-purple-600" />
// // // //                   )}
// // // //                 </div>
// // // //               </div>
// // // //             );
// // // //           })}
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }
// // // // );

// // // // // Voice Selector Component for Narration
// // // // const VoiceSelector = observer(
// // // //   ({
// // // //     selectedVoice,
// // // //     onVoiceChange,
// // // //   }: {
// // // //     selectedVoice: { id: string; name: string; provider: string };
// // // //     onVoiceChange: (voice: {
// // // //       id: string;
// // // //       name: string;
// // // //       provider: string;
// // // //     }) => void;
// // // //   }) => {
// // // //     const [filterProvider, setFilterProvider] = useState<
// // // //       "all" | "elevenlabs" | "openai"
// // // //     >("all");
// // // //     const [filterCategory, setFilterCategory] = useState<
// // // //       "all" | "professional" | "casual" | "energetic" | "calm"
// // // //     >("all");

// // // //     const filteredVoices = AVAILABLE_VOICES.filter((voice) => {
// // // //       const providerMatch =
// // // //         filterProvider === "all" || voice.provider === filterProvider;
// // // //       const categoryMatch =
// // // //         filterCategory === "all" || voice.category === filterCategory;
// // // //       return providerMatch && categoryMatch;
// // // //     });

// // // //     return (
// // // //       <div className="space-y-4">
// // // //         <div className="flex items-center justify-between">
// // // //           <Label className="text-sm font-medium">Voice Selection</Label>
// // // //           <Badge variant="secondary">
// // // //             {selectedVoice.provider} • {selectedVoice.name}
// // // //           </Badge>
// // // //         </div>

// // // //         {/* Filters */}
// // // //         <div className="grid grid-cols-2 gap-3">
// // // //           <Select
// // // //             value={filterProvider}
// // // //             onValueChange={(value) => setFilterProvider(value as any)}
// // // //           >
// // // //             <SelectTrigger>
// // // //               <SelectValue />
// // // //             </SelectTrigger>
// // // //             <SelectContent>
// // // //               <SelectItem value="all">All Providers</SelectItem>
// // // //               <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
// // // //               <SelectItem value="openai">OpenAI</SelectItem>
// // // //             </SelectContent>
// // // //           </Select>

// // // //           <Select
// // // //             value={filterCategory}
// // // //             onValueChange={(value) => setFilterCategory(value as any)}
// // // //           >
// // // //             <SelectTrigger>
// // // //               <SelectValue />
// // // //             </SelectTrigger>
// // // //             <SelectContent>
// // // //               <SelectItem value="all">All Styles</SelectItem>
// // // //               <SelectItem value="professional">Professional</SelectItem>
// // // //               <SelectItem value="casual">Casual</SelectItem>
// // // //               <SelectItem value="energetic">Energetic</SelectItem>
// // // //               <SelectItem value="calm">Calm</SelectItem>
// // // //             </SelectContent>
// // // //           </Select>
// // // //         </div>

// // // //         {/* Voice Grid */}
// // // //         <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
// // // //           {filteredVoices.map((voice) => (
// // // //             <div
// // // //               key={voice.id}
// // // //               className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
// // // //                 selectedVoice.id === voice.id
// // // //                   ? "border-purple-500 bg-purple-50"
// // // //                   : "border-gray-200 hover:border-gray-300"
// // // //               }`}
// // // //               onClick={() =>
// // // //                 onVoiceChange({
// // // //                   id: voice.id,
// // // //                   name: voice.name,
// // // //                   provider: voice.provider,
// // // //                 })
// // // //               }
// // // //             >
// // // //               <div className="flex items-center justify-between">
// // // //                 <div className="flex-1">
// // // //                   <div className="flex items-center gap-2">
// // // //                     <span className="font-medium text-sm">{voice.name}</span>
// // // //                     <Badge variant="outline" className="text-xs">
// // // //                       {voice.provider}
// // // //                     </Badge>
// // // //                     <Badge variant="outline" className="text-xs capitalize">
// // // //                       {voice.category}
// // // //                     </Badge>
// // // //                   </div>
// // // //                   <div className="text-xs text-gray-500 mt-1">
// // // //                     {voice.description} • {voice.accent}
// // // //                   </div>
// // // //                 </div>
// // // //                 {selectedVoice.id === voice.id && (
// // // //                   <CheckCircle className="h-4 w-4 text-purple-600" />
// // // //                 )}
// // // //               </div>
// // // //             </div>
// // // //           ))}
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }
// // // // );

// // // // // Enhanced Service Configuration Components
// // // // const EnhancementConfig = observer(() => {
// // // //   const config =
// // // //     workspaceHub.aiStudioManager.getServiceConfig("enhancement") || {};

// // // //   const updateConfig = (updates: any) => {
// // // //     workspaceHub.aiStudioManager.updateServiceConfig("enhancement", updates);
// // // //   };

// // // //   const handleStartProcessing = async () => {
// // // //     for (const testimonialId of workspaceHub.aiStudioManager
// // // //       .selectedTestimonials) {
// // // //       await workspaceHub.aiStudioManager.startJob("enhancement", testimonialId);
// // // //     }
// // // //   };

// // // //   return (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-4">
// // // //         <CardTitle className="flex items-center gap-2">
// // // //           <Sparkles className="h-5 w-5 text-purple-600" />
// // // //           Video Enhancement Configuration
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="space-y-6">
// // // //         {/* Quality Selection */}
// // // //         <div className="space-y-3">
// // // //           <Label className="text-sm font-medium">Enhancement Quality</Label>
// // // //           <Select
// // // //             value={config.quality}
// // // //             onValueChange={(value) => updateConfig({ quality: value })}
// // // //           >
// // // //             <SelectTrigger>
// // // //               <SelectValue />
// // // //             </SelectTrigger>
// // // //             <SelectContent>
// // // //               <SelectItem value="professional">
// // // //                 Professional - Highest quality, best results
// // // //               </SelectItem>
// // // //               <SelectItem value="high">
// // // //                 High - Great quality, faster processing
// // // //               </SelectItem>
// // // //               <SelectItem value="standard">
// // // //                 Standard - Good quality, quickest processing
// // // //               </SelectItem>
// // // //             </SelectContent>
// // // //           </Select>
// // // //         </div>

// // // //         {/* Enhancement Options */}
// // // //         <div className="space-y-4">
// // // //           <div className="grid grid-cols-2 gap-4">
// // // //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //               <div>
// // // //                 <Label className="text-sm font-medium">Color Enhancement</Label>
// // // //                 <p className="text-xs text-gray-500">Professional grading</p>
// // // //               </div>
// // // //               <Switch
// // // //                 checked={config.colorEnhancement}
// // // //                 onCheckedChange={(checked) =>
// // // //                   updateConfig({ colorEnhancement: checked })
// // // //                 }
// // // //               />
// // // //             </div>

// // // //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //               <div>
// // // //                 <Label className="text-sm font-medium">
// // // //                   Video Stabilization
// // // //                 </Label>
// // // //                 <p className="text-xs text-gray-500">Smooth footage</p>
// // // //               </div>
// // // //               <Switch
// // // //                 checked={config.stabilization}
// // // //                 onCheckedChange={(checked) =>
// // // //                   updateConfig({ stabilization: checked })
// // // //                 }
// // // //               />
// // // //             </div>

// // // //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //               <div>
// // // //                 <Label className="text-sm font-medium">Sharpening</Label>
// // // //                 <p className="text-xs text-gray-500">Enhanced clarity</p>
// // // //               </div>
// // // //               <Switch
// // // //                 checked={config.sharpening}
// // // //                 onCheckedChange={(checked) =>
// // // //                   updateConfig({ sharpening: checked })
// // // //                 }
// // // //               />
// // // //             </div>

// // // //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //               <div>
// // // //                 <Label className="text-sm font-medium">
// // // //                   Lighting Enhancement
// // // //                 </Label>
// // // //                 <p className="text-xs text-gray-500">Optimized brightness</p>
// // // //               </div>
// // // //               <Switch
// // // //                 checked={config.lightingEnhancement}
// // // //                 onCheckedChange={(checked) =>
// // // //                   updateConfig({ lightingEnhancement: checked })
// // // //                 }
// // // //               />
// // // //             </div>

// // // //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //               <div>
// // // //                 <Label className="text-sm font-medium">Remove Noise</Label>
// // // //                 <p className="text-xs text-gray-500">Clean audio</p>
// // // //               </div>
// // // //               <Switch
// // // //                 checked={config.removeNoise}
// // // //                 onCheckedChange={(checked) =>
// // // //                   updateConfig({ removeNoise: checked })
// // // //                 }
// // // //               />
// // // //             </div>

// // // //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //               <div>
// // // //                 <Label className="text-sm font-medium">Add Branding</Label>
// // // //                 <p className="text-xs text-gray-500">Logo & watermark</p>
// // // //               </div>
// // // //               <Switch
// // // //                 checked={config.addBranding}
// // // //                 onCheckedChange={(checked) =>
// // // //                   updateConfig({ addBranding: checked })
// // // //                 }
// // // //               />
// // // //             </div>
// // // //           </div>
// // // //         </div>

// // // //         {/* Branding Configuration */}
// // // //         {config.addBranding && (
// // // //           <motion.div
// // // //             initial={{ opacity: 0, height: 0 }}
// // // //             animate={{ opacity: 1, height: "auto" }}
// // // //             className="space-y-4 p-4 bg-purple-50 rounded-lg"
// // // //           >
// // // //             <div className="space-y-2">
// // // //               <Label className="text-sm font-medium">Logo URL</Label>
// // // //               <Input
// // // //                 placeholder="https://example.com/logo.png"
// // // //                 value={config.logoUrl || ""}
// // // //                 onChange={(e) => updateConfig({ logoUrl: e.target.value })}
// // // //               />
// // // //             </div>

// // // //             <div className="space-y-2">
// // // //               <Label className="text-sm font-medium">Watermark Text</Label>
// // // //               <Input
// // // //                 placeholder="Your brand name"
// // // //                 value={config.watermarkText || ""}
// // // //                 onChange={(e) =>
// // // //                   updateConfig({ watermarkText: e.target.value })
// // // //                 }
// // // //               />
// // // //             </div>

// // // //             <div className="space-y-2">
// // // //               <Label className="text-sm font-medium">Watermark Position</Label>
// // // //               <Select
// // // //                 value={config.watermarkPosition}
// // // //                 onValueChange={(value) =>
// // // //                   updateConfig({ watermarkPosition: value })
// // // //                 }
// // // //               >
// // // //                 <SelectTrigger>
// // // //                   <SelectValue />
// // // //                 </SelectTrigger>
// // // //                 <SelectContent>
// // // //                   <SelectItem value="top-left">Top Left</SelectItem>
// // // //                   <SelectItem value="top-right">Top Right</SelectItem>
// // // //                   <SelectItem value="bottom-left">Bottom Left</SelectItem>
// // // //                   <SelectItem value="bottom-right">Bottom Right</SelectItem>
// // // //                   <SelectItem value="center">Center</SelectItem>
// // // //                 </SelectContent>
// // // //               </Select>
// // // //             </div>
// // // //           </motion.div>
// // // //         )}

// // // //         {/* Background Music */}
// // // //         <div className="space-y-4">
// // // //           <div className="flex items-center justify-between">
// // // //             <Label className="text-sm font-medium">Background Music</Label>
// // // //             <Switch
// // // //               checked={config.addBackgroundMusic}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ addBackgroundMusic: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           {config.addBackgroundMusic && (
// // // //             <motion.div
// // // //               initial={{ opacity: 0, height: 0 }}
// // // //               animate={{ opacity: 1, height: "auto" }}
// // // //               className="space-y-3"
// // // //             >
// // // //               <div className="space-y-2">
// // // //                 <Label className="text-sm font-medium">
// // // //                   Music Volume: {config.backgroundMusicVolume}%
// // // //                 </Label>
// // // //                 <Slider
// // // //                   value={[config.backgroundMusicVolume]}
// // // //                   onValueChange={([value]) =>
// // // //                     updateConfig({ backgroundMusicVolume: value })
// // // //                   }
// // // //                   max={100}
// // // //                   step={5}
// // // //                 />
// // // //               </div>
// // // //             </motion.div>
// // // //           )}
// // // //         </div>

// // // //         <Button
// // // //           onClick={handleStartProcessing}
// // // //           className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
// // // //           disabled={!workspaceHub.aiStudioManager.hasSelectedTestimonials}
// // // //         >
// // // //           <Sparkles className="h-4 w-4 mr-2" />
// // // //           Start Enhancement
// // // //         </Button>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );
// // // // });

// // // // const StoryModeConfig = observer(() => {
// // // //   const config =
// // // //     workspaceHub.aiStudioManager.getServiceConfig("story_mode") || {};

// // // //   const updateConfig = (updates: any) => {
// // // //     workspaceHub.aiStudioManager.updateServiceConfig("story_mode", updates);
// // // //   };

// // // //   const handleStartProcessing = async () => {
// // // //     for (const testimonialId of workspaceHub.aiStudioManager
// // // //       .selectedTestimonials) {
// // // //       await workspaceHub.aiStudioManager.startJob("story_mode", testimonialId);
// // // //     }
// // // //   };

// // // //   return (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-4">
// // // //         <CardTitle className="flex items-center gap-2">
// // // //           <Video className="h-5 w-5 text-blue-600" />
// // // //           Story Mode Configuration
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="space-y-6">
// // // //         {/* Highlight Type Selection */}
// // // //         <HighlightTypeSelector
// // // //           selectedType={config.highlightType || "general"}
// // // //           onTypeChange={(type) => updateConfig({ highlightType: type })}
// // // //         />

// // // //         {/* Video Settings */}
// // // //         <div className="space-y-4">
// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">
// // // //               Maximum Duration (seconds)
// // // //             </Label>
// // // //             <div className="flex items-center gap-4">
// // // //               <Slider
// // // //                 value={[config.maxDuration || 60]}
// // // //                 onValueChange={([value]) =>
// // // //                   updateConfig({ maxDuration: value })
// // // //                 }
// // // //                 min={15}
// // // //                 max={300}
// // // //                 step={15}
// // // //                 className="flex-1"
// // // //               />
// // // //               <span className="text-sm font-medium w-12">
// // // //                 {config.maxDuration || 60}s
// // // //               </span>
// // // //             </div>
// // // //           </div>

// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">Transition Style</Label>
// // // //             <Select
// // // //               value={config.transitionStyle}
// // // //               onValueChange={(value) =>
// // // //                 updateConfig({ transitionStyle: value })
// // // //               }
// // // //             >
// // // //               <SelectTrigger>
// // // //                 <SelectValue />
// // // //               </SelectTrigger>
// // // //               <SelectContent>
// // // //                 <SelectItem value="fade">Smooth Fade</SelectItem>
// // // //                 <SelectItem value="cut">Quick Cut</SelectItem>
// // // //                 <SelectItem value="slide">Slide Transition</SelectItem>
// // // //                 <SelectItem value="zoom">Zoom Effect</SelectItem>
// // // //               </SelectContent>
// // // //             </Select>
// // // //           </div>
// // // //         </div>

// // // //         {/* Intro/Outro Configuration */}
// // // //         <div className="space-y-4">
// // // //           <div className="flex items-center justify-between">
// // // //             <Label className="text-sm font-medium">Include Intro</Label>
// // // //             <Switch
// // // //               checked={config.addIntro}
// // // //               onCheckedChange={(checked) => updateConfig({ addIntro: checked })}
// // // //             />
// // // //           </div>

// // // //           {config.addIntro && (
// // // //             <motion.div
// // // //               initial={{ opacity: 0, height: 0 }}
// // // //               animate={{ opacity: 1, height: "auto" }}
// // // //               className="space-y-2"
// // // //             >
// // // //               <Label className="text-sm font-medium">Intro Text</Label>
// // // //               <Textarea
// // // //                 placeholder="Enter your intro text..."
// // // //                 value={config.introText || ""}
// // // //                 onChange={(e) => updateConfig({ introText: e.target.value })}
// // // //                 rows={3}
// // // //               />
// // // //             </motion.div>
// // // //           )}

// // // //           <div className="flex items-center justify-between">
// // // //             <Label className="text-sm font-medium">Include Outro</Label>
// // // //             <Switch
// // // //               checked={config.addOutro}
// // // //               onCheckedChange={(checked) => updateConfig({ addOutro: checked })}
// // // //             />
// // // //           </div>

// // // //           {config.addOutro && (
// // // //             <motion.div
// // // //               initial={{ opacity: 0, height: 0 }}
// // // //               animate={{ opacity: 1, height: "auto" }}
// // // //               className="space-y-2"
// // // //             >
// // // //               <Label className="text-sm font-medium">Outro Text</Label>
// // // //               <Textarea
// // // //                 placeholder="Enter your outro text..."
// // // //                 value={config.outroText || ""}
// // // //                 onChange={(e) => updateConfig({ outroText: e.target.value })}
// // // //                 rows={3}
// // // //               />
// // // //             </motion.div>
// // // //           )}
// // // //         </div>

// // // //         {/* Audio Options */}
// // // //         <div className="grid grid-cols-2 gap-4">
// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Background Music</Label>
// // // //               <p className="text-xs text-gray-500">Enhance mood</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.backgroundMusic}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ backgroundMusic: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Voice Over</Label>
// // // //               <p className="text-xs text-gray-500">AI narration</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.voiceOverEnabled}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ voiceOverEnabled: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Remove Noise</Label>
// // // //               <p className="text-xs text-gray-500">Clean audio</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.removeNoise}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ removeNoise: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Include Timestamps</Label>
// // // //               <p className="text-xs text-gray-500">Show timing</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.includeTimestamps}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ includeTimestamps: checked })
// // // //               }
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         <Button
// // // //           onClick={handleStartProcessing}
// // // //           className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
// // // //           disabled={!workspaceHub.aiStudioManager.hasSelectedTestimonials}
// // // //         >
// // // //           <Video className="h-4 w-4 mr-2" />
// // // //           Create Story Video
// // // //         </Button>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );
// // // // });

// // // // const ClippingConfig = observer(() => {
// // // //   const config =
// // // //     workspaceHub.aiStudioManager.getServiceConfig("clipping") || {};

// // // //   const updateConfig = (updates: any) => {
// // // //     workspaceHub.aiStudioManager.updateServiceConfig("clipping", updates);
// // // //   };

// // // //   const handleStartProcessing = async () => {
// // // //     for (const testimonialId of workspaceHub.aiStudioManager
// // // //       .selectedTestimonials) {
// // // //       await workspaceHub.aiStudioManager.startJob("clipping", testimonialId);
// // // //     }
// // // //   };

// // // //   return (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-4">
// // // //         <CardTitle className="flex items-center gap-2">
// // // //           <Scissors className="h-5 w-5 text-emerald-600" />
// // // //           Smart Clipping Configuration
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="space-y-6">
// // // //         {/* Highlight Type Selection */}
// // // //         <HighlightTypeSelector
// // // //           selectedType={config.highlightType || "general"}
// // // //           onTypeChange={(type) => updateConfig({ highlightType: type })}
// // // //         />

// // // //         {/* Clip Settings */}
// // // //         <div className="space-y-4">
// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">
// // // //               Maximum Clips: {config.maxClips || 5}
// // // //             </Label>
// // // //             <Slider
// // // //               value={[config.maxClips || 5]}
// // // //               onValueChange={([value]) => updateConfig({ maxClips: value })}
// // // //               min={1}
// // // //               max={20}
// // // //               step={1}
// // // //             />
// // // //           </div>

// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">
// // // //               Clip Duration: {config.clipDuration || 15} seconds
// // // //             </Label>
// // // //             <Slider
// // // //               value={[config.clipDuration || 15]}
// // // //               onValueChange={([value]) => updateConfig({ clipDuration: value })}
// // // //               min={5}
// // // //               max={120}
// // // //               step={5}
// // // //             />
// // // //           </div>

// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">Export Format</Label>
// // // //             <Select
// // // //               value={config.exportFormat}
// // // //               onValueChange={(value) => updateConfig({ exportFormat: value })}
// // // //             >
// // // //               <SelectTrigger>
// // // //                 <SelectValue />
// // // //               </SelectTrigger>
// // // //               <SelectContent>
// // // //                 <SelectItem value="mp4">MP4 (Recommended)</SelectItem>
// // // //                 <SelectItem value="mov">MOV (High Quality)</SelectItem>
// // // //                 <SelectItem value="webm">WebM (Web Optimized)</SelectItem>
// // // //               </SelectContent>
// // // //             </Select>
// // // //           </div>

// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">Clip Naming Pattern</Label>
// // // //             <Input
// // // //               placeholder="Clip_{index}_{highlight_type}"
// // // //               value={config.clipNamingPattern || ""}
// // // //               onChange={(e) =>
// // // //                 updateConfig({ clipNamingPattern: e.target.value })
// // // //               }
// // // //             />
// // // //             <p className="text-xs text-gray-500">
// // // //               Variables: {"{index}"}, {"{highlight_type}"}, {"{timestamp}"}
// // // //             </p>
// // // //           </div>
// // // //         </div>

// // // //         {/* Clip Options */}
// // // //         <div className="grid grid-cols-2 gap-4">
// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Add Branding</Label>
// // // //               <p className="text-xs text-gray-500">Logo & watermark</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.addBranding}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ addBranding: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Include Subtitles</Label>
// // // //               <p className="text-xs text-gray-500">Auto captions</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.includeSubtitles}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ includeSubtitles: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">
// // // //                 Auto Generate Titles
// // // //               </Label>
// // // //               <p className="text-xs text-gray-500">AI-powered titles</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.autoGenerateTitles}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ autoGenerateTitles: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Background Music</Label>
// // // //               <p className="text-xs text-gray-500">Add music tracks</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.backgroundMusic}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ backgroundMusic: checked })
// // // //               }
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         <Button
// // // //           onClick={handleStartProcessing}
// // // //           className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
// // // //           disabled={!workspaceHub.aiStudioManager.hasSelectedTestimonials}
// // // //         >
// // // //           <Scissors className="h-4 w-4 mr-2" />
// // // //           Generate Clips
// // // //         </Button>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );
// // // // });

// // // // const PlatformOptimizerConfig = observer(() => {
// // // //   const config =
// // // //     workspaceHub.aiStudioManager.getServiceConfig("platform_optimizer") || {};

// // // //   const updateConfig = (updates: any) => {
// // // //     workspaceHub.aiStudioManager.updateServiceConfig(
// // // //       "platform_optimizer",
// // // //       updates
// // // //     );
// // // //   };

// // // //   const handleStartProcessing = async () => {
// // // //     for (const testimonialId of workspaceHub.aiStudioManager
// // // //       .selectedTestimonials) {
// // // //       await workspaceHub.aiStudioManager.startJob(
// // // //         "platform_optimizer",
// // // //         testimonialId
// // // //       );
// // // //     }
// // // //   };

// // // //   const platformOptions = [
// // // //     {
// // // //       id: "instagram_reel",
// // // //       label: "Instagram Reel",
// // // //       aspect: "9:16",
// // // //       duration: "60s",
// // // //       icon: "📱",
// // // //     },
// // // //     {
// // // //       id: "instagram_story",
// // // //       label: "Instagram Story",
// // // //       aspect: "9:16",
// // // //       duration: "15s",
// // // //       icon: "📖",
// // // //     },
// // // //     {
// // // //       id: "youtube_short",
// // // //       label: "YouTube Short",
// // // //       aspect: "9:16",
// // // //       duration: "60s",
// // // //       icon: "📺",
// // // //     },
// // // //     {
// // // //       id: "tiktok",
// // // //       label: "TikTok",
// // // //       aspect: "9:16",
// // // //       duration: "60s",
// // // //       icon: "🎵",
// // // //     },
// // // //     {
// // // //       id: "linkedin_video",
// // // //       label: "LinkedIn Video",
// // // //       aspect: "16:9",
// // // //       duration: "120s",
// // // //       icon: "💼",
// // // //     },
// // // //     {
// // // //       id: "twitter_video",
// // // //       label: "Twitter Video",
// // // //       aspect: "16:9",
// // // //       duration: "140s",
// // // //       icon: "🐦",
// // // //     },
// // // //   ];

// // // //   return (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-4">
// // // //         <CardTitle className="flex items-center gap-2">
// // // //           <Monitor className="h-5 w-5 text-orange-600" />
// // // //           Platform Optimizer Configuration
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="space-y-6">
// // // //         {/* Platform Selection */}
// // // //         <div className="space-y-3">
// // // //           <Label className="text-sm font-medium">Target Platforms</Label>
// // // //           <div className="grid grid-cols-2 gap-3">
// // // //             {platformOptions.map((platform) => (
// // // //               <div
// // // //                 key={platform.id}
// // // //                 className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
// // // //                   config.platforms?.includes(platform.id)
// // // //                     ? "border-orange-500 bg-orange-50"
// // // //                     : "border-gray-200 hover:border-gray-300"
// // // //                 }`}
// // // //                 onClick={() => {
// // // //                   const currentPlatforms = config.platforms || [];
// // // //                   if (currentPlatforms.includes(platform.id)) {
// // // //                     updateConfig({
// // // //                       platforms: currentPlatforms.filter(
// // // //                         (p) => p !== platform.id
// // // //                       ),
// // // //                     });
// // // //                   } else {
// // // //                     updateConfig({
// // // //                       platforms: [...currentPlatforms, platform.id],
// // // //                     });
// // // //                   }
// // // //                 }}
// // // //               >
// // // //                 <div className="flex items-center justify-between">
// // // //                   <div>
// // // //                     <div className="flex items-center gap-2">
// // // //                       <span className="text-lg">{platform.icon}</span>
// // // //                       <span className="font-medium text-sm">
// // // //                         {platform.label}
// // // //                       </span>
// // // //                     </div>
// // // //                     <div className="text-xs text-gray-500 mt-1">
// // // //                       {platform.aspect} • {platform.duration}
// // // //                     </div>
// // // //                   </div>
// // // //                   {config.platforms?.includes(platform.id) && (
// // // //                     <CheckCircle className="h-4 w-4 text-orange-600" />
// // // //                   )}
// // // //                 </div>
// // // //               </div>
// // // //             ))}
// // // //           </div>
// // // //         </div>

// // // //         {/* Caption Style */}
// // // //         {config.addCaptions && (
// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">Caption Style</Label>
// // // //             <Select
// // // //               value={config.captionStyle}
// // // //               onValueChange={(value) => updateConfig({ captionStyle: value })}
// // // //             >
// // // //               <SelectTrigger>
// // // //                 <SelectValue />
// // // //               </SelectTrigger>
// // // //               <SelectContent>
// // // //                 <SelectItem value="modern">
// // // //                   Modern - Clean and minimal
// // // //                 </SelectItem>
// // // //                 <SelectItem value="classic">
// // // //                   Classic - Traditional style
// // // //                 </SelectItem>
// // // //                 <SelectItem value="bold">Bold - Eye-catching design</SelectItem>
// // // //                 <SelectItem value="minimal">
// // // //                   Minimal - Subtle appearance
// // // //                 </SelectItem>
// // // //               </SelectContent>
// // // //             </Select>
// // // //           </div>
// // // //         )}

// // // //         {/* Optimization Options */}
// // // //         <div className="grid grid-cols-1 gap-3">
// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">
// // // //                 Content-Aware Cropping
// // // //               </Label>
// // // //               <p className="text-xs text-gray-500">Smart subject detection</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.contentAwareCropping}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ contentAwareCropping: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Auto Captions</Label>
// // // //               <p className="text-xs text-gray-500">
// // // //                 Platform-optimized subtitles
// // // //               </p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.addCaptions}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ addCaptions: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Add Hashtags</Label>
// // // //               <p className="text-xs text-gray-500">Platform-specific tags</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.addHashtags}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ addHashtags: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">
// // // //                 Enhance After Optimization
// // // //               </Label>
// // // //               <p className="text-xs text-gray-500">Apply enhancement service</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.enhanceAfterOptimization}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ enhanceAfterOptimization: checked })
// // // //               }
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         {/* File Size Limit */}
// // // //         {config.maxFileSize && (
// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">
// // // //               Max File Size: {config.maxFileSize}MB
// // // //             </Label>
// // // //             <Slider
// // // //               value={[config.maxFileSize]}
// // // //               onValueChange={([value]) => updateConfig({ maxFileSize: value })}
// // // //               min={10}
// // // //               max={500}
// // // //               step={10}
// // // //             />
// // // //           </div>
// // // //         )}

// // // //         <Button
// // // //           onClick={handleStartProcessing}
// // // //           className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
// // // //           disabled={
// // // //             !workspaceHub.aiStudioManager.hasSelectedTestimonials ||
// // // //             !config.platforms?.length
// // // //           }
// // // //         >
// // // //           <Monitor className="h-4 w-4 mr-2" />
// // // //           Optimize for Platforms
// // // //         </Button>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );
// // // // });

// // // // const NoiseRemovalConfig = observer(() => {
// // // //   const config =
// // // //     workspaceHub.aiStudioManager.getServiceConfig("noise_removal") || {};

// // // //   const updateConfig = (updates: any) => {
// // // //     workspaceHub.aiStudioManager.updateServiceConfig("noise_removal", updates);
// // // //   };

// // // //   const handleStartProcessing = async () => {
// // // //     for (const testimonialId of workspaceHub.aiStudioManager
// // // //       .selectedTestimonials) {
// // // //       await workspaceHub.aiStudioManager.startJob(
// // // //         "noise_removal",
// // // //         testimonialId
// // // //       );
// // // //     }
// // // //   };

// // // //   return (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-4">
// // // //         <CardTitle className="flex items-center gap-2">
// // // //           <VolumeX className="h-5 w-5 text-indigo-600" />
// // // //           Noise Removal Configuration
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="space-y-6">
// // // //         <div className="space-y-2">
// // // //           <Label className="text-sm font-medium">
// // // //             Noise Reduction Intensity
// // // //           </Label>
// // // //           <Select
// // // //             value={config.intensity}
// // // //             onValueChange={(value) => updateConfig({ intensity: value })}
// // // //           >
// // // //             <SelectTrigger>
// // // //               <SelectValue />
// // // //             </SelectTrigger>
// // // //             <SelectContent>
// // // //               <SelectItem value="light">
// // // //                 Light - Gentle noise reduction
// // // //               </SelectItem>
// // // //               <SelectItem value="medium">
// // // //                 Medium - Balanced cleaning (Recommended)
// // // //               </SelectItem>
// // // //               <SelectItem value="aggressive">
// // // //                 Aggressive - Maximum noise removal
// // // //               </SelectItem>
// // // //             </SelectContent>
// // // //           </Select>
// // // //         </div>

// // // //         <div className="space-y-2">
// // // //           <Label className="text-sm font-medium">Output Format</Label>
// // // //           <Select
// // // //             value={config.outputFormat}
// // // //             onValueChange={(value) => updateConfig({ outputFormat: value })}
// // // //           >
// // // //             <SelectTrigger>
// // // //               <SelectValue />
// // // //             </SelectTrigger>
// // // //             <SelectContent>
// // // //               <SelectItem value="mp3">
// // // //                 MP3 - Compressed, smaller file
// // // //               </SelectItem>
// // // //               <SelectItem value="wav">WAV - Lossless, high quality</SelectItem>
// // // //               <SelectItem value="aac">
// // // //                 AAC - Balanced quality and size
// // // //               </SelectItem>
// // // //             </SelectContent>
// // // //           </Select>
// // // //         </div>

// // // //         <div className="grid grid-cols-1 gap-3">
// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">
// // // //                 Preserve Voice Quality
// // // //               </Label>
// // // //               <p className="text-xs text-gray-500">Protect vocal clarity</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.preserveVoice}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ preserveVoice: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Remove Echo</Label>
// // // //               <p className="text-xs text-gray-500">Eliminate reverb effects</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.removeEcho}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ removeEcho: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Enhance Clarity</Label>
// // // //               <p className="text-xs text-gray-500">Improve speech clarity</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.enhanceClarity}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ enhanceClarity: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Normalize Volume</Label>
// // // //               <p className="text-xs text-gray-500">Consistent audio levels</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.normalizeVolume}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ normalizeVolume: checked })
// // // //               }
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         <Button
// // // //           onClick={handleStartProcessing}
// // // //           className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
// // // //           disabled={!workspaceHub.aiStudioManager.hasSelectedTestimonials}
// // // //         >
// // // //           <VolumeX className="h-4 w-4 mr-2" />
// // // //           Remove Noise
// // // //         </Button>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );
// // // // });

// // // // const ContentGeneratorConfig = observer(() => {
// // // //   const config =
// // // //     workspaceHub.aiStudioManager.getServiceConfig("content_generator") || {};

// // // //   const updateConfig = (updates: any) => {
// // // //     workspaceHub.aiStudioManager.updateServiceConfig(
// // // //       "content_generator",
// // // //       updates
// // // //     );
// // // //   };

// // // //   const handleStartProcessing = async () => {
// // // //     await workspaceHub.aiStudioManager.startJob(
// // // //       "content_generator",
// // // //       workspaceHub.aiStudioManager.selectedTestimonials[0]
// // // //     );
// // // //   };

// // // //   const contentTypeOptions = [
// // // //     {
// // // //       id: "email",
// // // //       label: "Email Campaign",
// // // //       description: "Marketing emails and newsletters",
// // // //     },
// // // //     {
// // // //       id: "blog",
// // // //       label: "Blog Post",
// // // //       description: "SEO-optimized articles and posts",
// // // //     },
// // // //     {
// // // //       id: "case_study",
// // // //       label: "Case Study",
// // // //       description: "Detailed success stories",
// // // //     },
// // // //     {
// // // //       id: "sales_deck",
// // // //       label: "Sales Deck",
// // // //       description: "Presentation slides and pitches",
// // // //     },
// // // //     {
// // // //       id: "whitepaper",
// // // //       label: "Whitepaper",
// // // //       description: "Technical documents and reports",
// // // //     },
// // // //     {
// // // //       id: "social_posts",
// // // //       label: "Social Media Posts",
// // // //       description: "Platform-specific content",
// // // //     },
// // // //     {
// // // //       id: "press_release",
// // // //       label: "Press Release",
// // // //       description: "Media announcements",
// // // //     },
// // // //     {
// // // //       id: "landing_page",
// // // //       label: "Landing Page Copy",
// // // //       description: "Conversion-focused pages",
// // // //     },
// // // //     {
// // // //       id: "testimonial_wall",
// // // //       label: "Testimonial Wall",
// // // //       description: "Showcase collections",
// // // //     },
// // // //   ];

// // // //   return (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-4">
// // // //         <CardTitle className="flex items-center gap-2">
// // // //           <FileText className="h-5 w-5 text-pink-600" />
// // // //           Content Generator Configuration
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="space-y-6">
// // // //         {/* Content Type Selection */}
// // // //         <div className="space-y-3">
// // // //           <Label className="text-sm font-medium">
// // // //             Content Types to Generate
// // // //           </Label>
// // // //           <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
// // // //             {contentTypeOptions.map((type) => (
// // // //               <div key={type.id} className="flex items-center space-x-3">
// // // //                 <Checkbox
// // // //                   id={type.id}
// // // //                   checked={config.contentTypes?.includes(type.id)}
// // // //                   onCheckedChange={(checked) => {
// // // //                     const currentTypes = config.contentTypes || [];
// // // //                     if (checked) {
// // // //                       updateConfig({
// // // //                         contentTypes: [...currentTypes, type.id],
// // // //                       });
// // // //                     } else {
// // // //                       updateConfig({
// // // //                         contentTypes: currentTypes.filter(
// // // //                           (id) => id !== type.id
// // // //                         ),
// // // //                       });
// // // //                     }
// // // //                   }}
// // // //                 />
// // // //                 <div className="flex-1">
// // // //                   <Label htmlFor={type.id} className="text-sm font-medium">
// // // //                     {type.label}
// // // //                   </Label>
// // // //                   <p className="text-xs text-gray-500">{type.description}</p>
// // // //                 </div>
// // // //               </div>
// // // //             ))}
// // // //           </div>
// // // //         </div>

// // // //         {/* Content Settings */}
// // // //         <div className="space-y-4">
// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">Tone & Style</Label>
// // // //             <Select
// // // //               value={config.tone}
// // // //               onValueChange={(value) => updateConfig({ tone: value })}
// // // //             >
// // // //               <SelectTrigger>
// // // //                 <SelectValue />
// // // //               </SelectTrigger>
// // // //               <SelectContent>
// // // //                 <SelectItem value="professional">
// // // //                   Professional - Formal and authoritative
// // // //                 </SelectItem>
// // // //                 <SelectItem value="casual">
// // // //                   Casual - Friendly and approachable
// // // //                 </SelectItem>
// // // //                 <SelectItem value="persuasive">
// // // //                   Persuasive - Compelling and action-oriented
// // // //                 </SelectItem>
// // // //                 <SelectItem value="technical">
// // // //                   Technical - Detailed and precise
// // // //                 </SelectItem>
// // // //                 <SelectItem value="friendly">
// // // //                   Friendly - Warm and personal
// // // //                 </SelectItem>
// // // //               </SelectContent>
// // // //             </Select>
// // // //           </div>

// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">Target Audience</Label>
// // // //             <Input
// // // //               placeholder="e.g., potential customers, existing clients, industry professionals"
// // // //               value={config.targetAudience || ""}
// // // //               onChange={(e) => updateConfig({ targetAudience: e.target.value })}
// // // //             />
// // // //           </div>

// // // //           {config.wordCountTarget && (
// // // //             <div className="space-y-2">
// // // //               <Label className="text-sm font-medium">
// // // //                 Word Count Target: {config.wordCountTarget}
// // // //               </Label>
// // // //               <Slider
// // // //                 value={[config.wordCountTarget]}
// // // //                 onValueChange={([value]) =>
// // // //                   updateConfig({ wordCountTarget: value })
// // // //                 }
// // // //                 min={100}
// // // //                 max={2000}
// // // //                 step={50}
// // // //               />
// // // //             </div>
// // // //           )}
// // // //         </div>

// // // //         {/* Auto-selection and Brand Voice */}
// // // //         <div className="space-y-4">
// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">
// // // //                 Auto-Select Positive Reviews
// // // //               </Label>
// // // //               <p className="text-xs text-gray-500">
// // // //                 Use only high-rated testimonials
// // // //               </p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.autoSelectPositive}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ autoSelectPositive: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Include Metrics</Label>
// // // //               <p className="text-xs text-gray-500">Add quantifiable results</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.includeMetrics}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ includeMetrics: checked })
// // // //               }
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         {/* Brand Voice */}
// // // //         <div className="space-y-2">
// // // //           <Label className="text-sm font-medium">Brand Voice (Optional)</Label>
// // // //           <Textarea
// // // //             placeholder="Describe your brand's personality and communication style..."
// // // //             value={config.brandVoice || ""}
// // // //             onChange={(e) => updateConfig({ brandVoice: e.target.value })}
// // // //             rows={3}
// // // //           />
// // // //         </div>

// // // //         {/* Custom Requirements */}
// // // //         <div className="space-y-2">
// // // //           <Label className="text-sm font-medium">
// // // //             Custom Requirements (Optional)
// // // //           </Label>
// // // //           <Textarea
// // // //             placeholder="Any specific requirements for the generated content..."
// // // //             value={config.customRequirement || ""}
// // // //             onChange={(e) =>
// // // //               updateConfig({ customRequirement: e.target.value })
// // // //             }
// // // //             rows={3}
// // // //           />
// // // //         </div>

// // // //         <Button
// // // //           onClick={handleStartProcessing}
// // // //           className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
// // // //           disabled={
// // // //             !workspaceHub.aiStudioManager.hasSelectedTestimonials ||
// // // //             !config.contentTypes?.length
// // // //           }
// // // //         >
// // // //           <FileText className="h-4 w-4 mr-2" />
// // // //           Generate Content
// // // //         </Button>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );
// // // // });

// // // // const TextPolishingConfig = observer(() => {
// // // //   const config =
// // // //     workspaceHub.aiStudioManager.getServiceConfig("text_polishing") || {};

// // // //   const updateConfig = (updates: any) => {
// // // //     workspaceHub.aiStudioManager.updateServiceConfig("text_polishing", updates);
// // // //   };

// // // //   const handleStartProcessing = async () => {
// // // //     for (const testimonialId of workspaceHub.aiStudioManager
// // // //       .selectedTestimonials) {
// // // //       await workspaceHub.aiStudioManager.startJob(
// // // //         "text_polishing",
// // // //         testimonialId
// // // //       );
// // // //     }
// // // //   };

// // // //   return (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-4">
// // // //         <CardTitle className="flex items-center gap-2">
// // // //           <Wand2 className="h-5 w-5 text-violet-600" />
// // // //           Text Polishing Configuration
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="space-y-6">
// // // //         <div className="space-y-2">
// // // //           <Label className="text-sm font-medium">Target Style</Label>
// // // //           <Select
// // // //             value={config.targetStyle}
// // // //             onValueChange={(value) => updateConfig({ targetStyle: value })}
// // // //           >
// // // //             <SelectTrigger>
// // // //               <SelectValue />
// // // //             </SelectTrigger>
// // // //             <SelectContent>
// // // //               <SelectItem value="professional">
// // // //                 Professional - Formal business language
// // // //               </SelectItem>
// // // //               <SelectItem value="casual">
// // // //                 Casual - Natural, conversational tone
// // // //               </SelectItem>
// // // //               <SelectItem value="marketing">
// // // //                 Marketing - Persuasive and engaging
// // // //               </SelectItem>
// // // //               <SelectItem value="technical">
// // // //                 Technical - Precise and detailed
// // // //               </SelectItem>
// // // //               <SelectItem value="conversational">
// // // //                 Conversational - Friendly dialogue
// // // //               </SelectItem>
// // // //             </SelectContent>
// // // //           </Select>
// // // //         </div>

// // // //         <div className="space-y-2">
// // // //           <Label className="text-sm font-medium">Length Optimization</Label>
// // // //           <Select
// // // //             value={config.lengthOptimization}
// // // //             onValueChange={(value) =>
// // // //               updateConfig({ lengthOptimization: value })
// // // //             }
// // // //           >
// // // //             <SelectTrigger>
// // // //               <SelectValue />
// // // //             </SelectTrigger>
// // // //             <SelectContent>
// // // //               <SelectItem value="maintain">
// // // //                 Maintain - Keep original length
// // // //               </SelectItem>
// // // //               <SelectItem value="expand">Expand - Add more detail</SelectItem>
// // // //               <SelectItem value="condense">
// // // //                 Condense - Make more concise
// // // //               </SelectItem>
// // // //             </SelectContent>
// // // //           </Select>
// // // //         </div>

// // // //         <div className="grid grid-cols-1 gap-3">
// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">
// // // //                 Preserve Authenticity
// // // //               </Label>
// // // //               <p className="text-xs text-gray-500">
// // // //                 Keep original voice and meaning
// // // //               </p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.preserveAuthenticity}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ preserveAuthenticity: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Grammar Correction</Label>
// // // //               <p className="text-xs text-gray-500">Fix grammatical errors</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.grammarCorrection}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ grammarCorrection: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Tone Adjustment</Label>
// // // //               <p className="text-xs text-gray-500">Optimize emotional tone</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.toneAdjustment}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ toneAdjustment: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">
// // // //                 Industry Terminology
// // // //               </Label>
// // // //               <p className="text-xs text-gray-500">
// // // //                 Use domain-specific language
// // // //               </p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.industryTerminology}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ industryTerminology: checked })
// // // //               }
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         <div className="space-y-2">
// // // //           <Label className="text-sm font-medium">
// // // //             Custom Instructions (Optional)
// // // //           </Label>
// // // //           <Textarea
// // // //             placeholder="Specific polishing instructions or style guidelines..."
// // // //             value={config.customPrompt || ""}
// // // //             onChange={(e) => updateConfig({ customPrompt: e.target.value })}
// // // //             rows={3}
// // // //           />
// // // //         </div>

// // // //         <Button
// // // //           onClick={handleStartProcessing}
// // // //           className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
// // // //           disabled={!workspaceHub.aiStudioManager.hasSelectedTestimonials}
// // // //         >
// // // //           <Wand2 className="h-4 w-4 mr-2" />
// // // //           Polish Text
// // // //         </Button>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );
// // // // });

// // // // const TranslationConfig = observer(() => {
// // // //   const config =
// // // //     workspaceHub.aiStudioManager.getServiceConfig("translation") || {};

// // // //   const updateConfig = (updates: any) => {
// // // //     workspaceHub.aiStudioManager.updateServiceConfig("translation", updates);
// // // //   };

// // // //   const handleStartProcessing = async () => {
// // // //     for (const testimonialId of workspaceHub.aiStudioManager
// // // //       .selectedTestimonials) {
// // // //       await workspaceHub.aiStudioManager.startJob("translation", testimonialId);
// // // //     }
// // // //   };

// // // //   const languageOptions = [
// // // //     { code: "es", name: "Spanish", flag: "🇪🇸" },
// // // //     { code: "fr", name: "French", flag: "🇫🇷" },
// // // //     { code: "de", name: "German", flag: "🇩🇪" },
// // // //     { code: "it", name: "Italian", flag: "🇮🇹" },
// // // //     { code: "pt", name: "Portuguese", flag: "🇵🇹" },
// // // //     { code: "nl", name: "Dutch", flag: "🇳🇱" },
// // // //     { code: "ru", name: "Russian", flag: "🇷🇺" },
// // // //     { code: "ja", name: "Japanese", flag: "🇯🇵" },
// // // //     { code: "ko", name: "Korean", flag: "🇰🇷" },
// // // //     { code: "zh", name: "Chinese", flag: "🇨🇳" },
// // // //     { code: "ar", name: "Arabic", flag: "🇸🇦" },
// // // //     { code: "hi", name: "Hindi", flag: "🇮🇳" },
// // // //   ];

// // // //   return (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-4">
// // // //         <CardTitle className="flex items-center gap-2">
// // // //           <Languages className="h-5 w-5 text-teal-600" />
// // // //           Translation Configuration
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="space-y-6">
// // // //         {/* Language Selection */}
// // // //         <div className="space-y-3">
// // // //           <Label className="text-sm font-medium">Target Languages</Label>
// // // //           <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
// // // //             {languageOptions.map((language) => (
// // // //               <div key={language.code} className="flex items-center space-x-3">
// // // //                 <Checkbox
// // // //                   id={language.code}
// // // //                   checked={config.targetLanguages?.includes(language.code)}
// // // //                   onCheckedChange={(checked) => {
// // // //                     const currentLangs = config.targetLanguages || [];
// // // //                     if (checked) {
// // // //                       updateConfig({
// // // //                         targetLanguages: [...currentLangs, language.code],
// // // //                       });
// // // //                     } else {
// // // //                       updateConfig({
// // // //                         targetLanguages: currentLangs.filter(
// // // //                           (code) => code !== language.code
// // // //                         ),
// // // //                       });
// // // //                     }
// // // //                   }}
// // // //                 />
// // // //                 <div className="flex items-center gap-2">
// // // //                   <span className="text-lg">{language.flag}</span>
// // // //                   <Label
// // // //                     htmlFor={language.code}
// // // //                     className="text-sm font-medium"
// // // //                   >
// // // //                     {language.name}
// // // //                   </Label>
// // // //                 </div>
// // // //               </div>
// // // //             ))}
// // // //           </div>
// // // //         </div>

// // // //         <div className="space-y-2">
// // // //           <Label className="text-sm font-medium">Formality Level</Label>
// // // //           <Select
// // // //             value={config.formalityLevel}
// // // //             onValueChange={(value) => updateConfig({ formalityLevel: value })}
// // // //           >
// // // //             <SelectTrigger>
// // // //               <SelectValue />
// // // //             </SelectTrigger>
// // // //             <SelectContent>
// // // //               <SelectItem value="formal">
// // // //                 Formal - Professional language
// // // //               </SelectItem>
// // // //               <SelectItem value="neutral">Neutral - Balanced tone</SelectItem>
// // // //               <SelectItem value="informal">
// // // //                 Informal - Casual language
// // // //               </SelectItem>
// // // //             </SelectContent>
// // // //           </Select>
// // // //         </div>

// // // //         <div className="grid grid-cols-1 gap-3">
// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Preserve Tone</Label>
// // // //               <p className="text-xs text-gray-500">Maintain emotional impact</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.preserveTone}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ preserveTone: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Cultural Adaptation</Label>
// // // //               <p className="text-xs text-gray-500">Adapt to local culture</p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.culturalAdaptation}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ culturalAdaptation: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Include Original</Label>
// // // //               <p className="text-xs text-gray-500">
// // // //                 Keep original text alongside
// // // //               </p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.includeOriginal}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ includeOriginal: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Localization</Label>
// // // //               <p className="text-xs text-gray-500">
// // // //                 Adapt units, dates, formats
// // // //               </p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.localization}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ localization: checked })
// // // //               }
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         <Button
// // // //           onClick={handleStartProcessing}
// // // //           className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
// // // //           disabled={
// // // //             !workspaceHub.aiStudioManager.hasSelectedTestimonials ||
// // // //             !config.targetLanguages?.length
// // // //           }
// // // //         >
// // // //           <Languages className="h-4 w-4 mr-2" />
// // // //           Translate Content
// // // //         </Button>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );
// // // // });

// // // // const NarrationConfig = observer(() => {
// // // //   const config =
// // // //     workspaceHub.aiStudioManager.getServiceConfig("narration") || {};

// // // //   const updateConfig = (updates: any) => {
// // // //     workspaceHub.aiStudioManager.updateServiceConfig("narration", updates);
// // // //   };

// // // //   const handleStartProcessing = async () => {
// // // //     for (const testimonialId of workspaceHub.aiStudioManager
// // // //       .selectedTestimonials) {
// // // //       await workspaceHub.aiStudioManager.startJob("narration", testimonialId);
// // // //     }
// // // //   };

// // // //   return (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-4">
// // // //         <CardTitle className="flex items-center gap-2">
// // // //           <Mic className="h-5 w-5 text-rose-600" />
// // // //           AI Narration Configuration
// // // //         </CardTitle>
// // // //       </CardHeader>
// // // //       <CardContent className="space-y-6">
// // // //         {/* Voice Selection */}
// // // //         <VoiceSelector
// // // //           selectedVoice={{
// // // //             id: config.voiceId || "rachel",
// // // //             name: config.voiceName || "Rachel",
// // // //             provider: config.voiceProvider || "elevenlabs",
// // // //           }}
// // // //           onVoiceChange={(voice) =>
// // // //             updateConfig({
// // // //               voiceId: voice.id,
// // // //               voiceName: voice.name,
// // // //               voiceProvider: voice.provider,
// // // //             })
// // // //           }
// // // //         />

// // // //         {/* Voice Settings */}
// // // //         <div className="space-y-4">
// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">
// // // //               Speech Speed: {config.speed || 1.0}x
// // // //             </Label>
// // // //             <Slider
// // // //               value={[config.speed || 1.0]}
// // // //               onValueChange={([value]) => updateConfig({ speed: value })}
// // // //               min={0.5}
// // // //               max={2.0}
// // // //               step={0.1}
// // // //             />
// // // //           </div>

// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">
// // // //               Voice Pitch: {config.pitch || 1.0}x
// // // //             </Label>
// // // //             <Slider
// // // //               value={[config.pitch || 1.0]}
// // // //               onValueChange={([value]) => updateConfig({ pitch: value })}
// // // //               min={0.5}
// // // //               max={1.5}
// // // //               step={0.1}
// // // //             />
// // // //           </div>

// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">Emotion Style</Label>
// // // //             <Select
// // // //               value={config.emotion}
// // // //               onValueChange={(value) => updateConfig({ emotion: value })}
// // // //             >
// // // //               <SelectTrigger>
// // // //                 <SelectValue />
// // // //               </SelectTrigger>
// // // //               <SelectContent>
// // // //                 <SelectItem value="neutral">
// // // //                   Neutral - Balanced delivery
// // // //                 </SelectItem>
// // // //                 <SelectItem value="professional">
// // // //                   Professional - Business-like
// // // //                 </SelectItem>
// // // //                 <SelectItem value="happy">
// // // //                   Happy - Upbeat and positive
// // // //                 </SelectItem>
// // // //                 <SelectItem value="energetic">
// // // //                   Energetic - Dynamic and lively
// // // //                 </SelectItem>
// // // //                 <SelectItem value="calm">
// // // //                   Calm - Soothing and peaceful
// // // //                 </SelectItem>
// // // //               </SelectContent>
// // // //             </Select>
// // // //           </div>

// // // //           <div className="space-y-2">
// // // //             <Label className="text-sm font-medium">Output Format</Label>
// // // //             <Select
// // // //               value={config.outputFormat}
// // // //               onValueChange={(value) => updateConfig({ outputFormat: value })}
// // // //             >
// // // //               <SelectTrigger>
// // // //                 <SelectValue />
// // // //               </SelectTrigger>
// // // //               <SelectContent>
// // // //                 <SelectItem value="mp3">
// // // //                   MP3 - Compressed, smaller file
// // // //                 </SelectItem>
// // // //                 <SelectItem value="wav">
// // // //                   WAV - Lossless, high quality
// // // //                 </SelectItem>
// // // //                 <SelectItem value="aac">
// // // //                   AAC - Balanced quality and size
// // // //                 </SelectItem>
// // // //               </SelectContent>
// // // //             </Select>
// // // //           </div>
// // // //         </div>

// // // //         {/* Audio Enhancement Options */}
// // // //         <div className="space-y-4">
// // // //           <div className="flex items-center justify-between">
// // // //             <Label className="text-sm font-medium">Background Music</Label>
// // // //             <Switch
// // // //               checked={config.addBackgroundMusic}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ addBackgroundMusic: checked })
// // // //               }
// // // //             />
// // // //           </div>

// // // //           {config.addBackgroundMusic && (
// // // //             <motion.div
// // // //               initial={{ opacity: 0, height: 0 }}
// // // //               animate={{ opacity: 1, height: "auto" }}
// // // //               className="space-y-3"
// // // //             >
// // // //               <div className="space-y-2">
// // // //                 <Label className="text-sm font-medium">
// // // //                   Music Volume: {config.backgroundMusicVolume || 15}%
// // // //                 </Label>
// // // //                 <Slider
// // // //                   value={[config.backgroundMusicVolume || 15]}
// // // //                   onValueChange={([value]) =>
// // // //                     updateConfig({ backgroundMusicVolume: value })
// // // //                   }
// // // //                   max={50}
// // // //                   step={5}
// // // //                 />
// // // //               </div>
// // // //             </motion.div>
// // // //           )}

// // // //           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // // //             <div>
// // // //               <Label className="text-sm font-medium">Enhance Audio</Label>
// // // //               <p className="text-xs text-gray-500">
// // // //                 Post-processing enhancement
// // // //               </p>
// // // //             </div>
// // // //             <Switch
// // // //               checked={config.enhanceAudio}
// // // //               onCheckedChange={(checked) =>
// // // //                 updateConfig({ enhanceAudio: checked })
// // // //               }
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         <Button
// // // //           onClick={handleStartProcessing}
// // // //           className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
// // // //           disabled={!workspaceHub.aiStudioManager.hasSelectedTestimonials}
// // // //         >
// // // //           <Mic className="h-4 w-4 mr-2" />
// // // //           Generate Narration
// // // //         </Button>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );
// // // // });

// // // // // Service Configuration Panel Router
// // // // const ServiceConfigPanel = observer(({ serviceId }: { serviceId: string }) => {
// // // //   switch (serviceId) {
// // // //     case "enhancement":
// // // //       return <EnhancementConfig />;
// // // //     case "story_mode":
// // // //       return <StoryModeConfig />;
// // // //     case "clipping":
// // // //       return <ClippingConfig />;
// // // //     case "platform_optimizer":
// // // //       return <PlatformOptimizerConfig />;
// // // //     case "noise_removal":
// // // //       return <NoiseRemovalConfig />;
// // // //     case "content_generator":
// // // //       return <ContentGeneratorConfig />;
// // // //     case "text_polishing":
// // // //       return <TextPolishingConfig />;
// // // //     case "translation":
// // // //       return <TranslationConfig />;
// // // //     case "narration":
// // // //       return <NarrationConfig />;
// // // //     default:
// // // //       return (
// // // //         <Card className="border-0 shadow-lg">
// // // //           <CardContent className="py-8 text-center">
// // // //             <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
// // // //             <h3 className="text-lg font-medium text-gray-900 mb-2">
// // // //               Service Not Found
// // // //             </h3>
// // // //             <p className="text-gray-500">
// // // //               The selected service configuration is not available.
// // // //             </p>
// // // //           </CardContent>
// // // //         </Card>
// // // //       );
// // // //   }
// // // // });

// // // // // Continue with the rest of the components...
// // // // // [TestimonialSelector, JobMonitor, ServiceGrid, and AIStudio remain the same as before]

// // // // // Main AI Studio Application (keeping existing implementation but with updated service list)
// // // // const AIStudio = observer(() => {
// // // //   const [activeTab, setActiveTab] = useState("services");
// // // //   const [selectedCategory, setSelectedCategory] = useState<
// // // //     "all" | "video" | "content" | "optimization" | "addon"
// // // //   >("all");
// // // //   const [sortBy, setSortBy] = useState<"popularity" | "alphabetical" | "time">(
// // // //     "popularity"
// // // //   );
// // // //   const activeService = workspaceHub.aiStudioManager.activeService;
// // // //   const activeJobs = workspaceHub.aiStudioManager.activeJobs;

// // // //   useEffect(() => {
// // // //     if (!workspaceHub.testimonialManager.testimonials) {
// // // //       workspaceHub.testimonialManager.getTestimonials();
// // // //     }
// // // //   }, []);

// // // //   let filteredServices =
// // // //     selectedCategory === "all"
// // // //       ? AI_SERVICES
// // // //       : AI_SERVICES.filter((service) => service.category === selectedCategory);

// // // //   filteredServices = [...filteredServices].sort((a, b) => {
// // // //     switch (sortBy) {
// // // //       case "popularity":
// // // //         return b.popularity - a.popularity;
// // // //       case "alphabetical":
// // // //         return a.title.localeCompare(b.title);
// // // //       case "time":
// // // //         return a.estimatedTime.localeCompare(b.estimatedTime);
// // // //       default:
// // // //         return 0;
// // // //     }
// // // //   });

// // // //   const categories = [
// // // //     { id: "all", label: "All Services", count: AI_SERVICES.length },
// // // //     {
// // // //       id: "video",
// // // //       label: "Video",
// // // //       count: AI_SERVICES.filter((s) => s.category === "video").length,
// // // //     },
// // // //     {
// // // //       id: "content",
// // // //       label: "Content",
// // // //       count: AI_SERVICES.filter((s) => s.category === "content").length,
// // // //     },
// // // //     {
// // // //       id: "optimization",
// // // //       label: "Optimization",
// // // //       count: AI_SERVICES.filter((s) => s.category === "optimization").length,
// // // //     },
// // // //     {
// // // //       id: "addon",
// // // //       label: "Add-ons",
// // // //       count: AI_SERVICES.filter((s) => s.category === "addon").length,
// // // //     },
// // // //   ];

// // // //   return (
// // // //     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
// // // //       {/* Header remains the same */}
// // // //       <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
// // // //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// // // //           <div className="flex items-center justify-between h-16">
// // // //             <div className="flex items-center gap-4">
// // // //               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
// // // //                 <Sparkles className="h-6 w-6 text-white" />
// // // //               </div>
// // // //               <div>
// // // //                 <h1 className="text-xl font-bold text-gray-900">AI Studio</h1>
// // // //                 <p className="text-sm text-gray-500">
// // // //                   Transform testimonials with AI
// // // //                 </p>
// // // //               </div>
// // // //             </div>

// // // //             <div className="flex items-center gap-4">
// // // //               {activeJobs.length > 0 && (
// // // //                 <Badge className="bg-blue-100 text-blue-700 animate-pulse">
// // // //                   {activeJobs.length} Processing
// // // //                 </Badge>
// // // //               )}

// // // //               {activeService && (
// // // //                 <Badge className="bg-purple-100 text-purple-700">
// // // //                   {AI_SERVICES.find((s) => s.id === activeService)?.title}{" "}
// // // //                   Active
// // // //                 </Badge>
// // // //               )}

// // // //               <Button
// // // //                 variant="outline"
// // // //                 onClick={() => workspaceHub.aiStudioManager.reset()}
// // // //                 className="hidden sm:flex"
// // // //               >
// // // //                 <RefreshCw className="h-4 w-4 mr-2" />
// // // //                 Reset
// // // //               </Button>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// // // //         <Tabs
// // // //           value={activeTab}
// // // //           onValueChange={setActiveTab}
// // // //           className="space-y-8"
// // // //         >
// // // //           <TabsList className="bg-white/90 backdrop-blur-sm p-1 shadow-lg border">
// // // //             <TabsTrigger
// // // //               value="services"
// // // //               className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
// // // //             >
// // // //               <Zap className="h-4 w-4 mr-2" />
// // // //               AI Services
// // // //             </TabsTrigger>
// // // //             <TabsTrigger
// // // //               value="configure"
// // // //               className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
// // // //               disabled={!activeService}
// // // //             >
// // // //               <Settings className="h-4 w-4 mr-2" />
// // // //               Configure
// // // //             </TabsTrigger>
// // // //             <TabsTrigger
// // // //               value="monitor"
// // // //               className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
// // // //             >
// // // //               <Monitor className="h-4 w-4 mr-2" />
// // // //               Monitor
// // // //             </TabsTrigger>
// // // //           </TabsList>

// // // //           <TabsContent value="services" className="space-y-8">
// // // //             {/* Hero Section */}
// // // //             <motion.div
// // // //               initial={{ opacity: 0, y: 20 }}
// // // //               animate={{ opacity: 1, y: 0 }}
// // // //               className="text-center max-w-3xl mx-auto"
// // // //             >
// // // //               <h2 className="text-4xl font-bold text-gray-900 mb-4">
// // // //                 AI-Powered Testimonial Studio
// // // //               </h2>
// // // //               <p className="text-xl text-gray-600 mb-8">
// // // //                 Transform your customer testimonials into professional marketing
// // // //                 content with our comprehensive suite of AI services.
// // // //               </p>
// // // //             </motion.div>

// // // //             {/* Category and Sort Controls */}
// // // //             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
// // // //               <div className="flex items-center gap-2 overflow-x-auto">
// // // //                 {categories.map((category) => (
// // // //                   <Button
// // // //                     key={category.id}
// // // //                     variant={
// // // //                       selectedCategory === category.id ? "default" : "outline"
// // // //                     }
// // // //                     size="sm"
// // // //                     onClick={() => setSelectedCategory(category.id as any)}
// // // //                     className={`whitespace-nowrap ${
// // // //                       selectedCategory === category.id
// // // //                         ? "bg-purple-600 hover:bg-purple-700"
// // // //                         : ""
// // // //                     }`}
// // // //                   >
// // // //                     {category.label}
// // // //                     <Badge variant="secondary" className="ml-2">
// // // //                       {category.count}
// // // //                     </Badge>
// // // //                   </Button>
// // // //                 ))}
// // // //               </div>

// // // //               <Select
// // // //                 value={sortBy}
// // // //                 onValueChange={(value) => setSortBy(value as any)}
// // // //               >
// // // //                 <SelectTrigger className="w-[180px]">
// // // //                   <SelectValue placeholder="Sort by..." />
// // // //                 </SelectTrigger>
// // // //                 <SelectContent>
// // // //                   <SelectItem value="popularity">Most Popular</SelectItem>
// // // //                   <SelectItem value="alphabetical">Alphabetical</SelectItem>
// // // //                   <SelectItem value="time">Processing Time</SelectItem>
// // // //                 </SelectContent>
// // // //               </Select>
// // // //             </div>

// // // //             {/* Services Grid */}
// // // //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
// // // //               <AnimatePresence mode="popLayout">
// // // //                 {filteredServices.map((service) => {
// // // //                   const IconComponent = service.icon;
// // // //                   const isActive = activeService === service.id;

// // // //                   return (
// // // //                     <motion.div
// // // //                       key={service.id}
// // // //                       layout
// // // //                       initial={{ opacity: 0, scale: 0.9 }}
// // // //                       animate={{ opacity: 1, scale: 1 }}
// // // //                       exit={{ opacity: 0, scale: 0.9 }}
// // // //                       transition={{ duration: 0.2 }}
// // // //                       whileHover={{ y: -4 }}
// // // //                     >
// // // //                       <Card
// // // //                         className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-0 shadow-lg h-full ${
// // // //                           isActive
// // // //                             ? "ring-2 ring-purple-500 shadow-purple-200"
// // // //                             : "hover:shadow-gray-200"
// // // //                         } ${service.isAddon ? "border-l-4 border-l-orange-400" : ""}`}
// // // //                         onClick={() =>
// // // //                           workspaceHub.aiStudioManager.setActiveService(
// // // //                             isActive ? null : (service.id as any)
// // // //                           )
// // // //                         }
// // // //                       >
// // // //                         <CardHeader className="pb-4">
// // // //                           <div className="flex items-start justify-between mb-3">
// // // //                             <div
// // // //                               className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg`}
// // // //                             >
// // // //                               <IconComponent className="h-6 w-6 text-white" />
// // // //                             </div>
// // // //                             <div className="flex items-center gap-1">
// // // //                               {service.isAddon && (
// // // //                                 <Badge
// // // //                                   variant="outline"
// // // //                                   className="text-xs text-orange-600 border-orange-300"
// // // //                                 >
// // // //                                   Add-on
// // // //                                 </Badge>
// // // //                               )}
// // // //                             </div>
// // // //                           </div>

// // // //                           <div className="space-y-2">
// // // //                             <CardTitle className="text-lg font-bold text-gray-900">
// // // //                               {service.title}
// // // //                             </CardTitle>
// // // //                             <div className="flex items-center gap-2">
// // // //                               <Badge variant="secondary" className="text-xs">
// // // //                                 {service.estimatedTime}
// // // //                               </Badge>
// // // //                               <Badge
// // // //                                 variant="outline"
// // // //                                 className="text-xs capitalize"
// // // //                               >
// // // //                                 {service.category}
// // // //                               </Badge>
// // // //                             </div>
// // // //                           </div>
// // // //                         </CardHeader>

// // // //                         <CardContent className="pt-0 space-y-4">
// // // //                           <p className="text-sm text-gray-600 leading-relaxed">
// // // //                             {service.description}
// // // //                           </p>

// // // //                           <div className="space-y-2">
// // // //                             {service.features
// // // //                               .slice(0, 3)
// // // //                               .map((feature, index) => (
// // // //                                 <div
// // // //                                   key={index}
// // // //                                   className="flex items-center gap-2"
// // // //                                 >
// // // //                                   <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
// // // //                                   <span className="text-xs text-gray-700">
// // // //                                     {feature}
// // // //                                   </span>
// // // //                                 </div>
// // // //                               ))}
// // // //                           </div>

// // // //                           <Button
// // // //                             variant={isActive ? "default" : "outline"}
// // // //                             size="sm"
// // // //                             className={`w-full ${
// // // //                               isActive
// // // //                                 ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
// // // //                                 : "hover:bg-gray-50"
// // // //                             }`}
// // // //                           >
// // // //                             {isActive ? (
// // // //                               <>
// // // //                                 <Settings className="h-4 w-4 mr-2" />
// // // //                                 Configure
// // // //                               </>
// // // //                             ) : (
// // // //                               <>
// // // //                                 <Play className="h-4 w-4 mr-2" />
// // // //                                 Select Service
// // // //                               </>
// // // //                             )}
// // // //                           </Button>
// // // //                         </CardContent>
// // // //                       </Card>
// // // //                     </motion.div>
// // // //                   );
// // // //                 })}
// // // //               </AnimatePresence>
// // // //             </div>
// // // //           </TabsContent>

// // // //           <TabsContent value="configure" className="space-y-8">
// // // //             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
// // // //               <div className="space-y-6">
// // // //                 {/* Add the TestimonialSelector component here */}
// // // //                 <TestimonialSelector />
// // // //               </div>

// // // //               <div className="space-y-6">
// // // //                 {activeService && (
// // // //                   <ServiceConfigPanel serviceId={activeService} />
// // // //                 )}

// // // //                 {/* Add the JobMonitor component here */}
// // // //                 <JobMonitor />
// // // //               </div>
// // // //             </div>
// // // //           </TabsContent>

// // // //           <TabsContent value="monitor" className="space-y-8">
// // // //             <div className="text-center mb-8">
// // // //               <h2 className="text-3xl font-bold text-gray-900 mb-4">
// // // //                 Processing Monitor
// // // //               </h2>
// // // //               <p className="text-lg text-gray-600">
// // // //                 Track the progress of your AI processing jobs and manage
// // // //                 results.
// // // //               </p>
// // // //             </div>

// // // //             <div className="max-w-4xl mx-auto">
// // // //               {/* JobMonitor would go here */}
// // // //               <JobMonitor />
// // // //             </div>
// // // //           </TabsContent>
// // // //         </Tabs>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // });
// // // // export default AIStudio;

// // // // // Testimonial Selector Component (remains same as before but moved here for completeness)
// // // // const TestimonialSelector = observer(() => {
// // // //   const [searchTerm, setSearchTerm] = useState("");
// // // //   const [filterType, setFilterType] = useState("all");

// // // //   const testimonials = workspaceHub.testimonialManager.testimonials || [];
// // // //   const selectedIds = workspaceHub.aiStudioManager.selectedTestimonials;

// // // //   const filteredTestimonials = testimonials.filter((testimonial) => {
// // // //     const matchesSearch =
// // // //       !searchTerm ||
// // // //       testimonial.customer_name
// // // //         ?.toLowerCase()
// // // //         .includes(searchTerm.toLowerCase()) ||
// // // //       testimonial.content_preview
// // // //         ?.toLowerCase()
// // // //         .includes(searchTerm.toLowerCase());

// // // //     const matchesFilter =
// // // //       filterType === "all" ||
// // // //       (filterType === "video" && testimonial.media_type === "video") ||
// // // //       (filterType === "text" && testimonial.media_type === "text") ||
// // // //       (filterType === "high_rating" && (testimonial.rating || 0) >= 4);

// // // //     return matchesSearch && matchesFilter;
// // // //   });

// // // //   return (
// // // //     <Card className="border-0 shadow-lg">
// // // //       <CardHeader className="pb-4">
// // // //         <div className="flex items-center justify-between">
// // // //           <CardTitle className="flex items-center gap-2">
// // // //             <Target className="h-5 w-5 text-purple-600" />
// // // //             Select Testimonials
// // // //           </CardTitle>
// // // //           <Badge variant="secondary" className="bg-purple-100 text-purple-700">
// // // //             {selectedIds.length} selected
// // // //           </Badge>
// // // //         </div>
// // // //       </CardHeader>
// // // //       <CardContent className="space-y-4">
// // // //         {/* Search and Filter */}
// // // //         <div className="space-y-3">
// // // //           <div className="relative">
// // // //             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// // // //             <Input
// // // //               placeholder="Search testimonials..."
// // // //               value={searchTerm}
// // // //               onChange={(e) => setSearchTerm(e.target.value)}
// // // //               className="pl-10"
// // // //             />
// // // //           </div>

// // // //           <Select value={filterType} onValueChange={setFilterType}>
// // // //             <SelectTrigger>
// // // //               <SelectValue />
// // // //             </SelectTrigger>
// // // //             <SelectContent>
// // // //               <SelectItem value="all">All Testimonials</SelectItem>
// // // //               <SelectItem value="video">Video Only</SelectItem>
// // // //               <SelectItem value="text">Text Only</SelectItem>
// // // //               <SelectItem value="high_rating">High Rating (4+)</SelectItem>
// // // //             </SelectContent>
// // // //           </Select>
// // // //         </div>

// // // //         {/* Quick Actions */}
// // // //         <div className="flex gap-2">
// // // //           <Button
// // // //             variant="outline"
// // // //             size="sm"
// // // //             onClick={() => {
// // // //               workspaceHub.aiStudioManager.selectAllTestimonials(
// // // //                 filteredTestimonials.map((t) => t.id)
// // // //               );
// // // //             }}
// // // //           >
// // // //             Select All
// // // //           </Button>
// // // //           <Button
// // // //             variant="outline"
// // // //             size="sm"
// // // //             onClick={() =>
// // // //               workspaceHub.aiStudioManager.clearTestimonialSelection()
// // // //             }
// // // //           >
// // // //             Clear All
// // // //           </Button>
// // // //         </div>

// // // //         {/* Testimonials List */}
// // // //         <div className="space-y-3 max-h-80 overflow-y-auto">
// // // //           {filteredTestimonials.map((testimonial) => (
// // // //             <motion.div
// // // //               key={testimonial.id}
// // // //               layout
// // // //               initial={{ opacity: 0, y: 10 }}
// // // //               animate={{ opacity: 1, y: 0 }}
// // // //               className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
// // // //                 selectedIds.includes(testimonial.id)
// // // //                   ? "border-purple-500 bg-purple-50"
// // // //                   : "border-gray-200 hover:border-gray-300 bg-white"
// // // //               }`}
// // // //               onClick={() =>
// // // //                 workspaceHub.aiStudioManager.toggleTestimonialSelection(
// // // //                   testimonial.id
// // // //                 )
// // // //               }
// // // //             >
// // // //               <div className="flex items-center justify-between">
// // // //                 <div className="flex-1 min-w-0">
// // // //                   <div className="flex items-center gap-2">
// // // //                     <h4 className="font-medium text-gray-900 truncate">
// // // //                       {testimonial.customer_name || "Anonymous"}
// // // //                     </h4>
// // // //                     {testimonial.media_type === "video" && (
// // // //                       <Badge variant="outline" className="text-xs">
// // // //                         Video
// // // //                       </Badge>
// // // //                     )}
// // // //                     {testimonial.rating && (
// // // //                       <div className="flex items-center gap-1">
// // // //                         <span className="text-yellow-500">★</span>
// // // //                         <span className="text-xs text-gray-600">
// // // //                           {testimonial.rating}
// // // //                         </span>
// // // //                       </div>
// // // //                     )}
// // // //                   </div>
// // // //                   <p className="text-sm text-gray-500 truncate mt-1">
// // // //                     {testimonial.content_preview || "No preview available"}
// // // //                   </p>
// // // //                 </div>
// // // //                 {selectedIds.includes(testimonial.id) && (
// // // //                   <CheckCircle className="h-5 w-5 text-purple-600 ml-3 flex-shrink-0" />
// // // //                 )}
// // // //               </div>
// // // //             </motion.div>
// // // //           ))}

// // // //           {filteredTestimonials.length === 0 && (
// // // //             <div className="text-center py-8 text-gray-500">
// // // //               <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
// // // //               <p>No testimonials found</p>
// // // //             </div>
// // // //           )}
// // // //         </div>
// // // //       </CardContent>
// // // //     </Card>
// // // //   );
// // // // });

// // // import React, { useState, useEffect } from "react";
// // // import { motion, AnimatePresence } from "framer-motion";
// // // import {
// // //   Sparkles,
// // //   Video,
// // //   Scissors,
// // //   VolumeX,
// // //   FileText,
// // //   Languages,
// // //   Wand2,
// // //   Play,
// // //   Settings,
// // //   CheckCircle,
// // //   Clock,
// // //   AlertCircle,
// // //   X,
// // //   Monitor,
// // //   Mic,
// // //   Search,
// // //   Filter,
// // //   MoreVertical,
// // //   ArrowRight,
// // //   Download,
// // //   Share2,
// // //   Eye,
// // //   Pause,
// // //   ChevronDown,
// // //   ChevronRight,
// // //   Target,
// // //   Users,
// // //   Workflow,
// // //   Layers,
// // //   RefreshCw,
// // //   Zap,
// // //   Star,
// // //   Calendar,
// // //   Bell,
// // //   ExternalLink,
// // //   Trash2,
// // //   RotateCcw,
// // //   CheckSquare,
// // // } from "lucide-react";

// // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // import { Button } from "@/components/ui/button";
// // // import { Badge } from "@/components/ui/badge";
// // // import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // // import { Progress } from "@/components/ui/progress";
// // // import { Input } from "@/components/ui/input";
// // // import { Label } from "@/components/ui/label";
// // // import { Textarea } from "@/components/ui/textarea";
// // // import { Switch } from "@/components/ui/switch";
// // // import {
// // //   Select,
// // //   SelectContent,
// // //   SelectItem,
// // //   SelectTrigger,
// // //   SelectValue,
// // // } from "@/components/ui/select";
// // // import { Checkbox } from "@/components/ui/checkbox";
// // // import { Slider } from "@/components/ui/slider";

// // // // AI Services Configuration
// // // const AI_SERVICES = [
// // //   {
// // //     id: "enhancement",
// // //     title: "Video Enhancement",
// // //     description:
// // //       "Transform raw testimonials into professional-quality videos with AI-powered visual and audio improvements, including noise reduction, color grading, and brand integration.",
// // //     icon: Sparkles,
// // //     category: "video",
// // //     estimatedTime: "2-5 minutes",
// // //     complexity: "Beginner",
// // //     features: [
// // //       "4K Upscaling",
// // //       "Noise Reduction",
// // //       "Color Grading",
// // //       "Brand Integration",
// // //     ],
// // //     gradient: "from-purple-600 to-indigo-600",
// // //     isQueued: true,
// // //     defaultSettings: {
// // //       quality: "Professional",
// // //       colorEnhancement: true,
// // //       stabilization: true,
// // //       addBranding: true,
// // //       removeNoise: true,
// // //     },
// // //   },
// // //   {
// // //     id: "story_mode",
// // //     title: "Story Mode",
// // //     description:
// // //       "Intelligently combine highlight moments into compelling narrative videos with custom intro/outro and seamless transitions between key moments.",
// // //     icon: Video,
// // //     category: "video",
// // //     estimatedTime: "3-7 minutes",
// // //     complexity: "Intermediate",
// // //     features: [
// // //       "Highlight Extraction",
// // //       "Smart Editing",
// // //       "Custom Branding",
// // //       "Voice Over",
// // //     ],
// // //     gradient: "from-blue-600 to-cyan-600",
// // //     isQueued: true,
// // //     defaultSettings: {
// // //       highlightType: "General",
// // //       addIntro: true,
// // //       addOutro: true,
// // //       backgroundMusic: true,
// // //       transitionStyle: "Fade",
// // //     },
// // //   },
// // //   {
// // //     id: "clipping",
// // //     title: "Smart Clipping",
// // //     description:
// // //       "Generate multiple engaging clips automatically based on emotional highlights, perfect for social media distribution and marketing campaigns.",
// // //     icon: Scissors,
// // //     category: "video",
// // //     estimatedTime: "1-3 minutes",
// // //     complexity: "Beginner",
// // //     features: [
// // //       "Multi-Clip Generation",
// // //       "Emotional AI",
// // //       "Auto Branding",
// // //       "Social Ready",
// // //     ],
// // //     gradient: "from-emerald-600 to-teal-600",
// // //     isQueued: true,
// // //     defaultSettings: {
// // //       maxClips: 5,
// // //       clipDuration: "15 seconds",
// // //       addBranding: true,
// // //       includeSubtitles: true,
// // //     },
// // //   },
// // //   {
// // //     id: "platform_optimizer",
// // //     title: "Platform Optimizer",
// // //     description:
// // //       "Optimize testimonials for specific social platforms with intelligent aspect ratio adjustment, captions, and content-aware cropping.",
// // //     icon: Monitor,
// // //     category: "optimization",
// // //     estimatedTime: "1-2 minutes",
// // //     complexity: "Beginner",
// // //     features: [
// // //       "Multi-Platform",
// // //       "Smart Cropping",
// // //       "Auto Captions",
// // //       "Platform Rules",
// // //     ],
// // //     gradient: "from-orange-600 to-red-600",
// // //     isQueued: true,
// // //     defaultSettings: {
// // //       platforms: ["Instagram Reel", "YouTube Short"],
// // //       contentAwareCropping: true,
// // //       addCaptions: true,
// // //       addHashtags: true,
// // //     },
// // //   },
// // //   {
// // //     id: "noise_removal",
// // //     title: "Audio Enhancement",
// // //     description:
// // //       "Remove background noise and enhance audio quality while preserving natural voice characteristics using advanced AI algorithms.",
// // //     icon: VolumeX,
// // //     category: "audio",
// // //     estimatedTime: "30 seconds",
// // //     complexity: "Beginner",
// // //     features: [
// // //       "Noise Removal",
// // //       "Voice Enhancement",
// // //       "Audio Clarity",
// // //       "Volume Normalization",
// // //     ],
// // //     gradient: "from-indigo-600 to-purple-600",
// // //     isQueued: true,
// // //     defaultSettings: {
// // //       intensity: "Medium",
// // //       preserveVoice: true,
// // //       enhanceClarity: true,
// // //       normalizeVolume: true,
// // //     },
// // //   },
// // //   {
// // //     id: "content_generator",
// // //     title: "Content Generator",
// // //     description:
// // //       "Generate high-impact marketing content from testimonials including email campaigns, blog posts, case studies, and social media posts.",
// // //     icon: FileText,
// // //     category: "content",
// // //     estimatedTime: "30-60 seconds",
// // //     complexity: "Beginner",
// // //     features: [
// // //       "Multiple Formats",
// // //       "SEO Optimized",
// // //       "Brand Voice",
// // //       "Ready to Publish",
// // //     ],
// // //     gradient: "from-pink-600 to-rose-600",
// // //     isQueued: false, // Streamed
// // //     defaultSettings: {
// // //       contentTypes: ["Email", "Blog Post"],
// // //       tone: "Professional",
// // //       targetAudience: "Potential customers",
// // //       includeMetrics: true,
// // //     },
// // //   },
// // //   {
// // //     id: "text_polishing",
// // //     title: "Text Enhancement",
// // //     description:
// // //       "Polish and enhance written testimonials while maintaining authenticity and original voice, improving clarity and impact.",
// // //     icon: Wand2,
// // //     category: "content",
// // //     estimatedTime: "15 seconds",
// // //     complexity: "Beginner",
// // //     features: [
// // //       "Grammar Enhancement",
// // //       "Tone Optimization",
// // //       "Clarity Improvement",
// // //       "Authenticity Preservation",
// // //     ],
// // //     gradient: "from-violet-600 to-purple-600",
// // //     isQueued: false, // Streamed
// // //     defaultSettings: {
// // //       preserveAuthenticity: true,
// // //       targetStyle: "Professional",
// // //       grammarCorrection: true,
// // //       lengthOptimization: "Maintain",
// // //     },
// // //   },
// // //   {
// // //     id: "translation",
// // //     title: "Translation",
// // //     description:
// // //       "Translate testimonials to multiple languages while preserving emotional tone and cultural context for global marketing reach.",
// // //     icon: Languages,
// // //     category: "content",
// // //     estimatedTime: "10-30 seconds",
// // //     complexity: "Beginner",
// // //     features: [
// // //       "60+ Languages",
// // //       "Tone Preservation",
// // //       "Cultural Adaptation",
// // //       "Native Quality",
// // //     ],
// // //     gradient: "from-teal-600 to-cyan-600",
// // //     isQueued: false, // Streamed
// // //     defaultSettings: {
// // //       targetLanguages: ["Spanish", "French"],
// // //       preserveTone: true,
// // //       culturalAdaptation: true,
// // //       formalityLevel: "Neutral",
// // //     },
// // //   },
// // //   {
// // //     id: "narration",
// // //     title: "AI Narration",
// // //     description:
// // //       "Convert text testimonials to professional audio narration using premium AI voices from ElevenLabs and OpenAI with customizable settings.",
// // //     icon: Mic,
// // //     category: "audio",
// // //     estimatedTime: "30-90 seconds",
// // //     complexity: "Intermediate",
// // //     features: [
// // //       "Premium AI Voices",
// // //       "Natural Speech",
// // //       "Custom Settings",
// // //       "Multiple Providers",
// // //     ],
// // //     gradient: "from-rose-600 to-pink-600",
// // //     isQueued: true,
// // //     defaultSettings: {
// // //       voiceProvider: "ElevenLabs",
// // //       voiceName: "Rachel",
// // //       speed: "1.0x",
// // //       emotion: "Professional",
// // //     },
// // //   },
// // // ];

// // // const TESTIMONIALS_DATA = [
// // //   {
// // //     id: "1",
// // //     customer_name: "Sarah Johnson",
// // //     company: "TechCorp Solutions",
// // //     content_preview:
// // //       "This product completely transformed our workflow and increased our team's productivity by 300%. The customer support is exceptional and the implementation was seamless.",
// // //     media_type: "video",
// // //     rating: 5,
// // //     duration: 120,
// // //     created_at: "2024-01-15",
// // //     sentiment_score: 0.95,
// // //     highlight_count: 4,
// // //     thumbnail:
// // //       "https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=100&h=100&fit=crop&crop=face",
// // //   },
// // //   {
// // //     id: "2",
// // //     customer_name: "Michael Chen",
// // //     company: "StartupX",
// // //     content_preview:
// // //       "Amazing results! Our conversion rates improved dramatically within the first month of using this solution. Highly recommend to any growing business.",
// // //     media_type: "text",
// // //     rating: 5,
// // //     created_at: "2024-01-10",
// // //     sentiment_score: 0.92,
// // //   },
// // //   {
// // //     id: "3",
// // //     customer_name: "Emily Davis",
// // //     company: "Enterprise Inc",
// // //     content_preview:
// // //       "Professional service and outstanding results. The ROI was immediate and substantial. This is exactly what we needed to scale our operations effectively.",
// // //     media_type: "video",
// // //     rating: 5,
// // //     duration: 180,
// // //     created_at: "2024-01-08",
// // //     sentiment_score: 0.98,
// // //     highlight_count: 6,
// // //     thumbnail:
// // //       "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
// // //   },
// // //   {
// // //     id: "4",
// // //     customer_name: "David Wilson",
// // //     company: "Global Dynamics",
// // //     content_preview:
// // //       "Game-changing technology that solved our biggest challenges. The team's expertise and support made all the difference in our success.",
// // //     media_type: "video",
// // //     rating: 4,
// // //     duration: 95,
// // //     created_at: "2024-01-05",
// // //     sentiment_score: 0.88,
// // //     highlight_count: 3,
// // //     thumbnail:
// // //       "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
// // //   },
// // // ];

// // // // Toast Notification Component
// // // const Toast = ({ message, action, onAction, onClose }) => (
// // //   <motion.div
// // //     initial={{ opacity: 0, y: 50, scale: 0.95 }}
// // //     animate={{ opacity: 1, y: 0, scale: 1 }}
// // //     exit={{ opacity: 0, y: 50, scale: 0.95 }}
// // //     className="fixed bottom-6 right-6 bg-white border shadow-lg rounded-lg p-4 max-w-md z-50"
// // //   >
// // //     <div className="flex items-start gap-3">
// // //       <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
// // //       <div className="flex-1">
// // //         <p className="text-sm font-medium text-gray-900">{message}</p>
// // //         {action && (
// // //           <Button
// // //             variant="link"
// // //             size="sm"
// // //             className="p-0 h-auto text-blue-600 font-medium"
// // //             onClick={onAction}
// // //           >
// // //             {action}
// // //           </Button>
// // //         )}
// // //       </div>
// // //       <Button
// // //         variant="ghost"
// // //         size="sm"
// // //         className="h-6 w-6 p-0"
// // //         onClick={onClose}
// // //       >
// // //         <X className="h-4 w-4" />
// // //       </Button>
// // //     </div>
// // //   </motion.div>
// // // );

// // // // Service Configuration Modal
// // // const ServiceConfigModal = ({
// // //   service,
// // //   isOpen,
// // //   onClose,
// // //   onProcess,
// // //   selectedTestimonials,
// // // }) => {
// // //   const [config, setConfig] = useState(service?.defaultSettings || {});

// // //   useEffect(() => {
// // //     if (service) {
// // //       setConfig(service.defaultSettings || {});
// // //     }
// // //   }, [service]);

// // //   if (!service) return null;

// // //   const updateConfig = (key, value) => {
// // //     setConfig((prev) => ({ ...prev, [key]: value }));
// // //   };

// // //   const handleProcess = () => {
// // //     onProcess(service.id, config);
// // //     onClose();
// // //   };

// // //   const renderConfigOptions = () => {
// // //     switch (service.id) {
// // //       case "enhancement":
// // //         return (
// // //           <div className="space-y-6">
// // //             <div>
// // //               <Label className="text-sm font-medium">Quality Level</Label>
// // //               <Select
// // //                 value={config.quality}
// // //                 onValueChange={(value) => updateConfig("quality", value)}
// // //               >
// // //                 <SelectTrigger className="mt-1">
// // //                   <SelectValue />
// // //                 </SelectTrigger>
// // //                 <SelectContent>
// // //                   <SelectItem value="Professional">
// // //                     Professional - Highest quality
// // //                   </SelectItem>
// // //                   <SelectItem value="High">
// // //                     High - Great quality, faster
// // //                   </SelectItem>
// // //                   <SelectItem value="Standard">
// // //                     Standard - Good quality, quickest
// // //                   </SelectItem>
// // //                 </SelectContent>
// // //               </Select>
// // //             </div>

// // //             <div className="grid grid-cols-2 gap-4">
// // //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // //                 <Label className="text-sm font-medium">Color Enhancement</Label>
// // //                 <Switch
// // //                   checked={config.colorEnhancement}
// // //                   onCheckedChange={(checked) =>
// // //                     updateConfig("colorEnhancement", checked)
// // //                   }
// // //                 />
// // //               </div>
// // //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // //                 <Label className="text-sm font-medium">
// // //                   Video Stabilization
// // //                 </Label>
// // //                 <Switch
// // //                   checked={config.stabilization}
// // //                   onCheckedChange={(checked) =>
// // //                     updateConfig("stabilization", checked)
// // //                   }
// // //                 />
// // //               </div>
// // //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // //                 <Label className="text-sm font-medium">Add Branding</Label>
// // //                 <Switch
// // //                   checked={config.addBranding}
// // //                   onCheckedChange={(checked) =>
// // //                     updateConfig("addBranding", checked)
// // //                   }
// // //                 />
// // //               </div>
// // //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // //                 <Label className="text-sm font-medium">Remove Noise</Label>
// // //                 <Switch
// // //                   checked={config.removeNoise}
// // //                   onCheckedChange={(checked) =>
// // //                     updateConfig("removeNoise", checked)
// // //                   }
// // //                 />
// // //               </div>
// // //             </div>
// // //           </div>
// // //         );

// // //       case "story_mode":
// // //         return (
// // //           <div className="space-y-6">
// // //             <div>
// // //               <Label className="text-sm font-medium">Highlight Type</Label>
// // //               <Select
// // //                 value={config.highlightType}
// // //                 onValueChange={(value) => updateConfig("highlightType", value)}
// // //               >
// // //                 <SelectTrigger className="mt-1">
// // //                   <SelectValue />
// // //                 </SelectTrigger>
// // //                 <SelectContent>
// // //                   <SelectItem value="General">General Highlights</SelectItem>
// // //                   <SelectItem value="Emotional">
// // //                     Emotional Highlights
// // //                   </SelectItem>
// // //                   <SelectItem value="Results">Results & Metrics</SelectItem>
// // //                   <SelectItem value="Problem">Problem/Solution</SelectItem>
// // //                 </SelectContent>
// // //               </Select>
// // //             </div>

// // //             <div>
// // //               <Label className="text-sm font-medium">Transition Style</Label>
// // //               <Select
// // //                 value={config.transitionStyle}
// // //                 onValueChange={(value) =>
// // //                   updateConfig("transitionStyle", value)
// // //                 }
// // //               >
// // //                 <SelectTrigger className="mt-1">
// // //                   <SelectValue />
// // //                 </SelectTrigger>
// // //                 <SelectContent>
// // //                   <SelectItem value="Fade">Smooth Fade</SelectItem>
// // //                   <SelectItem value="Cut">Quick Cut</SelectItem>
// // //                   <SelectItem value="Slide">Slide Transition</SelectItem>
// // //                   <SelectItem value="Zoom">Zoom Effect</SelectItem>
// // //                 </SelectContent>
// // //               </Select>
// // //             </div>

// // //             <div className="grid grid-cols-2 gap-4">
// // //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // //                 <Label className="text-sm font-medium">Add Intro</Label>
// // //                 <Switch
// // //                   checked={config.addIntro}
// // //                   onCheckedChange={(checked) =>
// // //                     updateConfig("addIntro", checked)
// // //                   }
// // //                 />
// // //               </div>
// // //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// // //                 <Label className="text-sm font-medium">Add Outro</Label>
// // //                 <Switch
// // //                   checked={config.addOutro}
// // //                   onCheckedChange={(checked) =>
// // //                     updateConfig("addOutro", checked)
// // //                   }
// // //                 />
// // //               </div>
// // //             </div>
// // //           </div>
// // //         );

// // //       case "content_generator":
// // //         return (
// // //           <div className="space-y-6">
// // //             <div>
// // //               <Label className="text-sm font-medium">Content Types</Label>
// // //               <div className="mt-2 grid grid-cols-2 gap-2">
// // //                 {[
// // //                   "Email",
// // //                   "Blog Post",
// // //                   "Case Study",
// // //                   "Social Posts",
// // //                   "Sales Deck",
// // //                 ].map((type) => (
// // //                   <div key={type} className="flex items-center space-x-2">
// // //                     <Checkbox
// // //                       id={type}
// // //                       checked={config.contentTypes?.includes(type)}
// // //                       onCheckedChange={(checked) => {
// // //                         const current = config.contentTypes || [];
// // //                         if (checked) {
// // //                           updateConfig("contentTypes", [...current, type]);
// // //                         } else {
// // //                           updateConfig(
// // //                             "contentTypes",
// // //                             current.filter((t) => t !== type)
// // //                           );
// // //                         }
// // //                       }}
// // //                     />
// // //                     <Label htmlFor={type} className="text-sm">
// // //                       {type}
// // //                     </Label>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             </div>

// // //             <div>
// // //               <Label className="text-sm font-medium">Tone & Style</Label>
// // //               <Select
// // //                 value={config.tone}
// // //                 onValueChange={(value) => updateConfig("tone", value)}
// // //               >
// // //                 <SelectTrigger className="mt-1">
// // //                   <SelectValue />
// // //                 </SelectTrigger>
// // //                 <SelectContent>
// // //                   <SelectItem value="Professional">Professional</SelectItem>
// // //                   <SelectItem value="Casual">Casual</SelectItem>
// // //                   <SelectItem value="Persuasive">Persuasive</SelectItem>
// // //                   <SelectItem value="Technical">Technical</SelectItem>
// // //                 </SelectContent>
// // //               </Select>
// // //             </div>

// // //             <div>
// // //               <Label className="text-sm font-medium">Target Audience</Label>
// // //               <Input
// // //                 value={config.targetAudience}
// // //                 onChange={(e) => updateConfig("targetAudience", e.target.value)}
// // //                 placeholder="e.g., potential customers, industry professionals"
// // //                 className="mt-1"
// // //               />
// // //             </div>
// // //           </div>
// // //         );

// // //       case "translation":
// // //         return (
// // //           <div className="space-y-6">
// // //             <div>
// // //               <Label className="text-sm font-medium">Target Languages</Label>
// // //               <div className="mt-2 grid grid-cols-2 gap-2">
// // //                 {[
// // //                   "Spanish",
// // //                   "French",
// // //                   "German",
// // //                   "Italian",
// // //                   "Portuguese",
// // //                   "Chinese",
// // //                 ].map((lang) => (
// // //                   <div key={lang} className="flex items-center space-x-2">
// // //                     <Checkbox
// // //                       id={lang}
// // //                       checked={config.targetLanguages?.includes(lang)}
// // //                       onCheckedChange={(checked) => {
// // //                         const current = config.targetLanguages || [];
// // //                         if (checked) {
// // //                           updateConfig("targetLanguages", [...current, lang]);
// // //                         } else {
// // //                           updateConfig(
// // //                             "targetLanguages",
// // //                             current.filter((l) => l !== lang)
// // //                           );
// // //                         }
// // //                       }}
// // //                     />
// // //                     <Label htmlFor={lang} className="text-sm">
// // //                       {lang}
// // //                     </Label>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             </div>

// // //             <div>
// // //               <Label className="text-sm font-medium">Formality Level</Label>
// // //               <Select
// // //                 value={config.formalityLevel}
// // //                 onValueChange={(value) => updateConfig("formalityLevel", value)}
// // //               >
// // //                 <SelectTrigger className="mt-1">
// // //                   <SelectValue />
// // //                 </SelectTrigger>
// // //                 <SelectContent>
// // //                   <SelectItem value="Formal">Formal</SelectItem>
// // //                   <SelectItem value="Neutral">Neutral</SelectItem>
// // //                   <SelectItem value="Informal">Informal</SelectItem>
// // //                 </SelectContent>
// // //               </Select>
// // //             </div>
// // //           </div>
// // //         );

// // //       default:
// // //         return (
// // //           <div className="space-y-4">
// // //             <div className="text-center py-8 text-gray-500">
// // //               <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
// // //               <p>Default settings will be used for this service.</p>
// // //             </div>
// // //           </div>
// // //         );
// // //     }
// // //   };

// // //   return (
// // //     <AnimatePresence>
// // //       {isOpen && (
// // //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
// // //           <motion.div
// // //             initial={{ opacity: 0, scale: 0.95 }}
// // //             animate={{ opacity: 1, scale: 1 }}
// // //             exit={{ opacity: 0, scale: 0.95 }}
// // //             className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
// // //           >
// // //             <div className="flex items-center justify-between p-6 border-b">
// // //               <div className="flex items-center gap-3">
// // //                 <div
// // //                   className={`w-10 h-10 rounded-lg bg-gradient-to-r ${service.gradient} flex items-center justify-center`}
// // //                 >
// // //                   <service.icon className="h-5 w-5 text-white" />
// // //                 </div>
// // //                 <div>
// // //                   <h2 className="text-xl font-semibold text-gray-900">
// // //                     {service.title}
// // //                   </h2>
// // //                   <p className="text-sm text-gray-600">
// // //                     Customize processing settings
// // //                   </p>
// // //                 </div>
// // //               </div>
// // //               <Button variant="ghost" size="sm" onClick={onClose}>
// // //                 <X className="h-4 w-4" />
// // //               </Button>
// // //             </div>

// // //             <div className="p-6 overflow-y-auto max-h-[60vh]">
// // //               {renderConfigOptions()}
// // //             </div>

// // //             <div className="flex items-center justify-between p-6 border-t bg-gray-50">
// // //               <div className="text-sm text-gray-600">
// // //                 Processing {selectedTestimonials.length} testimonial
// // //                 {selectedTestimonials.length > 1 ? "s" : ""}
// // //               </div>
// // //               <div className="flex gap-3">
// // //                 <Button variant="outline" onClick={onClose}>
// // //                   Cancel
// // //                 </Button>
// // //                 <Button
// // //                   onClick={handleProcess}
// // //                   className="bg-blue-600 hover:bg-blue-700"
// // //                 >
// // //                   <Play className="h-4 w-4 mr-2" />
// // //                   Start Processing
// // //                 </Button>
// // //               </div>
// // //             </div>
// // //           </motion.div>
// // //         </div>
// // //       )}
// // //     </AnimatePresence>
// // //   );
// // // };

// // // const AIStudio = () => {
// // //   const [selectedTestimonials, setSelectedTestimonials] = useState([]);
// // //   const [searchTerm, setSearchTerm] = useState("");
// // //   const [filterType, setFilterType] = useState("all");
// // //   const [activeTab, setActiveTab] = useState("testimonials");
// // //   const [processingJobs, setProcessingJobs] = useState([]);
// // //   const [showFilters, setShowFilters] = useState(false);
// // //   const [selectedCategory, setSelectedCategory] = useState("all");
// // //   const [configModal, setConfigModal] = useState({
// // //     isOpen: false,
// // //     service: null,
// // //   });
// // //   const [serviceConfigs, setServiceConfigs] = useState({});
// // //   const [toast, setToast] = useState(null);

// // //   // Filter testimonials
// // //   const filteredTestimonials = TESTIMONIALS_DATA.filter((testimonial) => {
// // //     const matchesSearch =
// // //       !searchTerm ||
// // //       testimonial.customer_name
// // //         ?.toLowerCase()
// // //         .includes(searchTerm.toLowerCase()) ||
// // //       testimonial.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //       testimonial.content_preview
// // //         ?.toLowerCase()
// // //         .includes(searchTerm.toLowerCase());

// // //     const matchesFilter =
// // //       filterType === "all" ||
// // //       (filterType === "video" && testimonial.media_type === "video") ||
// // //       (filterType === "text" && testimonial.media_type === "text") ||
// // //       (filterType === "high_rating" && testimonial.rating >= 4) ||
// // //       (filterType === "high_sentiment" && testimonial.sentiment_score >= 0.9);

// // //     return matchesSearch && matchesFilter;
// // //   });

// // //   // Filter services
// // //   const filteredServices =
// // //     selectedCategory === "all"
// // //       ? AI_SERVICES
// // //       : AI_SERVICES.filter((service) => service.category === selectedCategory);

// // //   // Handle testimonial selection
// // //   const toggleTestimonialSelection = (testimonialId) => {
// // //     setSelectedTestimonials((prev) => {
// // //       if (prev.includes(testimonialId)) {
// // //         return prev.filter((id) => id !== testimonialId);
// // //       } else {
// // //         return [...prev, testimonialId];
// // //       }
// // //     });
// // //   };

// // //   const selectAllTestimonials = () => {
// // //     setSelectedTestimonials(filteredTestimonials.map((t) => t.id));
// // //   };

// // //   const clearSelection = () => {
// // //     setSelectedTestimonials([]);
// // //   };

// // //   // Handle processing
// // //   const handleProcessImmediate = (serviceId) => {
// // //     const service = AI_SERVICES.find((s) => s.id === serviceId);
// // //     const config = serviceConfigs[serviceId] || service.defaultSettings;
// // //     processService(serviceId, config);
// // //   };

// // //   const handleCustomizeProcess = (serviceId) => {
// // //     const service = AI_SERVICES.find((s) => s.id === serviceId);
// // //     setConfigModal({ isOpen: true, service });
// // //   };

// // //   const processService = (serviceId, config) => {
// // //     const service = AI_SERVICES.find((s) => s.id === serviceId);

// // //     if (!service.isQueued) {
// // //       // Streaming services - go directly to monitor
// // //       setActiveTab("processing");

// // //       // Create streaming job
// // //       const streamingJob = {
// // //         id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
// // //         serviceId,
// // //         testimonialIds: selectedTestimonials,
// // //         status: "streaming",
// // //         progress: 0,
// // //         startTime: new Date(),
// // //         isStreaming: true,
// // //         config,
// // //       };

// // //       setProcessingJobs((prev) => [...prev, streamingJob]);

// // //       // Simulate streaming progress
// // //       const interval = setInterval(() => {
// // //         setProcessingJobs((prev) =>
// // //           prev.map((job) => {
// // //             if (job.id === streamingJob.id) {
// // //               const newProgress = Math.min(
// // //                 job.progress + Math.random() * 15,
// // //                 100
// // //               );
// // //               if (newProgress >= 100) {
// // //                 clearInterval(interval);
// // //                 return {
// // //                   ...job,
// // //                   progress: 100,
// // //                   status: "completed",
// // //                   endTime: new Date(),
// // //                 };
// // //               }
// // //               return { ...job, progress: newProgress };
// // //             }
// // //             return job;
// // //           })
// // //         );
// // //       }, 500);

// // //       return;
// // //     }

// // //     // Queued services
// // //     const newJobs = selectedTestimonials.map((testimonialId) => ({
// // //       id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
// // //       serviceId,
// // //       testimonialId,
// // //       status: "queued",
// // //       progress: 0,
// // //       startTime: new Date(),
// // //       config,
// // //     }));

// // //     setProcessingJobs((prev) => [...prev, ...newJobs]);

// // //     // Show toast notification
// // //     setToast({
// // //       message: `${newJobs.length} job${newJobs.length > 1 ? "s" : ""} added to queue. Estimated time: ${service.estimatedTime}`,
// // //       action: "View Progress",
// // //       onAction: () => {
// // //         setActiveTab("processing");
// // //         setToast(null);
// // //       },
// // //       onClose: () => setToast(null),
// // //     });

// // //     // Start processing after a delay
// // //     setTimeout(() => {
// // //       newJobs.forEach((job) => {
// // //         const interval = setInterval(() => {
// // //           setProcessingJobs((prev) =>
// // //             prev.map((j) => {
// // //               if (j.id === job.id) {
// // //                 if (j.status === "queued") {
// // //                   return { ...j, status: "processing" };
// // //                 }
// // //                 const newProgress = Math.min(
// // //                   j.progress + Math.random() * 10,
// // //                   100
// // //                 );
// // //                 if (newProgress >= 100) {
// // //                   clearInterval(interval);
// // //                   return {
// // //                     ...j,
// // //                     progress: 100,
// // //                     status: "completed",
// // //                     endTime: new Date(),
// // //                   };
// // //                 }
// // //                 return { ...j, progress: newProgress };
// // //               }
// // //               return j;
// // //             })
// // //           );
// // //         }, 1000);
// // //       });
// // //     }, 2000);
// // //   };

// // //   const handleConfigProcess = (serviceId, config) => {
// // //     setServiceConfigs((prev) => ({ ...prev, [serviceId]: config }));
// // //     processService(serviceId, config);
// // //   };

// // //   const deleteJob = (jobId) => {
// // //     setProcessingJobs((prev) => prev.filter((job) => job.id !== jobId));
// // //   };

// // //   const retryJob = (jobId) => {
// // //     setProcessingJobs((prev) =>
// // //       prev.map((job) => {
// // //         if (job.id === jobId) {
// // //           return {
// // //             ...job,
// // //             status: "processing",
// // //             progress: 0,
// // //             startTime: new Date(),
// // //           };
// // //         }
// // //         return job;
// // //       })
// // //     );
// // //   };

// // //   const categories = [
// // //     { id: "all", label: "All Services" },
// // //     { id: "video", label: "Video" },
// // //     { id: "audio", label: "Audio" },
// // //     { id: "content", label: "Content" },
// // //     { id: "optimization", label: "Optimization" },
// // //   ];

// // //   return (
// // //     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
// // //       {/* Header */}
// // //       <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
// // //         <div className="max-w-7xl mx-auto px-6 lg:px-8">
// // //           <div className="flex items-center justify-between h-16">
// // //             <div className="flex items-center gap-4">
// // //               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
// // //                 <Sparkles className="h-6 w-6 text-white" />
// // //               </div>
// // //               <div>
// // //                 <h1 className="text-xl font-bold text-gray-900">AI Studio</h1>
// // //                 <p className="text-sm text-gray-600">
// // //                   Transform testimonials with AI
// // //                 </p>
// // //               </div>
// // //             </div>

// // //             <div className="flex items-center gap-4">
// // //               {selectedTestimonials.length > 0 && (
// // //                 <Badge className="bg-blue-100 text-blue-800">
// // //                   {selectedTestimonials.length} selected
// // //                 </Badge>
// // //               )}
// // //               {processingJobs.filter(
// // //                 (j) => j.status === "processing" || j.status === "streaming"
// // //               ).length > 0 && (
// // //                 <Badge className="bg-green-100 text-green-800">
// // //                   {
// // //                     processingJobs.filter(
// // //                       (j) =>
// // //                         j.status === "processing" || j.status === "streaming"
// // //                     ).length
// // //                   }{" "}
// // //                   processing
// // //                 </Badge>
// // //               )}
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>

// // //       <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
// // //         <Tabs
// // //           value={activeTab}
// // //           onValueChange={setActiveTab}
// // //           className="space-y-8"
// // //         >
// // //           <TabsList className="bg-white shadow-sm">
// // //             <TabsTrigger
// // //               value="testimonials"
// // //               className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
// // //             >
// // //               <Users className="h-4 w-4 mr-2" />
// // //               Select Testimonials
// // //             </TabsTrigger>
// // //             <TabsTrigger
// // //               value="services"
// // //               className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
// // //             >
// // //               <Workflow className="h-4 w-4 mr-2" />
// // //               AI Services
// // //             </TabsTrigger>
// // //             <TabsTrigger
// // //               value="processing"
// // //               className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
// // //             >
// // //               <Target className="h-4 w-4 mr-2" />
// // //               Processing Monitor
// // //             </TabsTrigger>
// // //           </TabsList>

// // //           <TabsContent value="testimonials" className="space-y-6">
// // //             {/* Testimonials Tab Content - Same as before */}
// // //             <div className="flex items-center justify-between">
// // //               <div>
// // //                 <h2 className="text-2xl font-bold text-gray-900">
// // //                   Select Testimonials
// // //                 </h2>
// // //                 <p className="text-gray-600 mt-1">
// // //                   Choose testimonials to process with AI services
// // //                 </p>
// // //               </div>
// // //               <div className="flex items-center gap-3">
// // //                 <Button
// // //                   variant="outline"
// // //                   onClick={selectAllTestimonials}
// // //                   disabled={filteredTestimonials.length === 0}
// // //                 >
// // //                   Select All
// // //                 </Button>
// // //                 <Button
// // //                   variant="outline"
// // //                   onClick={clearSelection}
// // //                   disabled={selectedTestimonials.length === 0}
// // //                 >
// // //                   Clear All
// // //                 </Button>
// // //               </div>
// // //             </div>

// // //             {/* Search and Filters */}
// // //             <div className="space-y-4">
// // //               <div className="flex gap-4">
// // //                 <div className="relative flex-1">
// // //                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// // //                   <Input
// // //                     placeholder="Search testimonials..."
// // //                     value={searchTerm}
// // //                     onChange={(e) => setSearchTerm(e.target.value)}
// // //                     className="pl-10"
// // //                   />
// // //                 </div>
// // //                 <Button
// // //                   variant="outline"
// // //                   onClick={() => setShowFilters(!showFilters)}
// // //                 >
// // //                   <Filter className="h-4 w-4 mr-2" />
// // //                   Filters
// // //                   {showFilters ? (
// // //                     <ChevronDown className="h-4 w-4 ml-2" />
// // //                   ) : (
// // //                     <ChevronRight className="h-4 w-4 ml-2" />
// // //                   )}
// // //                 </Button>
// // //               </div>

// // //               <AnimatePresence>
// // //                 {showFilters && (
// // //                   <motion.div
// // //                     initial={{ opacity: 0, height: 0 }}
// // //                     animate={{ opacity: 1, height: "auto" }}
// // //                     exit={{ opacity: 0, height: 0 }}
// // //                     className="bg-white border rounded-lg p-4"
// // //                   >
// // //                     <Select value={filterType} onValueChange={setFilterType}>
// // //                       <SelectTrigger className="w-64">
// // //                         <SelectValue />
// // //                       </SelectTrigger>
// // //                       <SelectContent>
// // //                         <SelectItem value="all">All Types</SelectItem>
// // //                         <SelectItem value="video">Video Only</SelectItem>
// // //                         <SelectItem value="text">Text Only</SelectItem>
// // //                         <SelectItem value="high_rating">
// // //                           High Rating (4+)
// // //                         </SelectItem>
// // //                         <SelectItem value="high_sentiment">
// // //                           High Sentiment (90%+)
// // //                         </SelectItem>
// // //                       </SelectContent>
// // //                     </Select>
// // //                   </motion.div>
// // //                 )}
// // //               </AnimatePresence>
// // //             </div>

// // //             {/* Testimonials Grid */}
// // //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// // //               {filteredTestimonials.map((testimonial, index) => (
// // //                 <motion.div
// // //                   key={testimonial.id}
// // //                   initial={{ opacity: 0, y: 20 }}
// // //                   animate={{ opacity: 1, y: 0 }}
// // //                   transition={{ delay: index * 0.1 }}
// // //                 >
// // //                   <Card
// // //                     className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
// // //                       selectedTestimonials.includes(testimonial.id)
// // //                         ? "ring-2 ring-blue-500 bg-blue-50"
// // //                         : "hover:shadow-md"
// // //                     }`}
// // //                     onClick={() => toggleTestimonialSelection(testimonial.id)}
// // //                   >
// // //                     <CardContent className="p-6">
// // //                       <div className="flex items-start justify-between mb-4">
// // //                         <div className="flex items-center gap-3">
// // //                           {testimonial.thumbnail && (
// // //                             <img
// // //                               src={testimonial.thumbnail}
// // //                               alt={testimonial.customer_name}
// // //                               className="w-10 h-10 rounded-full object-cover"
// // //                             />
// // //                           )}
// // //                           <div>
// // //                             <h3 className="font-semibold text-gray-900">
// // //                               {testimonial.customer_name}
// // //                             </h3>
// // //                             <p className="text-sm text-gray-600">
// // //                               {testimonial.company}
// // //                             </p>
// // //                           </div>
// // //                         </div>
// // //                         {selectedTestimonials.includes(testimonial.id) && (
// // //                           <CheckCircle className="h-5 w-5 text-blue-600" />
// // //                         )}
// // //                       </div>

// // //                       <p className="text-sm text-gray-700 mb-4 line-clamp-3">
// // //                         {testimonial.content_preview}
// // //                       </p>

// // //                       <div className="flex items-center justify-between">
// // //                         <div className="flex items-center gap-4">
// // //                           {testimonial.media_type === "video" ? (
// // //                             <Badge
// // //                               variant="secondary"
// // //                               className="bg-purple-100 text-purple-700"
// // //                             >
// // //                               <Video className="h-3 w-3 mr-1" />
// // //                               Video
// // //                             </Badge>
// // //                           ) : (
// // //                             <Badge
// // //                               variant="secondary"
// // //                               className="bg-green-100 text-green-700"
// // //                             >
// // //                               <FileText className="h-3 w-3 mr-1" />
// // //                               Text
// // //                             </Badge>
// // //                           )}
// // //                           <div className="flex items-center gap-1">
// // //                             <Star className="h-4 w-4 text-yellow-500 fill-current" />
// // //                             <span className="text-sm font-medium">
// // //                               {testimonial.rating}
// // //                             </span>
// // //                           </div>
// // //                         </div>
// // //                         {testimonial.duration && (
// // //                           <span className="text-xs text-gray-500">
// // //                             {Math.round(testimonial.duration / 60)}m
// // //                           </span>
// // //                         )}
// // //                       </div>

// // //                       {testimonial.highlight_count && (
// // //                         <div className="mt-3 pt-3 border-t">
// // //                           <div className="flex items-center justify-between text-sm">
// // //                             <span className="text-gray-600">
// // //                               {testimonial.highlight_count} highlights detected
// // //                             </span>
// // //                             <span className="text-gray-600">
// // //                               {Math.round(testimonial.sentiment_score * 100)}%
// // //                               positive
// // //                             </span>
// // //                           </div>
// // //                         </div>
// // //                       )}
// // //                     </CardContent>
// // //                   </Card>
// // //                 </motion.div>
// // //               ))}
// // //             </div>

// // //             {filteredTestimonials.length === 0 && (
// // //               <div className="text-center py-12">
// // //                 <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
// // //                 <h3 className="text-lg font-medium text-gray-900 mb-2">
// // //                   No testimonials found
// // //                 </h3>
// // //                 <p className="text-gray-600">
// // //                   Try adjusting your search or filter criteria
// // //                 </p>
// // //               </div>
// // //             )}
// // //           </TabsContent>

// // //           <TabsContent value="services" className="space-y-6">
// // //             {/* Header */}
// // //             <div>
// // //               <h2 className="text-2xl font-bold text-gray-900">AI Services</h2>
// // //               <p className="text-gray-600 mt-1">
// // //                 Select the AI service to apply to your testimonials
// // //               </p>
// // //             </div>

// // //             {/* Category Filter */}
// // //             <div className="flex gap-2 overflow-x-auto">
// // //               {categories.map((category) => (
// // //                 <Button
// // //                   key={category.id}
// // //                   variant={
// // //                     selectedCategory === category.id ? "default" : "outline"
// // //                   }
// // //                   size="sm"
// // //                   onClick={() => setSelectedCategory(category.id)}
// // //                   className={`whitespace-nowrap ${
// // //                     selectedCategory === category.id
// // //                       ? "bg-blue-600 hover:bg-blue-700"
// // //                       : ""
// // //                   }`}
// // //                 >
// // //                   {category.label}
// // //                 </Button>
// // //               ))}
// // //             </div>

// // //             {/* Services Grid */}
// // //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// // //               {filteredServices.map((service, index) => {
// // //                 const IconComponent = service.icon;
// // //                 const config =
// // //                   serviceConfigs[service.id] || service.defaultSettings;

// // //                 return (
// // //                   <motion.div
// // //                     key={service.id}
// // //                     initial={{ opacity: 0, y: 20 }}
// // //                     animate={{ opacity: 1, y: 0 }}
// // //                     transition={{ delay: index * 0.1 }}
// // //                   >
// // //                     <Card className="transition-all duration-200 hover:shadow-lg h-full">
// // //                       <CardContent className="p-6 h-full flex flex-col">
// // //                         <div className="flex items-start justify-between mb-4">
// // //                           <div
// // //                             className={`w-12 h-12 rounded-xl bg-gradient-to-r ${service.gradient} flex items-center justify-center shadow-lg`}
// // //                           >
// // //                             <IconComponent className="h-6 w-6 text-white" />
// // //                           </div>
// // //                           {!service.isQueued && (
// // //                             <Badge
// // //                               variant="outline"
// // //                               className="text-xs bg-orange-50 text-orange-700 border-orange-200"
// // //                             >
// // //                               Instant
// // //                             </Badge>
// // //                           )}
// // //                         </div>

// // //                         <h3 className="text-lg font-bold text-gray-900 mb-2">
// // //                           {service.title}
// // //                         </h3>
// // //                         <p className="text-sm text-gray-600 mb-4 flex-1">
// // //                           {service.description}
// // //                         </p>

// // //                         <div className="space-y-3 mb-4">
// // //                           <div className="flex items-center justify-between text-sm">
// // //                             <span className="text-gray-500">
// // //                               Processing time:
// // //                             </span>
// // //                             <Badge variant="outline">
// // //                               {service.estimatedTime}
// // //                             </Badge>
// // //                           </div>
// // //                           <div className="flex items-center justify-between text-sm">
// // //                             <span className="text-gray-500">Complexity:</span>
// // //                             <Badge variant="outline">
// // //                               {service.complexity}
// // //                             </Badge>
// // //                           </div>
// // //                         </div>

// // //                         {/* Default Settings Display */}
// // //                         <div className="mb-4 p-3 bg-gray-50 rounded-lg">
// // //                           <h4 className="text-xs font-medium text-gray-700 mb-2">
// // //                             Current Settings:
// // //                           </h4>
// // //                           <div className="space-y-1">
// // //                             {Object.entries(config)
// // //                               .slice(0, 3)
// // //                               .map(([key, value]) => (
// // //                                 <div
// // //                                   key={key}
// // //                                   className="flex justify-between text-xs"
// // //                                 >
// // //                                   <span className="text-gray-600 capitalize">
// // //                                     {key
// // //                                       .replace(/([A-Z])/g, " $1")
// // //                                       .toLowerCase()}
// // //                                     :
// // //                                   </span>
// // //                                   <span className="text-gray-800">
// // //                                     {Array.isArray(value)
// // //                                       ? value.join(", ")
// // //                                       : String(value)}
// // //                                   </span>
// // //                                 </div>
// // //                               ))}
// // //                           </div>
// // //                         </div>

// // //                         <div className="space-y-2">
// // //                           <Button
// // //                             className="w-full bg-blue-600 hover:bg-blue-700"
// // //                             onClick={() => handleProcessImmediate(service.id)}
// // //                             disabled={selectedTestimonials.length === 0}
// // //                           >
// // //                             <Play className="h-4 w-4 mr-2" />
// // //                             Process Immediately
// // //                           </Button>
// // //                           <Button
// // //                             variant="outline"
// // //                             className="w-full"
// // //                             onClick={() => handleCustomizeProcess(service.id)}
// // //                             disabled={selectedTestimonials.length === 0}
// // //                           >
// // //                             <Settings className="h-4 w-4 mr-2" />
// // //                             Customize Processing
// // //                           </Button>
// // //                         </div>
// // //                       </CardContent>
// // //                     </Card>
// // //                   </motion.div>
// // //                 );
// // //               })}
// // //             </div>

// // //             {selectedTestimonials.length === 0 && (
// // //               <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
// // //                 <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
// // //                 <h3 className="font-medium text-yellow-800">
// // //                   Select testimonials first
// // //                 </h3>
// // //                 <p className="text-sm text-yellow-700 mt-1">
// // //                   Choose testimonials from the previous tab to enable processing
// // //                 </p>
// // //               </div>
// // //             )}
// // //           </TabsContent>

// // //           <TabsContent value="processing" className="space-y-6">
// // //             <div>
// // //               <h2 className="text-2xl font-bold text-gray-900">
// // //                 Processing Monitor
// // //               </h2>
// // //               <p className="text-gray-600 mt-1">
// // //                 Track your AI processing jobs and download results
// // //               </p>
// // //             </div>

// // //             {processingJobs.length === 0 ? (
// // //               <Card>
// // //                 <CardContent className="text-center py-12">
// // //                   <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
// // //                   <h3 className="text-lg font-medium text-gray-900 mb-2">
// // //                     No processing jobs
// // //                   </h3>
// // //                   <p className="text-gray-600">
// // //                     Start processing to see your jobs here
// // //                   </p>
// // //                 </CardContent>
// // //               </Card>
// // //             ) : (
// // //               <div className="space-y-4">
// // //                 {processingJobs.map((job) => {
// // //                   const service = AI_SERVICES.find(
// // //                     (s) => s.id === job.serviceId
// // //                   );
// // //                   const testimonial = job.testimonialId
// // //                     ? TESTIMONIALS_DATA.find((t) => t.id === job.testimonialId)
// // //                     : null;

// // //                   return (
// // //                     <Card key={job.id}>
// // //                       <CardContent className="p-6">
// // //                         <div className="flex items-center justify-between mb-4">
// // //                           <div className="flex items-center gap-3">
// // //                             <div
// // //                               className={`w-3 h-3 rounded-full ${
// // //                                 job.status === "completed"
// // //                                   ? "bg-green-500"
// // //                                   : job.status === "processing" ||
// // //                                       job.status === "streaming"
// // //                                     ? "bg-blue-500 animate-pulse"
// // //                                     : job.status === "queued"
// // //                                       ? "bg-yellow-500"
// // //                                       : "bg-gray-400"
// // //                               }`}
// // //                             />
// // //                             <div>
// // //                               <h3 className="font-semibold text-gray-900">
// // //                                 {service?.title}
// // //                                 {testimonial
// // //                                   ? ` - ${testimonial.customer_name}`
// // //                                   : ` - ${job.testimonialIds?.length} testimonials`}
// // //                               </h3>
// // //                               <p className="text-sm text-gray-600">
// // //                                 Started {job.startTime.toLocaleTimeString()}
// // //                                 {job.isStreaming && (
// // //                                   <span className="ml-2 text-orange-600">
// // //                                     • Streaming
// // //                                   </span>
// // //                                 )}
// // //                               </p>
// // //                             </div>
// // //                           </div>

// // //                           <div className="flex items-center gap-2">
// // //                             <Badge
// // //                               className={`${
// // //                                 job.status === "completed"
// // //                                   ? "bg-green-100 text-green-800"
// // //                                   : job.status === "processing" ||
// // //                                       job.status === "streaming"
// // //                                     ? "bg-blue-100 text-blue-800"
// // //                                     : job.status === "queued"
// // //                                       ? "bg-yellow-100 text-yellow-800"
// // //                                       : "bg-gray-100 text-gray-800"
// // //                               }`}
// // //                             >
// // //                               {job.status}
// // //                             </Badge>

// // //                             <Button
// // //                               variant="ghost"
// // //                               size="sm"
// // //                               onClick={() => deleteJob(job.id)}
// // //                               className="h-8 w-8 p-0"
// // //                             >
// // //                               <Trash2 className="h-4 w-4" />
// // //                             </Button>
// // //                           </div>
// // //                         </div>

// // //                         {(job.status === "processing" ||
// // //                           job.status === "streaming") && (
// // //                           <div className="space-y-2 mb-4">
// // //                             <Progress value={job.progress} className="h-2" />
// // //                             <div className="flex justify-between text-sm text-gray-600">
// // //                               <span>{Math.round(job.progress)}% complete</span>
// // //                               <span>
// // //                                 Est.{" "}
// // //                                 {Math.max(
// // //                                   1,
// // //                                   Math.round((100 - job.progress) / 20)
// // //                                 )}{" "}
// // //                                 min remaining
// // //                               </span>
// // //                             </div>
// // //                           </div>
// // //                         )}

// // //                         {job.status === "completed" && (
// // //                           <div className="flex gap-3">
// // //                             <Button variant="outline" size="sm">
// // //                               <Download className="h-4 w-4 mr-2" />
// // //                               Download
// // //                             </Button>
// // //                             <Button variant="outline" size="sm">
// // //                               <Eye className="h-4 w-4 mr-2" />
// // //                               Preview
// // //                             </Button>
// // //                             <Button variant="outline" size="sm">
// // //                               <Share2 className="h-4 w-4 mr-2" />
// // //                               Share
// // //                             </Button>
// // //                             <Button
// // //                               variant="outline"
// // //                               size="sm"
// // //                               onClick={() => retryJob(job.id)}
// // //                             >
// // //                               <RotateCcw className="h-4 w-4 mr-2" />
// // //                               Retry
// // //                             </Button>
// // //                           </div>
// // //                         )}

// // //                         {job.status === "queued" && (
// // //                           <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
// // //                             <Clock className="h-4 w-4 inline mr-2" />
// // //                             Waiting in queue...
// // //                           </div>
// // //                         )}
// // //                       </CardContent>
// // //                     </Card>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //           </TabsContent>
// // //         </Tabs>
// // //       </div>

// // //       {/* Service Configuration Modal */}
// // //       <ServiceConfigModal
// // //         service={configModal.service}
// // //         isOpen={configModal.isOpen}
// // //         onClose={() => setConfigModal({ isOpen: false, service: null })}
// // //         onProcess={handleConfigProcess}
// // //         selectedTestimonials={selectedTestimonials}
// // //       />

// // //       {/* Toast Notifications */}
// // //       <AnimatePresence>
// // //         {toast && (
// // //           <Toast
// // //             message={toast.message}
// // //             action={toast.action}
// // //             onAction={toast.onAction}
// // //             onClose={toast.onClose}
// // //           />
// // //         )}
// // //       </AnimatePresence>
// // //     </div>
// // //   );
// // // };

// // // export default AIStudio;

// // import React, { useState, useEffect } from "react";
// // import { motion, AnimatePresence } from "framer-motion";
// // import {
// //   Sparkles,
// //   Video,
// //   Scissors,
// //   VolumeX,
// //   FileText,
// //   Languages,
// //   Wand2,
// //   Play,
// //   Settings,
// //   CheckCircle,
// //   Clock,
// //   AlertCircle,
// //   X,
// //   Monitor,
// //   Mic,
// //   Search,
// //   Filter,
// //   MoreVertical,
// //   ArrowRight,
// //   Download,
// //   Share2,
// //   Eye,
// //   Pause,
// //   ChevronDown,
// //   ChevronRight,
// //   Target,
// //   Users,
// //   Workflow,
// //   Layers,
// //   RefreshCw,
// //   Zap,
// //   Star,
// //   Calendar,
// //   Bell,
// //   ExternalLink,
// //   Trash2,
// //   RotateCcw,
// //   CheckSquare,
// // } from "lucide-react";

// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";
// // import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // import { Progress } from "@/components/ui/progress";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Textarea } from "@/components/ui/textarea";
// // import { Switch } from "@/components/ui/switch";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import { Checkbox } from "@/components/ui/checkbox";
// // import { Slider } from "@/components/ui/slider";

// // // AI Services Configuration
// // const AI_SERVICES = [
// //   {
// //     id: "enhancement",
// //     title: "Video Enhancement",
// //     description: "Transform raw testimonials into professional-quality videos with AI-powered visual and audio improvements, including noise reduction, color grading, and brand integration.",
// //     icon: Sparkles,
// //     category: "video",
// //     estimatedTime: "2-5 minutes",
// //     complexity: "Beginner",
// //     features: ["4K Upscaling", "Noise Reduction", "Color Grading", "Brand Integration"],
// //     gradient: "from-purple-600 to-indigo-600",
// //     isQueued: true,
// //     defaultSettings: {
// //       quality: "Professional",
// //       colorEnhancement: true,
// //       stabilization: true,
// //       removeNoise: true,
// //       addLogo: false,
// //       logoUrl: "",
// //       logoPosition: "bottom-right",
// //       addWatermark: false,
// //       watermarkText: "",
// //       watermarkPosition: "bottom-right",
// //     }
// //   },
// //   {
// //     id: "story_mode",
// //     title: "Story Mode",
// //     description: "Intelligently combine highlight moments into compelling narrative videos with custom intro/outro and seamless transitions between key moments.",
// //     icon: Video,
// //     category: "video",
// //     estimatedTime: "3-7 minutes",
// //     complexity: "Intermediate",
// //     features: ["Highlight Extraction", "Smart Editing", "Custom Branding", "Voice Over"],
// //     gradient: "from-blue-600 to-cyan-600",
// //     isQueued: true,
// //     defaultSettings: {
// //       highlightType: "General",
// //       addIntro: true,
// //       addOutro: true,
// //       backgroundMusic: false,
// //       selectedMusic: "",
// //       customMusicUrl: "",
// //       transitionStyle: "Fade",
// //       removeNoise: true,
// //       addLogo: false,
// //       logoUrl: "",
// //       logoPosition: "bottom-right",
// //       addWatermark: false,
// //       watermarkText: "",
// //       watermarkPosition: "bottom-right",
// //       introImageUrl: "",
// //       introVoicePrompt: "",
// //       outroImageUrl: "",
// //       outroVoicePrompt: "",
// //     }
// //   },
// //   {
// //     id: "clipping",
// //     title: "Smart Clipping",
// //     description: "Generate multiple engaging clips automatically based on emotional highlights, perfect for social media distribution and marketing campaigns.",
// //     icon: Scissors,
// //     category: "video",
// //     estimatedTime: "1-3 minutes",
// //     complexity: "Beginner",
// //     features: ["Multi-Clip Generation", "Emotional AI", "Auto Branding", "Social Ready"],
// //     gradient: "from-emerald-600 to-teal-600",
// //     isQueued: true,
// //     defaultSettings: {
// //       maxClips: 5,
// //       clipDuration: "15 seconds",
// //       addBranding: true,
// //       includeSubtitles: true,
// //       transitionType: "Fade",
// //       removeNoise: true,
// //       backgroundMusic: false,
// //       selectedMusic: "",
// //       customMusicUrl: "",
// //       addLogo: false,
// //       logoUrl: "",
// //       logoPosition: "bottom-right",
// //       addWatermark: false,
// //       watermarkText: "",
// //       watermarkPosition: "bottom-right",
// //     }
// //   },
// //   {
// //     id: "platform_optimizer",
// //     title: "Platform Optimizer",
// //     description: "Optimize testimonials for specific social platforms with intelligent aspect ratio adjustment, captions, and content-aware cropping.",
// //     icon: Monitor,
// //     category: "optimization",
// //     estimatedTime: "1-2 minutes",
// //     complexity: "Beginner",
// //     features: ["Multi-Platform", "Smart Cropping", "Auto Captions", "Platform Rules"],
// //     gradient: "from-orange-600 to-red-600",
// //     isQueued: true,
// //     defaultSettings: {
// //       platforms: ["instagram_reel", "youtube_short"],
// //       contentAwareCropping: true,
// //       addCaptions: true,
// //       addHashtags: true,
// //       audioEnhancement: false,
// //       noiseLevel: "medium",
// //       preserveVoice: true,
// //       normalizeVolume: true,
// //       backgroundMusic: false,
// //       selectedMusic: "",
// //       customMusicUrl: "",
// //       addLogo: false,
// //       logoUrl: "",
// //       logoPosition: "bottom-right",
// //       addWatermark: false,
// //       watermarkText: "",
// //       watermarkPosition: "bottom-right",
// //     }
// //   },
// //   {
// //     id: "noise_removal",
// //     title: "Audio Enhancement",
// //     description: "Remove background noise and enhance audio quality while preserving natural voice characteristics using advanced AI algorithms.",
// //     icon: VolumeX,
// //     category: "audio",
// //     estimatedTime: "30 seconds",
// //     complexity: "Beginner",
// //     features: ["Noise Removal", "Voice Enhancement", "Audio Clarity", "Volume Normalization"],
// //     gradient: "from-indigo-600 to-purple-600",
// //     isQueued: true,
// //     defaultSettings: {
// //       intensity: "medium",
// //       preserveVoice: true,
// //       enhanceClarity: true,
// //       normalizeVolume: true,
// //       outputFormat: "mp3",
// //     }
// //   },
// //   {
// //     id: "content_generator",
// //     title: "Content Generator",
// //     description: "Generate high-impact marketing content from testimonials including email campaigns, blog posts, case studies, and social media posts.",
// //     icon: FileText,
// //     category: "content",
// //     estimatedTime: "30-60 seconds",
// //     complexity: "Beginner",
// //     features: ["Multiple Formats", "SEO Optimized", "Brand Voice", "Ready to Publish"],
// //     gradient: "from-pink-600 to-rose-600",
// //     isQueued: false, // Streamed
// //     defaultSettings: {
// //       contentTypes: ["Email Campaign", "Blog Post"],
// //       tone: "professional",
// //       contentLength: "medium",
// //       targetAudience: "potential customers",
// //       autoSelectPositive: true,
// //       includeMetrics: true,
// //       seoOptimization: false,
// //       includeCTA: true,
// //       brandVoice: "",
// //       customRequirements: "",
// //       seoKeywords: "",
// //       focusKeyword: "",
// //     }
// //   },
// //   {
// //     id: "text_polishing",
// //     title: "Text Enhancement",
// //     description: "Polish and enhance written testimonials while maintaining authenticity and original voice, improving clarity and impact.",
// //     icon: Wand2,
// //     category: "content",
// //     estimatedTime: "15 seconds",
// //     complexity: "Beginner",
// //     features: ["Grammar Enhancement", "Tone Optimization", "Clarity Improvement", "Authenticity Preservation"],
// //     gradient: "from-violet-600 to-purple-600",
// //     isQueued: false, // Streamed
// //     defaultSettings: {
// //       preserveAuthenticity: true,
// //       targetStyle: "Professional",
// //       grammarCorrection: true,
// //       lengthOptimization: "Maintain",
// //     }
// //   },
// //   {
// //     id: "translation",
// //     title: "Translation",
// //     description: "Translate testimonials to multiple languages while preserving emotional tone and cultural context for global marketing reach.",
// //     icon: Languages,
// //     category: "content",
// //     estimatedTime: "10-30 seconds",
// //     complexity: "Beginner",
// //     features: ["60+ Languages", "Tone Preservation", "Cultural Adaptation", "Native Quality"],
// //     gradient: "from-teal-600 to-cyan-600",
// //     isQueued: false, // Streamed
// //     defaultSettings: {
// //       targetLanguages: ["Spanish", "French"],
// //       preserveTone: true,
// //       culturalAdaptation: true,
// //       formalityLevel: "Neutral",
// //     }
// //   },
// //   {
// //     id: "narration",
// //     title: "AI Narration",
// //     description: "Convert text testimonials to professional audio narration using premium AI voices from ElevenLabs and OpenAI with customizable settings.",
// //     icon: Mic,
// //     category: "audio",
// //     estimatedTime: "30-90 seconds",
// //     complexity: "Intermediate",
// //     features: ["Premium AI Voices", "Natural Speech", "Custom Settings", "Multiple Providers"],
// //     gradient: "from-rose-600 to-pink-600",
// //     isQueued: true,
// //     defaultSettings: {
// //       voiceProvider: "elevenlabs",
// //       selectedVoice: "rachel",
// //       speed: "1.0x",
// //       emotion: "professional",
// //       outputFormat: "mp3",
// //       backgroundMusic: false,
// //       selectedMusic: "",
// //       customMusicUrl: "",
// //       musicVolume: 15,
// //       enhanceAudio: true,
// //     }
// //   },
// // ];

// // const TESTIMONIALS_DATA = [
// //   {
// //     id: "1",
// //     customer_name: "Sarah Johnson",
// //     company: "TechCorp Solutions",
// //     content_preview: "This product completely transformed our workflow and increased our team's productivity by 300%. The customer support is exceptional and the implementation was seamless.",
// //     media_type: "video",
// //     rating: 5,
// //     duration: 120,
// //     created_at: "2024-01-15",
// //     sentiment_score: 0.95,
// //     highlight_count: 4,
// //     thumbnail: "https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=100&h=100&fit=crop&crop=face",
// //   },
// //   {
// //     id: "2",
// //     customer_name: "Michael Chen",
// //     company: "StartupX",
// //     content_preview: "Amazing results! Our conversion rates improved dramatically within the first month of using this solution. Highly recommend to any growing business.",
// //     media_type: "text",
// //     rating: 5,
// //     created_at: "2024-01-10",
// //     sentiment_score: 0.92,
// //   },
// //   {
// //     id: "3",
// //     customer_name: "Emily Davis",
// //     company: "Enterprise Inc",
// //     content_preview: "Professional service and outstanding results. The ROI was immediate and substantial. This is exactly what we needed to scale our operations effectively.",
// //     media_type: "video",
// //     rating: 5,
// //     duration: 180,
// //     created_at: "2024-01-08",
// //     sentiment_score: 0.98,
// //     highlight_count: 6,
// //     thumbnail: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
// //   },
// //   {
// //     id: "4",
// //     customer_name: "David Wilson",
// //     company: "Global Dynamics",
// //     content_preview: "Game-changing technology that solved our biggest challenges. The team's expertise and support made all the difference in our success.",
// //     media_type: "video",
// //     rating: 4,
// //     duration: 95,
// //     created_at: "2024-01-05",
// //     sentiment_score: 0.88,
// //     highlight_count: 3,
// //     thumbnail: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
// //   },
// // ];

// // // Toast Notification Component
// // const Toast = ({ message, action, onAction, onClose }) => (
// //   <motion.div
// //     initial={{ opacity: 0, y: 50, scale: 0.95 }}
// //     animate={{ opacity: 1, y: 0, scale: 1 }}
// //     exit={{ opacity: 0, y: 50, scale: 0.95 }}
// //     className="fixed bottom-6 right-6 bg-white border shadow-lg rounded-lg p-4 max-w-md z-50"
// //   >
// //     <div className="flex items-start gap-3">
// //       <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
// //       <div className="flex-1">
// //         <p className="text-sm font-medium text-gray-900">{message}</p>
// //         {action && (
// //           <Button
// //             variant="link"
// //             size="sm"
// //             className="p-0 h-auto text-blue-600 font-medium"
// //             onClick={onAction}
// //           >
// //             {action}
// //           </Button>
// //         )}
// //       </div>
// //       <Button
// //         variant="ghost"
// //         size="sm"
// //         className="h-6 w-6 p-0"
// //         onClick={onClose}
// //       >
// //         <X className="h-4 w-4" />
// //       </Button>
// //     </div>
// //   </motion.div>
// // );

// // // Service Configuration Modal
// // const ServiceConfigModal = ({ service, isOpen, onClose, onProcess, selectedTestimonials }) => {
// //   const [config, setConfig] = useState(service?.defaultSettings || {});

// //   useEffect(() => {
// //     if (service) {
// //       setConfig(service.defaultSettings || {});
// //     }
// //   }, [service]);

// //   if (!service) return null;

// //   const updateConfig = (key, value) => {
// //     setConfig(prev => ({ ...prev, [key]: value }));
// //   };

// //   const handleProcess = () => {
// //     onProcess(service.id, config);
// //     onClose();
// //   };

// //   const backgroundMusicOptions = [
// //     { id: "ambient-corporate", name: "Ambient Corporate" },
// //     { id: "upbeat-modern", name: "Upbeat Modern" },
// //     { id: "inspiring-piano", name: "Inspiring Piano" },
// //     { id: "tech-minimal", name: "Tech Minimal" },
// //     { id: "emotional-strings", name: "Emotional Strings" },
// //   ];

// //   const platforms = [
// //     { id: "instagram_reel", name: "Instagram Reel", aspect: "9:16", icon: "📱" },
// //     { id: "instagram_feed", name: "Instagram Feed", aspect: "1:1", icon: "📷" },
// //     { id: "facebook_post", name: "Facebook Post", aspect: "16:9", icon: "📘" },
// //     { id: "tiktok", name: "TikTok", aspect: "9:16", icon: "🎵" },
// //     { id: "youtube_short", name: "YouTube Short", aspect: "9:16", icon: "📺" },
// //     { id: "linkedin_video", name: "LinkedIn Video", aspect: "16:9", icon: "💼" },
// //     { id: "twitter_video", name: "Twitter Video", aspect: "16:9", icon: "🐦" },
// //   ];

// //   const voices = {
// //     elevenlabs: [
// //       { id: "rachel", name: "Rachel", accent: "American", gender: "Female", description: "Calm and professional" },
// //       { id: "drew", name: "Drew", accent: "American", gender: "Male", description: "Confident and clear" },
// //       { id: "clyde", name: "Clyde", accent: "American", gender: "Male", description: "Warm and friendly" },
// //       { id: "paul", name: "Paul", accent: "American", gender: "Male", description: "Authoritative and strong" },
// //       { id: "domi", name: "Domi", accent: "American", gender: "Female", description: "Young and vibrant" },
// //     ],
// //     openai: [
// //       { id: "alloy", name: "Alloy", accent: "American", gender: "Neutral", description: "Balanced and versatile" },
// //       { id: "echo", name: "Echo", accent: "American", gender: "Male", description: "Clear and resonant" },
// //       { id: "fable", name: "Fable", accent: "British", gender: "Female", description: "Expressive and engaging" },
// //       { id: "nova", name: "Nova", accent: "American", gender: "Female", description: "Bright and energetic" },
// //       { id: "shimmer", name: "Shimmer", accent: "American", gender: "Female", description: "Soft and soothing" },
// //     ]
// //   };

// //   const renderConfigOptions = () => {
// //     switch (service.id) {
// //       case "enhancement":
// //         return (
// //           <div className="space-y-6">
// //             <div>
// //               <Label className="text-sm font-medium">Quality Level</Label>
// //               <Select value={config.quality} onValueChange={(value) => updateConfig('quality', value)}>
// //                 <SelectTrigger className="mt-1">
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="Professional">Professional - Highest quality</SelectItem>
// //                   <SelectItem value="High">High - Great quality, faster</SelectItem>
// //                   <SelectItem value="Standard">Standard - Good quality, quickest</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Color Enhancement</Label>
// //                 <Switch
// //                   checked={config.colorEnhancement}
// //                   onCheckedChange={(checked) => updateConfig('colorEnhancement', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Video Stabilization</Label>
// //                 <Switch
// //                   checked={config.stabilization}
// //                   onCheckedChange={(checked) => updateConfig('stabilization', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Remove Noise</Label>
// //                 <Switch
// //                   checked={config.removeNoise}
// //                   onCheckedChange={(checked) => updateConfig('removeNoise', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Logo</Label>
// //                 <Switch
// //                   checked={config.addLogo}
// //                   onCheckedChange={(checked) => updateConfig('addLogo', checked)}
// //                 />
// //               </div>
// //             </div>

// //             {config.addLogo && (
// //               <div className="p-4 bg-blue-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">Logo Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Logo URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/logo.png"
// //                     value={config.logoUrl || ""}
// //                     onChange={(e) => updateConfig('logoUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Logo Position</Label>
// //                   <Select value={config.logoPosition} onValueChange={(value) => updateConfig('logoPosition', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="top-left">Top Left</SelectItem>
// //                       <SelectItem value="top-right">Top Right</SelectItem>
// //                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
// //                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             )}

// //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //               <Label className="text-sm font-medium">Add Watermark</Label>
// //               <Switch
// //                 checked={config.addWatermark}
// //                 onCheckedChange={(checked) => updateConfig('addWatermark', checked)}
// //               />
// //             </div>

// //             {config.addWatermark && (
// //               <div className="p-4 bg-blue-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">Watermark Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Watermark Text (leave empty to use brand name)</Label>
// //                   <Input
// //                     placeholder="Your brand name"
// //                     value={config.watermarkText || ""}
// //                     onChange={(e) => updateConfig('watermarkText', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Watermark Position</Label>
// //                   <Select value={config.watermarkPosition} onValueChange={(value) => updateConfig('watermarkPosition', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="top-left">Top Left</SelectItem>
// //                       <SelectItem value="top-right">Top Right</SelectItem>
// //                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
// //                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         );

// //       case "platform_optimizer":
// //         return (
// //           <div className="space-y-6">
// //             <div>
// //               <Label className="text-sm font-medium">Target Platforms</Label>
// //               <div className="mt-2 grid grid-cols-2 gap-3">
// //                 {platforms.map((platform) => (
// //                   <div
// //                     key={platform.id}
// //                     className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
// //                       config.platforms?.includes(platform.id)
// //                         ? "border-orange-500 bg-orange-50"
// //                         : "border-gray-200 hover:border-gray-300"
// //                     }`}
// //                     onClick={() => {
// //                       const currentPlatforms = config.platforms || [];
// //                       if (currentPlatforms.includes(platform.id)) {
// //                         updateConfig('platforms', currentPlatforms.filter(p => p !== platform.id));
// //                       } else {
// //                         updateConfig('platforms', [...currentPlatforms, platform.id]);
// //                       }
// //                     }}
// //                   >
// //                     <div className="flex items-center justify-between">
// //                       <div>
// //                         <div className="flex items-center gap-2">
// //                           <span className="text-lg">{platform.icon}</span>
// //                           <span className="font-medium text-sm">{platform.name}</span>
// //                         </div>
// //                         <div className="text-xs text-gray-500 mt-1">
// //                           Aspect: {platform.aspect}
// //                         </div>
// //                       </div>
// //                       {config.platforms?.includes(platform.id) && (
// //                         <CheckCircle className="h-4 w-4 text-orange-600" />
// //                       )}
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Content-Aware Cropping</Label>
// //                 <Switch
// //                   checked={config.contentAwareCropping}
// //                   onCheckedChange={(checked) => updateConfig('contentAwareCropping', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Captions</Label>
// //                 <Switch
// //                   checked={config.addCaptions}
// //                   onCheckedChange={(checked) => updateConfig('addCaptions', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Hashtags</Label>
// //                 <Switch
// //                   checked={config.addHashtags}
// //                   onCheckedChange={(checked) => updateConfig('addHashtags', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Audio Enhancement</Label>
// //                 <Switch
// //                   checked={config.audioEnhancement}
// //                   onCheckedChange={(checked) => updateConfig('audioEnhancement', checked)}
// //                 />
// //               </div>
// //             </div>

// //             {/* Audio Enhancement Settings */}
// //             {config.audioEnhancement && (
// //               <div className="p-4 bg-indigo-50 rounded-lg space-y-4">
// //                 <Label className="text-sm font-medium">Audio Enhancement Settings</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Noise Reduction Level</Label>
// //                   <Select value={config.noiseLevel} onValueChange={(value) => updateConfig('noiseLevel', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="light">Light - Gentle noise reduction</SelectItem>
// //                       <SelectItem value="medium">Medium - Balanced cleaning (Recommended)</SelectItem>
// //                       <SelectItem value="aggressive">Aggressive - Maximum noise removal</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //                 <div className="grid grid-cols-2 gap-3">
// //                   <div className="flex items-center justify-between p-2 bg-white rounded">
// //                     <Label className="text-xs font-medium">Preserve Voice</Label>
// //                     <Switch
// //                       checked={config.preserveVoice}
// //                       onCheckedChange={(checked) => updateConfig('preserveVoice', checked)}
// //                     />
// //                   </div>
// //                   <div className="flex items-center justify-between p-2 bg-white rounded">
// //                     <Label className="text-xs font-medium">Normalize Volume</Label>
// //                     <Switch
// //                       checked={config.normalizeVolume}
// //                       onCheckedChange={(checked) => updateConfig('normalizeVolume', checked)}
// //                     />
// //                   </div>
// //                 </div>
// //               </div>
// //             )}

// //             {/* Background Music */}
// //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //               <Label className="text-sm font-medium">Add Background Music</Label>
// //               <Switch
// //                 checked={config.backgroundMusic}
// //                 onCheckedChange={(checked) => updateConfig('backgroundMusic', checked)}
// //               />
// //             </div>

// //             {config.backgroundMusic && (
// //               <div className="p-4 bg-blue-50 rounded-lg space-y-4">
// //                 <Label className="text-sm font-medium">Background Music Selection</Label>
// //                 <div className="grid grid-cols-1 gap-2">
// //                   {backgroundMusicOptions.map((music) => (
// //                     <div
// //                       key={music.id}
// //                       className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
// //                         config.selectedMusic === music.id
// //                           ? "border-blue-500 bg-blue-100"
// //                           : "border-gray-200 hover:border-gray-300"
// //                       }`}
// //                       onClick={() => updateConfig('selectedMusic', music.id)}
// //                     >
// //                       <div className="flex items-center justify-between">
// //                         <span className="font-medium text-sm">{music.name}</span>
// //                         {config.selectedMusic === music.id && (
// //                           <CheckCircle className="h-4 w-4 text-blue-600" />
// //                         )}
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Or use custom music URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/custom-music.mp3"
// //                     value={config.customMusicUrl || ""}
// //                     onChange={(e) => updateConfig('customMusicUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //               </div>
// //             )}

// //             {/* Logo and Watermark */}
// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Logo</Label>
// //                 <Switch
// //                   checked={config.addLogo}
// //                   onCheckedChange={(checked) => updateConfig('addLogo', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Watermark</Label>
// //                 <Switch
// //                   checked={config.addWatermark}
// //                   onCheckedChange={(checked) => updateConfig('addWatermark', checked)}
// //                 />
// //               </div>
// //             </div>

// //             {/* Logo Configuration */}
// //             {config.addLogo && (
// //               <div className="p-4 bg-green-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">Logo Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Logo URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/logo.png"
// //                     value={config.logoUrl || ""}
// //                     onChange={(e) => updateConfig('logoUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Logo Position</Label>
// //                   <Select value={config.logoPosition} onValueChange={(value) => updateConfig('logoPosition', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="top-left">Top Left</SelectItem>
// //                       <SelectItem value="top-right">Top Right</SelectItem>
// //                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
// //                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             )}

// //             {/* Watermark Configuration */}
// //             {config.addWatermark && (
// //               <div className="p-4 bg-yellow-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">Watermark Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Watermark Text (leave empty to use brand name)</Label>
// //                   <Input
// //                     placeholder="Your brand name"
// //                     value={config.watermarkText || ""}
// //                     onChange={(e) => updateConfig('watermarkText', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Watermark Position</Label>
// //                   <Select value={config.watermarkPosition} onValueChange={(value) => updateConfig('watermarkPosition', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="top-left">Top Left</SelectItem>
// //                       <SelectItem value="top-right">Top Right</SelectItem>
// //                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
// //                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         );

// //       case "noise_removal":
// //         return (
// //           <div className="space-y-6">
// //             <div>
// //               <Label className="text-sm font-medium">Noise Reduction Intensity</Label>
// //               <Select value={config.intensity} onValueChange={(value) => updateConfig('intensity', value)}>
// //                 <SelectTrigger className="mt-1">
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="light">Light - Gentle noise reduction</SelectItem>
// //                   <SelectItem value="medium">Medium - Balanced cleaning (Recommended)</SelectItem>
// //                   <SelectItem value="aggressive">Aggressive - Maximum noise removal</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             <div>
// //               <Label className="text-sm font-medium">Output Format</Label>
// //               <Select value={config.outputFormat} onValueChange={(value) => updateConfig('outputFormat', value)}>
// //                 <SelectTrigger className="mt-1">
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="mp3">MP3 - Compressed, smaller file</SelectItem>
// //                   <SelectItem value="wav">WAV - Lossless, high quality</SelectItem>
// //                   <SelectItem value="aac">AAC - Balanced quality and size</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Preserve Voice Quality</Label>
// //                 <Switch
// //                   checked={config.preserveVoice}
// //                   onCheckedChange={(checked) => updateConfig('preserveVoice', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Remove Echo</Label>
// //                 <Switch
// //                   checked={config.removeEcho}
// //                   onCheckedChange={(checked) => updateConfig('removeEcho', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Enhance Clarity</Label>
// //                 <Switch
// //                   checked={config.enhanceClarity}
// //                   onCheckedChange={(checked) => updateConfig('enhanceClarity', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Normalize Volume</Label>
// //                 <Switch
// //                   checked={config.normalizeVolume}
// //                   onCheckedChange={(checked) => updateConfig('normalizeVolume', checked)}
// //                 />
// //               </div>
// //             </div>

// //             <div className="p-4 bg-indigo-50 rounded-lg">
// //               <Label className="text-sm font-medium mb-3 block">Advanced Audio Processing</Label>
// //               <div className="space-y-3">
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Processing Quality</Label>
// //                   <Select value={config.processingQuality || "standard"} onValueChange={(value) => updateConfig('processingQuality', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="standard">Standard - Good quality, faster</SelectItem>
// //                       <SelectItem value="high">High - Better quality, slower</SelectItem>
// //                       <SelectItem value="professional">Professional - Best quality, slowest</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //                 <div className="flex items-center justify-between p-2 bg-white rounded">
// //                   <Label className="text-xs font-medium">Spectral Gating</Label>
// //                   <Switch
// //                     checked={config.spectralGating}
// //                     onCheckedChange={(checked) => updateConfig('spectralGating', checked)}
// //                   />
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         );
// //         return (
// //           <div className="space-y-6">
// //             <div>
// //               <Label className="text-sm font-medium">Quality Level</Label>
// //               <Select value={config.quality} onValueChange={(value) => updateConfig('quality', value)}>
// //                 <SelectTrigger className="mt-1">
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="Professional">Professional - Highest quality</SelectItem>
// //                   <SelectItem value="High">High - Great quality, faster</SelectItem>
// //                   <SelectItem value="Standard">Standard - Good quality, quickest</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Color Enhancement</Label>
// //                 <Switch
// //                   checked={config.colorEnhancement}
// //                   onCheckedChange={(checked) => updateConfig('colorEnhancement', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Video Stabilization</Label>
// //                 <Switch
// //                   checked={config.stabilization}
// //                   onCheckedChange={(checked) => updateConfig('stabilization', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Remove Noise</Label>
// //                 <Switch
// //                   checked={config.removeNoise}
// //                   onCheckedChange={(checked) => updateConfig('removeNoise', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Logo</Label>
// //                 <Switch
// //                   checked={config.addLogo}
// //                   onCheckedChange={(checked) => updateConfig('addLogo', checked)}
// //                 />
// //               </div>
// //             </div>

// //             {config.addLogo && (
// //               <div className="p-4 bg-blue-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">Logo Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Logo URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/logo.png"
// //                     value={config.logoUrl || ""}
// //                     onChange={(e) => updateConfig('logoUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Logo Position</Label>
// //                   <Select value={config.logoPosition} onValueChange={(value) => updateConfig('logoPosition', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="top-left">Top Left</SelectItem>
// //                       <SelectItem value="top-right">Top Right</SelectItem>
// //                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
// //                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             )}

// //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //               <Label className="text-sm font-medium">Add Watermark</Label>
// //               <Switch
// //                 checked={config.addWatermark}
// //                 onCheckedChange={(checked) => updateConfig('addWatermark', checked)}
// //               />
// //             </div>

// //             {config.addWatermark && (
// //               <div className="p-4 bg-blue-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">Watermark Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Watermark Text (leave empty to use brand name)</Label>
// //                   <Input
// //                     placeholder="Your brand name"
// //                     value={config.watermarkText || ""}
// //                     onChange={(e) => updateConfig('watermarkText', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Watermark Position</Label>
// //                   <Select value={config.watermarkPosition} onValueChange={(value) => updateConfig('watermarkPosition', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="top-left">Top Left</SelectItem>
// //                       <SelectItem value="top-right">Top Right</SelectItem>
// //                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
// //                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         );

// //       case "story_mode":
// //         return (
// //           <div className="space-y-6">
// //             <div>
// //               <Label className="text-sm font-medium">Highlight Type</Label>
// //               <Select value={config.highlightType} onValueChange={(value) => updateConfig('highlightType', value)}>
// //                 <SelectTrigger className="mt-1">
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="General">General Highlights</SelectItem>
// //                   <SelectItem value="Emotional">Emotional Highlights</SelectItem>
// //                   <SelectItem value="Results">Results & Metrics</SelectItem>
// //                   <SelectItem value="Problem">Problem/Solution</SelectItem>
// //                   <SelectItem value="Recommendation">Recommendations</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             <div>
// //               <Label className="text-sm font-medium">Transition Style</Label>
// //               <Select value={config.transitionStyle} onValueChange={(value) => updateConfig('transitionStyle', value)}>
// //                 <SelectTrigger className="mt-1">
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="Fade">Smooth Fade</SelectItem>
// //                   <SelectItem value="Cut">Quick Cut</SelectItem>
// //                   <SelectItem value="Slide">Slide Transition</SelectItem>
// //                   <SelectItem value="Zoom">Zoom Effect</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Intro</Label>
// //                 <Switch
// //                   checked={config.addIntro}
// //                   onCheckedChange={(checked) => updateConfig('addIntro', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Outro</Label>
// //                 <Switch
// //                   checked={config.addOutro}
// //                   onCheckedChange={(checked) => updateConfig('addOutro', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Remove Noise</Label>
// //                 <Switch
// //                   checked={config.removeNoise}
// //                   onCheckedChange={(checked) => updateConfig('removeNoise', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Logo</Label>
// //                 <Switch
// //                   checked={config.addLogo}
// //                   onCheckedChange={(checked) => updateConfig('addLogo', checked)}
// //                 />
// //               </div>
// //             </div>

// //             {/* Intro Configuration */}
// //             {config.addIntro && (
// //               <div className="p-4 bg-purple-50 rounded-lg space-y-4">
// //                 <Label className="text-sm font-medium">Intro Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Intro Image URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/intro-image.jpg"
// //                     value={config.introImageUrl || ""}
// //                     onChange={(e) => updateConfig('introImageUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Voice Over Prompt for Intro</Label>
// //                   <Textarea
// //                     placeholder="Enter the script for intro voice over..."
// //                     value={config.introVoicePrompt || ""}
// //                     onChange={(e) => updateConfig('introVoicePrompt', e.target.value)}
// //                     className="mt-1"
// //                     rows={2}
// //                   />
// //                 </div>
// //               </div>
// //             )}

// //             {/* Outro Configuration */}
// //             {config.addOutro && (
// //               <div className="p-4 bg-purple-50 rounded-lg space-y-4">
// //                 <Label className="text-sm font-medium">Outro Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Outro Image URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/outro-image.jpg"
// //                     value={config.outroImageUrl || ""}
// //                     onChange={(e) => updateConfig('outroImageUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Voice Over Prompt for Outro</Label>
// //                   <Textarea
// //                     placeholder="Enter the script for outro voice over..."
// //                     value={config.outroVoicePrompt || ""}
// //                     onChange={(e) => updateConfig('outroVoicePrompt', e.target.value)}
// //                     className="mt-1"
// //                     rows={2}
// //                   />
// //                 </div>
// //               </div>
// //             )}

// //             {/* Background Music */}
// //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //               <Label className="text-sm font-medium">Add Background Music</Label>
// //               <Switch
// //                 checked={config.backgroundMusic}
// //                 onCheckedChange={(checked) => updateConfig('backgroundMusic', checked)}
// //               />
// //             </div>

// //             {config.backgroundMusic && (
// //               <div className="p-4 bg-blue-50 rounded-lg space-y-4">
// //                 <Label className="text-sm font-medium">Background Music Selection</Label>
// //                 <div className="grid grid-cols-1 gap-2">
// //                   {backgroundMusicOptions.map((music) => (
// //                     <div
// //                       key={music.id}
// //                       className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
// //                         config.selectedMusic === music.id
// //                           ? "border-blue-500 bg-blue-100"
// //                           : "border-gray-200 hover:border-gray-300"
// //                       }`}
// //                       onClick={() => updateConfig('selectedMusic', music.id)}
// //                     >
// //                       <div className="flex items-center justify-between">
// //                         <span className="font-medium text-sm">{music.name}</span>
// //                         {config.selectedMusic === music.id && (
// //                           <CheckCircle className="h-4 w-4 text-blue-600" />
// //                         )}
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Or use custom music URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/custom-music.mp3"
// //                     value={config.customMusicUrl || ""}
// //                     onChange={(e) => updateConfig('customMusicUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //               </div>
// //             )}

// //             {/* Logo Configuration */}
// //             {config.addLogo && (
// //               <div className="p-4 bg-green-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">Logo Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Logo URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/logo.png"
// //                     value={config.logoUrl || ""}
// //                     onChange={(e) => updateConfig('logoUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Logo Position</Label>
// //                   <Select value={config.logoPosition} onValueChange={(value) => updateConfig('logoPosition', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="top-left">Top Left</SelectItem>
// //                       <SelectItem value="top-right">Top Right</SelectItem>
// //                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
// //                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             )}

// //             {/* Watermark */}
// //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //               <Label className="text-sm font-medium">Add Watermark</Label>
// //               <Switch
// //                 checked={config.addWatermark}
// //                 onCheckedChange={(checked) => updateConfig('addWatermark', checked)}
// //               />
// //             </div>

// //             {config.addWatermark && (
// //               <div className="p-4 bg-yellow-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">Watermark Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Watermark Text (leave empty to use brand name)</Label>
// //                   <Input
// //                     placeholder="Your brand name"
// //                     value={config.watermarkText || ""}
// //                     onChange={(e) => updateConfig('watermarkText', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Watermark Position</Label>
// //                   <Select value={config.watermarkPosition} onValueChange={(value) => updateConfig('watermarkPosition', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="top-left">Top Left</SelectItem>
// //                       <SelectItem value="top-right">Top Right</SelectItem>
// //                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
// //                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         );

// //       case "clipping":
// //         return (
// //           <div className="space-y-6">
// //             <div className="grid grid-cols-2 gap-4">
// //               <div>
// //                 <Label className="text-sm font-medium">Max Clips</Label>
// //                 <Select value={String(config.maxClips)} onValueChange={(value) => updateConfig('maxClips', parseInt(value))}>
// //                   <SelectTrigger className="mt-1">
// //                     <SelectValue />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="3">3 clips</SelectItem>
// //                     <SelectItem value="5">5 clips</SelectItem>
// //                     <SelectItem value="8">8 clips</SelectItem>
// //                     <SelectItem value="10">10 clips</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               </div>
// //               <div>
// //                 <Label className="text-sm font-medium">Clip Duration</Label>
// //                 <Select value={config.clipDuration} onValueChange={(value) => updateConfig('clipDuration', value)}>
// //                   <SelectTrigger className="mt-1">
// //                     <SelectValue />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="10 seconds">10 seconds</SelectItem>
// //                     <SelectItem value="15 seconds">15 seconds</SelectItem>
// //                     <SelectItem value="30 seconds">30 seconds</SelectItem>
// //                     <SelectItem value="45 seconds">45 seconds</SelectItem>
// //                     <SelectItem value="60 seconds">60 seconds</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               </div>
// //             </div>

// //             <div>
// //               <Label className="text-sm font-medium">Transition Type</Label>
// //               <Select value={config.transitionType} onValueChange={(value) => updateConfig('transitionType', value)}>
// //                 <SelectTrigger className="mt-1">
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="Fade">Smooth Fade</SelectItem>
// //                   <SelectItem value="Cut">Quick Cut</SelectItem>
// //                   <SelectItem value="Slide">Slide Transition</SelectItem>
// //                   <SelectItem value="Zoom">Zoom Effect</SelectItem>
// //                   <SelectItem value="Dissolve">Dissolve</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Remove Noise</Label>
// //                 <Switch
// //                   checked={config.removeNoise}
// //                   onCheckedChange={(checked) => updateConfig('removeNoise', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Include Subtitles</Label>
// //                 <Switch
// //                   checked={config.includeSubtitles}
// //                   onCheckedChange={(checked) => updateConfig('includeSubtitles', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Logo</Label>
// //                 <Switch
// //                   checked={config.addLogo}
// //                   onCheckedChange={(checked) => updateConfig('addLogo', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Add Watermark</Label>
// //                 <Switch
// //                   checked={config.addWatermark}
// //                   onCheckedChange={(checked) => updateConfig('addWatermark', checked)}
// //                 />
// //               </div>
// //             </div>

// //             {/* Background Music */}
// //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //               <Label className="text-sm font-medium">Add Background Music</Label>
// //               <Switch
// //                 checked={config.backgroundMusic}
// //                 onCheckedChange={(checked) => updateConfig('backgroundMusic', checked)}
// //               />
// //             </div>

// //             {config.backgroundMusic && (
// //               <div className="p-4 bg-blue-50 rounded-lg space-y-4">
// //                 <Label className="text-sm font-medium">Background Music Selection</Label>
// //                 <div className="grid grid-cols-1 gap-2">
// //                   {backgroundMusicOptions.map((music) => (
// //                     <div
// //                       key={music.id}
// //                       className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
// //                         config.selectedMusic === music.id
// //                           ? "border-blue-500 bg-blue-100"
// //                           : "border-gray-200 hover:border-gray-300"
// //                       }`}
// //                       onClick={() => updateConfig('selectedMusic', music.id)}
// //                     >
// //                       <div className="flex items-center justify-between">
// //                         <span className="font-medium text-sm">{music.name}</span>
// //                         {config.selectedMusic === music.id && (
// //                           <CheckCircle className="h-4 w-4 text-blue-600" />
// //                         )}
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Or use custom music URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/custom-music.mp3"
// //                     value={config.customMusicUrl || ""}
// //                     onChange={(e) => updateConfig('customMusicUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //               </div>
// //             )}

// //             {/* Logo Configuration */}
// //             {config.addLogo && (
// //               <div className="p-4 bg-green-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">Logo Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Logo URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/logo.png"
// //                     value={config.logoUrl || ""}
// //                     onChange={(e) => updateConfig('logoUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Logo Position</Label>
// //                   <Select value={config.logoPosition} onValueChange={(value) => updateConfig('logoPosition', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="top-left">Top Left</SelectItem>
// //                       <SelectItem value="top-right">Top Right</SelectItem>
// //                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
// //                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             )}

// //             {/* Watermark Configuration */}
// //             {config.addWatermark && (
// //               <div className="p-4 bg-yellow-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">Watermark Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Watermark Text (leave empty to use brand name)</Label>
// //                   <Input
// //                     placeholder="Your brand name"
// //                     value={config.watermarkText || ""}
// //                     onChange={(e) => updateConfig('watermarkText', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Watermark Position</Label>
// //                   <Select value={config.watermarkPosition} onValueChange={(value) => updateConfig('watermarkPosition', value)}>
// //                     <SelectTrigger className="mt-1">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value="top-left">Top Left</SelectItem>
// //                       <SelectItem value="top-right">Top Right</SelectItem>
// //                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
// //                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
// //                     </SelectContent>
// //                   </Select>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         );
// //       case "content_generator":
// //         return (
// //           <div className="space-y-6">
// //             <div>
// //               <Label className="text-sm font-medium">Content Types to Generate</Label>
// //               <div className="mt-2 grid grid-cols-2 gap-3">
// //                 {["Email Campaign", "Blog Post", "Case Study", "Social Media Posts", "Sales Deck", "Whitepaper", "Press Release", "Landing Page Copy", "Testimonial Wall"].map((type) => (
// //                   <div
// //                     key={type}
// //                     className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
// //                       config.contentTypes?.includes(type)
// //                         ? "border-pink-500 bg-pink-50"
// //                         : "border-gray-200 hover:border-gray-300"
// //                     }`}
// //                     onClick={() => {
// //                       const current = config.contentTypes || [];
// //                       if (current.includes(type)) {
// //                         updateConfig('contentTypes', current.filter(t => t !== type));
// //                       } else {
// //                         updateConfig('contentTypes', [...current, type]);
// //                       }
// //                     }}
// //                   >
// //                     <div className="flex items-center justify-between">
// //                       <span className="font-medium text-sm">{type}</span>
// //                       {config.contentTypes?.includes(type) && (
// //                         <CheckCircle className="h-4 w-4 text-pink-600" />
// //                       )}
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="grid grid-cols-2 gap-4">
// //               <div>
// //                 <Label className="text-sm font-medium">Tone & Style</Label>
// //                 <Select value={config.tone} onValueChange={(value) => updateConfig('tone', value)}>
// //                   <SelectTrigger className="mt-1">
// //                     <SelectValue />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="professional">Professional - Formal and authoritative</SelectItem>
// //                     <SelectItem value="casual">Casual - Friendly and approachable</SelectItem>
// //                     <SelectItem value="persuasive">Persuasive - Compelling and action-oriented</SelectItem>
// //                     <SelectItem value="technical">Technical - Detailed and precise</SelectItem>
// //                     <SelectItem value="friendly">Friendly - Warm and personal</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               </div>

// //               <div>
// //                 <Label className="text-sm font-medium">Content Length</Label>
// //                 <Select value={config.contentLength} onValueChange={(value) => updateConfig('contentLength', value)}>
// //                   <SelectTrigger className="mt-1">
// //                     <SelectValue />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="short">Short - Concise and punchy</SelectItem>
// //                     <SelectItem value="medium">Medium - Detailed overview</SelectItem>
// //                     <SelectItem value="long">Long - Comprehensive and thorough</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               </div>
// //             </div>

// //             <div>
// //               <Label className="text-sm font-medium">Target Audience</Label>
// //               <Input
// //                 placeholder="e.g., potential customers, existing clients, industry professionals"
// //                 value={config.targetAudience || ""}
// //                 onChange={(e) => updateConfig('targetAudience', e.target.value)}
// //                 className="mt-1"
// //               />
// //             </div>

// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Auto-Select Positive Reviews</Label>
// //                 <Switch
// //                   checked={config.autoSelectPositive}
// //                   onCheckedChange={(checked) => updateConfig('autoSelectPositive', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Include Metrics & Data</Label>
// //                 <Switch
// //                   checked={config.includeMetrics}
// //                   onCheckedChange={(checked) => updateConfig('includeMetrics', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">SEO Optimization</Label>
// //                 <Switch
// //                   checked={config.seoOptimization}
// //                   onCheckedChange={(checked) => updateConfig('seoOptimization', checked)}
// //                 />
// //               </div>
// //               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //                 <Label className="text-sm font-medium">Include Call-to-Action</Label>
// //                 <Switch
// //                   checked={config.includeCTA}
// //                   onCheckedChange={(checked) => updateConfig('includeCTA', checked)}
// //                 />
// //               </div>
// //             </div>

// //             <div>
// //               <Label className="text-sm font-medium">Brand Voice & Guidelines</Label>
// //               <Textarea
// //                 placeholder="Describe your brand's personality, communication style, and any specific guidelines..."
// //                 value={config.brandVoice || ""}
// //                 onChange={(e) => updateConfig('brandVoice', e.target.value)}
// //                 className="mt-1"
// //                 rows={3}
// //               />
// //             </div>

// //             <div>
// //               <Label className="text-sm font-medium">Custom Requirements (Optional)</Label>
// //               <Textarea
// //                 placeholder="Any specific requirements, keywords to include, or formatting preferences..."
// //                 value={config.customRequirements || ""}
// //                 onChange={(e) => updateConfig('customRequirements', e.target.value)}
// //                 className="mt-1"
// //                 rows={3}
// //               />
// //             </div>

// //             {config.seoOptimization && (
// //               <div className="p-4 bg-green-50 rounded-lg space-y-3">
// //                 <Label className="text-sm font-medium">SEO Configuration</Label>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Target Keywords (comma separated)</Label>
// //                   <Input
// //                     placeholder="testimonial management, customer reviews, social proof"
// //                     value={config.seoKeywords || ""}
// //                     onChange={(e) => updateConfig('seoKeywords', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Focus Keyword</Label>
// //                   <Input
// //                     placeholder="Primary keyword for content optimization"
// //                     value={config.focusKeyword || ""}
// //                     onChange={(e) => updateConfig('focusKeyword', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         );

// //       case "translation":
// //         return (
// //           <div className="space-y-6">
// //             <div>
// //               <Label className="text-sm font-medium">Target Languages</Label>
// //               <div className="mt-2 grid grid-cols-2 gap-2">
// //                 {["Spanish", "French", "German", "Italian", "Portuguese", "Chinese"].map((lang) => (
// //                   <div key={lang} className="flex items-center space-x-2">
// //                     <Checkbox
// //                       id={lang}
// //                       checked={config.targetLanguages?.includes(lang)}
// //                       onCheckedChange={(checked) => {
// //                         const current = config.targetLanguages || [];
// //                         if (checked) {
// //                           updateConfig('targetLanguages', [...current, lang]);
// //                         } else {
// //                           updateConfig('targetLanguages', current.filter(l => l !== lang));
// //                         }
// //                       }}
// //                     />
// //                     <Label htmlFor={lang} className="text-sm">{lang}</Label>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>

// //             <div>
// //               <Label className="text-sm font-medium">Formality Level</Label>
// //               <Select value={config.formalityLevel} onValueChange={(value) => updateConfig('formalityLevel', value)}>
// //                 <SelectTrigger className="mt-1">
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="Formal">Formal</SelectItem>
// //                   <SelectItem value="Neutral">Neutral</SelectItem>
// //                   <SelectItem value="Informal">Informal</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>
// //           </div>
// //         );

// //       case "narration":
// //         return (
// //           <div className="space-y-6">
// //             <div>
// //               <Label className="text-sm font-medium">Voice Provider</Label>
// //               <Select value={config.voiceProvider} onValueChange={(value) => updateConfig('voiceProvider', value)}>
// //                 <SelectTrigger className="mt-1">
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="elevenlabs">ElevenLabs - Premium AI Voices</SelectItem>
// //                   <SelectItem value="openai">OpenAI - Natural Speech</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             {/* Voice Selection */}
// //             <div>
// //               <Label className="text-sm font-medium">Voice Selection</Label>
// //               <div className="mt-2 grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
// //                 {(config.voiceProvider === "elevenlabs" ? voices.elevenlabs : voices.openai).map((voice) => (
// //                   <div
// //                     key={voice.id}
// //                     className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
// //                       config.selectedVoice === voice.id
// //                         ? "border-purple-500 bg-purple-50"
// //                         : "border-gray-200 hover:border-gray-300"
// //                     }`}
// //                     onClick={() => updateConfig('selectedVoice', voice.id)}
// //                   >
// //                     <div className="flex items-center justify-between">
// //                       <div className="flex-1">
// //                         <div className="flex items-center gap-2">
// //                           <span className="font-medium text-sm">{voice.name}</span>
// //                           <Badge variant="outline" className="text-xs">
// //                             {voice.gender}
// //                           </Badge>
// //                           <Badge variant="outline" className="text-xs">
// //                             {voice.accent}
// //                           </Badge>
// //                         </div>
// //                         <div className="text-xs text-gray-500 mt-1">
// //                           {voice.description}
// //                         </div>
// //                       </div>
// //                       {config.selectedVoice === voice.id && (
// //                         <CheckCircle className="h-4 w-4 text-purple-600" />
// //                       )}
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>

// //             {/* Voice Settings */}
// //             <div className="grid grid-cols-2 gap-4">
// //               <div>
// //                 <Label className="text-sm font-medium">Speech Speed</Label>
// //                 <Select value={config.speed} onValueChange={(value) => updateConfig('speed', value)}>
// //                   <SelectTrigger className="mt-1">
// //                     <SelectValue />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="0.75x">0.75x - Slower</SelectItem>
// //                     <SelectItem value="1.0x">1.0x - Normal</SelectItem>
// //                     <SelectItem value="1.25x">1.25x - Faster</SelectItem>
// //                     <SelectItem value="1.5x">1.5x - Much Faster</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               </div>
// //               <div>
// //                 <Label className="text-sm font-medium">Voice Emotion</Label>
// //                 <Select value={config.emotion} onValueChange={(value) => updateConfig('emotion', value)}>
// //                   <SelectTrigger className="mt-1">
// //                     <SelectValue />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="neutral">Neutral</SelectItem>
// //                     <SelectItem value="professional">Professional</SelectItem>
// //                     <SelectItem value="friendly">Friendly</SelectItem>
// //                     <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
// //                     <SelectItem value="calm">Calm</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               </div>
// //             </div>

// //             <div>
// //               <Label className="text-sm font-medium">Output Format</Label>
// //               <Select value={config.outputFormat} onValueChange={(value) => updateConfig('outputFormat', value)}>
// //                 <SelectTrigger className="mt-1">
// //                   <SelectValue />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="mp3">MP3 - Compressed, smaller file</SelectItem>
// //                   <SelectItem value="wav">WAV - Lossless, high quality</SelectItem>
// //                   <SelectItem value="aac">AAC - Balanced quality and size</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>

// //             {/* Background Music */}
// //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //               <Label className="text-sm font-medium">Add Background Music</Label>
// //               <Switch
// //                 checked={config.backgroundMusic}
// //                 onCheckedChange={(checked) => updateConfig('backgroundMusic', checked)}
// //               />
// //             </div>

// //             {config.backgroundMusic && (
// //               <div className="p-4 bg-blue-50 rounded-lg space-y-4">
// //                 <Label className="text-sm font-medium">Background Music Selection</Label>
// //                 <div className="grid grid-cols-1 gap-2">
// //                   {backgroundMusicOptions.map((music) => (
// //                     <div
// //                       key={music.id}
// //                       className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
// //                         config.selectedMusic === music.id
// //                           ? "border-blue-500 bg-blue-100"
// //                           : "border-gray-200 hover:border-gray-300"
// //                       }`}
// //                       onClick={() => updateConfig('selectedMusic', music.id)}
// //                     >
// //                       <div className="flex items-center justify-between">
// //                         <span className="font-medium text-sm">{music.name}</span>
// //                         {config.selectedMusic === music.id && (
// //                           <CheckCircle className="h-4 w-4 text-blue-600" />
// //                         )}
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Or use custom music URL</Label>
// //                   <Input
// //                     placeholder="https://example.com/custom-music.mp3"
// //                     value={config.customMusicUrl || ""}
// //                     onChange={(e) => updateConfig('customMusicUrl', e.target.value)}
// //                     className="mt-1"
// //                   />
// //                 </div>
// //                 <div>
// //                   <Label className="text-xs text-gray-600">Music Volume: {config.musicVolume || 15}%</Label>
// //                   <Slider
// //                     value={[config.musicVolume || 15]}
// //                     onValueChange={([value]) => updateConfig('musicVolume', value)}
// //                     max={50}
// //                     step={5}
// //                     className="mt-2"
// //                   />
// //                 </div>
// //               </div>
// //             )}

// //             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
// //               <Label className="text-sm font-medium">Enhance Audio Quality</Label>
// //               <Switch
// //                 checked={config.enhanceAudio}
// //                 onCheckedChange={(checked) => updateConfig('enhanceAudio', checked)}
// //               />
// //             </div>
// //           </div>
// //         );
// //         return (
// //           <div className="space-y-4">
// //             <div className="text-center py-8 text-gray-500">
// //               <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
// //               <p>Default settings will be used for this service.</p>
// //             </div>
// //           </div>
// //         );
// //     }
// //   };

// //   return (
// //     <AnimatePresence>
// //       {isOpen && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
// //           <motion.div
// //             initial={{ opacity: 0, scale: 0.95 }}
// //             animate={{ opacity: 1, scale: 1 }}
// //             exit={{ opacity: 0, scale: 0.95 }}
// //             className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
// //           >
// //             <div className="flex items-center justify-between p-6 border-b">
// //               <div className="flex items-center gap-3">
// //                 <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${service.gradient} flex items-center justify-center`}>
// //                   <service.icon className="h-5 w-5 text-white" />
// //                 </div>
// //                 <div>
// //                   <h2 className="text-xl font-semibold text-gray-900">{service.title}</h2>
// //                   <p className="text-sm text-gray-600">Customize processing settings</p>
// //                 </div>
// //               </div>
// //               <Button variant="ghost" size="sm" onClick={onClose}>
// //                 <X className="h-4 w-4" />
// //               </Button>
// //             </div>

// //             <div className="p-6 overflow-y-auto max-h-[65vh]">
// //               {renderConfigOptions()}
// //             </div>

// //             <div className="flex items-center justify-between p-6 border-t bg-gray-50">
// //               <div className="text-sm text-gray-600">
// //                 Processing {selectedTestimonials.length} testimonial{selectedTestimonials.length > 1 ? 's' : ''}
// //               </div>
// //               <div className="flex gap-3">
// //                 <Button variant="outline" onClick={onClose}>
// //                   Cancel
// //                 </Button>
// //                 <Button onClick={handleProcess} className="bg-blue-600 hover:bg-blue-700">
// //                   <Play className="h-4 w-4 mr-2" />
// //                   Start Processing
// //                 </Button>
// //               </div>
// //             </div>
// //           </motion.div>
// //         </div>
// //       )}
// //     </AnimatePresence>
// //   );
// // };

// // const AIStudio = () => {
// //   const [selectedTestimonials, setSelectedTestimonials] = useState([]);
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filterType, setFilterType] = useState("all");
// //   const [activeTab, setActiveTab] = useState("testimonials");
// //   const [processingJobs, setProcessingJobs] = useState([]);
// //   const [showFilters, setShowFilters] = useState(false);
// //   const [selectedCategory, setSelectedCategory] = useState("all");
// //   const [configModal, setConfigModal] = useState({ isOpen: false, service: null });
// //   const [serviceConfigs, setServiceConfigs] = useState({});
// //   const [toast, setToast] = useState(null);

// //   // Filter testimonials
// //   const filteredTestimonials = TESTIMONIALS_DATA.filter((testimonial) => {
// //     const matchesSearch = !searchTerm ||
// //       testimonial.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       testimonial.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       testimonial.content_preview?.toLowerCase().includes(searchTerm.toLowerCase());

// //     const matchesFilter = filterType === "all" ||
// //       (filterType === "video" && testimonial.media_type === "video") ||
// //       (filterType === "text" && testimonial.media_type === "text") ||
// //       (filterType === "high_rating" && testimonial.rating >= 4) ||
// //       (filterType === "high_sentiment" && testimonial.sentiment_score >= 0.9);

// //     return matchesSearch && matchesFilter;
// //   });

// //   // Filter services
// //   const filteredServices = selectedCategory === "all"
// //     ? AI_SERVICES
// //     : AI_SERVICES.filter(service => service.category === selectedCategory);

// //   // Handle testimonial selection
// //   const toggleTestimonialSelection = (testimonialId) => {
// //     setSelectedTestimonials(prev => {
// //       if (prev.includes(testimonialId)) {
// //         return prev.filter(id => id !== testimonialId);
// //       } else {
// //         return [...prev, testimonialId];
// //       }
// //     });
// //   };

// //   const selectAllTestimonials = () => {
// //     setSelectedTestimonials(filteredTestimonials.map(t => t.id));
// //   };

// //   const clearSelection = () => {
// //     setSelectedTestimonials([]);
// //   };

// //   // Handle processing
// //   const handleProcessImmediate = (serviceId) => {
// //     const service = AI_SERVICES.find(s => s.id === serviceId);
// //     const config = serviceConfigs[serviceId] || service.defaultSettings;
// //     processService(serviceId, config);
// //   };

// //   const handleCustomizeProcess = (serviceId) => {
// //     const service = AI_SERVICES.find(s => s.id === serviceId);
// //     setConfigModal({ isOpen: true, service });
// //   };

// //   const processService = (serviceId, config) => {
// //     const service = AI_SERVICES.find(s => s.id === serviceId);

// //     if (!service.isQueued) {
// //       // Streaming services - go directly to monitor
// //       setActiveTab("processing");

// //       // Create streaming job
// //       const streamingJob = {
// //         id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
// //         serviceId,
// //         testimonialIds: selectedTestimonials,
// //         status: "streaming",
// //         progress: 0,
// //         startTime: new Date(),
// //         isStreaming: true,
// //         config,
// //       };

// //       setProcessingJobs(prev => [...prev, streamingJob]);

// //       // Simulate streaming progress
// //       const interval = setInterval(() => {
// //         setProcessingJobs(prev => prev.map(job => {
// //           if (job.id === streamingJob.id) {
// //             const newProgress = Math.min(job.progress + Math.random() * 15, 100);
// //             if (newProgress >= 100) {
// //               clearInterval(interval);
// //               return { ...job, progress: 100, status: "completed", endTime: new Date() };
// //             }
// //             return { ...job, progress: newProgress };
// //           }
// //           return job;
// //         }));
// //       }, 500);

// //       return;
// //     }

// //     // Queued services
// //     const newJobs = selectedTestimonials.map(testimonialId => ({
// //       id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
// //       serviceId,
// //       testimonialId,
// //       status: "queued",
// //       progress: 0,
// //       startTime: new Date(),
// //       config,
// //     }));

// //     setProcessingJobs(prev => [...prev, ...newJobs]);

// //     // Show toast notification
// //     setToast({
// //       message: `${newJobs.length} job${newJobs.length > 1 ? 's' : ''} added to queue. Estimated time: ${service.estimatedTime}`,
// //       action: "View Progress",
// //       onAction: () => {
// //         setActiveTab("processing");
// //         setToast(null);
// //       },
// //       onClose: () => setToast(null),
// //     });

// //     // Start processing after a delay
// //     setTimeout(() => {
// //       newJobs.forEach(job => {
// //         const interval = setInterval(() => {
// //           setProcessingJobs(prev => prev.map(j => {
// //             if (j.id === job.id) {
// //               if (j.status === "queued") {
// //                 return { ...j, status: "processing" };
// //               }
// //               const newProgress = Math.min(j.progress + Math.random() * 10, 100);
// //               if (newProgress >= 100) {
// //                 clearInterval(interval);
// //                 return { ...j, progress: 100, status: "completed", endTime: new Date() };
// //               }
// //               return { ...j, progress: newProgress };
// //             }
// //             return j;
// //           }));
// //         }, 1000);
// //       });
// //     }, 2000);
// //   };

// //   const handleConfigProcess = (serviceId, config) => {
// //     setServiceConfigs(prev => ({ ...prev, [serviceId]: config }));
// //     processService(serviceId, config);
// //   };

// //   const deleteJob = (jobId) => {
// //     setProcessingJobs(prev => prev.filter(job => job.id !== jobId));
// //   };

// //   const retryJob = (jobId) => {
// //     setProcessingJobs(prev => prev.map(job => {
// //       if (job.id === jobId) {
// //         return { ...job, status: "processing", progress: 0, startTime: new Date() };
// //       }
// //       return job;
// //     }));
// //   };

// //   const categories = [
// //     { id: "all", label: "All Services" },
// //     { id: "video", label: "Video" },
// //     { id: "audio", label: "Audio" },
// //     { id: "content", label: "Content" },
// //     { id: "optimization", label: "Optimization" },
// //   ];

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
// //       {/* Header */}
// //       <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
// //         <div className="max-w-7xl mx-auto px-6 lg:px-8">
// //           <div className="flex items-center justify-between h-16">
// //             <div className="flex items-center gap-4">
// //               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
// //                 <Sparkles className="h-6 w-6 text-white" />
// //               </div>
// //               <div>
// //                 <h1 className="text-xl font-bold text-gray-900">AI Studio</h1>
// //                 <p className="text-sm text-gray-600">Transform testimonials with AI</p>
// //               </div>
// //             </div>

// //             <div className="flex items-center gap-4">
// //               {selectedTestimonials.length > 0 && (
// //                 <Badge className="bg-blue-100 text-blue-800">
// //                   {selectedTestimonials.length} selected
// //                 </Badge>
// //               )}
// //               {processingJobs.filter(j => j.status === "processing" || j.status === "streaming").length > 0 && (
// //                 <Badge className="bg-green-100 text-green-800">
// //                   {processingJobs.filter(j => j.status === "processing" || j.status === "streaming").length} processing
// //                 </Badge>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
// //         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
// //           <TabsList className="bg-white shadow-sm">
// //             <TabsTrigger value="testimonials" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
// //               <Users className="h-4 w-4 mr-2" />
// //               Select Testimonials
// //             </TabsTrigger>
// //             <TabsTrigger value="services" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
// //               <Workflow className="h-4 w-4 mr-2" />
// //               AI Services
// //             </TabsTrigger>
// //             <TabsTrigger value="processing" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
// //               <Target className="h-4 w-4 mr-2" />
// //               Processing Monitor
// //             </TabsTrigger>
// //           </TabsList>

// //           <TabsContent value="testimonials" className="space-y-6">
// //             {/* Testimonials Tab Content - Same as before */}
// //             <div className="flex items-center justify-between">
// //               <div>
// //                 <h2 className="text-2xl font-bold text-gray-900">Select Testimonials</h2>
// //                 <p className="text-gray-600 mt-1">Choose testimonials to process with AI services</p>
// //               </div>
// //               <div className="flex items-center gap-3">
// //                 <Button
// //                   variant="outline"
// //                   onClick={selectAllTestimonials}
// //                   disabled={filteredTestimonials.length === 0}
// //                 >
// //                   Select All
// //                 </Button>
// //                 <Button
// //                   variant="outline"
// //                   onClick={clearSelection}
// //                   disabled={selectedTestimonials.length === 0}
// //                 >
// //                   Clear All
// //                 </Button>
// //               </div>
// //             </div>

// //             {/* Search and Filters */}
// //             <div className="space-y-4">
// //               <div className="flex gap-4">
// //                 <div className="relative flex-1">
// //                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
// //                   <Input
// //                     placeholder="Search testimonials..."
// //                     value={searchTerm}
// //                     onChange={(e) => setSearchTerm(e.target.value)}
// //                     className="pl-10"
// //                   />
// //                 </div>
// //                 <Button
// //                   variant="outline"
// //                   onClick={() => setShowFilters(!showFilters)}
// //                 >
// //                   <Filter className="h-4 w-4 mr-2" />
// //                   Filters
// //                   {showFilters ? <ChevronDown className="h-4 w-4 ml-2" /> : <ChevronRight className="h-4 w-4 ml-2" />}
// //                 </Button>
// //               </div>

// //               <AnimatePresence>
// //                 {showFilters && (
// //                   <motion.div
// //                     initial={{ opacity: 0, height: 0 }}
// //                     animate={{ opacity: 1, height: "auto" }}
// //                     exit={{ opacity: 0, height: 0 }}
// //                     className="bg-white border rounded-lg p-4"
// //                   >
// //                     <Select value={filterType} onValueChange={setFilterType}>
// //                       <SelectTrigger className="w-64">
// //                         <SelectValue />
// //                       </SelectTrigger>
// //                       <SelectContent>
// //                         <SelectItem value="all">All Types</SelectItem>
// //                         <SelectItem value="video">Video Only</SelectItem>
// //                         <SelectItem value="text">Text Only</SelectItem>
// //                         <SelectItem value="high_rating">High Rating (4+)</SelectItem>
// //                         <SelectItem value="high_sentiment">High Sentiment (90%+)</SelectItem>
// //                       </SelectContent>
// //                     </Select>
// //                   </motion.div>
// //                 )}
// //               </AnimatePresence>
// //             </div>

// //             {/* Testimonials Grid */}
// //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //               {filteredTestimonials.map((testimonial, index) => (
// //                 <motion.div
// //                   key={testimonial.id}
// //                   initial={{ opacity: 0, y: 20 }}
// //                   animate={{ opacity: 1, y: 0 }}
// //                   transition={{ delay: index * 0.1 }}
// //                 >
// //                   <Card
// //                     className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
// //                       selectedTestimonials.includes(testimonial.id)
// //                         ? "ring-2 ring-blue-500 bg-blue-50"
// //                         : "hover:shadow-md"
// //                     }`}
// //                     onClick={() => toggleTestimonialSelection(testimonial.id)}
// //                   >
// //                     <CardContent className="p-6">
// //                       <div className="flex items-start justify-between mb-4">
// //                         <div className="flex items-center gap-3">
// //                           {testimonial.thumbnail && (
// //                             <img
// //                               src={testimonial.thumbnail}
// //                               alt={testimonial.customer_name}
// //                               className="w-10 h-10 rounded-full object-cover"
// //                             />
// //                           )}
// //                           <div>
// //                             <h3 className="font-semibold text-gray-900">{testimonial.customer_name}</h3>
// //                             <p className="text-sm text-gray-600">{testimonial.company}</p>
// //                           </div>
// //                         </div>
// //                         {selectedTestimonials.includes(testimonial.id) && (
// //                           <CheckCircle className="h-5 w-5 text-blue-600" />
// //                         )}
// //                       </div>

// //                       <p className="text-sm text-gray-700 mb-4 line-clamp-3">
// //                         {testimonial.content_preview}
// //                       </p>

// //                       <div className="flex items-center justify-between">
// //                         <div className="flex items-center gap-4">
// //                           {testimonial.media_type === "video" ? (
// //                             <Badge variant="secondary" className="bg-purple-100 text-purple-700">
// //                               <Video className="h-3 w-3 mr-1" />
// //                               Video
// //                             </Badge>
// //                           ) : (
// //                             <Badge variant="secondary" className="bg-green-100 text-green-700">
// //                               <FileText className="h-3 w-3 mr-1" />
// //                               Text
// //                             </Badge>
// //                           )}
// //                           <div className="flex items-center gap-1">
// //                             <Star className="h-4 w-4 text-yellow-500 fill-current" />
// //                             <span className="text-sm font-medium">{testimonial.rating}</span>
// //                           </div>
// //                         </div>
// //                         {testimonial.duration && (
// //                           <span className="text-xs text-gray-500">
// //                             {Math.round(testimonial.duration / 60)}m
// //                           </span>
// //                         )}
// //                       </div>

// //                       {testimonial.highlight_count && (
// //                         <div className="mt-3 pt-3 border-t">
// //                           <div className="flex items-center justify-between text-sm">
// //                             <span className="text-gray-600">{testimonial.highlight_count} highlights detected</span>
// //                             <span className="text-gray-600">{Math.round(testimonial.sentiment_score * 100)}% positive</span>
// //                           </div>
// //                         </div>
// //                       )}
// //                     </CardContent>
// //                   </Card>
// //                 </motion.div>
// //               ))}
// //             </div>

// //             {filteredTestimonials.length === 0 && (
// //               <div className="text-center py-12">
// //                 <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
// //                 <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials found</h3>
// //                 <p className="text-gray-600">Try adjusting your search or filter criteria</p>
// //               </div>
// //             )}
// //           </TabsContent>

// //           <TabsContent value="services" className="space-y-6">
// //             {/* Header */}
// //             <div>
// //               <h2 className="text-2xl font-bold text-gray-900">AI Services</h2>
// //               <p className="text-gray-600 mt-1">Select the AI service to apply to your testimonials</p>
// //             </div>

// //             {/* Category Filter */}
// //             <div className="flex gap-2 overflow-x-auto">
// //               {categories.map((category) => (
// //                 <Button
// //                   key={category.id}
// //                   variant={selectedCategory === category.id ? "default" : "outline"}
// //                   size="sm"
// //                   onClick={() => setSelectedCategory(category.id)}
// //                   className={`whitespace-nowrap ${
// //                     selectedCategory === category.id ? "bg-blue-600 hover:bg-blue-700" : ""
// //                   }`}
// //                 >
// //                   {category.label}
// //                 </Button>
// //               ))}
// //             </div>

// //             {/* Services Grid */}
// //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //               {filteredServices.map((service, index) => {
// //                 const IconComponent = service.icon;
// //                 const config = serviceConfigs[service.id] || service.defaultSettings;

// //                 return (
// //                   <motion.div
// //                     key={service.id}
// //                     initial={{ opacity: 0, y: 20 }}
// //                     animate={{ opacity: 1, y: 0 }}
// //                     transition={{ delay: index * 0.1 }}
// //                   >
// //                     <Card className="transition-all duration-200 hover:shadow-lg h-full">
// //                       <CardContent className="p-6 h-full flex flex-col">
// //                         <div className="flex items-start justify-between mb-4">
// //                           <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${service.gradient} flex items-center justify-center shadow-lg`}>
// //                             <IconComponent className="h-6 w-6 text-white" />
// //                           </div>
// //                           {!service.isQueued && (
// //                             <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
// //                               Instant
// //                             </Badge>
// //                           )}
// //                         </div>

// //                         <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
// //                         <p className="text-sm text-gray-600 mb-4 flex-1">{service.description}</p>

// //                         <div className="space-y-3 mb-4">
// //                           <div className="flex items-center justify-between text-sm">
// //                             <span className="text-gray-500">Processing time:</span>
// //                             <Badge variant="outline">{service.estimatedTime}</Badge>
// //                           </div>
// //                           <div className="flex items-center justify-between text-sm">
// //                             <span className="text-gray-500">Complexity:</span>
// //                             <Badge variant="outline">{service.complexity}</Badge>
// //                           </div>
// //                         </div>

// //                         {/* Default Settings Display */}
// //                         <div className="mb-4 p-3 bg-gray-50 rounded-lg">
// //                           <h4 className="text-xs font-medium text-gray-700 mb-2">Current Settings:</h4>
// //                           <div className="space-y-1">
// //                             {Object.entries(config).slice(0, 3).map(([key, value]) => (
// //                               <div key={key} className="flex justify-between text-xs">
// //                                 <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
// //                                 <span className="text-gray-800">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
// //                               </div>
// //                             ))}
// //                           </div>
// //                         </div>

// //                         <div className="space-y-2">
// //                           <Button
// //                             className="w-full bg-blue-600 hover:bg-blue-700"
// //                             onClick={() => handleProcessImmediate(service.id)}
// //                             disabled={selectedTestimonials.length === 0}
// //                           >
// //                             <Play className="h-4 w-4 mr-2" />
// //                             Process Immediately
// //                           </Button>
// //                           <Button
// //                             variant="outline"
// //                             className="w-full"
// //                             onClick={() => handleCustomizeProcess(service.id)}
// //                             disabled={selectedTestimonials.length === 0}
// //                           >
// //                             <Settings className="h-4 w-4 mr-2" />
// //                             Customize Processing
// //                           </Button>
// //                         </div>
// //                       </CardContent>
// //                     </Card>
// //                   </motion.div>
// //                 );
// //               })}
// //             </div>

// //             {selectedTestimonials.length === 0 && (
// //               <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
// //                 <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
// //                 <h3 className="font-medium text-yellow-800">Select testimonials first</h3>
// //                 <p className="text-sm text-yellow-700 mt-1">Choose testimonials from the previous tab to enable processing</p>
// //               </div>
// //             )}
// //           </TabsContent>

// //           <TabsContent value="processing" className="space-y-6">
// //             <div>
// //               <h2 className="text-2xl font-bold text-gray-900">Processing Monitor</h2>
// //               <p className="text-gray-600 mt-1">Track your AI processing jobs and download results</p>
// //             </div>

// //             {processingJobs.length === 0 ? (
// //               <Card>
// //                 <CardContent className="text-center py-12">
// //                   <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
// //                   <h3 className="text-lg font-medium text-gray-900 mb-2">No processing jobs</h3>
// //                   <p className="text-gray-600">Start processing to see your jobs here</p>
// //                 </CardContent>
// //               </Card>
// //             ) : (
// //               <div className="space-y-4">
// //                 {processingJobs.map((job) => {
// //                   const service = AI_SERVICES.find(s => s.id === job.serviceId);
// //                   const testimonial = job.testimonialId ? TESTIMONIALS_DATA.find(t => t.id === job.testimonialId) : null;

// //                   return (
// //                     <Card key={job.id}>
// //                       <CardContent className="p-6">
// //                         <div className="flex items-center justify-between mb-4">
// //                           <div className="flex items-center gap-3">
// //                             <div
// //                               className={`w-3 h-3 rounded-full ${
// //                                 job.status === "completed"
// //                                   ? "bg-green-500"
// //                                   : job.status === "processing" || job.status === "streaming"
// //                                   ? "bg-blue-500 animate-pulse"
// //                                   : job.status === "queued"
// //                                   ? "bg-yellow-500"
// //                                   : "bg-gray-400"
// //                               }`}
// //                             />
// //                             <div>
// //                               <h3 className="font-semibold text-gray-900">
// //                                 {service?.title}
// //                                 {testimonial ? ` - ${testimonial.customer_name}` : ` - ${job.testimonialIds?.length} testimonials`}
// //                               </h3>
// //                               <p className="text-sm text-gray-600">
// //                                 Started {job.startTime.toLocaleTimeString()}
// //                                 {job.isStreaming && <span className="ml-2 text-orange-600">• Streaming</span>}
// //                               </p>
// //                             </div>
// //                           </div>

// //                           <div className="flex items-center gap-2">
// //                             <Badge
// //                               className={`${
// //                                 job.status === "completed"
// //                                   ? "bg-green-100 text-green-800"
// //                                   : job.status === "processing" || job.status === "streaming"
// //                                   ? "bg-blue-100 text-blue-800"
// //                                   : job.status === "queued"
// //                                   ? "bg-yellow-100 text-yellow-800"
// //                                   : "bg-gray-100 text-gray-800"
// //                               }`}
// //                             >
// //                               {job.status}
// //                             </Badge>

// //                             <Button
// //                               variant="ghost"
// //                               size="sm"
// //                               onClick={() => deleteJob(job.id)}
// //                               className="h-8 w-8 p-0"
// //                             >
// //                               <Trash2 className="h-4 w-4" />
// //                             </Button>
// //                           </div>
// //                         </div>

// //                         {(job.status === "processing" || job.status === "streaming") && (
// //                           <div className="space-y-2 mb-4">
// //                             <Progress value={job.progress} className="h-2" />
// //                             <div className="flex justify-between text-sm text-gray-600">
// //                               <span>{Math.round(job.progress)}% complete</span>
// //                               <span>Est. {Math.max(1, Math.round((100 - job.progress) / 20))} min remaining</span>
// //                             </div>
// //                           </div>
// //                         )}

// //                         {job.status === "completed" && (
// //                           <div className="flex gap-3">
// //                             <Button variant="outline" size="sm">
// //                               <Download className="h-4 w-4 mr-2" />
// //                               Download
// //                             </Button>
// //                             <Button variant="outline" size="sm">
// //                               <Eye className="h-4 w-4 mr-2" />
// //                               Preview
// //                             </Button>
// //                             <Button variant="outline" size="sm">
// //                               <Share2 className="h-4 w-4 mr-2" />
// //                               Share
// //                             </Button>
// //                             <Button variant="outline" size="sm" onClick={() => retryJob(job.id)}>
// //                               <RotateCcw className="h-4 w-4 mr-2" />
// //                               Retry
// //                             </Button>
// //                           </div>
// //                         )}

// //                         {job.status === "queued" && (
// //                           <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
// //                             <Clock className="h-4 w-4 inline mr-2" />
// //                             Waiting in queue...
// //                           </div>
// //                         )}
// //                       </CardContent>
// //                     </Card>
// //                   );
// //                 })}
// //               </div>
// //             )}
// //           </TabsContent>
// //         </Tabs>
// //       </div>

// //       {/* Service Configuration Modal */}
// //       <ServiceConfigModal
// //         service={configModal.service}
// //         isOpen={configModal.isOpen}
// //         onClose={() => setConfigModal({ isOpen: false, service: null })}
// //         onProcess={handleConfigProcess}
// //         selectedTestimonials={selectedTestimonials}
// //       />

// //       {/* Toast Notifications */}
// //       <AnimatePresence>
// //         {toast && (
// //           <Toast
// //             message={toast.message}
// //             action={toast.action}
// //             onAction={toast.onAction}
// //             onClose={toast.onClose}
// //           />
// //         )}
// //       </AnimatePresence>
// //     </div>
// //   );
// // };

// // export default AIStudio;

// import React, { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Sparkles,
//   Video,
//   Scissors,
//   VolumeX,
//   FileText,
//   Languages,
//   Wand2,
//   Play,
//   Settings,
//   CheckCircle,
//   Clock,
//   AlertCircle,
//   X,
//   Monitor,
//   Mic,
//   Search,
//   Filter,
//   MoreVertical,
//   ArrowRight,
//   Download,
//   Share2,
//   Eye,
//   Pause,
//   ChevronDown,
//   ChevronRight,
//   Target,
//   Users,
//   Workflow,
//   Layers,
//   RefreshCw,
//   Zap,
//   Star,
//   Calendar,
//   Bell,
//   ExternalLink,
//   Trash2,
//   RotateCcw,
//   CheckSquare,
//   ArrowLeft,
//   Save,
//   Edit,
//   Copy,
//   Heart,
//   Bookmark,
//   Palette,
//   BarChart3,
//   Hash,
//   Shield,
//   Image,
//   Music,
// } from "lucide-react";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Progress } from "@/components/ui/progress";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Slider } from "@/components/ui/slider";

// // AI Services Configuration
// const AI_SERVICES = [
//   {
//     id: "enhancement",
//     title: "Video Enhancement",
//     description:
//       "Transform raw testimonials into professional-quality videos with AI-powered visual and audio improvements, including noise reduction, color grading, and brand integration.",
//     icon: Sparkles,
//     category: "video",
//     estimatedTime: "2-5 minutes",
//     complexity: "Beginner",
//     features: [
//       "4K Upscaling",
//       "Noise Reduction",
//       "Color Grading",
//       "Brand Integration",
//     ],
//     gradient: "from-purple-600 to-indigo-600",
//     isQueued: true,
//     defaultSettings: {
//       quality: "Professional",
//       colorEnhancement: true,
//       stabilization: true,
//       removeNoise: true,
//       addLogo: false,
//       logoUrl: "",
//       logoPosition: "bottom-right",
//       addWatermark: false,
//       watermarkText: "",
//       watermarkPosition: "bottom-right",
//     },
//   },
//   {
//     id: "story_mode",
//     title: "Story Mode",
//     description:
//       "Intelligently combine highlight moments into compelling narrative videos with custom intro/outro and seamless transitions between key moments.",
//     icon: Video,
//     category: "video",
//     estimatedTime: "3-7 minutes",
//     complexity: "Intermediate",
//     features: [
//       "Highlight Extraction",
//       "Smart Editing",
//       "Custom Branding",
//       "Voice Over",
//     ],
//     gradient: "from-blue-600 to-cyan-600",
//     isQueued: true,
//     defaultSettings: {
//       highlightType: "General",
//       addIntro: true,
//       addOutro: true,
//       backgroundMusic: false,
//       selectedMusic: "",
//       customMusicUrl: "",
//       transitionStyle: "Fade",
//       removeNoise: true,
//       addLogo: false,
//       logoUrl: "",
//       logoPosition: "bottom-right",
//       addWatermark: false,
//       watermarkText: "",
//       watermarkPosition: "bottom-right",
//       introImageUrl: "",
//       introVoicePrompt: "",
//       outroImageUrl: "",
//       outroVoicePrompt: "",
//     },
//   },
//   {
//     id: "clipping",
//     title: "Smart Clipping",
//     description:
//       "Generate multiple engaging clips automatically based on emotional highlights, perfect for social media distribution and marketing campaigns.",
//     icon: Scissors,
//     category: "video",
//     estimatedTime: "1-3 minutes",
//     complexity: "Beginner",
//     features: [
//       "Multi-Clip Generation",
//       "Emotional AI",
//       "Auto Branding",
//       "Social Ready",
//     ],
//     gradient: "from-emerald-600 to-teal-600",
//     isQueued: true,
//     defaultSettings: {
//       maxClips: 5,
//       clipDuration: "15 seconds",
//       addBranding: true,
//       includeSubtitles: true,
//       transitionType: "Fade",
//       removeNoise: true,
//       backgroundMusic: false,
//       selectedMusic: "",
//       customMusicUrl: "",
//       addLogo: false,
//       logoUrl: "",
//       logoPosition: "bottom-right",
//       addWatermark: false,
//       watermarkText: "",
//       watermarkPosition: "bottom-right",
//     },
//   },
//   {
//     id: "platform_optimizer",
//     title: "Platform Optimizer",
//     description:
//       "Optimize testimonials for specific social platforms with intelligent aspect ratio adjustment, captions, and content-aware cropping.",
//     icon: Monitor,
//     category: "optimization",
//     estimatedTime: "1-2 minutes",
//     complexity: "Beginner",
//     features: [
//       "Multi-Platform",
//       "Smart Cropping",
//       "Auto Captions",
//       "Platform Rules",
//     ],
//     gradient: "from-orange-600 to-red-600",
//     isQueued: true,
//     defaultSettings: {
//       platforms: ["instagram_reel", "youtube_short"],
//       contentAwareCropping: true,
//       addCaptions: true,
//       addHashtags: true,
//       audioEnhancement: false,
//       noiseLevel: "medium",
//       preserveVoice: true,
//       normalizeVolume: true,
//       backgroundMusic: false,
//       selectedMusic: "",
//       customMusicUrl: "",
//       addLogo: false,
//       logoUrl: "",
//       logoPosition: "bottom-right",
//       addWatermark: false,
//       watermarkText: "",
//       watermarkPosition: "bottom-right",
//     },
//   },
//   {
//     id: "noise_removal",
//     title: "Audio Enhancement",
//     description:
//       "Remove background noise and enhance audio quality while preserving natural voice characteristics using advanced AI algorithms.",
//     icon: VolumeX,
//     category: "audio",
//     estimatedTime: "30 seconds",
//     complexity: "Beginner",
//     features: [
//       "Noise Removal",
//       "Voice Enhancement",
//       "Audio Clarity",
//       "Volume Normalization",
//     ],
//     gradient: "from-indigo-600 to-purple-600",
//     isQueued: true,
//     defaultSettings: {
//       intensity: "medium",
//       preserveVoice: true,
//       enhanceClarity: true,
//       normalizeVolume: true,
//       outputFormat: "mp3",
//       removeEcho: false,
//       processingQuality: "standard",
//       spectralGating: false,
//     },
//   },
//   {
//     id: "content_generator",
//     title: "Content Generator",
//     description:
//       "Generate high-impact marketing content from testimonials including email campaigns, blog posts, case studies, and social media posts.",
//     icon: FileText,
//     category: "content",
//     estimatedTime: "30-60 seconds",
//     complexity: "Beginner",
//     features: [
//       "Multiple Formats",
//       "SEO Optimized",
//       "Brand Voice",
//       "Ready to Publish",
//     ],
//     gradient: "from-pink-600 to-rose-600",
//     isQueued: false,
//     defaultSettings: {
//       contentTypes: ["Email Campaign", "Blog Post"],
//       tone: "professional",
//       contentLength: "medium",
//       targetAudience: "potential customers",
//       autoSelectPositive: true,
//       includeMetrics: true,
//       seoOptimization: false,
//       includeCTA: true,
//       brandVoice: "",
//       customRequirements: "",
//       seoKeywords: "",
//       focusKeyword: "",
//     },
//   },
//   {
//     id: "text_polishing",
//     title: "Text Enhancement",
//     description:
//       "Polish and enhance written testimonials while maintaining authenticity and original voice, improving clarity and impact.",
//     icon: Wand2,
//     category: "content",
//     estimatedTime: "15 seconds",
//     complexity: "Beginner",
//     features: [
//       "Grammar Enhancement",
//       "Tone Optimization",
//       "Clarity Improvement",
//       "Authenticity Preservation",
//     ],
//     gradient: "from-violet-600 to-purple-600",
//     isQueued: false,
//     defaultSettings: {
//       preserveAuthenticity: true,
//       targetStyle: "professional",
//       grammarCorrection: true,
//       lengthOptimization: "maintain",
//     },
//   },
//   {
//     id: "translation",
//     title: "Translation",
//     description:
//       "Translate testimonials to multiple languages while preserving emotional tone and cultural context for global marketing reach.",
//     icon: Languages,
//     category: "content",
//     estimatedTime: "10-30 seconds",
//     complexity: "Beginner",
//     features: [
//       "60+ Languages",
//       "Tone Preservation",
//       "Cultural Adaptation",
//       "Native Quality",
//     ],
//     gradient: "from-teal-600 to-cyan-600",
//     isQueued: false,
//     defaultSettings: {
//       targetLanguages: ["Spanish", "French"],
//       preserveTone: true,
//       culturalAdaptation: true,
//       formalityLevel: "neutral",
//     },
//   },
//   {
//     id: "narration",
//     title: "AI Narration",
//     description:
//       "Convert text testimonials to professional audio narration using premium AI voices from ElevenLabs and OpenAI with customizable settings.",
//     icon: Mic,
//     category: "audio",
//     estimatedTime: "30-90 seconds",
//     complexity: "Intermediate",
//     features: [
//       "Premium AI Voices",
//       "Natural Speech",
//       "Custom Settings",
//       "Multiple Providers",
//     ],
//     gradient: "from-rose-600 to-pink-600",
//     isQueued: true,
//     defaultSettings: {
//       voiceProvider: "elevenlabs",
//       selectedVoice: "rachel",
//       speed: "1.0x",
//       emotion: "professional",
//       outputFormat: "mp3",
//       backgroundMusic: false,
//       selectedMusic: "",
//       customMusicUrl: "",
//       musicVolume: 15,
//       enhanceAudio: true,
//     },
//   },
// ];

// const TESTIMONIALS_DATA = [
//   {
//     id: "1",
//     customer_name: "Sarah Johnson",
//     company: "TechCorp Solutions",
//     content_preview:
//       "This product completely transformed our workflow and increased our team's productivity by 300%. The customer support is exceptional and the implementation was seamless.",
//     media_type: "video",
//     rating: 5,
//     duration: 120,
//     created_at: "2024-01-15",
//     sentiment_score: 0.95,
//     highlight_count: 4,
//     thumbnail:
//       "https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=100&h=100&fit=crop&crop=face",
//   },
//   {
//     id: "2",
//     customer_name: "Michael Chen",
//     company: "StartupX",
//     content_preview:
//       "Amazing results! Our conversion rates improved dramatically within the first month of using this solution. Highly recommend to any growing business.",
//     media_type: "text",
//     rating: 5,
//     created_at: "2024-01-10",
//     sentiment_score: 0.92,
//   },
//   {
//     id: "3",
//     customer_name: "Emily Davis",
//     company: "Enterprise Inc",
//     content_preview:
//       "Professional service and outstanding results. The ROI was immediate and substantial. This is exactly what we needed to scale our operations effectively.",
//     media_type: "video",
//     rating: 5,
//     duration: 180,
//     created_at: "2024-01-08",
//     sentiment_score: 0.98,
//     highlight_count: 6,
//     thumbnail:
//       "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
//   },
//   {
//     id: "4",
//     customer_name: "David Wilson",
//     company: "Global Dynamics",
//     content_preview:
//       "Game-changing technology that solved our biggest challenges. The team's expertise and support made all the difference in our success.",
//     media_type: "video",
//     rating: 4,
//     duration: 95,
//     created_at: "2024-01-05",
//     sentiment_score: 0.88,
//     highlight_count: 3,
//     thumbnail:
//       "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
//   },
// ];

// // Configuration data
// const backgroundMusicOptions = [
//   { id: "ambient-corporate", name: "Ambient Corporate" },
//   { id: "upbeat-modern", name: "Upbeat Modern" },
//   { id: "inspiring-piano", name: "Inspiring Piano" },
//   { id: "tech-minimal", name: "Tech Minimal" },
//   { id: "emotional-strings", name: "Emotional Strings" },
// ];

// const platforms = [
//   { id: "instagram_reel", name: "Instagram Reel", aspect: "9:16", icon: "📱" },
//   { id: "instagram_feed", name: "Instagram Feed", aspect: "1:1", icon: "📷" },
//   { id: "facebook_post", name: "Facebook Post", aspect: "16:9", icon: "📘" },
//   { id: "tiktok", name: "TikTok", aspect: "9:16", icon: "🎵" },
//   { id: "youtube_short", name: "YouTube Short", aspect: "9:16", icon: "📺" },
//   { id: "linkedin_video", name: "LinkedIn Video", aspect: "16:9", icon: "💼" },
//   { id: "twitter_video", name: "Twitter Video", aspect: "16:9", icon: "🐦" },
// ];

// const voices = {
//   elevenlabs: [
//     {
//       id: "rachel",
//       name: "Rachel",
//       accent: "American",
//       gender: "Female",
//       description: "Calm and professional",
//     },
//     {
//       id: "drew",
//       name: "Drew",
//       accent: "American",
//       gender: "Male",
//       description: "Confident and clear",
//     },
//     {
//       id: "clyde",
//       name: "Clyde",
//       accent: "American",
//       gender: "Male",
//       description: "Warm and friendly",
//     },
//     {
//       id: "paul",
//       name: "Paul",
//       accent: "American",
//       gender: "Male",
//       description: "Authoritative and strong",
//     },
//     {
//       id: "domi",
//       name: "Domi",
//       accent: "American",
//       gender: "Female",
//       description: "Young and vibrant",
//     },
//   ],
//   openai: [
//     {
//       id: "alloy",
//       name: "Alloy",
//       accent: "American",
//       gender: "Neutral",
//       description: "Balanced and versatile",
//     },
//     {
//       id: "echo",
//       name: "Echo",
//       accent: "American",
//       gender: "Male",
//       description: "Clear and resonant",
//     },
//     {
//       id: "fable",
//       name: "Fable",
//       accent: "British",
//       gender: "Female",
//       description: "Expressive and engaging",
//     },
//     {
//       id: "nova",
//       name: "Nova",
//       accent: "American",
//       gender: "Female",
//       description: "Bright and energetic",
//     },
//     {
//       id: "shimmer",
//       name: "Shimmer",
//       accent: "American",
//       gender: "Female",
//       description: "Soft and soothing",
//     },
//   ],
// };

// // Toast Notification Component
// const Toast = ({ message, action, onAction, onClose }) => (
//   <motion.div
//     initial={{ opacity: 0, y: 50, scale: 0.95 }}
//     animate={{ opacity: 1, y: 0, scale: 1 }}
//     exit={{ opacity: 0, y: 50, scale: 0.95 }}
//     className="fixed bottom-6 right-6 bg-white border shadow-lg rounded-lg p-4 max-w-md z-50"
//   >
//     <div className="flex items-start gap-3">
//       <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
//       <div className="flex-1">
//         <p className="text-sm font-medium text-gray-900">{message}</p>
//         {action && (
//           <Button
//             variant="link"
//             size="sm"
//             className="p-0 h-auto text-blue-600 font-medium"
//             onClick={onAction}
//           >
//             {action}
//           </Button>
//         )}
//       </div>
//       <Button
//         variant="ghost"
//         size="sm"
//         className="h-6 w-6 p-0"
//         onClick={onClose}
//       >
//         <X className="h-4 w-4" />
//       </Button>
//     </div>
//   </motion.div>
// );

// // Service Configuration Page Component
// const ServiceConfigPage = ({
//   service,
//   selectedTestimonials,
//   onBack,
//   onProcess,
//   savedPresets,
//   onSavePreset,
//   onDeletePreset,
//   onSetDefaultPreset,
//   defaultPreset,
// }) => {
//   const [config, setConfig] = useState(service?.defaultSettings || {});
//   const [presetName, setPresetName] = useState("");
//   const [showSavePreset, setShowSavePreset] = useState(false);
//   const [selectedPreset, setSelectedPreset] = useState(null);

//   useEffect(() => {
//     if (service && defaultPreset) {
//       setConfig(defaultPreset.config);
//     } else if (service) {
//       setConfig(service.defaultSettings || {});
//     }
//   }, [service, defaultPreset]);

//   const updateConfig = (key, value) => {
//     setConfig((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleSavePreset = () => {
//     if (presetName.trim()) {
//       onSavePreset(service.id, {
//         id: Date.now().toString(),
//         name: presetName.trim(),
//         config: { ...config },
//         createdAt: new Date(),
//       });
//       setPresetName("");
//       setShowSavePreset(false);
//     }
//   };

//   const handleLoadPreset = (preset) => {
//     setConfig(preset.config);
//     setSelectedPreset(preset);
//   };

//   const handleProcess = () => {
//     onProcess(service.id, config);
//   };

//   const renderConfigOptions = () => {
//     switch (service.id) {
//       case "enhancement":
//         return (
//           <div className="space-y-12">
//             {/* Quality & Processing Section */}
//             <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
//                   <Sparkles className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Quality & Processing
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure enhancement quality and visual improvements
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Enhancement Quality
//                     </Label>
//                     <Select
//                       value={config.quality}
//                       onValueChange={(value) => updateConfig("quality", value)}
//                     >
//                       <SelectTrigger className="h-12 text-base">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="Professional">
//                           <div className="py-2">
//                             <div className="font-semibold">Professional</div>
//                             <div className="text-sm text-gray-500">
//                               Highest quality, best results
//                             </div>
//                           </div>
//                         </SelectItem>
//                         <SelectItem value="High">
//                           <div className="py-2">
//                             <div className="font-semibold">High</div>
//                             <div className="text-sm text-gray-500">
//                               Great quality, faster processing
//                             </div>
//                           </div>
//                         </SelectItem>
//                         <SelectItem value="Standard">
//                           <div className="py-2">
//                             <div className="font-semibold">Standard</div>
//                             <div className="text-sm text-gray-500">
//                               Good quality, quickest processing
//                             </div>
//                           </div>
//                         </SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   {[
//                     {
//                       key: "colorEnhancement",
//                       label: "Color Enhancement",
//                       desc: "Professional color grading and correction",
//                       icon: Palette,
//                     },
//                     {
//                       key: "stabilization",
//                       label: "Video Stabilization",
//                       desc: "Smooth shaky footage automatically",
//                       icon: Monitor,
//                     },
//                     {
//                       key: "removeNoise",
//                       label: "Audio Enhancement",
//                       desc: "Remove background noise and improve clarity",
//                       icon: VolumeX,
//                     },
//                   ].map((option) => {
//                     const IconComponent = option.icon;
//                     return (
//                       <div
//                         key={option.key}
//                         className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-purple-300 transition-all"
//                       >
//                         <div className="flex items-center gap-4">
//                           <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
//                             <IconComponent className="h-5 w-5 text-gray-600" />
//                           </div>
//                           <div>
//                             <Label className="text-base font-semibold text-gray-900">
//                               {option.label}
//                             </Label>
//                             <p className="text-sm text-gray-600">
//                               {option.desc}
//                             </p>
//                           </div>
//                         </div>
//                         <Switch
//                           checked={config[option.key]}
//                           onCheckedChange={(checked) =>
//                             updateConfig(option.key, checked)
//                           }
//                           className="data-[state=checked]:bg-purple-600"
//                         />
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Branding Section */}
//             <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
//                   <img className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Branding & Identity
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Add your logo and watermark to enhance brand presence
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 {/* Logo Section */}
//                 <div className="space-y-6">
//                   <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
//                     <Label className="text-base font-semibold text-gray-900">
//                       Add Logo Overlay
//                     </Label>
//                     <Switch
//                       checked={config.addLogo}
//                       onCheckedChange={(checked) =>
//                         updateConfig("addLogo", checked)
//                       }
//                       className="data-[state=checked]:bg-blue-600"
//                     />
//                   </div>

//                   <AnimatePresence>
//                     {config.addLogo && (
//                       <motion.div
//                         initial={{ opacity: 0, height: 0 }}
//                         animate={{ opacity: 1, height: "auto" }}
//                         exit={{ opacity: 0, height: 0 }}
//                         className="space-y-4"
//                       >
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Logo URL
//                           </Label>
//                           <Input
//                             placeholder="https://example.com/logo.png"
//                             value={config.logoUrl || ""}
//                             onChange={(e) =>
//                               updateConfig("logoUrl", e.target.value)
//                             }
//                             className="h-12"
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Logo Position
//                           </Label>
//                           <div className="grid grid-cols-2 gap-2">
//                             {[
//                               { value: "top-left", label: "Top Left" },
//                               { value: "top-right", label: "Top Right" },
//                               { value: "bottom-left", label: "Bottom Left" },
//                               { value: "bottom-right", label: "Bottom Right" },
//                             ].map((position) => (
//                               <button
//                                 key={position.value}
//                                 className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
//                                   config.logoPosition === position.value
//                                     ? "border-blue-500 bg-blue-50 text-blue-700"
//                                     : "border-gray-200 hover:border-gray-300"
//                                 }`}
//                                 onClick={() =>
//                                   updateConfig("logoPosition", position.value)
//                                 }
//                               >
//                                 {position.label}
//                               </button>
//                             ))}
//                           </div>
//                         </div>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>

//                 {/* Watermark Section */}
//                 <div className="space-y-6">
//                   <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
//                     <Label className="text-base font-semibold text-gray-900">
//                       Add Watermark
//                     </Label>
//                     <Switch
//                       checked={config.addWatermark}
//                       onCheckedChange={(checked) =>
//                         updateConfig("addWatermark", checked)
//                       }
//                       className="data-[state=checked]:bg-blue-600"
//                     />
//                   </div>

//                   <AnimatePresence>
//                     {config.addWatermark && (
//                       <motion.div
//                         initial={{ opacity: 0, height: 0 }}
//                         animate={{ opacity: 1, height: "auto" }}
//                         exit={{ opacity: 0, height: 0 }}
//                         className="space-y-4"
//                       >
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Watermark Text
//                           </Label>
//                           <Input
//                             placeholder="Leave empty to use brand name"
//                             value={config.watermarkText || ""}
//                             onChange={(e) =>
//                               updateConfig("watermarkText", e.target.value)
//                             }
//                             className="h-12"
//                           />
//                           <p className="text-xs text-gray-500 mt-1">
//                             Leave empty to automatically use your brand name
//                           </p>
//                         </div>
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Watermark Position
//                           </Label>
//                           <div className="grid grid-cols-2 gap-2">
//                             {[
//                               { value: "top-left", label: "Top Left" },
//                               { value: "top-right", label: "Top Right" },
//                               { value: "bottom-left", label: "Bottom Left" },
//                               { value: "bottom-right", label: "Bottom Right" },
//                             ].map((position) => (
//                               <button
//                                 key={position.value}
//                                 className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
//                                   config.watermarkPosition === position.value
//                                     ? "border-blue-500 bg-blue-50 text-blue-700"
//                                     : "border-gray-200 hover:border-gray-300"
//                                 }`}
//                                 onClick={() =>
//                                   updateConfig(
//                                     "watermarkPosition",
//                                     position.value
//                                   )
//                                 }
//                               >
//                                 {position.label}
//                               </button>
//                             ))}
//                           </div>
//                         </div>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       case "story_mode":
//         return (
//           <div className="space-y-12">
//             {/* Story Configuration */}
//             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
//                   <Video className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Story Configuration
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure how your story video will be constructed
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Highlight Detection Type
//                     </Label>
//                     <Select
//                       value={config.highlightType}
//                       onValueChange={(value) =>
//                         updateConfig("highlightType", value)
//                       }
//                     >
//                       <SelectTrigger className="h-12 text-base">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {[
//                           {
//                             value: "General",
//                             label: "General Highlights",
//                             desc: "Overall compelling moments",
//                           },
//                           {
//                             value: "Emotional",
//                             label: "Emotional Highlights",
//                             desc: "Strong emotional impact moments",
//                           },
//                           {
//                             value: "Results",
//                             label: "Results & Metrics",
//                             desc: "Quantifiable outcomes",
//                           },
//                           {
//                             value: "Problem",
//                             label: "Problem/Solution",
//                             desc: "Challenge and resolution stories",
//                           },
//                           {
//                             value: "Recommendation",
//                             label: "Recommendations",
//                             desc: "Strong endorsements",
//                           },
//                         ].map((type) => (
//                           <SelectItem key={type.value} value={type.value}>
//                             <div className="py-2">
//                               <div className="font-semibold">{type.label}</div>
//                               <div className="text-sm text-gray-500">
//                                 {type.desc}
//                               </div>
//                             </div>
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Transition Style
//                     </Label>
//                     <div className="grid grid-cols-2 gap-3">
//                       {[
//                         {
//                           value: "Fade",
//                           label: "Smooth Fade",
//                           desc: "Gentle transitions",
//                         },
//                         {
//                           value: "Cut",
//                           label: "Quick Cut",
//                           desc: "Sharp cuts",
//                         },
//                         {
//                           value: "Slide",
//                           label: "Slide",
//                           desc: "Sliding motion",
//                         },
//                         {
//                           value: "Zoom",
//                           label: "Zoom Effect",
//                           desc: "Dynamic zoom",
//                         },
//                       ].map((style) => (
//                         <button
//                           key={style.value}
//                           className={`p-4 text-left rounded-xl border-2 transition-all ${
//                             config.transitionStyle === style.value
//                               ? "border-blue-500 bg-blue-50"
//                               : "border-gray-200 hover:border-gray-300"
//                           }`}
//                           onClick={() =>
//                             updateConfig("transitionStyle", style.value)
//                           }
//                         >
//                           <div className="font-medium text-sm">
//                             {style.label}
//                           </div>
//                           <div className="text-xs text-gray-500">
//                             {style.desc}
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   {[
//                     {
//                       key: "addIntro",
//                       label: "Add Intro Sequence",
//                       desc: "Custom introduction with your branding",
//                       icon: Play,
//                     },
//                     {
//                       key: "addOutro",
//                       label: "Add Outro Sequence",
//                       desc: "Professional closing with call-to-action",
//                       icon: CheckSquare,
//                     },
//                     {
//                       key: "removeNoise",
//                       label: "Audio Enhancement",
//                       desc: "Clean and professional audio",
//                       icon: VolumeX,
//                     },
//                     {
//                       key: "addLogo",
//                       label: "Logo Overlay",
//                       desc: "Brand logo throughout the video",
//                       icon: Image,
//                     },
//                   ].map((option) => {
//                     const IconComponent = option.icon;
//                     return (
//                       <div
//                         key={option.key}
//                         className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
//                       >
//                         <div className="flex items-center gap-4">
//                           <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
//                             <IconComponent className="h-5 w-5 text-gray-600" />
//                           </div>
//                           <div>
//                             <Label className="text-base font-semibold text-gray-900">
//                               {option.label}
//                             </Label>
//                             <p className="text-sm text-gray-600">
//                               {option.desc}
//                             </p>
//                           </div>
//                         </div>
//                         <Switch
//                           checked={config[option.key]}
//                           onCheckedChange={(checked) =>
//                             updateConfig(option.key, checked)
//                           }
//                           className="data-[state=checked]:bg-blue-600"
//                         />
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Intro/Outro Configuration */}
//             {(config.addIntro || config.addOutro) && (
//               <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
//                 <div className="flex items-center gap-3 mb-6">
//                   <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
//                     <Wand2 className="h-5 w-5 text-white" />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-bold text-gray-900">
//                       Intro & Outro Setup
//                     </h3>
//                     <p className="text-sm text-gray-600">
//                       Customize your video's opening and closing sequences
//                     </p>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                   {config.addIntro && (
//                     <div className="space-y-6">
//                       <h4 className="text-lg font-semibold text-purple-900">
//                         Intro Configuration
//                       </h4>
//                       <div className="space-y-4">
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Intro Background Image
//                           </Label>
//                           <Input
//                             placeholder="https://example.com/intro-background.jpg"
//                             value={config.introImageUrl || ""}
//                             onChange={(e) =>
//                               updateConfig("introImageUrl", e.target.value)
//                             }
//                             className="h-12"
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Voice Over Script
//                           </Label>
//                           <Textarea
//                             placeholder="Enter the script for intro voice over..."
//                             value={config.introVoicePrompt || ""}
//                             onChange={(e) =>
//                               updateConfig("introVoicePrompt", e.target.value)
//                             }
//                             rows={3}
//                             className="resize-none"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {config.addOutro && (
//                     <div className="space-y-6">
//                       <h4 className="text-lg font-semibold text-purple-900">
//                         Outro Configuration
//                       </h4>
//                       <div className="space-y-4">
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Outro Background Image
//                           </Label>
//                           <Input
//                             placeholder="https://example.com/outro-background.jpg"
//                             value={config.outroImageUrl || ""}
//                             onChange={(e) =>
//                               updateConfig("outroImageUrl", e.target.value)
//                             }
//                             className="h-12"
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Voice Over Script
//                           </Label>
//                           <Textarea
//                             placeholder="Enter the script for outro voice over..."
//                             value={config.outroVoicePrompt || ""}
//                             onChange={(e) =>
//                               updateConfig("outroVoicePrompt", e.target.value)
//                             }
//                             rows={3}
//                             className="resize-none"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Background Music */}
//             <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
//                   <Music className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Background Music
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Add atmospheric music to enhance your story
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-6">
//                 <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
//                   <Label className="text-base font-semibold text-gray-900">
//                     Enable Background Music
//                   </Label>
//                   <Switch
//                     checked={config.backgroundMusic}
//                     onCheckedChange={(checked) =>
//                       updateConfig("backgroundMusic", checked)
//                     }
//                     className="data-[state=checked]:bg-green-600"
//                   />
//                 </div>

//                 <AnimatePresence>
//                   {config.backgroundMusic && (
//                     <motion.div
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: "auto" }}
//                       exit={{ opacity: 0, height: 0 }}
//                       className="space-y-6"
//                     >
//                       <div>
//                         <Label className="text-base font-semibold text-gray-900 mb-4 block">
//                           Choose Music Track
//                         </Label>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                           {backgroundMusicOptions.map((music) => (
//                             <button
//                               key={music.id}
//                               className={`p-4 text-left rounded-xl border-2 transition-all ${
//                                 config.selectedMusic === music.id
//                                   ? "border-green-500 bg-green-50"
//                                   : "border-gray-200 hover:border-gray-300"
//                               }`}
//                               onClick={() =>
//                                 updateConfig("selectedMusic", music.id)
//                               }
//                             >
//                               <div className="flex items-center justify-between">
//                                 <span className="font-medium">
//                                   {music.name}
//                                 </span>
//                                 {config.selectedMusic === music.id && (
//                                   <CheckCircle className="h-5 w-5 text-green-600" />
//                                 )}
//                               </div>
//                             </button>
//                           ))}
//                         </div>
//                       </div>

//                       <div>
//                         <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                           Or Use Custom Music URL
//                         </Label>
//                         <Input
//                           placeholder="https://example.com/custom-music.mp3"
//                           value={config.customMusicUrl || ""}
//                           onChange={(e) =>
//                             updateConfig("customMusicUrl", e.target.value)
//                           }
//                           className="h-12"
//                         />
//                       </div>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </div>
//             </div>
//           </div>
//         );

//       case "platform_optimizer":
//         return (
//           <div className="space-y-12">
//             {/* Platform Selection */}
//             <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center">
//                   <Monitor className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Platform Selection
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Choose target platforms for optimization
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                 {platforms.map((platform) => (
//                   <motion.div
//                     key={platform.id}
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     <button
//                       className={`w-full p-6 rounded-2xl border-2 transition-all ${
//                         config.platforms?.includes(platform.id)
//                           ? "border-orange-500 bg-orange-100 shadow-lg"
//                           : "border-gray-200 hover:border-orange-300 bg-white hover:shadow-md"
//                       }`}
//                       onClick={() => {
//                         const currentPlatforms = config.platforms || [];
//                         if (currentPlatforms.includes(platform.id)) {
//                           updateConfig(
//                             "platforms",
//                             currentPlatforms.filter((p) => p !== platform.id)
//                           );
//                         } else {
//                           updateConfig("platforms", [
//                             ...currentPlatforms,
//                             platform.id,
//                           ]);
//                         }
//                       }}
//                     >
//                       <div className="text-center space-y-3">
//                         <div className="text-3xl">{platform.icon}</div>
//                         <div>
//                           <div className="font-semibold text-sm text-gray-900">
//                             {platform.name}
//                           </div>
//                           <div className="text-xs text-gray-600">
//                             {platform.aspect} aspect ratio
//                           </div>
//                         </div>
//                         {config.platforms?.includes(platform.id) && (
//                           <CheckCircle className="h-5 w-5 text-orange-600 mx-auto" />
//                         )}
//                       </div>
//                     </button>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>

//             {/* Optimization Settings */}
//             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
//                   <Settings className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Optimization Features
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure platform-specific enhancements
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {[
//                   {
//                     key: "contentAwareCropping",
//                     label: "Content-Aware Cropping",
//                     desc: "Smart subject detection and framing",
//                     icon: Target,
//                   },
//                   {
//                     key: "addCaptions",
//                     label: "Auto Captions",
//                     desc: "Platform-optimized subtitles",
//                     icon: FileText,
//                   },
//                   {
//                     key: "addHashtags",
//                     label: "Smart Hashtags",
//                     desc: "Platform-specific trending tags",
//                     icon: Hash,
//                   },
//                   {
//                     key: "audioEnhancement",
//                     label: "Audio Enhancement",
//                     desc: "Professional audio processing",
//                     icon: VolumeX,
//                   },
//                 ].map((option) => {
//                   const IconComponent = option.icon;
//                   return (
//                     <div
//                       key={option.key}
//                       className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
//                           <IconComponent className="h-6 w-6 text-gray-600" />
//                         </div>
//                         <div>
//                           <Label className="text-base font-semibold text-gray-900">
//                             {option.label}
//                           </Label>
//                           <p className="text-sm text-gray-600">{option.desc}</p>
//                         </div>
//                       </div>
//                       <Switch
//                         checked={config[option.key]}
//                         onCheckedChange={(checked) =>
//                           updateConfig(option.key, checked)
//                         }
//                         className="data-[state=checked]:bg-blue-600"
//                       />
//                     </div>
//                   );
//                 })}
//               </div>

//               <AnimatePresence>
//                 {config.audioEnhancement && (
//                   <motion.div
//                     initial={{ opacity: 0, height: 0 }}
//                     animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }}
//                     className="mt-8 p-6 bg-indigo-100 rounded-xl"
//                   >
//                     <h4 className="text-lg font-semibold text-indigo-900 mb-4">
//                       Audio Enhancement Settings
//                     </h4>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div>
//                         <Label className="text-sm font-medium text-indigo-800 mb-2 block">
//                           Noise Reduction Level
//                         </Label>
//                         <Select
//                           value={config.noiseLevel}
//                           onValueChange={(value) =>
//                             updateConfig("noiseLevel", value)
//                           }
//                         >
//                           <SelectTrigger>
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="light">Light</SelectItem>
//                             <SelectItem value="medium">
//                               Medium (Recommended)
//                             </SelectItem>
//                             <SelectItem value="aggressive">
//                               Aggressive
//                             </SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                       <div className="flex items-center justify-between p-3 bg-white rounded-lg">
//                         <Label className="text-sm font-medium text-gray-900">
//                           Preserve Voice
//                         </Label>
//                         <Switch
//                           checked={config.preserveVoice}
//                           onCheckedChange={(checked) =>
//                             updateConfig("preserveVoice", checked)
//                           }
//                         />
//                       </div>
//                       <div className="flex items-center justify-between p-3 bg-white rounded-lg">
//                         <Label className="text-sm font-medium text-gray-900">
//                           Normalize Volume
//                         </Label>
//                         <Switch
//                           checked={config.normalizeVolume}
//                           onCheckedChange={(checked) =>
//                             updateConfig("normalizeVolume", checked)
//                           }
//                         />
//                       </div>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           </div>
//         );

//       case "clipping":
//         return (
//           <div className="space-y-12">
//             {/* Clip Configuration */}
//             <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center">
//                   <Scissors className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Clip Settings
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure how clips will be generated and formatted
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Number of Clips
//                   </Label>
//                   <div className="grid grid-cols-2 gap-2">
//                     {[3, 5, 8, 10].map((num) => (
//                       <button
//                         key={num}
//                         className={`p-4 text-center rounded-xl border-2 transition-all ${
//                           config.maxClips === num
//                             ? "border-emerald-500 bg-emerald-50 text-emerald-700"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() => updateConfig("maxClips", num)}
//                       >
//                         <div className="text-xl font-bold">{num}</div>
//                         <div className="text-xs">clips</div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Clip Duration
//                   </Label>
//                   <div className="space-y-2">
//                     {[
//                       "10 seconds",
//                       "15 seconds",
//                       "30 seconds",
//                       "45 seconds",
//                       "60 seconds",
//                     ].map((duration) => (
//                       <button
//                         key={duration}
//                         className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
//                           config.clipDuration === duration
//                             ? "border-emerald-500 bg-emerald-50 text-emerald-700"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() => updateConfig("clipDuration", duration)}
//                       >
//                         {duration}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Transition Type
//                   </Label>
//                   <div className="space-y-2">
//                     {[
//                       { value: "Fade", desc: "Smooth fade" },
//                       { value: "Cut", desc: "Quick cut" },
//                       { value: "Slide", desc: "Slide effect" },
//                       { value: "Zoom", desc: "Zoom transition" },
//                       { value: "Dissolve", desc: "Dissolve effect" },
//                     ].map((transition) => (
//                       <button
//                         key={transition.value}
//                         className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
//                           config.transitionType === transition.value
//                             ? "border-emerald-500 bg-emerald-50 text-emerald-700"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() =>
//                           updateConfig("transitionType", transition.value)
//                         }
//                       >
//                         <div className="font-medium">{transition.value}</div>
//                         <div className="text-xs text-gray-500">
//                           {transition.desc}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Enhancement Options */}
//             <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
//                   <Sparkles className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Enhancement Options
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Add professional touches to your clips
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {[
//                   {
//                     key: "includeSubtitles",
//                     label: "Auto Subtitles",
//                     desc: "Generate captions for accessibility",
//                     icon: FileText,
//                   },
//                   {
//                     key: "removeNoise",
//                     label: "Audio Enhancement",
//                     desc: "Clean and professional audio",
//                     icon: VolumeX,
//                   },
//                   {
//                     key: "addLogo",
//                     label: "Logo Overlay",
//                     desc: "Brand logo on each clip",
//                     icon: Image,
//                   },
//                   {
//                     key: "addWatermark",
//                     label: "Watermark",
//                     desc: "Brand watermark protection",
//                     icon: Shield,
//                   },
//                 ].map((option) => {
//                   const IconComponent = option.icon;
//                   return (
//                     <div
//                       key={option.key}
//                       className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
//                           <IconComponent className="h-6 w-6 text-gray-600" />
//                         </div>
//                         <div>
//                           <Label className="text-base font-semibold text-gray-900">
//                             {option.label}
//                           </Label>
//                           <p className="text-sm text-gray-600">{option.desc}</p>
//                         </div>
//                       </div>
//                       <Switch
//                         checked={config[option.key]}
//                         onCheckedChange={(checked) =>
//                           updateConfig(option.key, checked)
//                         }
//                         className="data-[state=checked]:bg-blue-600"
//                       />
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         );

//       case "noise_removal":
//         return (
//           <div className="space-y-12">
//             {/* Audio Processing Settings */}
//             <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
//                   <VolumeX className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Audio Processing
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure noise removal and audio enhancement settings
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Noise Reduction Intensity
//                     </Label>
//                     <div className="space-y-3">
//                       {[
//                         {
//                           value: "light",
//                           label: "Light",
//                           desc: "Gentle noise reduction",
//                           color: "from-green-500 to-emerald-500",
//                         },
//                         {
//                           value: "medium",
//                           label: "Medium",
//                           desc: "Balanced cleaning (Recommended)",
//                           color: "from-blue-500 to-indigo-500",
//                         },
//                         {
//                           value: "aggressive",
//                           label: "Aggressive",
//                           desc: "Maximum noise removal",
//                           color: "from-red-500 to-pink-500",
//                         },
//                       ].map((intensity) => (
//                         <button
//                           key={intensity.value}
//                           className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
//                             config.intensity === intensity.value
//                               ? "border-indigo-500 bg-indigo-50"
//                               : "border-gray-200 hover:border-gray-300"
//                           }`}
//                           onClick={() =>
//                             updateConfig("intensity", intensity.value)
//                           }
//                         >
//                           <div className="flex items-center gap-4">
//                             <div
//                               className={`w-8 h-8 rounded-lg bg-gradient-to-r ${intensity.color}`}
//                             />
//                             <div>
//                               <div className="font-semibold">
//                                 {intensity.label}
//                               </div>
//                               <div className="text-sm text-gray-600">
//                                 {intensity.desc}
//                               </div>
//                             </div>
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   </div>

//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Output Format
//                     </Label>
//                     <div className="grid grid-cols-3 gap-3">
//                       {[
//                         { value: "mp3", label: "MP3", desc: "Compressed" },
//                         { value: "wav", label: "WAV", desc: "Lossless" },
//                         { value: "aac", label: "AAC", desc: "Balanced" },
//                       ].map((format) => (
//                         <button
//                           key={format.value}
//                           className={`p-4 text-center rounded-xl border-2 transition-all ${
//                             config.outputFormat === format.value
//                               ? "border-indigo-500 bg-indigo-50"
//                               : "border-gray-200 hover:border-gray-300"
//                           }`}
//                           onClick={() =>
//                             updateConfig("outputFormat", format.value)
//                           }
//                         >
//                           <div className="font-semibold">{format.label}</div>
//                           <div className="text-xs text-gray-500">
//                             {format.desc}
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   {[
//                     {
//                       key: "preserveVoice",
//                       label: "Preserve Voice Quality",
//                       desc: "Protect vocal clarity during processing",
//                       icon: Mic,
//                     },
//                     {
//                       key: "removeEcho",
//                       label: "Remove Echo",
//                       desc: "Eliminate reverb and echo effects",
//                       icon: RefreshCw,
//                     },
//                     {
//                       key: "enhanceClarity",
//                       label: "Enhance Speech Clarity",
//                       desc: "Improve voice intelligibility",
//                       icon: Sparkles,
//                     },
//                     {
//                       key: "normalizeVolume",
//                       label: "Normalize Volume",
//                       desc: "Consistent audio levels",
//                       icon: BarChart3,
//                     },
//                   ].map((option) => {
//                     const IconComponent = option.icon;
//                     return (
//                       <div
//                         key={option.key}
//                         className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 transition-all"
//                       >
//                         <div className="flex items-center gap-4">
//                           <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
//                             <IconComponent className="h-6 w-6 text-gray-600" />
//                           </div>
//                           <div>
//                             <Label className="text-base font-semibold text-gray-900">
//                               {option.label}
//                             </Label>
//                             <p className="text-sm text-gray-600">
//                               {option.desc}
//                             </p>
//                           </div>
//                         </div>
//                         <Switch
//                           checked={config[option.key]}
//                           onCheckedChange={(checked) =>
//                             updateConfig(option.key, checked)
//                           }
//                           className="data-[state=checked]:bg-indigo-600"
//                         />
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Advanced Processing */}
//             <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
//                   <Settings className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Advanced Processing
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Fine-tune audio processing algorithms
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Processing Quality
//                   </Label>
//                   <div className="space-y-2">
//                     {[
//                       {
//                         value: "standard",
//                         label: "Standard",
//                         desc: "Good quality, faster processing",
//                       },
//                       {
//                         value: "high",
//                         label: "High",
//                         desc: "Better quality, moderate speed",
//                       },
//                       {
//                         value: "professional",
//                         label: "Professional",
//                         desc: "Best quality, slower processing",
//                       },
//                     ].map((quality) => (
//                       <button
//                         key={quality.value}
//                         className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
//                           config.processingQuality === quality.value
//                             ? "border-purple-500 bg-purple-50"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() =>
//                           updateConfig("processingQuality", quality.value)
//                         }
//                       >
//                         <div className="font-semibold">{quality.label}</div>
//                         <div className="text-sm text-gray-600">
//                           {quality.desc}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200">
//                   <div>
//                     <Label className="text-base font-semibold text-gray-900">
//                       Spectral Gating
//                     </Label>
//                     <p className="text-sm text-gray-600">
//                       Advanced frequency-based noise reduction
//                     </p>
//                   </div>
//                   <Switch
//                     checked={config.spectralGating}
//                     onCheckedChange={(checked) =>
//                       updateConfig("spectralGating", checked)
//                     }
//                     className="data-[state=checked]:bg-purple-600"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       default:
//         return (
//           <div className="text-center py-12">
//             <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               Configuration Available
//             </h3>
//             <p className="text-gray-600">
//               Custom settings for {service.title} will be displayed here.
//             </p>
//           </div>
//         );
//     }
//   };

//   if (!service) return null;

//   const IconComponent = service.icon;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
//       {/* Header */}
//       <div className="bg-white border-b">
//         <div className="max-w-6xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <Button
//                 variant="ghost"
//                 onClick={onBack}
//                 className="flex items-center gap-2"
//               >
//                 <ArrowLeft className="h-4 w-4" />
//                 Back to Studio
//               </Button>
//               <div className="h-6 w-px bg-gray-300" />
//               <div className="flex items-center gap-3">
//                 <div
//                   className={`w-10 h-10 rounded-lg bg-gradient-to-r ${service.gradient} flex items-center justify-center`}
//                 >
//                   <IconComponent className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h1 className="text-xl font-semibold text-gray-900">
//                     {service.title} Configuration
//                   </h1>
//                   <p className="text-sm text-gray-600">
//                     Customize settings for {selectedTestimonials.length}{" "}
//                     testimonial{selectedTestimonials.length > 1 ? "s" : ""}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <Button
//                 variant="outline"
//                 onClick={() => setShowSavePreset(true)}
//                 className="flex items-center gap-2"
//               >
//                 <Save className="h-4 w-4" />
//                 Save Preset
//               </Button>
//               <Button
//                 onClick={handleProcess}
//                 className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
//               >
//                 <Play className="h-4 w-4" />
//                 Start Processing
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//           {/* Saved Presets Sidebar */}
//           <div className="lg:col-span-1">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Bookmark className="h-5 w-5" />
//                   Saved Presets
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {savedPresets.length === 0 ? (
//                   <div className="text-center py-6 text-gray-500">
//                     <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-30" />
//                     <p className="text-sm">No saved presets</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-2">
//                     {savedPresets.map((preset) => (
//                       <div
//                         key={preset.id}
//                         className={`p-3 border rounded-lg cursor-pointer transition-all ${
//                           selectedPreset?.id === preset.id
//                             ? "border-blue-500 bg-blue-50"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() => handleLoadPreset(preset)}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1 min-w-0">
//                             <h4 className="font-medium text-sm truncate">
//                               {preset.name}
//                             </h4>
//                             <p className="text-xs text-gray-500">
//                               {new Date(preset.createdAt).toLocaleDateString()}
//                             </p>
//                           </div>
//                           {defaultPreset?.id === preset.id && (
//                             <Heart className="h-4 w-4 text-red-500 fill-current" />
//                           )}
//                         </div>

//                         <div className="flex gap-1 mt-2">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               onSetDefaultPreset(service.id, preset);
//                             }}
//                             className="h-6 px-2 text-xs"
//                           >
//                             Make Default
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               onDeletePreset(service.id, preset.id);
//                             }}
//                             className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
//                           >
//                             <Trash2 className="h-3 w-3" />
//                           </Button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//           {/* Configuration Content */}
//           <div className="lg:col-span-3">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Configuration Settings</CardTitle>
//                 <p className="text-sm text-gray-600">{service.description}</p>
//               </CardHeader>
//               <CardContent>{renderConfigOptions()}</CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>

//       {/* Save Preset Modal */}
//       <AnimatePresence>
//         {showSavePreset && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.95 }}
//               className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
//             >
//               <h3 className="text-lg font-semibold mb-4">
//                 Save Configuration Preset
//               </h3>
//               <div className="space-y-4">
//                 <div>
//                   <Label className="text-sm font-medium">Preset Name</Label>
//                   <Input
//                     placeholder="Enter preset name..."
//                     value={presetName}
//                     onChange={(e) => setPresetName(e.target.value)}
//                     className="mt-1"
//                   />
//                 </div>
//                 <div className="flex gap-3">
//                   <Button
//                     variant="outline"
//                     onClick={() => {
//                       setShowSavePreset(false);
//                       setPresetName("");
//                     }}
//                     className="flex-1"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={handleSavePreset}
//                     disabled={!presetName.trim()}
//                     className="flex-1"
//                   >
//                     Save Preset
//                   </Button>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// const AIStudio = () => {
//   const [selectedTestimonials, setSelectedTestimonials] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterType, setFilterType] = useState("all");
//   const [activeTab, setActiveTab] = useState("testimonials");
//   const [processingJobs, setProcessingJobs] = useState([]);
//   const [showFilters, setShowFilters] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState("all");
//   const [toast, setToast] = useState(null);
//   const [currentConfigService, setCurrentConfigService] = useState(null);
//   const [savedPresets, setSavedPresets] = useState({});
//   const [defaultPresets, setDefaultPresets] = useState({});

//   // Filter testimonials
//   const filteredTestimonials = TESTIMONIALS_DATA.filter((testimonial) => {
//     const matchesSearch =
//       !searchTerm ||
//       testimonial.customer_name
//         ?.toLowerCase()
//         .includes(searchTerm.toLowerCase()) ||
//       testimonial.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       testimonial.content_preview
//         ?.toLowerCase()
//         .includes(searchTerm.toLowerCase());

//     const matchesFilter =
//       filterType === "all" ||
//       (filterType === "video" && testimonial.media_type === "video") ||
//       (filterType === "text" && testimonial.media_type === "text") ||
//       (filterType === "high_rating" && testimonial.rating >= 4) ||
//       (filterType === "high_sentiment" && testimonial.sentiment_score >= 0.9);

//     return matchesSearch && matchesFilter;
//   });

//   // Filter services
//   const filteredServices =
//     selectedCategory === "all"
//       ? AI_SERVICES
//       : AI_SERVICES.filter((service) => service.category === selectedCategory);

//   // Handle testimonial selection
//   const toggleTestimonialSelection = (testimonialId) => {
//     setSelectedTestimonials((prev) => {
//       if (prev.includes(testimonialId)) {
//         return prev.filter((id) => id !== testimonialId);
//       } else {
//         return [...prev, testimonialId];
//       }
//     });
//   };

//   const selectAllTestimonials = () => {
//     setSelectedTestimonials(filteredTestimonials.map((t) => t.id));
//   };

//   const clearSelection = () => {
//     setSelectedTestimonials([]);
//   };

//   // Handle processing
//   const handleProcessImmediate = (serviceId) => {
//     const service = AI_SERVICES.find((s) => s.id === serviceId);
//     const config = defaultPresets[serviceId]?.config || service.defaultSettings;
//     processService(serviceId, config);
//   };

//   const handleCustomizeProcess = (serviceId) => {
//     const service = AI_SERVICES.find((s) => s.id === serviceId);
//     setCurrentConfigService(service);
//   };

//   const processService = (serviceId, config) => {
//     const service = AI_SERVICES.find((s) => s.id === serviceId);

//     if (!service.isQueued) {
//       // Streaming services - go directly to monitor
//       setActiveTab("processing");
//       setCurrentConfigService(null);

//       // Create streaming job
//       const streamingJob = {
//         id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//         serviceId,
//         testimonialIds: selectedTestimonials,
//         status: "streaming",
//         progress: 0,
//         startTime: new Date(),
//         isStreaming: true,
//         config,
//       };

//       setProcessingJobs((prev) => [...prev, streamingJob]);

//       // Simulate streaming progress
//       const interval = setInterval(() => {
//         setProcessingJobs((prev) =>
//           prev.map((job) => {
//             if (job.id === streamingJob.id) {
//               const newProgress = Math.min(
//                 job.progress + Math.random() * 15,
//                 100
//               );
//               if (newProgress >= 100) {
//                 clearInterval(interval);
//                 return {
//                   ...job,
//                   progress: 100,
//                   status: "completed",
//                   endTime: new Date(),
//                 };
//               }
//               return { ...job, progress: newProgress };
//             }
//             return job;
//           })
//         );
//       }, 500);

//       return;
//     }

//     // Queued services
//     const newJobs = selectedTestimonials.map((testimonialId) => ({
//       id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       serviceId,
//       testimonialId,
//       status: "queued",
//       progress: 0,
//       startTime: new Date(),
//       config,
//     }));

//     setProcessingJobs((prev) => [...prev, ...newJobs]);
//     setCurrentConfigService(null);
//     setActiveTab("processing");

//     // Show toast notification
//     setToast({
//       message: `${newJobs.length} job${newJobs.length > 1 ? "s" : ""} added to queue. Estimated time: ${service.estimatedTime}`,
//       action: "View Progress",
//       onAction: () => {
//         setActiveTab("processing");
//         setToast(null);
//       },
//       onClose: () => setToast(null),
//     });

//     // Start processing after a delay
//     setTimeout(() => {
//       newJobs.forEach((job) => {
//         const interval = setInterval(() => {
//           setProcessingJobs((prev) =>
//             prev.map((j) => {
//               if (j.id === job.id) {
//                 if (j.status === "queued") {
//                   return { ...j, status: "processing" };
//                 }
//                 const newProgress = Math.min(
//                   j.progress + Math.random() * 10,
//                   100
//                 );
//                 if (newProgress >= 100) {
//                   clearInterval(interval);
//                   return {
//                     ...j,
//                     progress: 100,
//                     status: "completed",
//                     endTime: new Date(),
//                   };
//                 }
//                 return { ...j, progress: newProgress };
//               }
//               return j;
//             })
//           );
//         }, 1000);
//       });
//     }, 2000);
//   };

//   // Preset management
//   const handleSavePreset = (serviceId, preset) => {
//     setSavedPresets((prev) => ({
//       ...prev,
//       [serviceId]: [...(prev[serviceId] || []), preset],
//     }));
//   };

//   const handleDeletePreset = (serviceId, presetId) => {
//     setSavedPresets((prev) => ({
//       ...prev,
//       [serviceId]: (prev[serviceId] || []).filter((p) => p.id !== presetId),
//     }));
//   };

//   const handleSetDefaultPreset = (serviceId, preset) => {
//     setDefaultPresets((prev) => ({
//       ...prev,
//       [serviceId]: preset,
//     }));
//   };

//   const deleteJob = (jobId) => {
//     setProcessingJobs((prev) => prev.filter((job) => job.id !== jobId));
//   };

//   const retryJob = (jobId) => {
//     setProcessingJobs((prev) =>
//       prev.map((job) => {
//         if (job.id === jobId) {
//           return {
//             ...job,
//             status: "processing",
//             progress: 0,
//             startTime: new Date(),
//           };
//         }
//         return job;
//       })
//     );
//   };

//   const categories = [
//     { id: "all", label: "All Services" },
//     { id: "video", label: "Video" },
//     { id: "audio", label: "Audio" },
//     { id: "content", label: "Content" },
//     { id: "optimization", label: "Optimization" },
//   ];

//   // If in configuration mode, show the config page
//   if (currentConfigService) {
//     return (
//       <ServiceConfigPage
//         service={currentConfigService}
//         selectedTestimonials={selectedTestimonials}
//         onBack={() => setCurrentConfigService(null)}
//         onProcess={processService}
//         savedPresets={savedPresets[currentConfigService.id] || []}
//         onSavePreset={handleSavePreset}
//         onDeletePreset={handleDeletePreset}
//         onSetDefaultPreset={handleSetDefaultPreset}
//         defaultPreset={defaultPresets[currentConfigService.id]}
//       />
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
//       {/* Header */}
//       <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
//         <div className="max-w-7xl mx-auto px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center gap-4">
//               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
//                 <Sparkles className="h-6 w-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-xl font-bold text-gray-900">AI Studio</h1>
//                 <p className="text-sm text-gray-600">
//                   Transform testimonials with AI
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-4">
//               {selectedTestimonials.length > 0 && (
//                 <Badge className="bg-blue-100 text-blue-800">
//                   {selectedTestimonials.length} selected
//                 </Badge>
//               )}
//               {processingJobs.filter(
//                 (j) => j.status === "processing" || j.status === "streaming"
//               ).length > 0 && (
//                 <Badge className="bg-green-100 text-green-800">
//                   {
//                     processingJobs.filter(
//                       (j) =>
//                         j.status === "processing" || j.status === "streaming"
//                     ).length
//                   }{" "}
//                   processing
//                 </Badge>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
//         <Tabs
//           value={activeTab}
//           onValueChange={setActiveTab}
//           className="space-y-8"
//         >
//           <TabsList className="bg-white shadow-sm">
//             <TabsTrigger
//               value="testimonials"
//               className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
//             >
//               <Users className="h-4 w-4 mr-2" />
//               Select Testimonials
//             </TabsTrigger>
//             <TabsTrigger
//               value="services"
//               className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
//             >
//               <Workflow className="h-4 w-4 mr-2" />
//               AI Services
//             </TabsTrigger>
//             <TabsTrigger
//               value="processing"
//               className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
//             >
//               <Target className="h-4 w-4 mr-2" />
//               Processing Monitor
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="testimonials" className="space-y-6">
//             {/* Testimonials content - same as before */}
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900">
//                   Select Testimonials
//                 </h2>
//                 <p className="text-gray-600 mt-1">
//                   Choose testimonials to process with AI services
//                 </p>
//               </div>
//               <div className="flex items-center gap-3">
//                 <Button
//                   variant="outline"
//                   onClick={selectAllTestimonials}
//                   disabled={filteredTestimonials.length === 0}
//                 >
//                   Select All
//                 </Button>
//                 <Button
//                   variant="outline"
//                   onClick={clearSelection}
//                   disabled={selectedTestimonials.length === 0}
//                 >
//                   Clear All
//                 </Button>
//               </div>
//             </div>

//             {/* Search and Filters */}
//             <div className="space-y-4">
//               <div className="flex gap-4">
//                 <div className="relative flex-1">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                   <Input
//                     placeholder="Search testimonials..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-10"
//                   />
//                 </div>
//                 <Button
//                   variant="outline"
//                   onClick={() => setShowFilters(!showFilters)}
//                 >
//                   <Filter className="h-4 w-4 mr-2" />
//                   Filters
//                   {showFilters ? (
//                     <ChevronDown className="h-4 w-4 ml-2" />
//                   ) : (
//                     <ChevronRight className="h-4 w-4 ml-2" />
//                   )}
//                 </Button>
//               </div>

//               <AnimatePresence>
//                 {showFilters && (
//                   <motion.div
//                     initial={{ opacity: 0, height: 0 }}
//                     animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }}
//                     className="bg-white border rounded-lg p-4"
//                   >
//                     <Select value={filterType} onValueChange={setFilterType}>
//                       <SelectTrigger className="w-64">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All Types</SelectItem>
//                         <SelectItem value="video">Video Only</SelectItem>
//                         <SelectItem value="text">Text Only</SelectItem>
//                         <SelectItem value="high_rating">
//                           High Rating (4+)
//                         </SelectItem>
//                         <SelectItem value="high_sentiment">
//                           High Sentiment (90%+)
//                         </SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>

//             {/* Testimonials Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {filteredTestimonials.map((testimonial, index) => (
//                 <motion.div
//                   key={testimonial.id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.1 }}
//                 >
//                   <Card
//                     className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
//                       selectedTestimonials.includes(testimonial.id)
//                         ? "ring-2 ring-blue-500 bg-blue-50"
//                         : "hover:shadow-md"
//                     }`}
//                     onClick={() => toggleTestimonialSelection(testimonial.id)}
//                   >
//                     <CardContent className="p-6">
//                       <div className="flex items-start justify-between mb-4">
//                         <div className="flex items-center gap-3">
//                           {testimonial.thumbnail && (
//                             <img
//                               src={testimonial.thumbnail}
//                               alt={testimonial.customer_name}
//                               className="w-10 h-10 rounded-full object-cover"
//                             />
//                           )}
//                           <div>
//                             <h3 className="font-semibold text-gray-900">
//                               {testimonial.customer_name}
//                             </h3>
//                             <p className="text-sm text-gray-600">
//                               {testimonial.company}
//                             </p>
//                           </div>
//                         </div>
//                         {selectedTestimonials.includes(testimonial.id) && (
//                           <CheckCircle className="h-5 w-5 text-blue-600" />
//                         )}
//                       </div>

//                       <p className="text-sm text-gray-700 mb-4 line-clamp-3">
//                         {testimonial.content_preview}
//                       </p>

//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-4">
//                           {testimonial.media_type === "video" ? (
//                             <Badge
//                               variant="secondary"
//                               className="bg-purple-100 text-purple-700"
//                             >
//                               <Video className="h-3 w-3 mr-1" />
//                               Video
//                             </Badge>
//                           ) : (
//                             <Badge
//                               variant="secondary"
//                               className="bg-green-100 text-green-700"
//                             >
//                               <FileText className="h-3 w-3 mr-1" />
//                               Text
//                             </Badge>
//                           )}
//                           <div className="flex items-center gap-1">
//                             <Star className="h-4 w-4 text-yellow-500 fill-current" />
//                             <span className="text-sm font-medium">
//                               {testimonial.rating}
//                             </span>
//                           </div>
//                         </div>
//                         {testimonial.duration && (
//                           <span className="text-xs text-gray-500">
//                             {Math.round(testimonial.duration / 60)}m
//                           </span>
//                         )}
//                       </div>

//                       {testimonial.highlight_count && (
//                         <div className="mt-3 pt-3 border-t">
//                           <div className="flex items-center justify-between text-sm">
//                             <span className="text-gray-600">
//                               {testimonial.highlight_count} highlights detected
//                             </span>
//                             <span className="text-gray-600">
//                               {Math.round(testimonial.sentiment_score * 100)}%
//                               positive
//                             </span>
//                           </div>
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>
//                 </motion.div>
//               ))}
//             </div>

//             {filteredTestimonials.length === 0 && (
//               <div className="text-center py-12">
//                 <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">
//                   No testimonials found
//                 </h3>
//                 <p className="text-gray-600">
//                   Try adjusting your search or filter criteria
//                 </p>
//               </div>
//             )}
//           </TabsContent>

//           <TabsContent value="services" className="space-y-6">
//             {/* Header */}
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900">AI Services</h2>
//               <p className="text-gray-600 mt-1">
//                 Select the AI service to apply to your testimonials
//               </p>
//             </div>

//             {/* Category Filter */}
//             <div className="flex gap-2 overflow-x-auto">
//               {categories.map((category) => (
//                 <Button
//                   key={category.id}
//                   variant={
//                     selectedCategory === category.id ? "default" : "outline"
//                   }
//                   size="sm"
//                   onClick={() => setSelectedCategory(category.id)}
//                   className={`whitespace-nowrap ${
//                     selectedCategory === category.id
//                       ? "bg-blue-600 hover:bg-blue-700"
//                       : ""
//                   }`}
//                 >
//                   {category.label}
//                 </Button>
//               ))}
//             </div>

//             {/* Services Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {filteredServices.map((service, index) => {
//                 const IconComponent = service.icon;
//                 const defaultPreset = defaultPresets[service.id];
//                 const config = defaultPreset?.config || service.defaultSettings;

//                 return (
//                   <motion.div
//                     key={service.id}
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: index * 0.1 }}
//                   >
//                     <Card className="transition-all duration-200 hover:shadow-lg h-full">
//                       <CardContent className="p-6 h-full flex flex-col">
//                         <div className="flex items-start justify-between mb-4">
//                           <div
//                             className={`w-12 h-12 rounded-xl bg-gradient-to-r ${service.gradient} flex items-center justify-center shadow-lg`}
//                           >
//                             <IconComponent className="h-6 w-6 text-white" />
//                           </div>
//                           <div className="flex items-center gap-2">
//                             {!service.isQueued && (
//                               <Badge
//                                 variant="outline"
//                                 className="text-xs bg-orange-50 text-orange-700 border-orange-200"
//                               >
//                                 Instant
//                               </Badge>
//                             )}
//                             {defaultPreset && (
//                               <Badge
//                                 variant="outline"
//                                 className="text-xs bg-red-50 text-red-700 border-red-200"
//                               >
//                                 <Heart className="h-3 w-3 mr-1 fill-current" />
//                                 Default
//                               </Badge>
//                             )}
//                           </div>
//                         </div>

//                         <h3 className="text-lg font-bold text-gray-900 mb-2">
//                           {service.title}
//                         </h3>
//                         <p className="text-sm text-gray-600 mb-4 flex-1">
//                           {service.description}
//                         </p>

//                         <div className="space-y-3 mb-4">
//                           <div className="flex items-center justify-between text-sm">
//                             <span className="text-gray-500">
//                               Processing time:
//                             </span>
//                             <Badge variant="outline">
//                               {service.estimatedTime}
//                             </Badge>
//                           </div>
//                           <div className="flex items-center justify-between text-sm">
//                             <span className="text-gray-500">Complexity:</span>
//                             <Badge variant="outline">
//                               {service.complexity}
//                             </Badge>
//                           </div>
//                         </div>

//                         {/* Current Settings Display */}
//                         <div className="mb-4 p-3 bg-gray-50 rounded-lg">
//                           <div className="flex items-center justify-between mb-2">
//                             <h4 className="text-xs font-medium text-gray-700">
//                               Current Settings:
//                             </h4>
//                             {defaultPreset && (
//                               <span className="text-xs text-red-600 font-medium">
//                                 {defaultPreset.name}
//                               </span>
//                             )}
//                           </div>
//                           <div className="space-y-1">
//                             {Object.entries(config)
//                               .slice(0, 3)
//                               .map(([key, value]) => (
//                                 <div
//                                   key={key}
//                                   className="flex justify-between text-xs"
//                                 >
//                                   <span className="text-gray-600 capitalize">
//                                     {key
//                                       .replace(/([A-Z])/g, " $1")
//                                       .toLowerCase()}
//                                     :
//                                   </span>
//                                   <span className="text-gray-800 truncate ml-2">
//                                     {Array.isArray(value)
//                                       ? value.join(", ")
//                                       : String(value)}
//                                   </span>
//                                 </div>
//                               ))}
//                           </div>
//                         </div>

//                         <div className="space-y-2">
//                           <Button
//                             className="w-full bg-blue-600 hover:bg-blue-700"
//                             onClick={() => handleProcessImmediate(service.id)}
//                             disabled={selectedTestimonials.length === 0}
//                           >
//                             <Play className="h-4 w-4 mr-2" />
//                             Process Immediately
//                           </Button>
//                           <Button
//                             variant="outline"
//                             className="w-full"
//                             onClick={() => handleCustomizeProcess(service.id)}
//                             disabled={selectedTestimonials.length === 0}
//                           >
//                             <Settings className="h-4 w-4 mr-2" />
//                             Customize Processing
//                           </Button>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   </motion.div>
//                 );
//               })}
//             </div>

//             {selectedTestimonials.length === 0 && (
//               <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
//                 <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
//                 <h3 className="font-medium text-yellow-800">
//                   Select testimonials first
//                 </h3>
//                 <p className="text-sm text-yellow-700 mt-1">
//                   Choose testimonials from the previous tab to enable processing
//                 </p>
//               </div>
//             )}
//           </TabsContent>

//           <TabsContent value="processing" className="space-y-6">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900">
//                 Processing Monitor
//               </h2>
//               <p className="text-gray-600 mt-1">
//                 Track your AI processing jobs and download results
//               </p>
//             </div>

//             {processingJobs.length === 0 ? (
//               <Card>
//                 <CardContent className="text-center py-12">
//                   <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">
//                     No processing jobs
//                   </h3>
//                   <p className="text-gray-600">
//                     Start processing to see your jobs here
//                   </p>
//                 </CardContent>
//               </Card>
//             ) : (
//               <div className="space-y-4">
//                 {processingJobs.map((job) => {
//                   const service = AI_SERVICES.find(
//                     (s) => s.id === job.serviceId
//                   );
//                   const testimonial = job.testimonialId
//                     ? TESTIMONIALS_DATA.find((t) => t.id === job.testimonialId)
//                     : null;

//                   return (
//                     <Card key={job.id}>
//                       <CardContent className="p-6">
//                         <div className="flex items-center justify-between mb-4">
//                           <div className="flex items-center gap-3">
//                             <div
//                               className={`w-3 h-3 rounded-full ${
//                                 job.status === "completed"
//                                   ? "bg-green-500"
//                                   : job.status === "processing" ||
//                                       job.status === "streaming"
//                                     ? "bg-blue-500 animate-pulse"
//                                     : job.status === "queued"
//                                       ? "bg-yellow-500"
//                                       : "bg-gray-400"
//                               }`}
//                             />
//                             <div>
//                               <h3 className="font-semibold text-gray-900">
//                                 {service?.title}
//                                 {testimonial
//                                   ? ` - ${testimonial.customer_name}`
//                                   : ` - ${job.testimonialIds?.length} testimonials`}
//                               </h3>
//                               <p className="text-sm text-gray-600">
//                                 Started {job.startTime.toLocaleTimeString()}
//                                 {job.isStreaming && (
//                                   <span className="ml-2 text-orange-600">
//                                     • Streaming
//                                   </span>
//                                 )}
//                               </p>
//                             </div>
//                           </div>

//                           <div className="flex items-center gap-2">
//                             <Badge
//                               className={`${
//                                 job.status === "completed"
//                                   ? "bg-green-100 text-green-800"
//                                   : job.status === "processing" ||
//                                       job.status === "streaming"
//                                     ? "bg-blue-100 text-blue-800"
//                                     : job.status === "queued"
//                                       ? "bg-yellow-100 text-yellow-800"
//                                       : "bg-gray-100 text-gray-800"
//                               }`}
//                             >
//                               {job.status}
//                             </Badge>

//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => deleteJob(job.id)}
//                               className="h-8 w-8 p-0"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         </div>

//                         {(job.status === "processing" ||
//                           job.status === "streaming") && (
//                           <div className="space-y-2 mb-4">
//                             <Progress value={job.progress} className="h-2" />
//                             <div className="flex justify-between text-sm text-gray-600">
//                               <span>{Math.round(job.progress)}% complete</span>
//                               <span>
//                                 Est.{" "}
//                                 {Math.max(
//                                   1,
//                                   Math.round((100 - job.progress) / 20)
//                                 )}{" "}
//                                 min remaining
//                               </span>
//                             </div>
//                           </div>
//                         )}

//                         {job.status === "completed" && (
//                           <div className="flex gap-3">
//                             <Button variant="outline" size="sm">
//                               <Download className="h-4 w-4 mr-2" />
//                               Download
//                             </Button>
//                             <Button variant="outline" size="sm">
//                               <Eye className="h-4 w-4 mr-2" />
//                               Preview
//                             </Button>
//                             <Button variant="outline" size="sm">
//                               <Share2 className="h-4 w-4 mr-2" />
//                               Share
//                             </Button>
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               onClick={() => retryJob(job.id)}
//                             >
//                               <RotateCcw className="h-4 w-4 mr-2" />
//                               Retry
//                             </Button>
//                           </div>
//                         )}

//                         {job.status === "queued" && (
//                           <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
//                             <Clock className="h-4 w-4 inline mr-2" />
//                             Waiting in queue...
//                           </div>
//                         )}
//                       </CardContent>
//                     </Card>
//                   );
//                 })}
//               </div>
//             )}
//           </TabsContent>
//         </Tabs>
//       </div>

//       {/* Toast Notifications */}
//       <AnimatePresence>
//         {toast && (
//           <Toast
//             message={toast.message}
//             action={toast.action}
//             onAction={toast.onAction}
//             onClose={toast.onClose}
//           />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default AIStudio;
