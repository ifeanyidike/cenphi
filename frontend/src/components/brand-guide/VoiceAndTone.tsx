import { motion } from "framer-motion";
import { FC, useState, useEffect } from "react";
import { observer } from "mobx-react-lite";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icons
import {
  Loader2,
  MessageSquare,
  Plus,
  PlusCircle,
  Sparkles,
  X,
  MessageCircle,
  Bell,
  Info,
  Mail,
  Globe,
  CheckCircle,
  Palette,
  ExternalLink,
  Share2,
  ChevronDown,
  Layout,
  Menu,
  Megaphone,
  Wand2,
  Save,
  Star,
  SlidersHorizontal,
  Heart,
  FileText,
  LucideIcon,
  LockIcon,
  PackageIcon,
} from "lucide-react";

// Components
import EmailSettings from "./EmailSettings";
import ChatSettings from "./ChatSettings";

// Store and utils
import { itemVariants } from "./constants";
import { brandGuideStore } from "@/stores/brandGuideStore";
import SocialSettings from "./SocialSettings";
import CustomPageSettings from "./CustomPageSettings";

// Type for channel item
interface ChannelItem {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  description: string;
  status?: "active" | "coming-soon";
}

// Type for voice style
interface VoiceStyle {
  id: string;
  name: string;
  description: string;
  tones: string[];
}

type VoiceAndToneProps = {
  setShowAIDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showAIDialog: boolean;
};

