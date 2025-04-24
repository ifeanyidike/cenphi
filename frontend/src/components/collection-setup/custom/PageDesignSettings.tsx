import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  LayoutTemplate,
  Check,
  Eye,
  Video,
  AudioLines,
  MessageSquare,
  ChevronRight,
  Laptop,
  Tablet,
  Smartphone,
  X,
  Sparkles,
  ArrowRight,
  Play,
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CollectionSettings, TestimonialFormat } from "@/types/setup";

// Types
interface PageTemplate {
  id: string;
  name: string;
  description: string;
  features: string[];
  popular: boolean;
  previewBackground?: string;
  supportedFormats: TestimonialFormat[];
}

interface TemplateSelectionProps {
  settings: CollectionSettings["custom"];
  onSettingsChange: (
    field: keyof CollectionSettings["custom"],
    value: any
  ) => void;
  onNestedSettingsChange: <
    U extends keyof CollectionSettings["custom"],
    F extends keyof NonNullable<CollectionSettings["custom"][U]>,
  >(
    parentField: U,
    field: F,
    value: NonNullable<CollectionSettings["custom"][U]>[F]
  ) => void;
  // onTemplateSelect: (templateId: string) => void;
  // onFormatsSelect: (formats: TestimonialFormat[]) => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      when: "beforeChildren",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

// Template definitions with modern aesthetics
const pageTemplates: PageTemplate[] = [
  {
    id: "modern-sleek",
    name: "Modern Sleek",
    description:
      "Premium minimalist design with focus on testimonial collection",
    features: [
      "Video Recording",
      "Audio Recording",
      "Text Testimonials",
      "Custom Branding",
    ],
    popular: true,
    previewBackground: "bg-gradient-to-br from-indigo-50 to-blue-100",
    supportedFormats: ["video", "audio", "text"],
  },
  {
    id: "testimonial-wall",
    name: "Testimonial Wall",
    description: "Showcase existing testimonials alongside collection form",
    features: [
      "Social Proof",
      "Video Recording",
      "Text Testimonials",
      "Customizable Layout",
    ],
    popular: false,
    previewBackground: "bg-gradient-to-br from-gray-50 to-gray-100",
    supportedFormats: ["video", "text"],
  },
  {
    id: "gradient-premium",
    name: "Gradient Premium",
    description: "Eye-catching gradients with contemporary design elements",
    features: [
      "Animated Gradients",
      "Video Recording",
      "Premium Feel",
      "Mobile Optimized",
    ],
    popular: true,
    previewBackground: "bg-gradient-to-br from-purple-50 to-indigo-100",
    supportedFormats: ["video", "audio", "text"],
  },
  {
    id: "minimal-focus",
    name: "Minimal Focus",
    description: "Distraction-free design focused on conversion and simplicity",
    features: [
      "High Conversion",
      "Quick Setup",
      "All Testimonial Types",
      "Clean Design",
    ],
    popular: false,
    previewBackground: "bg-gradient-to-br from-slate-50 to-slate-100",
    supportedFormats: ["video", "text"],
  },
  {
    id: "immersive-spotlight",
    name: "Immersive Spotlight",
    description: "Cinematic spotlights with interactive testimonial showcasing",
    features: [
      "Dynamic Animations",
      "Dark Theme",
      "Interactive Testimonials",
      "Spotlight Effects",
    ],
    popular: true,
    previewBackground: "bg-gradient-to-br from-zinc-900 to-slate-800",
    supportedFormats: ["video", "audio", "text"],
  },
  {
    id: "interactive-gallery",
    name: "Interactive Gallery",
    description:
      "Dynamic card-based layout with stunning hover effects and interactions",
    features: [
      "Interactive Cards",
      "Category Filtering",
      "Smooth Animations",
      "Live Preview",
    ],
    popular: true,
    previewBackground: "bg-gradient-to-br from-blue-50 to-cyan-100",
    supportedFormats: ["video", "audio", "text"],
  },
  {
    id: "video-showcase",
    name: "Video Showcase",
    description:
      "Professional video-first template with cinematic UI and seamless transitions",
    features: [
      "Cinematic Video UI",
      "Interactive Controls",
      "Seamless Transitions",
      "Video Testimonial Focus",
    ],
    popular: true,
    previewBackground: "bg-gradient-to-br from-gray-900 to-gray-800",
    supportedFormats: ["video"],
  },
  {
    id: "interactive-form",
    name: "Interactive Form",
    description:
      "Captivating multi-step form with real-time preview and interactive elements",
    features: [
      "Multi-step Form",
      "Real-time Preview",
      "Guided Experience",
      "Micro-interactions",
    ],
    popular: false,
    previewBackground: "bg-gradient-to-br from-emerald-50 to-teal-100",
    supportedFormats: ["video", "audio", "text"],
  },
];

// Testimonial format options with icons and descriptions
const testimonialFormats = [
  {
    id: "video" as TestimonialFormat,
    icon: <Video className="h-6 w-6" />,
    label: "Video Testimonials",
    description:
      "Allow customers to record video testimonials directly from your page",
    benefits: [
      "Highest engagement",
      "Personal connection",
      "Boosts credibility",
    ],
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "audio" as TestimonialFormat,
    icon: <AudioLines className="h-6 w-6" />,
    label: "Audio Testimonials",
    description: "Collect voice testimonials for customers who prefer audio",
    benefits: ["Easy to create", "Lower commitment", "Voice authenticity"],
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "text" as TestimonialFormat,
    icon: <MessageSquare className="h-6 w-6" />,
    label: "Text Testimonials",
    description: "Traditional written testimonials with optional images",
    benefits: ["Highest completion rate", "Quick to create", "Easy moderation"],
    color: "from-emerald-500 to-teal-600",
  },
];

// Testimonial Sample Data for Previews
interface TestimonialSample {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  rating: number;
  content: string;
  date: string;
  type: "video" | "audio" | "text";
  verified: boolean;
}

const testimonialSamples: TestimonialSample[] = [
  {
    id: "t1",
    name: "Alex Johnson",
    role: "Marketing Director",
    company: "TechCorp Inc",
    avatar: "",
    rating: 5,
    content:
      "This product completely transformed our workflow. The efficiency gains were immediate, and the support team was exceptional throughout the onboarding process.",
    date: "2 days ago",
    type: "video",
    verified: true,
  },
  {
    id: "t2",
    name: "Samantha Lee",
    role: "Product Manager",
    company: "Innovate Solutions",
    avatar: "",
    rating: 4,
    content:
      "Intuitive interface and powerful features. We've seen a 40% improvement in team collaboration since implementing this solution.",
    date: "1 week ago",
    type: "audio",
    verified: true,
  },
  {
    id: "t3",
    name: "Michael Chen",
    role: "Operations Lead",
    company: "Global Logistics",
    avatar: "",
    rating: 5,
    content:
      "The analytics capabilities alone made this worth the investment. We're now able to make data-driven decisions that have measurably improved our outcomes.",
    date: "2 weeks ago",
    type: "text",
    verified: true,
  },
  {
    id: "t4",
    name: "Rachel Torres",
    role: "CEO",
    company: "Startup Ventures",
    avatar: "",
    rating: 5,
    content:
      "As a growing startup, we needed a solution that would scale with us. This platform has exceeded our expectations in every way.",
    date: "1 month ago",
    type: "video",
    verified: true,
  },
];

// Template Preview Component
const TemplatePreview: React.FC<{ templateId: string; device?: string }> = ({
  templateId,
  // device = "desktop",
}) => {
  const [activeTab, setActiveTab] = useState<string>("collect");
  const [recordMode, setRecordMode] = useState<TestimonialFormat>("video");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [formStep, setFormStep] = useState<number>(1);

  const template = pageTemplates.find((t) => t.id === templateId);
  const isDark =
    templateId === "immersive-spotlight" || templateId === "video-showcase";

  // Handle record button click
  const handleRecordClick = () => {
    setIsRecording(!isRecording);
  };

  // Handle play button click
  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
  };

