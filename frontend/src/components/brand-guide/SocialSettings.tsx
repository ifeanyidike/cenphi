import { FC, useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";
import { motion } from "framer-motion";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Icons
import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  X,
  User,
  AtSign,
  MessageSquareQuote,
  Smartphone,
  Globe,
  EyeIcon,
  ChevronRight,
  MessageCircle,
  Heart,
  CornerDownRight,
  Clock,
  CheckCircle2,
  LightbulbIcon,
  Zap,
} from "lucide-react";

import { getInitials } from "@/utils/utils";
import { SocialPlatformName } from "@/types/setup";

// Type definitions
interface SocialPlatformType {
  id: string;
  name: string;
  icon: any; // React component
  color: string;
  gradient: string;
  characterLimit?: number;
  hashtagSupport: boolean;
  mentionSupport: boolean;
}

const SocialSettings: FC = () => {
  const store = brandGuideStore;
  const { brandData } = store;

  const [activeTab, setActiveTab] = useState<string>("request");
  const [activePlatform, setActivePlatform] =
    useState<SocialPlatformName>("twitter");
  const [charCount, setCharCount] = useState<number>(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [showAiIdeas, setShowAiIdeas] = useState<boolean>(false);
  const [activeIdea, setActiveIdea] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize social settings if they don't exist
  useEffect(() => {
    if (!brandData.voice?.channels?.social) {
      store.updateBrandData(["voice", "channels", "social"], {
        platforms: {
          twitter: {
            requestTemplate:
              "We value your feedback! How has your experience been with {{brand}}? Share your thoughts in a reply and help others discover us. #CustomerFeedback",
            thankYouTemplate:
              "Thank you @{{username}} for sharing your experience with {{brand}}! We appreciate your feedback and support. #CustomerLove",
            followupTemplate:
              "Hi @{{username}}, we noticed you recently had an experience with {{brand}}. We'd love to hear your thoughts when you have a moment!",
          },
          linkedin: {
            requestTemplate:
              "We value your professional opinion! How has your experience been with {{brand}}? Your insights would be invaluable to us and our network.",
            thankYouTemplate:
              "Thank you {{name}} for taking the time to share your experience with {{brand}}! Your professional insights are greatly appreciated.",
            followupTemplate:
              "Hello {{name}}, we noticed you recently engaged with {{brand}}. We'd value your professional perspective when you have a moment to share.",
          },
          facebook: {
            requestTemplate:
              "We'd love to hear about your experience with {{brand}}! Drop a comment below or send us a message with your feedback.",
            thankYouTemplate:
              "Thank you {{name}} for sharing your experience with {{brand}}! We truly value your feedback and support.",
            followupTemplate:
              "Hi {{name}}, we noticed you recently experienced {{brand}}. We'd love to hear your thoughts when you have a moment!",
          },
          instagram: {
            requestTemplate:
              "We'd love to hear your story! How has {{brand}} impacted you? Share in the comments or DM us your experience. ✨ #ShareYourStory",
            thankYouTemplate:
              "Thank you @{{username}} for sharing your amazing experience with {{brand}}! We're so glad to have you in our community. ❤️ #CustomerLove",
            followupTemplate:
              "Hi @{{username}}! We noticed you've been using {{brand}} - we'd love to hear your thoughts! Drop us a comment or DM when you have a moment. ✨",
          },
        },
      });
    }
  }, [brandData.voice?.channels?.social, store]);

  // Social platforms configuration
  const platforms: SocialPlatformType[] = [
    {
      id: "twitter",
      name: "Twitter",
      icon: Twitter,
      color: "text-blue-500 dark:text-blue-400",
      gradient: "from-blue-500 to-sky-400",
      characterLimit: 280,
      hashtagSupport: true,
      mentionSupport: true,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-600 dark:text-blue-500",
      gradient: "from-blue-600 to-indigo-500",
      hashtagSupport: true,
      mentionSupport: true,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-700 dark:text-blue-600",
      gradient: "from-blue-700 to-blue-600",
      hashtagSupport: true,
      mentionSupport: true,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      color: "text-pink-600 dark:text-pink-500",
      gradient: "from-pink-600 to-purple-500",
      hashtagSupport: true,
      mentionSupport: true,
    },
  ];

  // Get current platform
  const getCurrentPlatform = (): SocialPlatformType => {
    return platforms.find((p) => p.id === activePlatform) || platforms[0];
  };

  // Get template value
  const getTemplateValue = (
    type: string,
    platform: SocialPlatformName = activePlatform
  ): string => {
    if (
      brandData.voice?.channels?.social?.platforms &&
      brandData.voice.channels.social.platforms[platform] &&
      brandData.voice.channels.social.platforms[platform][
        `${type}Template` as "requestTemplate" | "thankYouTemplate"
      ]
    ) {
      return brandData.voice.channels.social.platforms[platform][
        `${type}Template` as "requestTemplate" | "thankYouTemplate"
      ];
    }
    return "";
  };

  // Update template
  const updateTemplate = (
    type: string,
    value: string,
    platform: string = activePlatform
  ) => {
    store.updateBrandData(
      ["voice", "channels", "social", "platforms", platform, `${type}Template`],
      value
    );

    // Update character count
    if (platforms.find((p) => p.id === platform)?.characterLimit) {
      setCharCount(value.length);
    }
  };

  // Format template preview
  const formatPreviewText = (text: string): string => {
    return text
      .replace(/{{name}}/g, "Alex Thompson")
      .replace(/{{username}}/g, "alexthompson")
      .replace(/{{brand}}/g, brandData.name || "YourBrand")
      .replace(/{{product}}/g, "Premium Plan");
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // AI template suggestions
  const getTemplateSuggestions = () => {
    const platform = getCurrentPlatform().id as SocialPlatformName;
    const messageType = activeTab as
      | "requestTemplate"
      | "followupTemplate"
      | "thankYouTemplate";

    const suggestions: Partial<
      Record<
        SocialPlatformName,
        Record<
          "requestTemplate" | "thankYouTemplate" | "followupTemplate",
          string[]
        >
      >
    > = {
      twitter: {
        requestTemplate: [
          "How has your experience been with {{brand}}? We'd love to hear your thoughts! Reply with your feedback and help others discover us. #CustomerFeedback",
          "Enjoying {{brand}}? We'd love to know what you think! Share your experience in a reply to help us improve and guide others. #Testimonials",
          "Your opinion matters! Had a great experience with {{brand}}? We'd love if you'd share your thoughts in a reply! #CustomerReviews",
        ],
        thankYouTemplate: [
          "Thank you @{{username}} for sharing your experience with {{brand}}! We're thrilled you're enjoying it. Your feedback means the world to us! #CustomerLove",
          "We appreciate your kind words about {{brand}}, @{{username}}! Feedback like yours helps us continue to improve. Thanks for being an amazing customer! 💙",
          "This made our day, @{{username}}! Thank you for taking the time to share your experience with {{brand}}. We're so glad you're enjoying it! #HappyCustomers",
        ],
        followupTemplate: [
          "Hi @{{username}}, we noticed you recently experienced {{brand}}. We'd love to hear your thoughts when you have a moment! Your feedback helps us improve.",
          "Just checking in, @{{username}}! We'd love to hear about your experience with {{brand}}. A quick reply with your thoughts would be greatly appreciated!",
          "Your opinion matters to us, @{{username}}! If you've been using {{brand}}, we'd love to hear what you think. Mind sharing your experience?",
        ],
      },
      facebook: {
        requestTemplate: [
          "We love hearing from our customers! How has your experience been with {{brand}}? Drop a comment below or send us a message with your feedback.",
          "Your opinion helps us grow! If you've used {{brand}}, we'd love to hear your thoughts. Share your experience in the comments below!",
          "Have you tried {{brand}}? We'd love to know what you think! Leave a comment with your experience to help others make informed decisions.",
        ],
        thankYouTemplate: [
          "Thank you {{name}} for sharing your experience with {{brand}}! Stories like yours truly inspire our community. We appreciate you taking the time to share.",
          "We're thrilled you're enjoying {{brand}}, {{name}}! Thank you for your wonderful feedback - it means so much to our team to hear from happy customers.",
          "What a wonderful review, {{name}}! Thank you for sharing your experience with {{brand}}. We're grateful for customers like you who take the time to provide feedback.",
        ],
        followupTemplate: [
          "Hi {{name}}, we wanted to check in! How's your experience been with {{brand}}? We'd love to hear your thoughts when you have a moment to share.",
          "Hello {{name}}! We noticed you've been using {{brand}} and we'd love to hear what you think. Would you mind sharing your experience in a quick comment?",
          "Your opinion matters, {{name}}! If you've been using {{brand}}, we'd appreciate hearing your thoughts. Just a quick comment would be incredibly helpful!",
        ],
      },
      linkedin: {
        requestTemplate: [
          "We value your professional insights. How has {{brand}} impacted your workflow? Your feedback would be invaluable to our community of professionals.",
          "As a valued professional in our network, we'd appreciate your perspective on {{brand}}. How has it benefited your organization?",
          "Professional feedback helps us improve. If you've implemented {{brand}} in your workflow, we'd value hearing about your experience and results.",
        ],
        thankYouTemplate: [
          "Thank you {{name}} for your thoughtful feedback about {{brand}}. Your professional perspective is invaluable, and we appreciate you taking the time to share it.",
          "We appreciate your detailed insights about {{brand}}, {{name}}. Feedback from industry professionals like yourself helps us continue to refine our offerings.",
          "Thank you for sharing your experience with {{brand}}, {{name}}. Your professional endorsement means a great deal to us and provides valuable guidance for others.",
        ],
        followupTemplate: [
          "Hello {{name}}, we noticed you've been using {{brand}} recently. We'd value your professional perspective when you have a moment to share your experience.",
          "Your professional insight would be valuable, {{name}}. If you've implemented {{brand}}, would you be willing to share your experience with our network?",
          "Checking in regarding your experience with {{brand}}, {{name}}. As a respected professional, your feedback would provide valuable insights for our community.",
        ],
      },
      instagram: {
        requestTemplate: [
          "We'd love to hear your {{brand}} story! How has it made a difference for you? Share in the comments or DM us your experience. ✨ #CustomerStories",
          "Your journey with {{brand}} matters to us! 📱 Comment below or DM us about your experience - we'd love to hear what you think! #ShareYourStory",
          "How has {{brand}} enhanced your life? 💫 Drop a comment or send us a DM with your experience! We love hearing from our community. #CustomerExperience",
        ],
        thankYouTemplate: [
          "Thank you @{{username}} for sharing your amazing experience with {{brand}}! We're so glad to have you in our community. ❤️ #CustomerLove",
          "We're absolutely thrilled by your kind words about {{brand}}, @{{username}}! 🙌 Thanks for being part of our journey and sharing your story. ✨",
          "This made our day, @{{username}}! 🥰 Thank you for sharing your beautiful experience with {{brand}}. We're honored to have amazing supporters like you! 💖",
        ],
        followupTemplate: [
          "Hi @{{username}}! How's your experience been with {{brand}}? We'd love to hear your thoughts! Drop us a comment or DM when you have a moment. ✨",
          "Hey @{{username}}! 👋 We'd love to know what you think about {{brand}}! Share your experience in a comment or DM - your feedback means everything! 💕",
          "Hello @{{username}}! Loving {{brand}}? We'd be thrilled to hear your thoughts! Comment below or send us a message with your experience. 📲 #ShareYourStory",
        ],
      },
    };

    return suggestions[platform]?.[messageType] || [];
  };

  // Handle platform change
  useEffect(() => {
    // Update character count when platform changes
    const template = getTemplateValue(activeTab);
    if (template) {
      setCharCount(template.length);
    } else {
      setCharCount(0);
    }
  }, [activePlatform, activeTab]);

  // Platform specific tone tips
  const getPlatformToneTips = (): JSX.Element => {
    const platform = getCurrentPlatform().id as
      | "twitter"
      | "facebook"
      | "linkedin"
      | "instagram";

    const tips: Record<
      "twitter" | "facebook" | "linkedin" | "instagram",
      React.ReactElement
    > = {
      twitter: (
        <div>
          <div className="text-sm font-medium mb-1.5">
            Twitter Voice Strategy:
          </div>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                1
              </span>
              <span className="text-xs">
                Keep it brief and conversational (280 char limit)
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                2
              </span>
              <span className="text-xs">
                Use hashtags strategically for discoverability
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                3
              </span>
              <span className="text-xs">
                Direct mentions with @username for notifications
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                4
              </span>
              <span className="text-xs">
                Use emoji sparingly for personality
              </span>
            </li>
          </ul>
        </div>
      ),
      facebook: (
        <div>
          <div className="text-sm font-medium mb-1.5">
            Facebook Voice Strategy:
          </div>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                1
              </span>
              <span className="text-xs">
                Use a warm, friendly tone for broad audiences
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                2
              </span>
              <span className="text-xs">
                Ask questions to encourage engagement
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                3
              </span>
              <span className="text-xs">
                Write conversationally as if talking to a friend
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                4
              </span>
              <span className="text-xs">
                Use line breaks for readability in longer posts
              </span>
            </li>
          </ul>
        </div>
      ),
      linkedin: (
        <div>
          <div className="text-sm font-medium mb-1.5">
            LinkedIn Voice Strategy:
          </div>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                1
              </span>
              <span className="text-xs">
                Maintain a professional, authoritative tone
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                2
              </span>
              <span className="text-xs">
                Focus on business value and professional benefits
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                3
              </span>
              <span className="text-xs">
                Use industry-specific terminology appropriately
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex-shrink-0">
                4
              </span>
              <span className="text-xs">
                Create content that demonstrates expertise
              </span>
            </li>
          </ul>
        </div>
      ),
      instagram: (
        <div>
          <div className="text-sm font-medium mb-1.5">
            Instagram Voice Strategy:
          </div>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/40 text-xs text-pink-700 dark:text-pink-300 flex-shrink-0">
                1
              </span>
              <span className="text-xs">
                Visual-first approach with concise captions
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/40 text-xs text-pink-700 dark:text-pink-300 flex-shrink-0">
                2
              </span>
              <span className="text-xs">
                Use emoji to add personality and visual appeal ✨
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/40 text-xs text-pink-700 dark:text-pink-300 flex-shrink-0">
                3
              </span>
              <span className="text-xs">
                Incorporate relevant hashtags for discovery
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/40 text-xs text-pink-700 dark:text-pink-300 flex-shrink-0">
                4
              </span>
              <span className="text-xs">
                Create an aspirational, lifestyle-oriented tone
              </span>
            </li>
          </ul>
        </div>
      ),
    };

    return tips[platform];
  };

  // Get message type label
  const getMessageTypeLabel = (type: string): string => {
    if (type === "request") return "Request Template";
    if (type === "thankYou") return "Thank You Template";
    return "Follow-up Template";
  };

  // Get message type icon
  const getMessageTypeIcon = (type: string): JSX.Element => {
    if (type === "request") return <MessageCircle className="h-4 w-4" />;
    if (type === "thankYou") return <Heart className="h-4 w-4" />;
    return <CornerDownRight className="h-4 w-4" />;
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-xl">
      <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Social Media Templates
            </CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Customize your brand voice for social media testimonial requests
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Platform selection tabs */}
        <div className="flex flex-wrap gap-3 justify-center">
          {platforms.map((platform) => (
            <motion.div
              key={platform.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                className={`relative flex flex-col items-center bg-white dark:bg-gray-900 border-2 ${
                  activePlatform === platform.id
                    ? "border-blue-400 dark:border-blue-600"
                    : "border-gray-200 dark:border-gray-800"
                } rounded-xl p-3 shadow-sm hover:shadow-md transition-all`}
                onClick={() =>
                  setActivePlatform(platform.id as SocialPlatformName)
                }
              >
                <div
                  className={`h-10 w-10 rounded-full bg-gradient-to-br ${
                    platform.id === "instagram"
                      ? "from-pink-500 to-purple-500"
                      : "from-blue-500 to-blue-700"
                  } flex items-center justify-center text-white mb-1`}
                >
                  <platform.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{platform.name}</span>
                {platform.characterLimit && (
                  <span className="text-[10px] text-gray-500">
                    {platform.characterLimit} chars
                  </span>
                )}
                {activePlatform === platform.id && (
                  <motion.div
                    layoutId="activePlatform"
                    className="absolute inset-0 rounded-xl ring-2 ring-blue-500 dark:ring-blue-400"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Message type tabs */}
        <Tabs
          defaultValue="request"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-auto flex flex-col items-center"
        >
          <TabsList className="h-10 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            <TabsTrigger
              value="request"
              className="rounded-full text-sm px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                <span>Request</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="thankYou"
              className="rounded-full text-sm px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span>Thank You</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="followup"
              className="rounded-full text-sm px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <div className="flex items-center gap-1.5">
                <CornerDownRight className="h-4 w-4" />
                <span>Follow-up</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content area */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Left Column - Editor area */}
          <div className="md:col-span-7 space-y-5">
            {/* Template editor */}
            <div className="rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-6 w-6 rounded-full bg-gradient-to-br ${
                      activePlatform === "instagram"
                        ? "from-pink-500 to-purple-500"
                        : "from-blue-500 to-blue-600"
                    } flex items-center justify-center text-white`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full bg-gradient-to-br ${
                        activePlatform === "instagram"
                          ? "from-pink-500 to-purple-500"
                          : "from-blue-500 to-blue-600"
                      } flex items-center justify-center text-white`}
                    >
                      {(() => {
                        const PlatformIcon = getCurrentPlatform().icon;
                        return <PlatformIcon className="h-3 w-3" />;
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      {getMessageTypeIcon(activeTab)}
                      <span>
                        {getCurrentPlatform().name}{" "}
                        {getMessageTypeLabel(activeTab)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {activeTab === "request"
                        ? "Message to request testimonials"
                        : activeTab === "thankYou"
                          ? "Response after receiving testimonials"
                          : "Reminder for non-responders"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={() =>
                            copyToClipboard(
                              getTemplateValue(activeTab),
                              activeTab
                            )
                          }
                        >
                          {copied === activeTab ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">
                          {copied === activeTab ? "Copied!" : "Copy template"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={() => {
                            // Get example and reset
                            const suggestions = getTemplateSuggestions();
                            if (suggestions.length > 0) {
                              updateTemplate(activeTab, suggestions[0]);
                            }
                          }}
                        >
                          <RefreshCw className="h-4 w-4 text-gray-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Reset to example</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="p-4 relative">
                <motion.div
                  layout
                  className="rounded-xl border-2 border-gray-200 focus-within:border-blue-400 dark:border-gray-700 dark:focus-within:border-blue-600 relative"
                >
                  <Textarea
                    ref={textareaRef}
                    value={getTemplateValue(activeTab)}
                    onChange={(e) => updateTemplate(activeTab, e.target.value)}
                    className="min-h-[180px] font-mono text-sm resize-none rounded-xl border-0 shadow-none focus:ring-0 focus:ring-offset-0 p-4"
                    placeholder="Enter your message template here..."
                  />

                  {getCurrentPlatform().characterLimit && (
                    <div
                      className={`absolute right-3 bottom-3 text-xs font-mono ${
                        charCount > (getCurrentPlatform()?.characterLimit || 0)
                          ? "text-red-600 dark:text-red-400"
                          : charCount >
                              (getCurrentPlatform()?.characterLimit || 0) * 0.8
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-500"
                      }`}
                    >
                      {charCount}/{getCurrentPlatform().characterLimit}
                    </div>
                  )}
                </motion.div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge
                      variant="outline"
                      className="rounded-full h-6 text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <span className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-gray-500" />
                        {"{{"}name{"}}"}
                      </span>
                    </Badge>

                    {getCurrentPlatform().mentionSupport && (
                      <Badge
                        variant="outline"
                        className="rounded-full h-6 text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 ml-2"
                      >
                        <span className="flex items-center gap-1.5">
                          <AtSign className="h-3 w-3 text-gray-500" />
                          {"{{"}username{"}}"}
                        </span>
                      </Badge>
                    )}

                    <Badge
                      variant="outline"
                      className="rounded-full h-6 text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 ml-2"
                    >
                      <span className="flex items-center gap-1.5">
                        <MessageSquareQuote className="h-3 w-3 text-gray-500" />
                        {"{{"}brand{"}}"}
                      </span>
                    </Badge>
                  </div>

                  <Popover open={showAiIdeas} onOpenChange={setShowAiIdeas}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-full gap-1.5 text-xs border-2 border-blue-200 hover:border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 dark:border-blue-900 dark:hover:border-blue-700 dark:from-blue-900/20 dark:to-indigo-900/20 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 dark:text-blue-400"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>AI Ideas</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 flex items-center justify-between border-b">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-sm">
                            AI Template Suggestions
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs bg-white/80 dark:bg-gray-800/80"
                        >
                          {getCurrentPlatform().name}
                        </Badge>
                      </div>
                      <div className="py-2 max-h-80 overflow-auto">
                        {getTemplateSuggestions().map((suggestion, index) => (
                          <div
                            key={index}
                            className={`px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors ${
                              activeIdea === index
                                ? "bg-blue-50 dark:bg-blue-900/20"
                                : ""
                            }`}
                            onMouseEnter={() => setActiveIdea(index)}
                            onMouseLeave={() => setActiveIdea(null)}
                            onClick={() => {
                              updateTemplate(activeTab, suggestion);
                              setShowAiIdeas(false);
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                                Suggestion {index + 1}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTemplate(activeTab, suggestion);
                                  setShowAiIdeas(false);
                                }}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                              {suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs h-8"
                          onClick={() => setShowAiIdeas(false)}
                        >
                          <X className="h-3.5 w-3.5 mr-1.5" />
                          <span>Close</span>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Platform tone tips */}
            <div
              className={`rounded-xl border-2 ${
                getCurrentPlatform().id === "instagram"
                  ? "border-pink-100 dark:border-pink-900/40"
                  : "border-blue-100 dark:border-blue-900/40"
              } p-4 bg-white dark:bg-gray-900 shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div
                    className={`h-8 w-8 rounded-full ${
                      getCurrentPlatform().id === "instagram"
                        ? "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400"
                        : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                    } flex items-center justify-center`}
                  >
                    <LightbulbIcon className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1">{getPlatformToneTips()}</div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview area */}
          <div className="md:col-span-5">
            <div className="sticky top-4">
              <div className="rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border-b px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Live Preview</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 rounded-full gap-1.5 text-xs"
                    onClick={() =>
                      setPreviewDevice(
                        previewDevice === "desktop" ? "mobile" : "desktop"
                      )
                    }
                  >
                    {previewDevice === "desktop" ? (
                      <>
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>Mobile</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-3.5 w-3.5" />
                        <span>Desktop</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-4">
                  <motion.div
                    layout
                    className={`mx-auto rounded-xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden ${
                      previewDevice === "mobile" ? "max-w-[320px]" : ""
                    }`}
                  >
                    {/* Twitter-style preview */}
                    {activePlatform === "twitter" && (
                      <div className="bg-white dark:bg-gray-950">
                        <div className="border-b px-3 py-2 flex items-center gap-1.5">
                          <Twitter className="h-5 w-5 text-blue-500" />
                          <span className="text-sm font-semibold">Twitter</span>
                        </div>
                        <div className="p-3 pb-2 border-b">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div
                                className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                                style={{
                                  backgroundColor:
                                    brandData.colors?.primary || "#4F46E5",
                                }}
                              >
                                <span className="text-sm font-medium">
                                  {getInitials(brandData.name || "YB")}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="font-semibold mr-1 text-sm">
                                  {brandData.name || "YourBrand"}
                                </span>
                                <span className="text-blue-500 text-sm">✓</span>
                                <span className="text-gray-500 ml-1 text-xs">
                                  @
                                  {(brandData.name || "yourbrand")
                                    .toLowerCase()
                                    .replace(/\s/g, "")}
                                </span>
                              </div>
                              <div className="mt-1 text-sm">
                                {formatPreviewText(getTemplateValue(activeTab))}
                              </div>
                              <div className="mt-3 flex items-center gap-5 text-gray-500 text-xs">
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>12</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  <span>24</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-rose-500">♥</span>
                                  <span>82</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 text-gray-500 text-xs">
                          <div className="flex items-center gap-4">
                            <span>6:42 PM</span>
                            <span>Jul 23, 2023</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-gray-500"></div>
                            <div className="h-1 w-1 rounded-full bg-gray-500"></div>
                            <div className="h-1 w-1 rounded-full bg-gray-500"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Facebook-style preview */}
                    {activePlatform === "facebook" && (
                      <div className="bg-white dark:bg-gray-950">
                        <div className="border-b px-3 py-2 flex items-center gap-1.5">
                          <Facebook className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-semibold">
                            Facebook
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                              style={{
                                backgroundColor:
                                  brandData.colors?.primary || "#4F46E5",
                              }}
                            >
                              <span className="text-sm font-medium">
                                {getInitials(brandData.name || "YB")}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-sm">
                                {brandData.name || "Your Brand"}
                              </div>
                              <div className="text-xs text-gray-500">
                                Sponsored ·{" "}
                                <ChevronRight className="h-3 w-3 inline" />
                              </div>
                            </div>
                          </div>
                          <div className="text-sm mt-1 mb-3">
                            {formatPreviewText(getTemplateValue(activeTab))}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t text-gray-500 text-xs">
                            <span>Like</span>
                            <span>Comment</span>
                            <span>Share</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LinkedIn-style preview */}
                    {activePlatform === "linkedin" && (
                      <div className="bg-white dark:bg-gray-950">
                        <div className="border-b px-3 py-2 flex items-center gap-1.5">
                          <Linkedin className="h-5 w-5 text-blue-700" />
                          <span className="text-sm font-semibold">
                            LinkedIn
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="h-10 w-10 rounded-md flex items-center justify-center text-white"
                              style={{
                                backgroundColor:
                                  brandData.colors?.primary || "#4F46E5",
                              }}
                            >
                              <span className="text-sm font-medium">
                                {getInitials(brandData.name || "YB")}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-sm">
                                {brandData.name || "Your Brand"}
                              </div>
                              <div className="text-xs text-gray-500">
                                Company · 1,234 followers
                              </div>
                              <div className="text-xs text-gray-500">
                                1h · <ChevronRight className="h-3 w-3 inline" />
                              </div>
                            </div>
                          </div>
                          <div className="text-sm">
                            {formatPreviewText(getTemplateValue(activeTab))}
                          </div>
                          <div className="mt-4 flex justify-between border-t pt-2 text-gray-500 text-xs">
                            <span>Like</span>
                            <span>Comment</span>
                            <span>Share</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Instagram-style preview */}
                    {activePlatform === "instagram" && (
                      <div className="bg-white dark:bg-gray-950">
                        <div className="border-b px-3 py-2 flex items-center gap-1.5">
                          <Instagram className="h-5 w-5 text-pink-600" />
                          <span className="text-sm font-semibold">
                            Instagram
                          </span>
                        </div>
                        <div className="flex items-center gap-2 p-2 border-b">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-white"
                            style={{
                              background:
                                "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                            }}
                          >
                            <span className="text-sm font-medium">
                              {getInitials(brandData.name || "YB")}
                            </span>
                          </div>
                          <div className="font-medium text-sm">
                            {(brandData.name || "yourbrand")
                              .toLowerCase()
                              .replace(/\s/g, "")}
                          </div>
                        </div>

                        <div className="aspect-square w-full bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 flex items-center justify-center">
                          <div
                            className="h-14 w-14 rounded-full flex items-center justify-center text-white"
                            style={{
                              backgroundColor:
                                brandData.colors?.primary || "#4F46E5",
                            }}
                          >
                            <span className="text-xl font-medium">
                              {getInitials(brandData.name || "YB")}
                            </span>
                          </div>
                        </div>

                        <div className="p-3">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex gap-3">
                              <span>❤️</span>
                              <span>💬</span>
                              <span>📤</span>
                            </div>
                            <div>
                              <span>🔖</span>
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {Math.floor(Math.random() * 500) + 100} likes
                          </div>
                          <div className="mt-1 text-sm">
                            <span className="font-medium mr-1">
                              {(brandData.name || "yourbrand")
                                .toLowerCase()
                                .replace(/\s/g, "")}
                            </span>
                            {formatPreviewText(getTemplateValue(activeTab))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      <span>
                        Last updated {new Date().toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default observer(SocialSettings);
