import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  Copy,
  CopyCheck,
  Download,
  Loader2,
  Moon,
  Palette,
  Save,
  Shield,
  Sparkles,
  Sun,
  Type,
} from "lucide-react";
import Essentials from "./Essentials";
import { BrandData, ColorMode } from "@/types/setup";
import { containerVariants, itemVariants } from "./constants";
import Colors from "./Colors";
import Typography from "./Typography";
import Testimonials from "./Testimonials";
import VoiceAndTone from "./VoiceAndTone";
import Preview from "./Preview";
import DeveloperCode from "./DeveloperCode";
import TabListElement from "./TabList";

interface BrandGuideProps {
  onSave?: (data: BrandData) => void;
  onExport?: () => void;
  className?: string;
}

const BrandGuide: React.FC<BrandGuideProps> = observer(
  ({ onSave, onExport, className }) => {
    // State from MobX store
    const { brandData, saveChanges, brandPresets, applyPreset } =
      brandGuideStore;

    // Local component state
    const [activeTab, setActiveTab] = useState<string>("essentials");
    const [colorMode, setColorMode] = useState<ColorMode>("light");

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [completionPercent, setCompletionPercent] = useState<number>(0);

    const [copySuccess, setCopySuccess] = useState<Record<string, boolean>>({});
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [showAIDialog, setShowAIDialog] = useState<boolean>(false);

    const [customCss, setCustomCss] = useState<string>("");

    // Calculate completion percentage on brand data changes
    useEffect(() => {
      calculateCompletionPercentage();
    }, [brandData]);

    // Calculate completion percentage based on required fields
    const calculateCompletionPercentage = () => {
      let completed = 0;
      let total = 0;

      // Check essentials
      if (brandData.name) completed++;
      if (brandData.tagline) completed++;
      if (brandData.description && brandData.description.length > 10)
        completed++;
      if (brandData.logo.main) completed++;
      total += 4;

      // Check colors (just the main ones)
      if (brandData.colors.primary) completed++;
      if (brandData.colors.secondary) completed++;
      if (brandData.colors.accent) completed++;
      total += 3;

      // Check typography
      if (brandData.typography.headingFont) completed++;
      if (brandData.typography.bodyFont) completed++;
      total += 2;

      // Check testimonial styles
      if (brandData.testimonials.style) completed++;
      total += 1;

      // Check voice & tone
      if (brandData.voice.values.length > 0) completed++;
      if (brandData.voice.ctas.length > 0) completed++;
      if (brandData.voice.channels.email.requestTemplate.length > 20)
        completed++;
      if (brandData.voice.channels.email.thankYouTemplate.length > 20)
        completed++;
      if (brandData.voice.channels.social.requestTemplate.length > 20)
        completed++;

      if (brandData.voice.channels.social.thankYouTemplate.length > 20)
        completed++;
      if (brandData.voice.channels.website.requestTemplate.length > 20)
        completed++;
      if (brandData.voice.channels.website.thankYouTemplate.length > 20)
        completed++;
      total += 8;

      if (brandData.voice.channels.email.signature.text.length > 10)
        completed++;
      if (brandData.voice.channels.email.sender.name.length > 10) completed++;
      if (brandData.voice.channels.email.sender.email.length > 10) completed++;
      total += 3;

      setCompletionPercent(Math.round((completed / total) * 100));
    };

    // Copy to clipboard helper
    const copyToClipboard = (text: string, field: string) => {
      navigator.clipboard.writeText(text);
      setCopySuccess({ ...copySuccess, [field]: true });
      setTimeout(() => {
        setCopySuccess({ ...copySuccess, [field]: false });
      }, 2000);
    };

    // Generate CSS variables from brand data

    // Handle save action
    const handleSave = async () => {
      setIsSaving(true);
      try {
        await saveChanges();
        if (onSave) {
          onSave(brandData);
        }
        setTimeout(() => {
          setIsSaving(false);
        }, 1000);
      } catch (error) {
        console.error("Error saving brand guide:", error);
        setIsSaving(false);
      }
    };

    // Handle export action
    const handleExport = () => {
      if (onExport) {
        onExport();
      } else {
        // Default export to JSON
        const dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(brandData, null, 2));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute(
          "download",
          `${brandData.name.replace(/\s+/g, "-").toLowerCase()}-brand-guide.json`
        );
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    };
    // Apply preset and track selection
    const handleApplyPreset = (presetId: string) => {
      setSelectedPreset(presetId);
      applyPreset(presetId);
    };

    return (
      <div
        className={cn("w-full", className)}
        style={
          {
            "--primary-color": brandData.colors.primary,
            "--secondary-color": brandData.colors.secondary,
          } as React.CSSProperties
        }
      >
        <motion.div
          className="min-h-screen bg-white dark:bg-gray-950"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header with progress and actions */}
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
            <div className="container flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className="flex items-center"
                  variants={itemVariants}
                >
                  <Shield className="h-5 w-5 text-primary mr-2" />
                  <h1 className="text-xl font-bold">Brand Guide</h1>
                </motion.div>

                <motion.div
                  className="hidden md:flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-full px-3 py-1.5"
                  variants={itemVariants}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Completion:
                  </span>
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {completionPercent}%
                  </span>
                </motion.div>
              </div>

              <motion.div
                className="flex items-center gap-2"
                variants={itemVariants}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="hidden md:flex"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Export your brand guide</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(brandData, null, 2),
                            "brandData"
                          )
                        }
                        className="hidden lg:flex"
                      >
                        {copySuccess["brandData"] ? (
                          <CopyCheck className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        Copy JSON
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Copy brand data as JSON</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="hidden md:flex border-l border-gray-200 dark:border-gray-800 h-6 mx-2" />

                <div className="items-center justify-center hidden md:flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 gap-1"
                    onClick={() =>
                      setColorMode(colorMode === "light" ? "dark" : "light")
                    }
                  >
                    {colorMode === "light" ? (
                      <>
                        <Sun className="h-4 w-4" />
                        <span className="text-xs">Light</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        <span className="text-xs">Dark</span>
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="relative"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </header>

          <main className="container py-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <TabListElement />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="ml-auto flex gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span className="hidden sm:inline">AI Assist</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                          AI Assistance
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Let AI help you create brand elements
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Button
                          variant="secondary"
                          className="justify-start"
                          onClick={() => setShowAIDialog(true)}
                        >
                          <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                          Generate Brand Voice
                        </Button>
                        <Button
                          variant="secondary"
                          className="justify-start"
                          onClick={() =>
                            handleApplyPreset(brandPresets[0]?.id || "")
                          }
                        >
                          <Palette className="h-4 w-4 mr-2 text-amber-500" />
                          Suggest Color Palette
                        </Button>
                        <Button variant="secondary" className="justify-start">
                          <Type className="h-4 w-4 mr-2 text-amber-500" />
                          Recommend Typography
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Brand Essentials */}
              <TabsContent value="essentials" className="space-y-6">
                <Essentials
                  handleApplyPreset={handleApplyPreset}
                  selectedPreset={selectedPreset}
                />
              </TabsContent>

              {/* Colors */}
              <TabsContent value="colors" className="space-y-6">
                <Colors />
              </TabsContent>

              {/* Typography */}
              <TabsContent value="typography" className="space-y-6">
                <Typography colorMode={colorMode} setColorMode={setColorMode} />
              </TabsContent>

              {/* Testimonials */}
              <TabsContent value="testimonials" className="space-y-6">
                <Testimonials
                  colorMode={colorMode}
                  setColorMode={setColorMode}
                />
              </TabsContent>

              {/* Voice & Tone */}
              <TabsContent value="voice" className="space-y-6">
                <VoiceAndTone
                  showAIDialog={showAIDialog}
                  setShowAIDialog={setShowAIDialog}
                />
              </TabsContent>

              {/* Preview */}
              <TabsContent value="preview" className="space-y-6">
                <Preview colorMode={colorMode} setColorMode={setColorMode} />
              </TabsContent>

              {/* Developer Code */}
              <TabsContent value="code" className="space-y-6">
                <DeveloperCode
                  colorMode={colorMode}
                  copySuccess={copySuccess}
                  copyToClipboard={copyToClipboard}
                  customCss={customCss}
                  setCustomCss={setCustomCss}
                  setColorMode={setColorMode}
                />
              </TabsContent>
            </Tabs>
          </main>
        </motion.div>
      </div>
    );
  }
);

export default BrandGuide;
