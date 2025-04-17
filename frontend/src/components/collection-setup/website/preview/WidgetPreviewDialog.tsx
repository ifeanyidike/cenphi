import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Laptop,
  Smartphone,
  Tablet,
  MessageSquare,
  Check,
  Copy,
  Code,
  Sparkles,
  Star,
  FileText,
  Globe,
  Lock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import Widget Preview Components
import WebsiteWidget from "./TestimonialWidget";
import TestimonialForm from "./TestimonialForm";

// Types
import { IncentiveConfig, TestimonialSubmission } from "@/types/setup";
import { observer } from "mobx-react-lite";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
import { runInAction } from "mobx";
import { brandGuideStore } from "@/stores/brandGuideStore";

interface WidgetPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "desktop" | "mobile" | "tablet";
  tab: "widget" | "form";
  onModeChange: (mode: "desktop" | "mobile" | "tablet") => void;
  onTabChange: (tab: "widget" | "form") => void;
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Sample website content for the preview
const websiteContent = {
  title: "Premium Product Solutions",
  description:
    "Experience our award-winning software that helps businesses grow faster.",
  ctaText: "Get Started",
  testimonialHeadline: "Trusted by thousands of businesses",
  testimonialQuotes: [
    {
      text: "This product has transformed how we manage our workflow. Highly recommended!",
      author: "Sarah J., Marketing Director",
    },
    {
      text: "We've seen a 40% increase in productivity since implementing this solution.",
      author: "Michael T., CEO",
    },
  ],
};