const VoiceAndTone: FC<VoiceAndToneProps> = ({
  showAIDialog,
  setShowAIDialog,
}) => {
  const store = brandGuideStore;
  const { brandData } = store;
  const [addingValue, setAddingValue] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("brand-voice");
  const [activeChannel, setActiveChannel] = useState<string>("email");
  const [expansionState, setExpansionState] = useState<Record<string, boolean>>(
    {
      tone: true,
      values: true,
      ctas: true,
    }
  );
  const [saved, setSaved] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Initialize channels if they don't exist
  useEffect(() => {
    // Initialize email settings if they don't exist
    if (!brandData.voice.channels.email) {
      store.updateBrandData(["voice", "channels", "email"], {
        sender: {
          name: "",
          email: "",
        },
        signature: {
          text: "",
          includeCompanyLogo: true,
          includeSocialLinks: true,
          template: "simple",
        },
        requestTemplate: "",
        thankYouTemplate: "",
        followupTemplate: "",
      });
    }

    // Initialize chat settings if they don't exist
    if (!brandData.voice.channels.chat) {
      store.updateBrandData(["voice", "channels", "chat"], {
        requestTemplate:
          "Hi {{name}}, we appreciate your recent experience with {{brand}}. Would you be willing to share your thoughts in a brief testimonial?",
        followupTemplate:
          "Hi {{name}}, just a friendly reminder that we'd love to hear your thoughts about your experience with {{brand}}. It would mean a lot to us!",
      });
    }

    // Initialize social settings if they don't exist
    if (!brandData.voice.channels.social) {
      store.updateBrandData(["voice", "channels", "social"], {
        requestTemplate: "",
        thankYouTemplate: "",
      });
    }

    // Initialize website settings if they don't exist
    if (!brandData.voice.channels.website) {
      store.updateBrandData(["voice", "channels", "website"], {
        requestTemplate: "",
        thankYouTemplate: "",
      });
    }
  }, [brandData.voice.channels, store]);

  // Channel options
  const channels: ChannelItem[] = [
    {
      id: "email",
      name: "Email",
      icon: Mail,
      color: "text-blue-600 dark:text-blue-500",
      gradient: "from-blue-600 to-sky-500",
      description: "Email templates and signature settings",
      status: "active",
    },
    {
      id: "chat",
      name: "Chat",
      icon: MessageCircle,
      color: "text-violet-600 dark:text-violet-500",
      gradient: "from-violet-600 to-purple-500",
      description: "Chat templates for testimonial requests",
      status: "active",
    },
    {
      id: "social",
      name: "Social Media",
      icon: Share2,
      color: "text-pink-600 dark:text-pink-500",
      gradient: "from-pink-600 to-rose-500",
      description: "Social media templates and settings",
      // status: "coming-soon",
    },
    {
      id: "website",
      name: "Website",
      icon: Globe,
      color: "text-emerald-600 dark:text-emerald-500",
      gradient: "from-emerald-600 to-teal-500",
      description: "Website widgets and popups",
      status: "coming-soon",
    },
    {
      id: "custom-pages",
      name: "Custom Pages",
      icon: PackageIcon,
      color: "text-emerald-600 dark:text-emerald-500",
      gradient: "from-emerald-600 to-teal-500",
      description: "Custom pages and company pages",
      // status: "coming-soon",
    },
  ];

  // Voice styles for presets
  const voiceStyles: VoiceStyle[] = [
    {
      id: "friendly",
      name: "Friendly & Approachable",
      description: "Warm, conversational tone that builds rapport and trust",
      tones: ["friendly", "conversational", "warm"],
    },
    {
      id: "professional",
      name: "Professional & Polished",
      description: "Formal, authoritative tone ideal for business services",
      tones: ["professional", "authoritative", "formal"],
    },
    {
      id: "playful",
      name: "Playful & Energetic",
      description: "Fun, enthusiastic tone perfect for creative brands",
      tones: ["playful", "energetic", "casual"],
    },
    {
      id: "minimalist",
      name: "Clear & Concise",
      description: "Direct, simple tone focused on clarity and brevity",
      tones: ["clear", "concise", "direct"],
    },
  ];

  // Add a value to an array in the brand data
  const addValueToArray = (path: string[], value: string) => {
    if (!value.trim()) return;

    const currentArray = path.reduce((obj, key) => obj[key], brandData as any);
    if (Array.isArray(currentArray)) {
      store.updateBrandData(path, [...currentArray, value.trim()]);
    }
    setAddingValue("");
  };

  // Remove a value from an array in the brand data
  const removeValueFromArray = (path: string[], index: number) => {
    const currentArray = path.reduce((obj, key) => obj[key], brandData as any);
    if (Array.isArray(currentArray)) {
      const newArray = [...currentArray];
      newArray.splice(index, 1);
      store.updateBrandData(path, newArray);
    }
  };

  // Simulate AI generation of brand voice suggestions
  const generateAIBrandVoice = () => {
    setIsGenerating(true);

    // Simulate AI processing
    setTimeout(() => {
      const tones = [
        "conversational",
        "professional",
        "friendly",
        "authoritative",
        "playful",
      ];
      const values = [
        "Authentic",
        "Innovative",
        "Trusted",
        "Expert",
        "Reliable",
      ];
      const ctas = [
        "Share your story",
        "Tell us about your experience",
        "Join our community of satisfied customers",
      ];

      const randomTone = tones[Math.floor(Math.random() * tones.length)];
      const selectedValues = values.sort(() => 0.5 - Math.random()).slice(0, 3);
      const selectedCtas = ctas.sort(() => 0.5 - Math.random()).slice(0, 3);

      store.updateBrandData(["voice", "tone"], randomTone);
      store.updateBrandData(["voice", "values"], selectedValues);
      store.updateBrandData(["voice", "ctas"], selectedCtas);

      setIsGenerating(false);
      setShowAIDialog(false);
    }, 2000);
  };

  // Toggle accordion sections
  const toggleSection = (section: string) => {
    setExpansionState({
      ...expansionState,
      [section]: !expansionState[section],
    });
  };

  // Handle save button
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400">
              Brand Voice & Tone
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Define how your brand communicates across all channels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-2 rounded-xl h-10 shadow-sm"
            onClick={() => setShowAIDialog(true)}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-medium">AI Suggestions</span>
          </Button>

          <Button
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 border-0 rounded-xl h-10 hover:from-indigo-700 hover:to-purple-700 shadow-md"
            onClick={handleSave}
          >
            {saved ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>

          <div className="md:hidden">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-2 shadow-sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-3 space-y-2">
          <div className="font-medium text-sm mb-2">Navigation</div>
          <Button
            variant={activeTab === "brand-voice" ? "default" : "ghost"}
            className={`w-full justify-start text-sm h-10 ${activeTab === "brand-voice" ? "bg-gradient-to-r from-indigo-600 to-purple-600" : ""}`}
            onClick={() => {
              setActiveTab("brand-voice");
              setIsMenuOpen(false);
            }}
          >
            <Megaphone className="h-4 w-4 mr-2" />
            <span>Brand Voice</span>
          </Button>
          <Button
            variant={activeTab === "channels" ? "default" : "ghost"}
            className={`w-full justify-start text-sm h-10 ${activeTab === "channels" ? "bg-gradient-to-r from-indigo-600 to-purple-600" : ""}`}
            onClick={() => {
              setActiveTab("channels");
              setIsMenuOpen(false);
            }}
          >
            <Layout className="h-4 w-4 mr-2" />
            <span>Channels</span>
          </Button>
          <div className="font-medium text-sm mt-4 mb-2">Channels</div>
          {channels.map((channel) => (
            <Button
              key={channel.id}
              variant={activeChannel === channel.id ? "default" : "ghost"}
              className={`w-full justify-start text-sm h-10 ${activeChannel === channel.id ? `bg-gradient-to-r ${channel.gradient}` : ""}`}
              onClick={() => {
                setActiveChannel(channel.id);
                setActiveTab("channels");
                setIsMenuOpen(false);
              }}
              disabled={channel.status === "coming-soon"}
            >
              <channel.icon className="h-4 w-4 mr-2" />
              <span>{channel.name}</span>
              {channel.status === "coming-soon" && (
                <Badge
                  variant="outline"
                  className="ml-auto text-[10px] bg-gray-100 dark:bg-gray-800"
                >
                  Soon
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden md:block md:col-span-3 space-y-4">
          <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <Button
                  variant="ghost"
                  className={`w-full justify-start p-3 rounded-none h-auto ${activeTab === "brand-voice" ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600 dark:border-indigo-500" : ""}`}
                  onClick={() => setActiveTab("brand-voice")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center ${activeTab === "brand-voice" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                    >
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Brand Voice</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Define your core brand personality
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className={`w-full justify-start p-3 rounded-none h-auto ${activeTab === "channels" ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600 dark:border-indigo-500" : ""}`}
                  onClick={() => setActiveTab("channels")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center ${activeTab === "channels" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                    >
                      <Layout className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Communication Channels</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Configure channel-specific settings
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {activeTab === "channels" && (
            <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layout className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {channels.map((channel) => (
                    <Button
                      key={channel.id}
                      variant="ghost"
                      className={`w-full justify-start p-3 rounded-none h-auto ${activeChannel === channel.id ? `bg-${channel.id}-50 dark:bg-${channel.id}-900/20 border-l-4 border-${channel.id}-600 dark:border-${channel.id}-500` : ""}`}
                      onClick={() => setActiveChannel(channel.id)}
                      disabled={channel.status === "coming-soon"}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center ${activeChannel === channel.id ? `bg-${channel.id}-100 dark:bg-${channel.id}-900/40 ${channel.color}` : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                        >
                          <channel.icon className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{channel.name}</span>
                            {channel.status === "coming-soon" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 h-4 px-1.5 bg-gray-100 dark:bg-gray-800"
                              >
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {channel.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Tips & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                    <span className="text-xs">1</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keep your brand voice consistent across all channels
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                    <span className="text-xs">2</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use personalization variables like {"{{"}name{"}}"} to
                    increase engagement
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                    <span className="text-xs">3</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keep testimonial requests brief and focus on the customer
                    experience
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs h-8 gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>View full guide</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="col-span-12 md:col-span-9">
          {activeTab === "brand-voice" && (
            <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Megaphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Brand Voice Characteristics
                  </CardTitle>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 gap-1.5 rounded-lg border-2"
                      >
                        <Wand2 className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs">Voice Presets</span>
                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {voiceStyles.map((style) => (
                        <DropdownMenuItem
                          key={style.id}
                          className="py-2 px-3 cursor-pointer"
                          onClick={() => {
                            store.updateBrandData(
                              ["voice", "tone"],
                              style.tones[0]
                            );
                          }}
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {style.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {style.description}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>
                  Define the core personality and values that guide all your
                  communications
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-8">
                {/* Brand Tone */}
                <div className="space-y-3">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection("tone")}
                  >
                    <Label
                      htmlFor="brand-tone"
                      className="text-base font-medium flex items-center gap-2"
                    >
                      <Palette className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Brand Tone
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expansionState.tone ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </div>

                  {expansionState.tone && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="p-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                        <div className="space-y-1 mb-1">
                          <Label
                            htmlFor="brand-tone"
                            className="text-sm text-gray-700 dark:text-gray-300"
                          >
                            Select your primary brand tone
                          </Label>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Your brand's overall communication style and
                            personality
                          </div>
                        </div>

                        <Select
                          value={brandData.voice.tone}
                          onValueChange={(value) =>
                            store.updateBrandData(["voice", "tone"], value)
                          }
                        >
                          <SelectTrigger
                            id="brand-tone"
                            className="w-full h-10 mt-2 border-2 rounded-lg"
                          >
                            <SelectValue placeholder="Select a tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">
                              Friendly & Approachable
                            </SelectItem>
                            <SelectItem value="professional">
                              Professional & Polished
                            </SelectItem>
                            <SelectItem value="conversational">
                              Casual & Conversational
                            </SelectItem>
                            <SelectItem value="authoritative">
                              Authoritative & Expert
                            </SelectItem>
                            <SelectItem value="playful">
                              Playful & Energetic
                            </SelectItem>
                            <SelectItem value="empathetic">
                              Empathetic & Supportive
                            </SelectItem>
                            <SelectItem value="inspirational">
                              Inspirational & Motivating
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-xl border-2 border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                              Your brand tone affects how testimonial requests
                              come across to customers
                            </p>
                            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                              For example, a "friendly" tone uses casual
                              language, while "professional" is more formal.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Brand Values */}
                <div className="space-y-3">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection("values")}
                  >
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Heart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Brand Values
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expansionState.values ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </div>

                  {expansionState.values && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="p-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                        <div className="space-y-1 mb-3">
                          <Label className="text-sm text-gray-700 dark:text-gray-300">
                            Core brand values
                          </Label>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Values that define your brand and guide your
                            communication
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {brandData.voice.values.map((value, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1 pl-3 pr-1 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:hover:bg-indigo-900/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors"
                            >
                              {value}
                              <button
                                className="ml-1 rounded-full h-5 w-5 inline-flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-800"
                                onClick={() =>
                                  removeValueFromArray(
                                    ["voice", "values"],
                                    index
                                  )
                                }
                              >
                                <span className="sr-only">Remove</span>
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Add value..."
                            value={addingValue}
                            onChange={(e) => setAddingValue(e.target.value)}
                            className="h-10 border-2 rounded-lg focus:border-indigo-400 focus:ring-indigo-400"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addValueToArray(
                                  ["voice", "values"],
                                  addingValue
                                );
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-3 rounded-lg border-2"
                            onClick={() =>
                              addValueToArray(["voice", "values"], addingValue)
                            }
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-xl border-2 border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 p-3">
                        <div className="flex items-start gap-2">
                          <Star className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                              Values help guide content creation across all
                              channels
                            </p>
                            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                              Testimonial requests should reflect your values.
                              For example, if "Authenticity" is a value,
                              emphasize genuine feedback.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Call-to-Action Phrases */}
                <div className="space-y-3">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection("ctas")}
                  >
                    <Label className="text-base font-medium flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Call-to-Action Phrases
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expansionState.ctas ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </div>

                  {expansionState.ctas && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="p-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                        <div className="space-y-1 mb-3">
                          <Label className="text-sm text-gray-700 dark:text-gray-300">
                            Testimonial call-to-action phrases
                          </Label>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Phrases used to encourage testimonial submissions
                            and other actions
                          </div>
                        </div>

                        <div className="space-y-2">
                          {brandData.voice.ctas.map((cta, index) => (
                            <div
                              key={index}
                              className="flex gap-2 items-center"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></div>
                              <Input
                                value={cta}
                                onChange={(e) => {
                                  const newCtas = [...brandData.voice.ctas];
                                  newCtas[index] = e.target.value;
                                  store.updateBrandData(
                                    ["voice", "ctas"],
                                    newCtas
                                  );
                                }}
                                className="flex-1 h-10 border-2 rounded-lg focus:border-indigo-400 focus:ring-indigo-400"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() =>
                                  removeValueFromArray(["voice", "ctas"], index)
                                }
                              >
                                <X className="h-4 w-4 text-gray-500" />
                              </Button>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            className="w-full text-sm h-10 mt-2 rounded-lg border-2 border-dashed flex items-center justify-center gap-1"
                            onClick={() => {
                              const newCtas = [...brandData.voice.ctas, ""];
                              store.updateBrandData(["voice", "ctas"], newCtas);
                            }}
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Add CTA Phrase
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-xl border-2 border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                              Use compelling action phrases to increase response
                              rates
                            </p>
                            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                              Examples: "Share your story", "Tell us your
                              experience", or "Leave your feedback"
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "channels" && (
            <>
              {activeChannel === "email" && <EmailSettings />}

              {activeChannel === "chat" && <ChatSettings />}

              {activeChannel === "social" && (
                <SocialSettings />
                // <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-lg rounded-xl overflow-hidden">
                //   <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
                //     <div className="flex items-center gap-3">
                //       <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md">
                //         <Share2 className="h-5 w-5" />
                //       </div>
                //       <div>
                //         <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-700 to-rose-700 dark:from-pink-400 dark:to-rose-400">
                //           Social Media Settings
                //         </CardTitle>
                //         <CardDescription className="text-sm mt-0.5">
                //           Configure testimonial requests for social platforms
                //         </CardDescription>
                //       </div>
                //     </div>
                //   </CardHeader>
                //   <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                //     <div className="h-16 w-16 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                //       <LockIcon className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                //     </div>
                //     <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                //     <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                //       We're working on adding support for social media
                //       testimonial collection. This feature will be available in
                //       a future update.
                //     </p>
                //     <Button
                //       variant="outline"
                //       className="gap-2 rounded-xl border-2 h-10"
                //     >
                //       <Bell className="h-4 w-4" />
                //       <span>Get notified when available</span>
                //     </Button>
                //   </CardContent>
                // </Card>
              )}

              {activeChannel === "website" && (
                <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-lg rounded-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-400">
                          Website Widgets
                        </CardTitle>
                        <CardDescription className="text-sm mt-0.5">
                          Configure testimonial collection on your website
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                      <LockIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                      We're developing beautiful widgets that will help you
                      collect testimonials directly on your website. Stay tuned
                      for this feature in an upcoming release.
                    </p>
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl border-2 h-10"
                    >
                      <Bell className="h-4 w-4" />
                      <span>Get notified when available</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
              {activeChannel === "custom-pages" && <CustomPageSettings />}
            </>
          )}
        </div>
      </div>

      {/* AI Brand Voice Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-md border-2 border-gray-200 dark:border-gray-800 rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg">
                AI Brand Voice Generator
              </DialogTitle>
            </div>
            <DialogDescription>
              Let AI help you create a consistent brand voice for your
              testimonial communications
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-tone"
                  defaultChecked
                  className="h-4 w-4 rounded border-2 border-gray-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <Label htmlFor="ai-tone" className="text-sm cursor-pointer">
                  Brand tone suggestions
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-values"
                  defaultChecked
                  className="h-4 w-4 rounded border-2 border-gray-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <Label htmlFor="ai-values" className="text-sm cursor-pointer">
                  Core brand values
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-ctas"
                  defaultChecked
                  className="h-4 w-4 rounded border-2 border-gray-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <Label htmlFor="ai-ctas" className="text-sm cursor-pointer">
                  Call-to-action phrases
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-templates"
                  className="h-4 w-4 rounded border-2 border-gray-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <Label
                  htmlFor="ai-templates"
                  className="text-sm cursor-pointer"
                >
                  Email and message templates
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-thankyou"
                  className="h-4 w-4 rounded border-2 border-gray-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <Label htmlFor="ai-thankyou" className="text-sm cursor-pointer">
                  Thank you message templates
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-email-signature"
                  className="h-4 w-4 rounded border-2 border-gray-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <Label
                  htmlFor="ai-email-signature"
                  className="text-sm cursor-pointer"
                >
                  Email signature
                </Label>
              </div>
            </div>

            <div className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
              AI will analyze your brand name, description, and other settings
              to generate appropriate voice elements.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-lg border-2 h-10"
              onClick={() => setShowAIDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={generateAIBrandVoice}
              disabled={isGenerating}
              className="rounded-lg h-10 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default observer(VoiceAndTone);