  // Set form step
  const nextStep = () => setFormStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setFormStep((prev) => Math.max(prev - 1, 1));

  // Get format icon
  const getFormatIcon = (format: TestimonialFormat) => {
    switch (format) {
      case "video":
        return (
          <Video
            className={cn(
              "w-full h-full p-1.5",
              isDark ? "text-blue-300" : "text-blue-500"
            )}
          />
        );
      case "audio":
        return (
          <AudioLines
            className={cn(
              "w-full h-full p-1.5",
              isDark ? "text-amber-300" : "text-amber-500"
            )}
          />
        );
      case "text":
        return (
          <MessageSquare
            className={cn(
              "w-full h-full p-1.5",
              isDark ? "text-emerald-300" : "text-emerald-500"
            )}
          />
        );
    }
  };

  // Get format background
  const getFormatBackground = (format: TestimonialFormat) => {
    switch (format) {
      case "video":
        return isDark ? "bg-blue-900/30" : "bg-blue-50";
      case "audio":
        return isDark ? "bg-amber-900/30" : "bg-amber-50";
      case "text":
        return isDark ? "bg-emerald-900/30" : "bg-emerald-50";
    }
  };

  // Modern Sleek Template
  if (templateId === "modern-sleek") {
    return (
      <div className="w-full h-full overflow-hidden rounded-lg shadow-lg transition-all duration-500 bg-white">
        <div className="relative h-full w-full flex flex-col">
          {/* Header */}
          <div className="p-4 flex justify-between items-center border-b border-gray-200">
            <div className="font-bold text-lg text-gray-800">BRAND</div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                <Star className="w-4 h-4 text-gray-500" />
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                <MessageSquare className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="p-4 border-b">
            <div className="max-w-md mx-auto flex rounded-lg overflow-hidden border divide-x">
              <button
                className={`flex-1 py-2 text-sm font-medium ${activeTab === "collect" ? "bg-blue-50 text-blue-600" : "bg-white text-gray-600"}`}
                onClick={() => setActiveTab("collect")}
              >
                Record Testimonial
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium ${activeTab === "view" ? "bg-blue-50 text-blue-600" : "bg-white text-gray-600"}`}
                onClick={() => setActiveTab("view")}
              >
                View Testimonials
              </button>
            </div>
          </div>

          {/* Collect Testimonial View */}
          {activeTab === "collect" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
              <div className="relative z-10 max-w-md w-full mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800">
                  Share Your Experience
                </h2>
                <p className="mb-6 text-sm md:text-base text-gray-600">
                  Help others by sharing your story with our product
                </p>

                {/* Testimonial type options */}
                <div className="flex justify-center gap-4 mb-8">
                  {template?.supportedFormats.map((format) => (
                    <motion.div
                      key={format}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex flex-col items-center cursor-pointer"
                      onClick={() => setRecordMode(format)}
                    >
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-transform",
                          recordMode === format
                            ? format === "video"
                              ? "bg-blue-100 ring-2 ring-blue-300"
                              : format === "audio"
                                ? "bg-amber-100 ring-2 ring-amber-300"
                                : "bg-emerald-100 ring-2 ring-emerald-300"
                            : "bg-gray-100"
                        )}
                      >
                        {format === "video" && (
                          <Video
                            className={`w-7 h-7 ${recordMode === format ? "text-blue-500" : "text-gray-500"}`}
                          />
                        )}
                        {format === "audio" && (
                          <AudioLines
                            className={`w-7 h-7 ${recordMode === format ? "text-amber-500" : "text-gray-500"}`}
                          />
                        )}
                        {format === "text" && (
                          <MessageSquare
                            className={`w-7 h-7 ${recordMode === format ? "text-emerald-500" : "text-gray-500"}`}
                          />
                        )}
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {format}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Video/Audio Recording Preview */}
                {(recordMode === "video" || recordMode === "audio") && (
                  <div
                    className={`mb-6 rounded-xl overflow-hidden shadow ${recordMode === "audio" ? "h-32 bg-gray-50" : "aspect-video bg-gray-100"}`}
                  >
                    {isRecording ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
                        <div className="absolute top-4 right-4 flex items-center gap-2 px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                          <span className="text-xs text-white font-medium">
                            Recording
                          </span>
                        </div>

                        {recordMode === "video" ? (
                          <img
                            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1494&q=80"
                            alt="Video preview"
                            className="w-full h-full object-cover opacity-80"
                          />
                        ) : (
                          <div className="flex flex-col items-center">
                            <AudioLines className="h-16 w-16 text-blue-500 animate-pulse" />
                            <div className="w-48 h-4 bg-gray-700 rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full animate-[expand_2s_ease-in-out_infinite]"
                                style={{ width: `${Math.random() * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-red-500 rounded-full p-3"
                          onClick={handleRecordClick}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="6"
                              y="6"
                              width="12"
                              height="12"
                              rx="2"
                              fill="currentColor"
                            />
                          </svg>
                        </motion.button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        {recordMode === "video" ? (
                          <Video className="h-12 w-12 text-gray-400 mb-2" />
                        ) : (
                          <AudioLines className="h-12 w-12 text-gray-400 mb-2" />
                        )}
                        <p className="text-sm text-gray-500 mb-4">
                          Click to start recording your {recordMode}
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`bg-blue-500 text-white rounded-full p-3`}
                          onClick={handleRecordClick}
                        >
                          <Play className="h-5 w-5 ml-0.5" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Testimonial */}
                {recordMode === "text" && (
                  <div className="space-y-4 text-left mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          placeholder="Your role"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Experience
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg h-24 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        placeholder="Share your experience with our product..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className="text-amber-400 hover:text-amber-500"
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 rounded-lg shadow-lg font-medium w-full md:w-auto bg-blue-600 text-white hover:bg-blue-700"
                >
                  {recordMode === "text"
                    ? "Submit Testimonial"
                    : isRecording
                      ? "Stop Recording"
                      : "Start Recording"}
                </motion.button>
              </div>
            </div>
          )}

          {/* View Testimonials */}
          {activeTab === "view" && (
            <div className="flex-1 p-6 overflow-auto">
              <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
                Recent Testimonials
              </h2>

              <div className="grid gap-4 max-w-4xl mx-auto">
                {testimonialSamples.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="bg-white rounded-lg border shadow-sm p-5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {testimonial.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="font-medium">{testimonial.name}</div>
                          <div className="text-sm text-gray-500">
                            {testimonial.role}, {testimonial.company}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${getFormatBackground(testimonial.type)}`}
                      >
                        {getFormatIcon(testimonial.type)}
                      </div>
                    </div>

                    <div className="mt-3 flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= testimonial.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>

                    {testimonial.type === "video" && (
                      <div className="mt-3 aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            className="w-12 h-12 rounded-full bg-blue-600/90 flex items-center justify-center text-white"
                            onClick={handlePlayClick}
                          >
                            <Play className="w-5 h-5 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {testimonial.type === "audio" && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <button className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                            <Play className="w-4 h-4 ml-0.5" />
                          </button>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: "30%" }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-500">
                            1:24
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="mt-3 text-gray-700">{testimonial.content}</p>

                    <div className="mt-4 pt-3 border-t flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {testimonial.date}
                      </div>
                      {testimonial.verified && (
                        <div className="flex items-center text-xs font-medium text-green-600">
                          <Check className="w-3.5 h-3.5 mr-1" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t p-4 text-center text-xs text-gray-500">
            All testimonials are reviewed before publishing
          </div>
        </div>
      </div>
    );
  }

  // Testimonial Wall Template
  if (templateId === "testimonial-wall") {
    return (
      <div className="w-full h-full overflow-hidden rounded-lg shadow-lg bg-white">
        <div className="h-full flex flex-col md:flex-row">
          {/* Left Side - Testimonial Wall */}
          <div className="w-full md:w-1/2 h-full md:h-auto bg-gray-50 border-r overflow-auto p-5">
            <div className="mb-6">
              <div className="font-bold text-xl text-gray-800">BRAND</div>
            </div>

            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              What others are saying
            </h2>

            <div className="space-y-4">
              {testimonialSamples.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white rounded-lg shadow-sm p-4 border"
                >
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-medium">{testimonial.name}</div>
                        <div className="text-xs text-gray-500">
                          {testimonial.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= testimonial.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-600">
                    {testimonial.content}
                  </p>

                  {testimonial.type === "video" && (
                    <div className="mt-3 p-2 bg-gray-50 rounded flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-500" />
                      <span className="text-xs">Video testimonial</span>
                      <button className="ml-auto text-xs text-blue-600 font-medium">
                        Watch
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Collection Form */}
          <div className="w-full md:w-1/2 h-full md:h-auto p-8 flex items-center justify-center">
            <div className="max-w-md w-full">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Share Your Experience
              </h2>
              <p className="mb-6 text-gray-600">
                Help others by sharing your story with our product
              </p>

              <div className="bg-white rounded-xl shadow border p-6 mb-6">
                <h3 className="font-medium text-gray-800 mb-4">
                  Choose testimonial type
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {template?.supportedFormats.map((format) => (
                    <motion.button
                      key={format}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                        recordMode === format
                          ? format === "video"
                            ? "border-blue-500 bg-blue-50"
                            : format === "audio"
                              ? "border-amber-500 bg-amber-50"
                              : "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setRecordMode(format)}
                    >
                      {format === "video" && (
                        <Video
                          className={`w-6 h-6 mb-2 ${recordMode === format ? "text-blue-600" : "text-gray-500"}`}
                        />
                      )}
                      {format === "audio" && (
                        <AudioLines
                          className={`w-6 h-6 mb-2 ${recordMode === format ? "text-amber-600" : "text-gray-500"}`}
                        />
                      )}
                      {format === "text" && (
                        <MessageSquare
                          className={`w-6 h-6 mb-2 ${recordMode === format ? "text-emerald-600" : "text-gray-500"}`}
                        />
                      )}
                      <span className="text-sm font-medium capitalize">
                        {format}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-lg shadow text-white font-medium bg-blue-600"
                >
                  Continue
                </motion.button>
              </div>

              <div className="text-center text-xs text-gray-500 flex justify-center items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 mr-1 text-gray-400"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  />
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m9 12 2 2 4-4"
                  />
                </svg>
                Your privacy is protected. Read our policy
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Immersive Spotlight Template
  if (templateId === "immersive-spotlight") {
    return (
      <div className="w-full h-full overflow-hidden rounded-lg shadow-lg bg-gray-900 text-white">
        <div className="relative h-full">
          {/* Animated background with spotlight effect */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: `radial-gradient(circle at 30% 40%, #6366f180, transparent 40%),
                          radial-gradient(circle at 70% 60%, #818cf880, transparent 40%)`,
            }}
          ></div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Header */}
            <div className="border-b border-white/10 p-4 flex justify-between items-center backdrop-blur-sm bg-black/20">
              <div className="font-bold text-xl">BRAND</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded-full text-sm bg-white/10 hover:bg-white/20">
                  Browse
                </button>
                <button className="px-3 py-1 rounded-full text-sm bg-blue-600 hover:bg-blue-700">
                  Share Yours
                </button>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column - Content */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                <div className="text-blue-400 text-sm uppercase tracking-widest font-medium mb-2">
                  Customer Stories
                </div>

                <h1 className="text-4xl font-bold mb-4">
                  Share Your Experience
                </h1>

                <p className="text-white/70 mb-8">
                  Help others by sharing your story with our product. Join
                  thousands of satisfied customers.
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  {template?.supportedFormats.map((format) => (
                    <motion.button
                      key={format}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium ${
                        recordMode === format
                          ? format === "video"
                            ? "bg-blue-600 text-white"
                            : format === "audio"
                              ? "bg-amber-600 text-white"
                              : "bg-emerald-600 text-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                      onClick={() => setRecordMode(format)}
                    >
                      {format === "video" && <Video className="w-4 h-4" />}
                      {format === "audio" && <AudioLines className="w-4 h-4" />}
                      {format === "text" && (
                        <MessageSquare className="w-4 h-4" />
                      )}
                      <span className="capitalize">{format}</span>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-auto pt-6 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center text-xs text-white font-bold"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-white/70">
                    Join <span className="text-white font-medium">2,500+</span>{" "}
                    customers who shared their story
                  </div>
                </div>
              </div>

              {/* Right Column - Active Testimonial */}
              <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
                <div className="w-full max-w-md">
                  <div className="relative">
                    <div
                      className="absolute inset-0 blur-xl rounded-xl"
                      style={{
                        background: `radial-gradient(circle at center, #6366f180, transparent 70%)`,
                      }}
                    ></div>

                    <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg font-bold text-blue-400">
                          JD
                        </div>
                        <div>
                          <div className="font-medium text-lg">Jane Doe</div>
                          <div className="text-white/60 text-sm">
                            Marketing Director, Acme Inc
                          </div>
                          <div className="flex mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="w-4 h-4 text-amber-400 fill-amber-400"
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-lg italic mb-4 text-white/90">
                        "This product completely transformed our customer
                        feedback process. We were struggling with collecting
                        authentic stories from our users, and this solution made
                        it incredibly simple."
                      </div>

                      <div className="flex justify-between items-center mt-6 border-t border-white/20 pt-4">
                        <div className="flex gap-2">
                          <button className="p-2 rounded-full hover:bg-white/10">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12h14"></path>
                              <path d="m12 5 7 7-7 7"></path>
                            </svg>
                          </button>
                          <button className="p-2 rounded-full hover:bg-white/10">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M19 12H5"></path>
                              <path d="m12 19-7-7 7-7"></path>
                            </svg>
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button className="p-2 rounded-full hover:bg-white/10">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                              <polyline points="16 6 12 2 8 6"></polyline>
                              <line x1="12" y1="2" x2="12" y2="15"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-1 mt-6">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-2 rounded-full transition-all ${i === 0 ? "w-6 bg-blue-400" : "w-2 bg-white/30"}`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4 flex justify-between items-center bg-black/20 backdrop-blur-sm">
              <div className="text-white/60 text-sm">
                All testimonials are verified
              </div>
              <div className="flex items-center gap-4 text-white/60">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interactive Form Template
  if (templateId === "interactive-form") {
    return (
      <div className="w-full h-full overflow-hidden rounded-lg shadow-lg bg-white">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b px-6 py-4 flex justify-between items-center">
            <div className="font-bold text-xl text-gray-800">BRAND</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-800">
                Help
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-auto p-6">
            <div className="max-w-2xl mx-auto w-full">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-3 text-gray-800">
                  Share Your Experience
                </h1>
                <p className="text-gray-600">
                  Help others by sharing your story with our product
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="mb-10">
                <div className="flex justify-between mb-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                        step === formStep
                          ? "text-white bg-blue-600"
                          : step < formStep
                            ? "text-white bg-blue-500"
                            : "text-gray-400 bg-gray-100"
                      }`}
                    >
                      {step < formStep ? <Check className="w-5 h-5" /> : step}
                    </div>
                  ))}
                </div>

                <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${(formStep / 3) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Form Steps */}
              <div className="bg-white rounded-xl border shadow-sm p-8">
                {/* Step 1 - Info */}
                {formStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold mb-4">
                      Your Information
                    </h2>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value="Alex Johnson"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                          </label>
                          <input
                            type="text"
                            value="Marketing Director"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          value="Acme Inc"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value="alex@example.com"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2 - Rating */}
                {formStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold mb-6">
                      How would you rate your experience?
                    </h2>

                    <div className="flex justify-center gap-3 py-6">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <motion.button
                          key={value}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`w-14 h-14 rounded-lg flex items-center justify-center text-lg font-medium transition-all ${
                            value <= 5
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-400"
                          }`}
                          style={{
                            transform: value === 5 ? "scale(1.1)" : "scale(1)",
                          }}
                        >
                          {value}
                        </motion.button>
                      ))}
                    </div>

                    <div className="flex justify-between text-sm text-gray-500 px-3">
                      <span>Not satisfied</span>
                      <span>Very satisfied</span>
                    </div>
                  </motion.div>
                )}

                {/* Step 3 - Testimonial */}
                {formStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold mb-4">
                      Share your experience
                    </h2>

                    <div className="mb-6">
                      <div className="flex gap-4 mb-6">
                        {template?.supportedFormats.map((format) => (
                          <motion.button
                            key={format}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 py-3 px-4 rounded-lg flex flex-col items-center gap-2 ${
                              recordMode === format
                                ? format === "video"
                                  ? "bg-blue-50 border-2 border-blue-500"
                                  : format === "audio"
                                    ? "bg-amber-50 border-2 border-amber-500"
                                    : "bg-emerald-50 border-2 border-emerald-500"
                                : "bg-gray-50 border border-gray-200"
                            }`}
                            onClick={() => setRecordMode(format)}
                          >
                            {format === "video" && (
                              <Video
                                className={`w-5 h-5 ${recordMode === format ? "text-blue-600" : "text-gray-500"}`}
                              />
                            )}
                            {format === "audio" && (
                              <AudioLines
                                className={`w-5 h-5 ${recordMode === format ? "text-amber-600" : "text-gray-500"}`}
                              />
                            )}
                            {format === "text" && (
                              <MessageSquare
                                className={`w-5 h-5 ${recordMode === format ? "text-emerald-600" : "text-gray-500"}`}
                              />
                            )}
                            <span className="text-sm font-medium capitalize">
                              {format}
                            </span>
                          </motion.button>
                        ))}
                      </div>

                      {recordMode === "text" && (
                        <textarea
                          className="w-full px-4 py-3 border rounded-lg h-32"
                          placeholder="Tell us about your experience with our product..."
                        ></textarea>
                      )}

                      {recordMode === "video" && (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          <button className="p-5 rounded-full bg-blue-600 text-white">
                            <Video className="w-6 h-6" />
                          </button>
                        </div>
                      )}

                      {recordMode === "audio" && (
                        <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                          <button className="p-5 rounded-full bg-amber-500 text-white">
                            <AudioLines className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Form Navigation */}
                <div className="pt-6 flex justify-between">
                  <button
                    className={`px-6 py-2 rounded-lg border hover:bg-gray-50 ${formStep === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={prevStep}
                    disabled={formStep === 1}
                  >
                    Back
                  </button>

                  <button
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    onClick={formStep < 3 ? nextStep : () => {}}
                  >
                    {formStep < 3 ? "Continue" : "Submit Testimonial"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Video Showcase Template
  if (templateId === "video-showcase") {
    return (
      <div className="w-full h-full overflow-hidden rounded-lg shadow-lg bg-gray-900 text-white">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-black/30">
            <div className="font-bold text-xl">BRAND</div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-1.5 rounded-full text-sm bg-white/10 hover:bg-white/20">
                Browse
              </button>
              <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700">
                Record Testimonial
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col md:flex-row">
            {/* Left Sidebar - Video List */}
            <div className="w-full md:w-64 border-r border-white/10 bg-black/20 backdrop-blur-md p-4 overflow-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3">Featured Stories</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search testimonials..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm placeholder-white/50"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-2 flex gap-3 cursor-pointer ${i === 1 ? "bg-white/20" : "hover:bg-white/10"}`}
                  >
                    <div className="relative w-20 h-12 flex-shrink-0 rounded overflow-hidden bg-black/60">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {i === 1 ? (
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: i === 1 ? "75%" : "0%" }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {i % 2 === 0
                          ? "Product Experience"
                          : "Customer Success"}
                      </div>
                      <div className="text-xs text-white/60 flex items-center gap-1">
                        <span>John D.</span>
                        <span>•</span>
                        <span>2:34</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium mb-3 text-white/70">
                  Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600">
                    Product
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10">
                    Service
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10">
                    Support
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Video Player */}
            <div className="flex-1 flex flex-col">
              {/* Video Player */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-60"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80')`,
                    filter: "brightness(0.6)",
                  }}
                ></div>

                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2 border-white/30 backdrop-blur-sm bg-black/30 cursor-pointer"
                    onClick={handlePlayClick}
                  >
                    <Play className="w-10 h-10 text-white ml-1" />
                  </motion.div>

                  <div className="text-lg font-medium">Watch Testimonial</div>
                </div>

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-4">
                    <button className="text-white/80 hover:text-white">
                      <Play className="w-5 h-5" />
                    </button>

                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm">0:45</span>
                      <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: "35%" }}
                        ></div>
                      </div>
                      <span className="text-sm">2:34</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="text-white/80 hover:text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        </svg>
                      </button>
                      <button className="text-white/80 hover:text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M23 12a11 11 0 0 1-22 0 11 11 0 0 1 22 0z"></path>
                          <path d="M8 12h8"></path>
                        </svg>
                      </button>
                      <button className="text-white/80 hover:text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M15 3h6v6"></path>
                          <path d="M9 21H3v-6"></path>
                          <path d="M21 3l-7 7"></path>
                          <path d="M3 21l7-7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Details */}
              <div className="p-6 flex-1 overflow-auto">
                <div className="max-w-3xl">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        Transformed Our Customer Experience
                      </h2>
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600">
                          Product
                        </div>
                        <span className="text-white/60">2:34</span>
                        <span className="text-white/60">•</span>
                        <span className="text-white/60">423 views</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                          <polyline points="16 6 12 2 8 6"></polyline>
                          <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                      </button>
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 border-t border-b border-white/10 py-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-blue-400">
                      JD
                    </div>
                    <div>
                      <div className="font-medium">John Doe</div>
                      <div className="text-sm text-white/60">CTO, Acme Inc</div>
                    </div>
                  </div>

                  <div className="text-white/90">
                    <p className="mb-4">
                      "This testimonial platform completely transformed our
                      customer feedback process. We were struggling with
                      collecting authentic stories from our users, and this
                      solution made it incredibly simple. The video testimonials
                      have been particularly powerful for our marketing
                      campaigns."
                    </p>
                    <p>
                      "Implementation was seamless, and the customer support has
                      been exceptional. We've seen a 40% increase in conversion
                      rates since featuring these testimonials on our landing
                      pages. I would highly recommend this to any business
                      looking to showcase real customer experiences."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 backdrop-blur-md bg-black/30 py-4 px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Ready to share your story?
                </h3>
                <p className="text-white/70 text-sm">
                  Help others by sharing your experience with our product
                </p>
              </div>

              <div className="flex gap-3">
                <button className="px-4 py-2.5 rounded-lg text-white font-medium flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <Video className="w-4 h-4" />
                  <span>Record Video</span>
                </button>

                <button className="px-4 py-2.5 rounded-lg flex items-center gap-2 bg-white/10 hover:bg-white/20">
                  <MessageSquare className="w-4 h-4" />
                  <span>Write Testimonial</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback for any other template
  return (
    <div
      className={cn(
        "w-full h-full overflow-hidden rounded-lg shadow-lg transition-all duration-500",
        template?.previewBackground || "bg-white"
      )}
    >
      <div className="relative h-full w-full flex flex-col">
        {/* Header */}
        <div
          className={cn(
            "p-4 flex justify-between items-center border-b",
            isDark ? "border-white/10" : "border-gray-200"
          )}
        >
          <div
            className={cn(
              "font-bold text-lg",
              isDark ? "text-white" : "text-gray-800"
            )}
          >
            BRAND
          </div>
          <div className="flex gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isDark ? "bg-white/10" : "bg-gray-100"
              )}
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  isDark ? "text-white/70" : "text-gray-500"
                )}
              />
            </div>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isDark ? "bg-white/10" : "bg-gray-100"
              )}
            >
              <MessageSquare
                className={cn(
                  "w-4 h-4",
                  isDark ? "text-white/70" : "text-gray-500"
                )}
              />
            </div>
          </div>
        </div>

        {/* Content - Different for each template */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 overflow-hidden">
          {/* Content specific to template */}
          <div className="relative z-10 max-w-md w-full mx-auto text-center">
            <h2
              className={cn(
                "text-2xl md:text-3xl font-bold mb-3",
                isDark ? "text-white" : "text-gray-800"
              )}
            >
              Share Your Experience
            </h2>
            <p
              className={cn(
                "mb-6 text-sm md:text-base",
                isDark ? "text-white/70" : "text-gray-600"
              )}
            >
              Help others by sharing your story with our product
            </p>

            {/* Testimonial type options */}
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {template?.supportedFormats.includes("video") && (
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-transform hover:scale-110",
                      isDark ? "bg-white/10" : "bg-blue-50"
                    )}
                  >
                    <Video
                      className={cn(
                        "w-6 h-6",
                        isDark ? "text-blue-300" : "text-blue-500"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      isDark ? "text-white/80" : "text-gray-700"
                    )}
                  >
                    Video
                  </span>
                </div>
              )}

              {template?.supportedFormats.includes("audio") && (
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-transform hover:scale-110",
                      isDark ? "bg-white/10" : "bg-amber-50"
                    )}
                  >
                    <AudioLines
                      className={cn(
                        "w-6 h-6",
                        isDark ? "text-amber-300" : "text-amber-500"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      isDark ? "text-white/80" : "text-gray-700"
                    )}
                  >
                    Audio
                  </span>
                </div>
              )}

              {template?.supportedFormats.includes("text") && (
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-transform hover:scale-110",
                      isDark ? "bg-white/10" : "bg-emerald-50"
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "w-6 h-6",
                        isDark ? "text-emerald-300" : "text-emerald-500"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      isDark ? "text-white/80" : "text-gray-700"
                    )}
                  >
                    Text
                  </span>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "px-6 py-3 rounded-lg shadow-lg font-medium w-full md:w-auto",
                isDark
                  ? "bg-white text-gray-800 hover:bg-white/90"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              Get Started
            </motion.button>
          </div>
        </div>

        {/* Footer - only show on certain templates */}
        {["modern-sleek", "testimonial-wall", "interactive-gallery"].includes(
          templateId
        ) && (
          <div
            className={cn(
              "border-t p-4 text-center text-xs",
              isDark
                ? "border-white/10 text-white/50"
                : "border-gray-200 text-gray-500"
            )}
          >
            All testimonials are reviewed before publishing
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const TestimonialTemplateSelector: React.FC<TemplateSelectionProps> = ({
  // settings,
  // onNestedSettingsChange,
  onSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<string>("templates");
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("modern-sleek");
  const [selectedFormats, setSelectedFormats] = useState<TestimonialFormat[]>([
    "video",
    "text",
  ]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<string>("desktop");

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // onTemplateSelect(templateId);

    // Auto-select formats based on template support
    const template = pageTemplates.find((t) => t.id === templateId);
    if (template) {
      const formats = template.supportedFormats;
      setSelectedFormats(formats);
      // onFormatsSelect(formats);
      onSettingsChange("formats", formats);
    }
  };

  // Handle format toggle
  const handleFormatToggle = (format: TestimonialFormat) => {
    // Check if selected template supports this format
    const template = pageTemplates.find((t) => t.id === selectedTemplate);
    if (!template?.supportedFormats.includes(format)) return;

    // Toggle format
    const newFormats = selectedFormats.includes(format)
      ? selectedFormats.filter((f) => f !== format)
      : [...selectedFormats, format];

    // Ensure at least one format is selected
    if (newFormats.length > 0) {
      setSelectedFormats(newFormats);
      onSettingsChange("formats", newFormats);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-6xl mx-auto"
    >
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Testimonial Collection
          </h2>
          <p className="text-sm text-gray-500">
            Choose a template and testimonial formats for your collection page
          </p>
        </div>

        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowPreview(true)}
        >
          <Eye className="w-4 h-4" />
          <span>Preview Template</span>
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-lg grid grid-cols-2 mb-6 w-full max-w-md mx-auto">
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5"
          >
            <LayoutTemplate className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger
            value="formats"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5"
          >
            <Video className="h-4 w-4" />
            <span>Testimonial Formats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 pb-8 pt-8">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <LayoutTemplate className="h-5 w-5 text-blue-600" />
                  <span>Select Your Template</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="-mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                  {pageTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      className={cn(
                        "border-2 rounded-xl overflow-hidden cursor-pointer transition-all shadow-md hover:shadow-xl",
                        selectedTemplate === template.id
                          ? "border-blue-500 ring-4 ring-blue-100"
                          : "border-transparent hover:border-gray-200"
                      )}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <div className="absolute inset-0 scale-[0.85] origin-top rounded-t-lg overflow-hidden shadow-xl transition-transform duration-300 hover:scale-[0.90]">
                          <TemplatePreview templateId={template.id} />
                        </div>
                      </div>

                      <div className="p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                              {template.name}
                              {template.popular && (
                                <Badge className="ml-2 bg-gradient-to-r from-amber-200 to-amber-300 text-amber-800 hover:from-amber-200 hover:to-amber-300 border-0">
                                  Popular
                                </Badge>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          </div>

                          {selectedTemplate === template.id && (
                            <div className="bg-blue-500 text-white p-1 rounded-full">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>

                        <Separator className="my-3" />

                        <div className="mt-2 flex flex-wrap gap-2">
                          {template.supportedFormats.map((format) => {
                            const formatInfo = testimonialFormats.find(
                              (f) => f.id === format
                            );
                            return (
                              <div
                                key={format}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                              >
                                {formatInfo?.icon &&
                                  React.cloneElement(
                                    formatInfo.icon,
                                    { className: "h-3 w-3" }
                                  )}
                                {format}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="border-t flex justify-between py-6 bg-gradient-to-r from-slate-50 to-gray-100">
                <div className="flex items-center text-sm text-blue-600">
                  <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                  {
                    pageTemplates.find((t) => t.id === selectedTemplate)?.name
                  }{" "}
                  selected
                </div>

                <Button
                  className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md"
                  onClick={() => setActiveTab("formats")}
                >
                  <span>Continue to Formats</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="formats" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 pb-8 pt-8">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Video className="h-5 w-5 text-blue-600" />
                  <span>Select Testimonial Formats</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="-mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2">
                  {testimonialFormats.map((format) => {
                    const template = pageTemplates.find(
                      (t) => t.id === selectedTemplate
                    );
                    const isSupported = template?.supportedFormats.includes(
                      format.id
                    );
                    const isSelected = selectedFormats.includes(format.id);

                    return (
                      <motion.div
                        key={format.id}
                        //@ts-expect-error ignore variant error
                        variants={pulseVariants}
                        animate={isSelected ? "pulse" : ""}
                        className={cn(
                          "rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
                          isSupported
                            ? isSelected
                              ? "ring-4 ring-blue-100 shadow-lg"
                              : "border-2 border-gray-200 shadow hover:shadow-md"
                            : "border-2 border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed shadow-none"
                        )}
                        onClick={() =>
                          isSupported && handleFormatToggle(format.id)
                        }
                      >
                        <div
                          className="h-3 bg-gradient-to-r w-full"
                          style={{
                            backgroundImage: isSupported
                              ? `linear-gradient(to right, ${isSelected ? "rgb(59 130 246)" : "rgb(229 231 235)"}, ${isSelected ? "rgb(79 70 229)" : "rgb(209 213 219)"})`
                              : "linear-gradient(to right, rgb(229 231 235), rgb(209 213 219))",
                          }}
                        ></div>

                        <div className="p-6 relative">
                          {isSelected && (
                            <div className="absolute top-4 right-4 bg-blue-500 text-white p-1 rounded-full">
                              <Check className="h-4 w-4" />
                            </div>
                          )}

                          {!isSupported && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                              <div className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                Not supported by selected template
                              </div>
                            </div>
                          )}

                          <div
                            className={cn(
                              "inline-flex items-center justify-center w-12 h-12 rounded-full mb-4",
                              isSelected
                                ? `bg-gradient-to-r ${format.color} text-white`
                                : "bg-gray-100 text-gray-500"
                            )}
                          >
                            {format.icon}
                          </div>

                          <h3 className="text-lg font-semibold mb-2 text-gray-800">
                            {format.label}
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">
                            {format.description}
                          </p>

                          <div className="space-y-2">
                            {format.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <div
                                  className={cn(
                                    "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                                    isSelected
                                      ? "bg-blue-100 text-blue-600"
                                      : "bg-gray-100 text-gray-400"
                                  )}
                                >
                                  <Check className="w-3 h-3" />
                                </div>
                                <span className="text-sm text-gray-600">
                                  {benefit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-10 flex flex-col items-center justify-center text-center p-6 bg-blue-50 rounded-xl">
                  <Zap className="h-8 w-8 text-blue-500 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Selected Template & Formats
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You've chosen the{" "}
                    <span className="font-semibold text-blue-600">
                      {
                        pageTemplates.find((t) => t.id === selectedTemplate)
                          ?.name
                      }
                    </span>{" "}
                    template with{" "}
                    {selectedFormats.length === 1
                      ? "this format"
                      : "these formats"}
                    :
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {selectedFormats.map((format) => {
                      const formatInfo = testimonialFormats.find(
                        (f) => f.id === format
                      );
                      return (
                        <Badge
                          key={format}
                          className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 shadow-sm"
                        >
                          {formatInfo?.icon &&
                            React.cloneElement(
                              formatInfo.icon, { className: "h-3.5 w-3.5 mr-1.5" }
                            )}
                          {formatInfo?.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t flex justify-between py-6 bg-gradient-to-r from-slate-50 to-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("templates")}
                  className="gap-2"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  <span>Back to Templates</span>
                </Button>

                <Button
                  className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview Configuration</span>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 rounded-2xl border-0 shadow-2xl">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-gray-50 to-slate-100">
              <DialogTitle className="flex items-center gap-2 text-gray-900">
                <Eye className="h-5 w-5 text-blue-600" />
                Template Preview:{" "}
                {pageTemplates.find((t) => t.id === selectedTemplate)?.name}
              </DialogTitle>

              <div className="flex items-center gap-2">
                <div className="border rounded-lg p-1 flex">
                  <Button
                    variant={
                      previewDevice === "desktop" ? "secondary" : "ghost"
                    }
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setPreviewDevice("desktop")}
                  >
                    <Laptop className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewDevice === "tablet" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setPreviewDevice("tablet")}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setPreviewDevice("mobile")}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-gray-100 p-6 overflow-auto">
              <div
                className={cn(
                  "mx-auto shadow-2xl transition-all duration-300 overflow-hidden rounded-xl",
                  previewDevice === "desktop"
                    ? "max-w-6xl"
                    : previewDevice === "tablet"
                      ? "max-w-2xl"
                      : "max-w-sm"
                )}
                style={{
                  height: previewDevice === "mobile" ? "800px" : "650px",
                }}
              >
                <TemplatePreview
                  templateId={selectedTemplate}
                  device={previewDevice}
                />
              </div>
            </div>

            <div className="p-5 border-t bg-gradient-to-r from-gray-50 to-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className="bg-white/80 border-blue-200 text-blue-700 px-3 py-1.5"
                >
                  {pageTemplates.find((t) => t.id === selectedTemplate)?.name}
                </Badge>

                <div className="flex gap-1">
                  {selectedFormats.map((format) => {
                    const formatColor =
                      format === "video"
                        ? "bg-blue-100 text-blue-700"
                        : format === "audio"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700";
                    return (
                      <Badge
                        key={format}
                        className={`px-2 py-1 ${formatColor}`}
                      >
                        {format}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close Preview
                </Button>

                <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700">
                  <ArrowRight className="h-4 w-4" />
                  <span>Save Configuration</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TestimonialTemplateSelector;