const WidgetPreviewDialog: React.FC<WidgetPreviewDialogProps> = observer(
  ({
    open,
    onOpenChange,
    mode,
    tab,
    onModeChange,
    onTabChange,
    // formats,
  }) => {
    const store = testimonialSettingsStore;
    const brandingGuide = brandGuideStore;
    const { displayRules, triggers, formats, customization, incentives } =
      store.settings.website;

    function onUpdateIncentives(update: Partial<IncentiveConfig>) {
      runInAction(() => {
        store.updateSettings("website", "incentives", {
          ...update,
        });
      });
    }
    const [showCode, setShowCode] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Integration code sample
    const integrationCode = `<!-- Testimonial Widget Integration -->
<script src="https://cdn.testimonials.com/widget.js?id=YOUR_WIDGET_ID" async></script>

<!-- Optional: Custom Initialization -->
<script>
  window.testimonialWidgetConfig = {
    primaryColor: "${brandingGuide.brandData.colors.primary || ""}",
    position: "${customization?.position || ""}",
    companyName: "${brandGuideStore.brandData.name || ""}",
    // Additional settings applied from dashboard
  };
</script>`;

    // Reset state when dialog closes
    const handleCloseDialog = () => {
      onOpenChange(false);
      setTimeout(() => {
        setShowCode(false);
        setCopiedCode(false);
      }, 300);
    };

    // Copy code to clipboard
    const handleCopyCode = () => {
      navigator.clipboard.writeText(integrationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    };

    // Simulated refresh of the preview
    const handleRefresh = () => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 800);
    };

    return (
      <Dialog open={open} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-[78vw] max-h-[78vh] w-[78vw] h-[78vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 md:p-6 pb-2 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold">
                  Widget Preview
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Preview how your testimonial widget will appear to visitors
                </DialogDescription>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={showCode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCode(!showCode)}
                    className="flex items-center gap-2"
                  >
                    <Code className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {showCode ? "Hide Code" : "View Code"}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="flex items-center gap-2"
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                    />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>

                <div className="hidden md:block h-6 border-l border-gray-300 mx-1"></div>

                <Tabs
                  value={mode}
                  onValueChange={(value: any) => onModeChange(value)}
                  className="w-full md:w-auto"
                >
                  <TabsList className="grid grid-cols-3 h-9 w-full md:w-auto">
                    <TabsTrigger
                      value="desktop"
                      className="flex items-center gap-1.5 px-3"
                    >
                      <Laptop className="h-3.5 w-3.5" />
                      <span className="text-xs">Desktop</span>
                    </TabsTrigger>
                    {customization?.tabletEnabled && (
                      <TabsTrigger
                        value="tablet"
                        className="flex items-center gap-1.5 px-3"
                      >
                        <Tablet className="h-3.5 w-3.5" />
                        <span className="text-xs">Tablet</span>
                      </TabsTrigger>
                    )}
                    {customization?.mobileEnabled && (
                      <TabsTrigger
                        value="mobile"
                        className="flex items-center gap-1.5 px-3"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        <span className="text-xs">Mobile</span>
                      </TabsTrigger>
                    )}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Tabs
              value={tab}
              onValueChange={(value: any) => onTabChange(value)}
              className="mt-6"
            >
              <TabsList className="w-full md:w-64 grid grid-cols-2">
                <TabsTrigger
                  value="widget"
                  className="flex items-center gap-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Widget</span>
                </TabsTrigger>
                <TabsTrigger value="form" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>Form</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <AnimatePresence mode="wait">
              {showCode ? (
                <motion.div
                  key="code"
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="p-6 h-full overflow-auto bg-white rounded-lg shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">
                        Integration Code
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="absolute top-0 left-0 right-0 h-10 bg-slate-900 rounded-t-md flex items-center px-4">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="text-xs font-mono text-slate-400 ml-4">
                          JavaScript
                        </div>
                      </div>
                      <pre className="bg-slate-900 text-slate-50 p-4 pt-12 rounded-md overflow-auto font-mono text-sm">
                        {integrationCode}
                      </pre>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800 text-sm">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span>Implementation Tips</span>
                      </h4>
                      <ul className="space-y-2 text-blue-700 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>
                            Add the integration code right before the closing{" "}
                            <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">
                              {"</body>"}
                            </code>{" "}
                            tag
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>
                            The widget will automatically use your settings from
                            the dashboard
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>
                            You can override settings with the{" "}
                            <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">
                              testimonialWidgetConfig
                            </code>{" "}
                            object
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>
                            Test the integration on a staging environment before
                            deploying to production
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="h-full overflow-auto"
                >
                  {/* Browser-like frame */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full border border-gray-200">
                    {/* Browser chrome */}
                    <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center">
                      <div className="flex items-center space-x-1.5 ml-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>

                      <div className="flex-1 mx-4">
                        <div className="bg-white border border-gray-300 rounded-md flex items-center px-3 py-1 text-sm text-gray-500 max-w-2xl mx-auto">
                          <Lock className="h-3.5 w-3.5 mr-2 text-gray-400" />
                          <span className="truncate">
                            https://www.example.com/your-website
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center mr-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Content area with website and widget */}
                    <div className="relative flex-1 overflow-auto">
                      {/* Demo website watermark */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 text-gray-200 text-5xl md:text-6xl font-bold whitespace-nowrap opacity-30">
                          DEMO WEBSITE
                        </div>
                      </div>

                      <div className="w-full h-full flex flex-col md:flex-row p-4">
                        {/* Demo website container with fixed max height and scrollable content */}
                        <div
                          className={cn(
                            "relative transition-all bg-white border border-gray-200 rounded-md shadow-sm",
                            mode === "desktop"
                              ? "w-full"
                              : mode === "tablet"
                                ? "w-full max-w-2xl mx-auto"
                                : "w-full max-w-sm mx-auto"
                          )}
                          style={{
                            height: "calc(100vh - 220px)",
                            overflow: "auto",
                            minWidth: mode === "mobile" ? "320px" : "auto",
                          }}
                        >
                          <div
                            className={cn(
                              "bg-white mx-auto transition-all",
                              mode === "desktop"
                                ? "p-8"
                                : mode === "tablet"
                                  ? "p-6"
                                  : "p-4"
                            )}
                          >
                            {tab === "widget" ? (
                              <div
                                className={cn(
                                  "space-y-6",
                                  mode === "mobile" && "space-y-4"
                                )}
                              >
                                {/* Sample Website Header/Navigation */}
                                <div className="border-b pb-4">
                                  <div className="flex justify-between items-center">
                                    <div
                                      className={cn(
                                        "font-bold text-gray-800",
                                        mode === "desktop"
                                          ? "text-xl"
                                          : "text-base"
                                      )}
                                    >
                                      Demo Company
                                    </div>
                                    <div
                                      className={cn(
                                        "hidden md:flex",
                                        mode === "desktop"
                                          ? "space-x-6"
                                          : "space-x-3"
                                      )}
                                    >
                                      <div className="text-gray-600 hover:text-gray-900 cursor-pointer">
                                        Products
                                      </div>
                                      <div className="text-gray-600 hover:text-gray-900 cursor-pointer">
                                        Pricing
                                      </div>
                                      {mode === "desktop" && (
                                        <>
                                          <div className="text-gray-600 hover:text-gray-900 cursor-pointer">
                                            About
                                          </div>
                                          <div className="text-gray-600 hover:text-gray-900 cursor-pointer">
                                            Contact
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    <button className="px-3 py-1 border border-blue-600 text-blue-600 rounded">
                                      Sign In
                                    </button>
                                  </div>
                                </div>

                                {/* Sample Website Content */}
                                <div>
                                  <h1
                                    className={cn(
                                      "font-bold mb-4",
                                      mode === "desktop"
                                        ? "text-4xl md:text-5xl"
                                        : mode === "tablet"
                                          ? "text-3xl"
                                          : "text-2xl"
                                    )}
                                  >
                                    {websiteContent.title}
                                  </h1>
                                  <p
                                    className={cn(
                                      "text-slate-600 mb-6",
                                      mode === "desktop"
                                        ? "text-lg"
                                        : "text-base"
                                    )}
                                  >
                                    {websiteContent.description}
                                  </p>
                                  <div className="flex space-x-4">
                                    <button
                                      className={cn(
                                        "bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium",
                                        mode === "desktop"
                                          ? "px-6 py-3"
                                          : "px-4 py-2 text-sm"
                                      )}
                                    >
                                      {websiteContent.ctaText}
                                    </button>
                                    <button
                                      className={cn(
                                        "border border-gray-300 hover:border-gray-400 rounded-md font-medium",
                                        mode === "desktop"
                                          ? "px-6 py-3"
                                          : "px-4 py-2 text-sm"
                                      )}
                                    >
                                      Learn More
                                    </button>
                                  </div>
                                </div>

                                <div
                                  className={cn(
                                    "border-t border-b my-8",
                                    mode === "desktop" ? "py-8" : "py-4"
                                  )}
                                >
                                  <h2
                                    className={cn(
                                      "font-semibold mb-6",
                                      mode === "desktop"
                                        ? "text-2xl"
                                        : mode === "tablet"
                                          ? "text-xl"
                                          : "text-lg mb-4"
                                    )}
                                  >
                                    {websiteContent.testimonialHeadline}
                                  </h2>
                                  <div
                                    className={cn(
                                      mode === "desktop"
                                        ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                                        : "space-y-4"
                                    )}
                                  >
                                    {websiteContent.testimonialQuotes.map(
                                      (quote, i) => (
                                        <div
                                          key={i}
                                          className={cn(
                                            "bg-slate-50 rounded-lg border shadow-sm",
                                            mode === "desktop" ? "p-5" : "p-3"
                                          )}
                                        >
                                          <div className="flex gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={i}
                                                className={cn(
                                                  "text-amber-400 fill-amber-400",
                                                  mode === "mobile"
                                                    ? "h-3 w-3"
                                                    : "h-4 w-4"
                                                )}
                                              />
                                            ))}
                                          </div>
                                          <p
                                            className={cn(
                                              "text-slate-700 mb-3",
                                              mode === "mobile" && "text-sm"
                                            )}
                                          >
                                            "{quote.text}"
                                          </p>
                                          <p
                                            className={cn(
                                              "text-slate-500",
                                              mode === "desktop"
                                                ? "text-sm"
                                                : "text-xs"
                                            )}
                                          >
                                            {quote.author}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h2
                                    className={cn(
                                      "font-semibold mb-4",
                                      mode === "desktop"
                                        ? "text-2xl"
                                        : mode === "tablet"
                                          ? "text-xl"
                                          : "text-lg"
                                    )}
                                  >
                                    About Our Features
                                  </h2>
                                  <p
                                    className={cn(
                                      "text-slate-600 mb-6",
                                      mode === "mobile" && "text-sm mb-4"
                                    )}
                                  >
                                    Our platform provides comprehensive
                                    solutions designed to streamline your
                                    workflow and increase productivity. With
                                    easy integration and powerful analytics,
                                    you'll have everything you need to succeed.
                                  </p>

                                  <div
                                    className={cn(
                                      mode === "desktop"
                                        ? "grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
                                        : mode === "tablet"
                                          ? "grid grid-cols-2 gap-4 mt-6"
                                          : "space-y-4 mt-4"
                                    )}
                                  >
                                    {[...Array(mode === "mobile" ? 2 : 3)].map(
                                      (_, i) => (
                                        <div
                                          key={i}
                                          className={cn(
                                            "border border-gray-200 rounded-lg",
                                            mode === "desktop" ? "p-4" : "p-3"
                                          )}
                                        >
                                          <div
                                            className={cn(
                                              "bg-blue-100 rounded-full flex items-center justify-center mb-3",
                                              mode === "desktop"
                                                ? "w-10 h-10"
                                                : "w-8 h-8"
                                            )}
                                          >
                                            <div
                                              className={cn(
                                                "bg-blue-600 rounded-md",
                                                mode === "desktop"
                                                  ? "w-5 h-5"
                                                  : "w-4 h-4"
                                              )}
                                            ></div>
                                          </div>
                                          <h3
                                            className={cn(
                                              "font-medium mb-2",
                                              mode === "mobile" && "text-sm"
                                            )}
                                          >
                                            Feature {i + 1}
                                          </h3>
                                          <p
                                            className={cn(
                                              "text-gray-500",
                                              mode === "desktop"
                                                ? "text-sm"
                                                : "text-xs"
                                            )}
                                          >
                                            Lorem ipsum dolor sit amet,
                                            consectetur adipiscing elit. Sed do
                                            eiusmod tempor incididunt.
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Footer placeholder */}
                                <div
                                  className={cn(
                                    "border-t",
                                    mode === "desktop"
                                      ? "mt-12 pt-8"
                                      : "mt-8 pt-4"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      mode === "mobile"
                                        ? "flex flex-col space-y-2"
                                        : "flex justify-between"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "text-gray-500",
                                        mode === "desktop"
                                          ? "text-sm"
                                          : "text-xs"
                                      )}
                                    >
                                      © 2025 Demo Company. All rights reserved.
                                    </div>
                                    <div
                                      className={cn(
                                        "text-gray-500 flex",
                                        mode === "desktop"
                                          ? "space-x-4 text-sm"
                                          : "space-x-3 text-xs"
                                      )}
                                    >
                                      <span>Privacy</span>
                                      <span>Terms</span>
                                      {mode !== "mobile" && (
                                        <span>Contact</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Widget is positioned outside of the demo website content for better visibility */}
                                <WebsiteWidget
                                  customization={customization}
                                  brandData={brandingGuide.brandData}
                                  formats={formats}
                                  incentives={incentives}
                                  displayRules={displayRules}
                                  triggers={triggers}
                                />
                              </div>
                            ) : (
                              <div className="flex justify-center items-center py-8">
                                <div
                                  className={cn(
                                    "bg-white p-8 rounded-lg border border-gray-200 shadow-sm overflow-auto",
                                    mode === "desktop"
                                      ? "w-full max-w-4xl"
                                      : mode === "tablet"
                                        ? "w-full max-w-2xl"
                                        : "w-full"
                                  )}
                                  style={{ maxHeight: "calc(100vh - 250px)" }}
                                >
                                  <TestimonialForm
                                    customization={customization}
                                    brandData={brandingGuide.brandData}
                                    formats={formats}
                                    incentives={incentives}
                                    onSubmit={async (
                                      s: TestimonialSubmission
                                    ) => {
                                      console.log("s", s);
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter className="p-4 border-t">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <Label htmlFor="show-incentives" className="mr-2 text-sm">
                    Show Incentives
                  </Label>
                  <Switch
                    id="show-incentives"
                    checked={incentives?.enabled}
                    onCheckedChange={() => {
                      onUpdateIncentives({
                        enabled: !incentives?.enabled,
                      });
                    }}
                  />
                </div>

                <div className="text-xs text-gray-500">
                  {mode === "desktop"
                    ? "Desktop View"
                    : mode === "tablet"
                      ? "Tablet View"
                      : "Mobile View"}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="w-full sm:w-auto"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export default WidgetPreviewDialog;
