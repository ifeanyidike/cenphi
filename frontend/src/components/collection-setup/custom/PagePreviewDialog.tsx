//@ts-nocheck
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Laptop,
  Tablet,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Share2,
  FileText,
  Video,
  Mic,
  Camera,
  MessageSquare,
  Star,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CollectionSettings } from "@/types/setup";

interface PagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CollectionSettings["custom"];
  mode: "desktop" | "tablet" | "mobile";
  onModeChange: (mode: "desktop" | "tablet" | "mobile") => void;
}

const PagePreviewDialog: React.FC<PagePreviewDialogProps> = ({
  open,
  onOpenChange,
  settings,
  mode,
  onModeChange,
}) => {
  const [activeStep, setActiveStep] = useState<"overview" | "form" | "success">(
    "overview"
  );
  const [copied, setCopied] = useState(false);

  // Get page URL based on settings
  const getPageUrl = () => {
    if (settings.useCustomDomain && settings.customDomain) {
      return `https://${settings.customDomain}`;
    }
    return `https://${settings.subdomain || "your-company"}.testimonials.app`;
  };

  // Copy page URL to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(getPageUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to get the background style based on theme settings
  const getBackgroundStyle = () => {
    if (settings.themeSettings?.heroType === "gradient") {
      return "bg-gradient-to-br from-blue-400 to-purple-500";
    }
    if (
      settings.themeSettings?.heroType === "image" &&
      settings.themeSettings?.heroImage
    ) {
      return `bg-cover bg-center bg-no-repeat`;
    }
    return `bg-[${settings.themeSettings?.backgroundColor || "#ffffff"}]`;
  };

  // Get the primary color with a fallback
  const primaryColor = settings.themeSettings?.primaryColor || "#4F46E5";

  // Get text color or fallback
  const textColor = settings.themeSettings?.textColor || "#1F2937";

  // Get font family
  const fontFamily = settings.themeSettings?.fontFamily || "inter";

  // Apply border radius
  const borderRadius = settings.themeSettings?.borderRadius || 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                Page Preview
              </DialogTitle>
              <DialogDescription>
                Preview how your testimonial page will appear to visitors
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-100"
              >
                Published
              </Badge>

              <Tabs
                value={mode}
                onValueChange={(value: any) => onModeChange(value)}
              >
                <TabsList className="grid grid-cols-3 h-9">
                  <TabsTrigger
                    value="desktop"
                    className="flex items-center gap-1.5 px-3"
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    <span className="text-xs">Desktop</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="tablet"
                    className="flex items-center gap-1.5 px-3"
                  >
                    <Tablet className="h-3.5 w-3.5" />
                    <span className="text-xs">Tablet</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="mobile"
                    className="flex items-center gap-1.5 px-3"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span className="text-xs">Mobile</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="mt-6 border-b flex items-center">
            <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-primary text-primary font-medium">
              <ExternalLink className="h-4 w-4" />
              <span>{getPageUrl()}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        <div
          className={cn(
            "flex-1 overflow-auto",
            mode === "mobile"
              ? "max-w-[375px]"
              : mode === "tablet"
                ? "max-w-[768px]"
                : "",
            mode !== "desktop" && "mx-auto border-x border-gray-200"
          )}
        >
          <div
            className={cn("min-h-full", getBackgroundStyle())}
            style={{ fontFamily }}
          >
            {/* Preview Header Section */}
            <header className="pt-12 pb-16 px-6 sm:px-12 text-center relative">
              <div className="max-w-3xl mx-auto">
                {settings.themeSettings?.showLogo &&
                  settings.themeSettings?.logo && (
                    <div className="mb-8">
                      <img
                        src={settings.themeSettings.logo}
                        alt={settings.companyName || "Company Logo"}
                        className="h-12 mx-auto object-contain"
                      />
                    </div>
                  )}

                <h1
                  className={cn(
                    "text-3xl sm:text-4xl md:text-5xl font-bold mb-4",
                    settings.themeSettings?.heroType === "gradient"
                      ? "text-white"
                      : `text-[${textColor}]`
                  )}
                  style={{
                    color:
                      settings.themeSettings?.heroType === "gradient"
                        ? "white"
                        : textColor,
                  }}
                >
                  {settings.pageTitle || "Share Your Experience"}
                </h1>

                <p
                  className={cn(
                    "text-lg sm:text-xl opacity-90",
                    settings.themeSettings?.heroType === "gradient"
                      ? "text-white"
                      : `text-[${textColor}]`
                  )}
                  style={{
                    color:
                      settings.themeSettings?.heroType === "gradient"
                        ? "white"
                        : textColor,
                  }}
                >
                  {settings.pageDescription ||
                    "We value your feedback! Share your story and help others make informed decisions."}
                </p>
              </div>
            </header>

            {/* Preview Content Section */}
            <div
              className={cn(
                "bg-white py-12 px-6 sm:px-12",
                settings.themeSettings?.heroType !== "gradient" &&
                  "bg-transparent",
                activeStep === "overview" ? "min-h-[400px]" : "min-h-[600px]"
              )}
            >
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Left Column - Navigation */}
                  <div className="w-full md:w-1/3">
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 sticky top-6">
                      <div className="text-sm font-medium mb-4">Steps</div>
                      <div className="space-y-2">
                        <div
                          className={cn(
                            "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                            activeStep === "overview"
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-gray-100"
                          )}
                          onClick={() => setActiveStep("overview")}
                        >
                          <div
                            className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs",
                              activeStep === "overview"
                                ? "bg-primary text-white"
                                : "bg-gray-200"
                            )}
                          >
                            1
                          </div>
                          <span>Overview</span>
                        </div>

                        <div
                          className={cn(
                            "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                            activeStep === "form"
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-gray-100"
                          )}
                          onClick={() => setActiveStep("form")}
                        >
                          <div
                            className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs",
                              activeStep === "form"
                                ? "bg-primary text-white"
                                : "bg-gray-200"
                            )}
                          >
                            2
                          </div>
                          <span>Submit Testimonial</span>
                        </div>

                        <div
                          className={cn(
                            "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                            activeStep === "success"
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-gray-100"
                          )}
                          onClick={() => setActiveStep("success")}
                        >
                          <div
                            className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs",
                              activeStep === "success"
                                ? "bg-primary text-white"
                                : "bg-gray-200"
                            )}
                          >
                            3
                          </div>
                          <span>Success</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium mb-3">Share This Page</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center gap-2 mb-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Link</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center gap-2"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share</span>
                      </Button>
                    </div>
                  </div>

                  {/* Right Column - Content */}
                  <div className="w-full md:w-2/3">
                    <AnimatePresence mode="wait">
                      {activeStep === "overview" && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">
                              Why Share Your Experience?
                            </h2>
                            <p className="text-gray-700 mb-4">
                              Your testimonial helps us improve our products and
                              services while helping potential customers make
                              informed decisions. We appreciate your honest
                              feedback and the time you take to share your
                              experience.
                            </p>
                            <Button
                              style={{ backgroundColor: primaryColor }}
                              className="mt-2"
                              onClick={() => setActiveStep("form")}
                            >
                              Get Started
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>

                          <div className="border-t border-gray-200 pt-8 mb-8">
                            <h3 className="text-lg font-medium mb-4">
                              Choose How to Share
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div
                                className={cn(
                                  "border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors",
                                  `rounded-[${borderRadius}px]`
                                )}
                              >
                                <div className="flex flex-col items-center text-center mb-2">
                                  <div
                                    className={cn(
                                      "h-12 w-12 rounded-full flex items-center justify-center mb-3",
                                      "bg-primary/10"
                                    )}
                                    style={{ color: primaryColor }}
                                  >
                                    <Video className="h-6 w-6" />
                                  </div>
                                  <h4 className="font-medium">
                                    Video Testimonial
                                  </h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Record a video sharing your experience
                                  </p>
                                </div>
                              </div>

                              <div
                                className={cn(
                                  "border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors",
                                  `rounded-[${borderRadius}px]`
                                )}
                              >
                                <div className="flex flex-col items-center text-center mb-2">
                                  <div
                                    className={cn(
                                      "h-12 w-12 rounded-full flex items-center justify-center mb-3",
                                      "bg-primary/10"
                                    )}
                                    style={{ color: primaryColor }}
                                  >
                                    <MessageSquare className="h-6 w-6" />
                                  </div>
                                  <h4 className="font-medium">
                                    Text Testimonial
                                  </h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Write your experience in your own words
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-200 pt-8">
                            <h3 className="text-lg font-medium mb-4">
                              What Others Are Saying
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                              <div
                                className={cn(
                                  "bg-gray-50 p-4 rounded-lg",
                                  `rounded-[${borderRadius}px]`
                                )}
                              >
                                <div className="flex items-center gap-1 mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className="h-4 w-4 text-amber-400 fill-amber-400"
                                    />
                                  ))}
                                </div>
                                <p className="text-gray-700 italic mb-3">
                                  "This product has completely transformed our
                                  workflow. The customer support team is amazing
                                  and always responsive."
                                </p>
                                <div className="text-sm font-medium">
                                  John D., Marketing Director
                                </div>
                                <div className="text-xs text-gray-500">
                                  Acme Corp
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeStep === "form" && (
                        <motion.div
                          key="form"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="mb-6">
                            <h2 className="text-2xl font-semibold mb-4">
                              Share Your Testimonial
                            </h2>
                            <p className="text-gray-700">
                              We appreciate your feedback. Please fill out the
                              form below to share your experience.
                            </p>
                          </div>

                          {settings.customForm?.enableRatings && (
                            <div className="mb-8">
                              <label className="block text-sm font-medium mb-2">
                                {settings.customForm.ratingQuestion ||
                                  "How would you rate your experience?"}
                              </label>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <div
                                    key={rating}
                                    className={cn(
                                      "cursor-pointer p-1 rounded-full hover:bg-primary/10 transition-colors",
                                      rating === 5
                                        ? "text-primary"
                                        : "text-gray-300"
                                    )}
                                  >
                                    <Star
                                      className="h-8 w-8"
                                      fill={
                                        rating === 5 ? primaryColor : "none"
                                      }
                                      style={{
                                        color:
                                          rating === 5
                                            ? primaryColor
                                            : "#D1D5DB",
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mb-6">
                            <div className="mb-8 space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  {settings.customForm?.mainQuestion ||
                                    "What has been your experience with our product/service?"}
                                </label>
                                <textarea
                                  className={cn(
                                    "w-full p-3 border rounded-lg transition-colors",
                                    `rounded-[${borderRadius}px]`,
                                    "focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                  )}
                                  rows={5}
                                  placeholder="Share your thoughts here..."
                                  style={{ borderColor: `${primaryColor}50` }}
                                ></textarea>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Full Name
                                  </label>
                                  <input
                                    type="text"
                                    className={cn(
                                      "w-full p-2.5 border rounded-lg transition-colors",
                                      `rounded-[${borderRadius}px]`,
                                      "focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    )}
                                    placeholder="Your name"
                                    style={{ borderColor: `${primaryColor}50` }}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Email Address
                                  </label>
                                  <input
                                    type="email"
                                    className={cn(
                                      "w-full p-2.5 border rounded-lg transition-colors",
                                      `rounded-[${borderRadius}px]`,
                                      "focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    )}
                                    placeholder="Your email"
                                    style={{ borderColor: `${primaryColor}50` }}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Company Name
                                  </label>
                                  <input
                                    type="text"
                                    className={cn(
                                      "w-full p-2.5 border rounded-lg transition-colors",
                                      `rounded-[${borderRadius}px]`,
                                      "focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    )}
                                    placeholder="Your company"
                                    style={{ borderColor: `${primaryColor}50` }}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Job Title
                                  </label>
                                  <input
                                    type="text"
                                    className={cn(
                                      "w-full p-2.5 border rounded-lg transition-colors",
                                      `rounded-[${borderRadius}px]`,
                                      "focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    )}
                                    placeholder="Your position"
                                    style={{ borderColor: `${primaryColor}50` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {settings.customForm?.consentRequired && (
                              <div className="mb-6">
                                <div className="flex items-start gap-2">
                                  <div className="flex h-5 items-center">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-primary"
                                      style={{ accentColor: primaryColor }}
                                    />
                                  </div>
                                  <div className="text-sm">
                                    <label className="font-medium text-gray-700">
                                      {settings.customForm.consentText ||
                                        "I agree to allow [Company Name] to use my testimonial for marketing purposes."}
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="pt-4">
                              <Button
                                className="w-full sm:w-auto"
                                style={{ backgroundColor: primaryColor }}
                                onClick={() => setActiveStep("success")}
                              >
                                {settings.customForm?.submitButtonText ||
                                  "Submit Testimonial"}
                              </Button>

                              {settings.customForm?.showPrivacyNotice && (
                                <div className="mt-4 text-xs text-gray-500">
                                  By submitting this form, you agree to our{" "}
                                  <a href="#" className="underline">
                                    Privacy Policy
                                  </a>
                                  .
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeStep === "success" && (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="py-8 text-center"
                        >
                          <div
                            className={cn(
                              "mx-auto h-20 w-20 rounded-full mb-6 flex items-center justify-center",
                              "bg-primary/10"
                            )}
                            style={{ color: primaryColor }}
                          >
                            <Check className="h-10 w-10" />
                          </div>

                          <h2 className="text-2xl font-semibold mb-4">
                            Thank You!
                          </h2>
                          <p className="text-gray-700 mb-8 max-w-md mx-auto">
                            {settings.customForm?.successMessage ||
                              "Your testimonial has been submitted successfully. We appreciate your feedback and thank you for taking the time to share your experience."}
                          </p>

                          {settings.customForm?.incentivesEnabled && (
                            <div
                              className={cn(
                                "max-w-sm mx-auto mb-8 p-6 border rounded-lg",
                                `rounded-[${borderRadius}px]`,
                                "bg-primary/5 border-primary/20"
                              )}
                            >
                              <h3 className="font-medium mb-2">Your Reward</h3>
                              <p className="text-gray-700 mb-4">
                                Use the code below to get 10% off your next
                                purchase:
                              </p>
                              <div
                                className={cn(
                                  "bg-white border px-4 py-3 rounded font-mono text-lg mb-4",
                                  `rounded-[${borderRadius}px]`
                                )}
                              >
                                THANKYOU10
                              </div>
                              <p className="text-sm text-gray-500">
                                This code expires in 30 days.
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3 justify-center">
                            <Button
                              variant="outline"
                              className="flex items-center gap-2"
                              onClick={() => setActiveStep("overview")}
                            >
                              Return to Home
                            </Button>
                            <Button
                              style={{ backgroundColor: primaryColor }}
                              className="flex items-center gap-2"
                            >
                              <Share2 className="h-4 w-4" />
                              Share With Others
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <footer className="py-8 px-6 sm:px-12 text-center bg-gray-50 border-t">
              <div className="max-w-3xl mx-auto">
                <p className="text-sm text-gray-500">
                  &copy; {new Date().getFullYear()}{" "}
                  {settings.companyName || "Your Company"}. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </div>

        <DialogFooter className="border-t p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close Preview
          </Button>
          <a
            href={getPageUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
            style={{ backgroundColor: primaryColor }}
          >
            Open Page
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PagePreviewDialog;
