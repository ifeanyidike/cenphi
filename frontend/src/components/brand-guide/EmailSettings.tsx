import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  Mail,
  Copy,
  Check,
  Palette,
  Layers,
  Wand2,
  Fingerprint,
  RefreshCw,
  EyeIcon,
  LayoutTemplate,
  Check as CheckIcon,
  ChevronRight,
  Info,
  ShieldCheck,
  ThumbsUp,
  User,
  LucideMessageSquare,
  MailCheck,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";
import { useEffect, useState } from "react";
import { getInitials } from "@/utils/utils";
import { signatureTemplates } from "./constants";
import { motion } from "framer-motion";

const EmailSettings = () => {
  const store = brandGuideStore;
  const { brandData } = store;

  const [activeSignatureTemplate, setActiveSignatureTemplate] =
    useState("simple");
  const [copied, setCopied] = useState(false);
  const [signatureExpanded, setSignatureExpanded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [sigPreviewDevice, setSigPreviewDevice] = useState<
    "desktop" | "mobile"
  >("desktop");
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Initialize email settings if they don't exist
  useEffect(() => {
    if (!brandData.voice?.channels?.email?.signature) {
      store.updateBrandData(["voice", "channels", "email", "signature"], {
        text: "",
        includeCompanyLogo: true,
        includeSocialLinks: true,
        template: "simple",
      });
    }

    if (!brandData.voice?.channels?.email?.sender) {
      store.updateBrandData(["voice", "channels", "email", "sender"], {
        name: "",
        email: "",
      });
    }
  }, [brandData.voice?.channels?.email, store]);

  // Apply signature template
  const applySignatureTemplate = (template: string) => {
    const newSignature = signatureTemplates[template]
      .replace(
        /{{senderName}}/g,
        brandData.voice.channels.email?.sender.name || "Your Name"
      )
      .replace(/{{position}}/g, "Position Title")
      .replace(/{{companyName}}/g, brandData.name || "Company Name")
      .replace(
        /{{contactEmail}}/g,
        brandData.voice.channels.email?.sender.email || "email@example.com"
      )
      .replace(/{{contactPhone}}/g, "555-123-4567")
      .replace(/{{websiteUrl}}/g, "www.yourwebsite.com")
      .replace(/{{streetAddress}}/g, "123 Business St")
      .replace(/{{city}}/g, "City")
      .replace(/{{state}}/g, "State")
      .replace(/{{zipCode}}/g, "12345")
      .replace(/{{socialLinks}}/g, "Twitter • LinkedIn • Instagram")
      .replace(
        /{{tagline}}/g,
        brandData.tagline || "Your company tagline here"
      );

    store.updateBrandData(
      ["voice", "channels", "email", "signature", "text"],
      newSignature
    );
    store.updateBrandData(
      ["voice", "channels", "email", "signature", "template"],
      template
    );
    setActiveSignatureTemplate(template);

    // Show confirmation animation
    setSelectedTemplate(template);
    setTimeout(() => setSelectedTemplate(null), 800);
  };

  // Function to copy signature to clipboard
  const copySignature = () => {
    if (brandData.voice?.channels?.email?.signature?.text) {
      navigator.clipboard.writeText(
        brandData.voice.channels.email.signature.text
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sender Settings Card */}
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950 overflow-hidden">
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">Sender Identity</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Define who testimonial requests come from
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-white dark:bg-gray-900 font-normal px-2"
            >
              Email Settings
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label
                    htmlFor="sender-name"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <span>Sender Name</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="w-56">
                          <p className="text-xs">
                            The name that will appear in recipients' inboxes
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className="text-xs text-gray-500">Required</span>
                </div>
                <div className="relative">
                  <Input
                    id="sender-name"
                    placeholder="Jane Smith or Company Team"
                    value={brandData.voice?.channels?.email?.sender?.name || ""}
                    onChange={(e) =>
                      store.updateBrandData(
                        ["voice", "channels", "email", "sender", "name"],
                        e.target.value
                      )
                    }
                    className="pl-9 bg-white dark:bg-gray-950"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <User className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                  <span>Personalize with a name for better open rates</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <Label
                    htmlFor="sender-email"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <span>Sender Email</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="w-56">
                          <p className="text-xs">
                            The email address testimonial requests will be sent
                            from
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className="text-xs text-gray-500">Required</span>
                </div>
                <div className="relative">
                  <Input
                    id="sender-email"
                    placeholder="feedback@yourbrand.com"
                    value={
                      brandData.voice?.channels?.email?.sender?.email || ""
                    }
                    onChange={(e) =>
                      store.updateBrandData(
                        ["voice", "channels", "email", "sender", "email"],
                        e.target.value
                      )
                    }
                    className="pl-9 bg-white dark:bg-gray-950"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <Mail className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                  <span>
                    Use a valid, professional email that instills trust
                  </span>
                </div>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden bg-white dark:bg-gray-950">
              <div className="bg-gray-50 dark:bg-gray-900 border-b p-2 flex items-center justify-between">
                <div className="text-xs font-medium flex items-center gap-1.5">
                  <MailCheck className="h-3.5 w-3.5 text-blue-500" />
                  Preview
                </div>
                <Badge variant="outline" className="text-xs py-0 px-2 h-5">
                  Sender Appearance
                </Badge>
              </div>
              <div className="p-4">
                <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white"
                      style={{
                        backgroundColor: brandData.colors?.primary || "#4F46E5",
                      }}
                    >
                      <span className="text-xs font-medium">
                        {getInitials(
                          brandData.voice?.channels?.email?.sender?.name ||
                            brandData.name ||
                            "YB"
                        )}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {brandData.voice?.channels?.email?.sender?.name ||
                          "Your Name"}
                        <span className="text-gray-500 font-normal text-xs ml-1">
                          {" <"}
                          {brandData.voice?.channels?.email?.sender?.email ||
                            "email@example.com"}
                          {">"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        to:{" "}
                        <span className="underline">customer@example.com</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-medium">
                    Subject: Feedback Request from{" "}
                    {brandData.name || "Your Brand"}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500 flex items-center justify-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  <span>
                    This is how your sender appears in recipient inboxes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Builder Card */}
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950 overflow-hidden">
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <Fingerprint className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-base">Email Signature</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Create a professional brand signature
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1"
              onClick={() => setSignatureExpanded(!signatureExpanded)}
            >
              {signatureExpanded ? (
                <>
                  <span className="text-xs">Collapse</span>
                  <ChevronRight className="h-3.5 w-3.5 transform rotate-90" />
                </>
              ) : (
                <>
                  <span className="text-xs">Expand</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent
          className={`pt-5 pb-5 ${signatureExpanded ? "" : "max-h-[300px] overflow-hidden"}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-4">
              <div className="rounded-md border overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      Signature Templates
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs py-0 px-2 h-5">
                    Quick Setup
                  </Badge>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {["simple", "professional", "detailed", "marketing"].map(
                    (template) => (
                      <motion.div
                        key={template}
                        className={`border rounded-md cursor-pointer overflow-hidden ${
                          activeSignatureTemplate === template
                            ? "ring-2 ring-offset-1 ring-blue-500"
                            : ""
                        }`}
                        onClick={() => applySignatureTemplate(template)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        animate={{
                          borderColor:
                            selectedTemplate === template ? "#3b82f6" : "",
                          backgroundColor:
                            selectedTemplate === template ? "#eff6ff" : "",
                        }}
                      >
                        <div className="bg-gray-50 dark:bg-gray-900 p-2 border-b flex items-center justify-between">
                          <span className="text-xs font-medium capitalize">
                            {template}
                          </span>
                          {activeSignatureTemplate === template && (
                            <CheckIcon className="h-3.5 w-3.5 text-blue-500" />
                          )}
                        </div>
                        <div
                          className="p-2 text-[10px] text-gray-500 h-20 overflow-hidden"
                          onMouseEnter={() => {
                            setSelectedTemplate(template);
                            setShowTemplatePreview(true);
                          }}
                          onMouseLeave={() => {
                            setSelectedTemplate(null);
                            setShowTemplatePreview(false);
                          }}
                        >
                          <div className="opacity-80">
                            {signatureTemplates[template]
                              .replace(/{{senderName}}/g, "John Doe")
                              .replace(/{{position}}/g, "Position")
                              .replace(
                                /{{companyName}}/g,
                                brandData.name || "Company"
                              )
                              .replace(/{{contactEmail}}/g, "email@example.com")
                              .split("\n")
                              .slice(0, 5)
                              .join("\n")}
                            ...
                          </div>
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <span>Customize Signature</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="w-56">
                          <p className="text-xs">
                            Edit your email signature directly
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={copySignature}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                          <span className="text-green-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        applySignatureTemplate(activeSignatureTemplate);
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      <span>Reset</span>
                    </Button>
                  </div>
                </div>

                <Textarea
                  placeholder="Enter your email signature text..."
                  className="font-mono text-sm min-h-[150px] bg-white dark:bg-gray-950"
                  value={
                    brandData.voice?.channels?.email?.signature?.text || ""
                  }
                  onChange={(e) =>
                    store.updateBrandData(
                      ["voice", "channels", "email", "signature", "text"],
                      e.target.value
                    )
                  }
                />

                <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-3 text-xs">
                  <p className="font-medium mb-2 flex items-center">
                    <Wand2 className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                    <span>Available Variables:</span>
                  </p>
                  <div className="grid grid-cols-3 gap-y-1.5 text-gray-500">
                    <div>
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                        {`{{senderName}}`}
                      </code>
                    </div>
                    <div>
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                        {`{{companyName}}`}
                      </code>
                    </div>
                    <div>
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                        {`{{position}}`}
                      </code>
                    </div>
                    <div>
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                        {`{{contactEmail}}`}
                      </code>
                    </div>
                    <div>
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                        {`{{contactPhone}}`}
                      </code>
                    </div>
                    <div>
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                        {`{{tagline}}`}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <span>Display Options</span>
                  </Label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="include-logo"
                      className="text-sm flex items-center gap-1.5"
                    >
                      Company Logo
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="w-56">
                            <p className="text-xs">
                              Include company logo in email signature
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Switch
                      id="include-logo"
                      checked={
                        brandData.voice?.channels?.email?.signature
                          ?.includeCompanyLogo
                      }
                      onCheckedChange={(checked) =>
                        store.updateBrandData(
                          [
                            "voice",
                            "channels",
                            "email",
                            "signature",
                            "includeCompanyLogo",
                          ],
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="include-social"
                      className="text-sm flex items-center gap-1.5"
                    >
                      Social Media Links
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="w-56">
                            <p className="text-xs">
                              Include social media links in your signature
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Switch
                      id="include-social"
                      checked={
                        brandData.voice?.channels?.email?.signature
                          ?.includeSocialLinks
                      }
                      onCheckedChange={(checked) =>
                        store.updateBrandData(
                          [
                            "voice",
                            "channels",
                            "email",
                            "signature",
                            "includeSocialLinks",
                          ],
                          checked
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="border rounded-md overflow-hidden h-full flex flex-col">
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Live Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPreviewMode(
                          previewMode === "light" ? "dark" : "light"
                        )
                      }
                      className="h-7 w-7 p-0"
                    >
                      <Palette className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSigPreviewDevice(
                          sigPreviewDevice === "desktop" ? "mobile" : "desktop"
                        )
                      }
                      className="h-7 w-7 p-0"
                    >
                      {sigPreviewDevice === "desktop" ? (
                        <Layers className="h-3.5 w-3.5" />
                      ) : (
                        <Layers className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div
                  className={`flex-grow p-4 overflow-auto ${previewMode === "dark" ? "bg-gray-900" : "bg-white"}`}
                >
                  <div
                    className={`${sigPreviewDevice === "mobile" ? "max-w-[320px] mx-auto" : ""}`}
                  >
                    {/* Email Content Preview */}
                    <div
                      className={`border ${previewMode === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"} rounded-t-md p-3`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white"
                          style={{
                            backgroundColor:
                              brandData.colors?.primary || "#4F46E5",
                          }}
                        >
                          <span className="text-xs font-medium">
                            {getInitials(
                              brandData.voice?.channels?.email?.sender?.name ||
                                brandData.name ||
                                "YB"
                            )}
                          </span>
                        </div>
                        <div>
                          <div
                            className={`text-sm font-medium ${previewMode === "dark" ? "text-gray-200" : ""}`}
                          >
                            {brandData.voice?.channels?.email?.sender?.name ||
                              "Your Name"}
                          </div>
                          <div className="text-xs text-gray-500">to: me</div>
                        </div>
                      </div>
                    </div>

                    {/* Email Body */}
                    <div
                      className={`border border-t-0 ${previewMode === "dark" ? "border-gray-700 bg-gray-800 text-gray-200" : "border-gray-200 bg-white"} rounded-b-md p-4`}
                    >
                      <div className="text-sm mb-10">
                        <p>Thank you for your recent purchase!</p>
                        <p className="mt-2">
                          We appreciate your business and would love to hear
                          your feedback.
                        </p>
                        <p className="mt-2">Best regards,</p>
                      </div>

                      {/* Signature Area */}
                      <div
                        className={`border-t ${previewMode === "dark" ? "border-gray-700" : "border-gray-200"} pt-4 mt-6`}
                      >
                        {/* Logo */}
                        {brandData.voice?.channels?.email?.signature
                          ?.includeCompanyLogo && (
                          <div className="mb-3">
                            {brandData.logo?.main ? (
                              <div className="h-10 max-w-[120px]">
                                <img
                                  src={brandData.logo.main}
                                  alt={`${brandData.name} logo`}
                                  className="h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div
                                className="h-10 w-10 rounded-md flex items-center justify-center text-white"
                                style={{
                                  backgroundColor:
                                    brandData.colors?.primary || "#4F46E5",
                                }}
                              >
                                <span className="text-sm font-medium">
                                  {getInitials(brandData.name || "Your Brand")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Signature Text */}
                        <div
                          className={`text-sm whitespace-pre-line ${previewMode === "dark" ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {brandData.voice?.channels?.email?.signature?.text ||
                            `Your Name
Position
Company
email@example.com`}
                        </div>

                        {/* Social Links */}
                        {brandData.voice?.channels?.email?.signature
                          ?.includeSocialLinks && (
                          <div className="flex items-center gap-2 mt-3">
                            <div
                              className={`w-6 h-6 rounded-full ${previewMode === "dark" ? "bg-gray-700" : "bg-gray-200"} flex items-center justify-center`}
                            >
                              <span className="text-xs">T</span>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full ${previewMode === "dark" ? "bg-gray-700" : "bg-gray-200"} flex items-center justify-center`}
                            >
                              <span className="text-xs">L</span>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full ${previewMode === "dark" ? "bg-gray-700" : "bg-gray-200"} flex items-center justify-center`}
                            >
                              <span className="text-xs">F</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {showTemplatePreview && selectedTemplate && (
                  <HoverCard open>
                    <HoverCardContent
                      side="right"
                      className="w-80 p-0 border shadow-lg"
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: "-20rem",
                        transform: "translateY(-50%)",
                      }}
                    >
                      <div className="bg-gray-50 dark:bg-gray-900 p-2 border-b">
                        <span className="text-xs font-medium capitalize">
                          {selectedTemplate} Template
                        </span>
                      </div>
                      <div className="p-3 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {signatureTemplates[selectedTemplate]
                          .replace(/{{senderName}}/g, "John Doe")
                          .replace(/{{position}}/g, "Position Title")
                          .replace(
                            /{{companyName}}/g,
                            brandData.name || "Company Name"
                          )
                          .replace(/{{contactEmail}}/g, "john.doe@company.com")
                          .replace(/{{contactPhone}}/g, "(555) 123-4567")
                          .replace(/{{websiteUrl}}/g, "www.company.com")
                          .replace(/{{streetAddress}}/g, "123 Business St")
                          .replace(/{{city}}/g, "City")
                          .replace(/{{state}}/g, "State")
                          .replace(/{{zipCode}}/g, "12345")
                          .replace(
                            /{{socialLinks}}/g,
                            "Twitter • LinkedIn • Instagram"
                          )
                          .replace(
                            /{{tagline}}/g,
                            brandData.tagline || "Your company tagline"
                          )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Template Card */}
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950 overflow-hidden">
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <LucideMessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">Email Template</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Customize your testimonial request message
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8">
                <Wand2 className="h-4 w-4 mr-1.5 text-amber-500" />
                <span className="text-xs">AI Suggestions</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="email-template"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <span>Request Template</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="w-56">
                        <p className="text-xs">
                          Customize the message that will be sent to request
                          testimonials
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Badge variant="outline" className="text-xs py-0 px-2 h-5">
                  Required
                </Badge>
              </div>

              <Textarea
                id="email-template"
                value={brandData.voice?.channels?.email?.requestTemplate || ""}
                onChange={(e) =>
                  store.updateBrandData(
                    ["voice", "channels", "email", "requestTemplate"],
                    e.target.value
                  )
                }
                className="min-h-[200px] font-mono text-sm bg-white dark:bg-gray-950"
                placeholder="Hi {{name}},

Thank you for choosing {{brand}}. We value your opinion and would love to hear about your experience. Would you take a moment to share your thoughts?

Thanks,
{{brand}} Team"
              />

              <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-3 text-xs">
                <p className="font-medium mb-2 flex items-center">
                  <Wand2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  <span>Template Variables:</span>
                </p>
                <div className="grid grid-cols-3 gap-y-1.5 text-gray-500">
                  <div>
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                      {`{{name}}`}
                    </code>
                    <span className="ml-1 text-[10px]">Customer name</span>
                  </div>
                  <div>
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                      {`{{brand}}`}
                    </code>
                    <span className="ml-1 text-[10px]">Brand name</span>
                  </div>
                  <div>
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
                      {`{{product}}`}
                    </code>
                    <span className="ml-1 text-[10px]">Product name</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden bg-white dark:bg-gray-950 flex flex-col">
              <div className="bg-gray-50 dark:bg-gray-900 border-b p-2 flex items-center justify-between">
                <div className="text-xs font-medium flex items-center gap-1.5">
                  <EyeIcon className="h-3.5 w-3.5 text-gray-500" />
                  Template Preview
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                  >
                    <MailCheck className="h-3 w-3 mr-1" />
                    Test Send
                  </Button>
                </div>
              </div>

              <div className="flex-grow p-3 overflow-auto">
                <div className="border rounded-md overflow-hidden">
                  <div
                    className="p-2.5 text-white"
                    style={{
                      backgroundColor: brandData.colors?.primary || "#4F46E5",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">
                        Testimonial Request
                      </div>
                      <div className="text-xs opacity-90">
                        From {brandData.name || "Your Brand"}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800">
                    <div className="text-sm whitespace-pre-line">
                      {(brandData.voice?.channels?.email?.requestTemplate || "")
                        .replace(/{{name}}/g, "Alex Thompson")
                        .replace(/{{brand}}/g, brandData.name || "Your Brand")
                        .replace(/{{product}}/g, "Premium Plan")}
                    </div>

                    {brandData.voice?.ctas?.length > 0 && (
                      <div className="mt-4 pt-4 border-t text-center">
                        <button
                          className="px-4 py-2 rounded-md text-white text-sm font-medium"
                          style={{
                            backgroundColor:
                              brandData.colors?.primary || "#4F46E5",
                          }}
                        >
                          {brandData.voice?.ctas?.[0] ||
                            "Share your experience"}
                        </button>
                      </div>
                    )}

                    {/* Signature Preview */}
                    {brandData.voice?.channels?.email?.signature?.text && (
                      <div className="mt-4 pt-4 border-t">
                        {/* Logo */}
                        {brandData.voice?.channels?.email?.signature
                          ?.includeCompanyLogo && (
                          <div className="mb-3">
                            {brandData.logo?.main ? (
                              <div className="h-8 max-w-[100px]">
                                <img
                                  src={brandData.logo.main}
                                  alt={`${brandData.name} logo`}
                                  className="h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div
                                className="h-8 w-8 rounded-full flex items-center justify-center text-white"
                                style={{
                                  backgroundColor:
                                    brandData.colors?.primary || "#4F46E5",
                                }}
                              >
                                <span className="text-xs font-medium">
                                  {getInitials(brandData.name || "Your Brand")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-xs whitespace-pre-line text-gray-600 dark:text-gray-300">
                          {brandData.voice?.channels?.email?.signature?.text ||
                            ""}
                        </div>

                        {brandData.voice?.channels?.email?.signature
                          ?.includeSocialLinks && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-xs">T</span>
                            </div>
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-xs">L</span>
                            </div>
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-xs">F</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 px-2 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>
                      Email templates with personal touches can increase
                      responses by up to 30%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default observer(EmailSettings);
