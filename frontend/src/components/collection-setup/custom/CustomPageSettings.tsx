import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PaintBucket,
  Link,
  FormInput,
  CheckCircle,
  BarChart4,
  Eye,
  Info,
  ExternalLink,
  Save,
  Globe,
  Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CollectionSettings } from "@/types/setup";

// Import tab components
import PageDesignSettings from "./PageDesignSettings";
import PageDomainSettings from "./PageDomainSettings";
import PageFormSettings from "./PageFormSettings";
import PageAnalyticsSettings from "./PageAnalyticsSettings";
import PagePreviewDialog from "./PagePreviewDialog";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

interface CustomPageSettingsProps {
  settings: CollectionSettings["custom"];
  onFormatToggle: (formatType: "video" | "audio" | "text" | "image") => void;
  onAddFormatClick: () => void;
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
  copiedElement: string | null;
  onCopyElement: (element: string) => void;
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

const CustomPageSettings: React.FC<CustomPageSettingsProps> = ({
  settings,
  onSettingsChange,
  onNestedSettingsChange,
  copiedElement,
  onCopyElement,
  showToast,
}) => {
  // Local state for the active tab
  const [activeTab, setActiveTab] = useState("design");
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublished, setIsPublished] = useState(
    !!settings.customDomain && settings.useCustomDomain
  );

  // Update the published state when domain settings change
  useEffect(() => {
    setIsPublished(!!settings.customDomain && settings.useCustomDomain);
  }, [settings.customDomain, settings.useCustomDomain]);

  // Update unsaved changes state when settings change
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [settings]);

  // Get page URL based on settings
  const getPageUrl = () => {
    if (settings.useCustomDomain && settings.customDomain) {
      return `https://${settings.customDomain}`;
    }
    return `https://${settings.subdomain || "your-company"}.testimonials.app`;
  };

  // Handle publishing the page
  const handlePublish = () => {
    setIsPublished(true);
    setHasUnsavedChanges(false);
    showToast({
      title: "Page Published",
      description:
        "Your testimonial collection page is now live and accessible.",
      variant: "default",
    });
  };

  // Handle saving settings
  const handleSaveSettings = () => {
    setHasUnsavedChanges(false);
    showToast({
      title: "Settings Saved",
      description: "Your testimonial page settings have been saved.",
      variant: "default",
    });
  };

  // Handle copying URL
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(getPageUrl());
    onCopyElement("page-url");
    showToast({
      title: "URL Copied",
      description: "Page URL copied to clipboard",
      variant: "default",
    });
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Info Banner */}
      <motion.div
        variants={itemVariants}
        className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-start gap-3"
      >
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-blue-900 text-sm">
            Dedicated Testimonial Collection Page
          </h3>
          <p className="text-blue-700/80 text-xs leading-relaxed mt-1">
            Create a branded page specifically for collecting testimonials.
            Share via email campaigns, social media, or directly with customers.
            Customize the design, form fields, and success experience to match
            your brand.
          </p>
        </div>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full text-blue-700 hover:text-blue-900 hover:bg-blue-100"
            onClick={() =>
              window.open(
                "https://help.testimonials.com/custom-pages",
                "_blank"
              )
            }
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>

      {/* Published Status Banner (conditional) */}
      {isPublished && (
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between px-5 py-4 bg-green-50 border border-green-100 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">Your page is live</h3>
              <p className="text-sm text-green-700">{getPageUrl()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-green-700 bg-green-50 border-green-200 hover:bg-green-100 hover:text-green-800"
              onClick={handleCopyUrl}
            >
              {copiedElement === "page-url" ? (
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span>
                {copiedElement === "page-url" ? "Copied!" : "Copy URL"}
              </span>
            </Button>
            <Button
              size="sm"
              className="bg-white text-green-700 border border-green-200 hover:bg-green-50"
              onClick={() => window.open(getPageUrl(), "_blank")}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              <span>View Page</span>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main tabs with preview button */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center"
      >
        <div className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 mb-4"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4" />
            <span>Preview Page</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              Unsaved changes
            </Badge>
          )}
          {!isPublished && (
            <Button
              variant="default"
              size="sm"
              className="gap-1"
              onClick={handlePublish}
            >
              <Globe className="h-4 w-4" />
              <span>Publish Page</span>
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className="gap-1"
            onClick={handleSaveSettings}
            disabled={!hasUnsavedChanges}
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </Button>
        </div>
      </motion.div>

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full p-0 h-auto bg-transparent border-b rounded-none">
              <div className="flex w-full overflow-x-auto">
                <TabsTrigger
                  value="design"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
                >
                  <PaintBucket className="h-4 w-4 mr-2" />
                  <span>Design</span>
                </TabsTrigger>
                <TabsTrigger
                  value="domain"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
                >
                  <Link className="h-4 w-4 mr-2" />
                  <span>Domain</span>
                </TabsTrigger>
                <TabsTrigger
                  value="form"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
                >
                  <FormInput className="h-4 w-4 mr-2" />
                  <span>Form</span>
                </TabsTrigger>

                <TabsTrigger
                  value="analytics"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
                >
                  <BarChart4 className="h-4 w-4 mr-2" />
                  <span>Analytics</span>
                </TabsTrigger>
              </div>
            </TabsList>

            <div className="p-6">
              <TabsContent value="design" className="mt-0">
                <PageDesignSettings
                  settings={settings}
                  onSettingsChange={onSettingsChange}
                  onNestedSettingsChange={onNestedSettingsChange}
                />
              </TabsContent>

              <TabsContent value="domain" className="mt-0">
                <PageDomainSettings
                  settings={settings}
                  onSettingsChange={onSettingsChange}
                />
              </TabsContent>

              <TabsContent value="form" className="mt-0">
                <PageFormSettings
                  settings={settings}
                  // onFormatToggle={onFormatToggle}
                  // onAddFormatClick={onAddFormatClick}
                  onSettingsChange={onSettingsChange}
                  onNestedSettingsChange={onNestedSettingsChange}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <PageAnalyticsSettings
                  settings={settings}
                  onSettingsChange={onSettingsChange}
                  onNestedSettingsChange={onNestedSettingsChange}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Integration Code Section */}

      {/* Preview Dialog */}
      <PagePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        settings={settings}
        mode={previewDevice}
        onModeChange={setPreviewDevice}
      />
    </motion.div>
  );
};

export default CustomPageSettings;
