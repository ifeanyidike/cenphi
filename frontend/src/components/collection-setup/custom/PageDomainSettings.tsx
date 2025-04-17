import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Lock,
  ExternalLink,
  CheckCircle2,
  Copy,
  ArrowRight,
  Globe2,
  Link as LinkIcon,
  ShieldCheck,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types
interface DomainSettings {
  subdomain: string;
  useCustomDomain: boolean;
  customDomain: string;
}

interface PageDomainSettingsProps {
  settings: DomainSettings;
  onSettingsChange: (field: keyof DomainSettings, value: any) => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

// Function to check if a domain is valid
const isValidDomain = (domain: string): boolean => {
  const regex =
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;
  return regex.test(domain);
};

const PageDomainSettings: React.FC<PageDomainSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [subdomainCopied, setSubdomainCopied] = useState<boolean>(false);
  const [customDomainCopied, setCustomDomainCopied] = useState<boolean>(false);
  const [isSubdomainValid, setIsSubdomainValid] = useState<boolean>(true);
  const [isCustomDomainValid, setIsCustomDomainValid] = useState<boolean>(true);
  const [subdomainPreview, setSubdomainPreview] = useState<string>(
    settings.subdomain || ""
  );

  // Check subdomain validity
  useEffect(() => {
    setIsSubdomainValid(
      settings.subdomain
        ? /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(settings.subdomain)
        : true
    );
  }, [settings.subdomain]);

  // Check custom domain validity when it's being used
  useEffect(() => {
    if (settings.useCustomDomain) {
      setIsCustomDomainValid(
        settings.customDomain ? isValidDomain(settings.customDomain) : false
      );
    } else {
      setIsCustomDomainValid(true);
    }
  }, [settings.customDomain, settings.useCustomDomain]);

  // Get subdomain preview with fallback
  useEffect(() => {
    setSubdomainPreview(
      settings.subdomain && isSubdomainValid ? settings.subdomain : "your-brand"
    );
  }, [settings.subdomain, isSubdomainValid]);

  // Handle subdomain change
  const handleSubdomainChange = (value: string) => {
    // Allow only lowercase letters, numbers, and hyphens
    const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    onSettingsChange("subdomain", sanitizedValue);
  };

  // Handle custom domain change
  const handleCustomDomainChange = (value: string) => {
    onSettingsChange("customDomain", value);
  };

  // Toggle use of custom domain
  const toggleUseCustomDomain = (checked: boolean) => {
    onSettingsChange("useCustomDomain", checked);
  };

  // Copy URL to clipboard
  const copyToClipboard = (text: string, type: "subdomain" | "custom") => {
    navigator.clipboard.writeText(`https://${text}`);
    if (type === "subdomain") {
      setSubdomainCopied(true);
      setTimeout(() => setSubdomainCopied(false), 2000);
    } else {
      setCustomDomainCopied(true);
      setTimeout(() => setCustomDomainCopied(false), 2000);
    }
  };

  // Get URL status badge
  const getStatusBadge = (isValid: boolean) => {
    if (isValid) {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          <span>Valid</span>
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200"
        >
          <Info className="w-3 h-3 mr-1" />
          <span>Invalid format</span>
        </Badge>
      );
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-5xl mx-auto"
    >
      <motion.div variants={itemVariants} className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Page Domain
        </h1>
        <p className="text-gray-500 mt-1">
          Configure how people will access your testimonial collection page
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden shadow-md border-0 bg-white rounded-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-6 py-5">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center text-gray-900">
                  <LinkIcon className="w-5 h-5 mr-2 text-blue-600" />
                  <span>Your Page URL</span>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Choose where people will access your testimonial page
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">
                  SSL Secured
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* Subdomain Section */}
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Subdomain</span>
                </h3>
                {getStatusBadge(isSubdomainValid)}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Input
                      value={settings.subdomain || ""}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      placeholder="your-brand"
                      className="rounded-r-none text-base h-12 border-slate-300"
                    />
                    <div className="h-12 bg-slate-50 border border-l-0 border-slate-300 px-4 flex items-center rounded-r-md text-sm text-slate-600 whitespace-nowrap font-medium">
                      .testimonials.app
                    </div>
                  </div>

                  <AnimatePresence>
                    {!isSubdomainValid && settings.subdomain && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-rose-600"
                      >
                        Only lowercase letters, numbers, and hyphens are allowed
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <p className="text-sm text-slate-500">
                    This is your default URL that's always available, even if
                    you set up a custom domain.
                  </p>
                </div>

                <div className="flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`subdomain-${isSubdomainValid}`}
                      variants={fadeVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-5 border border-slate-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                          <span className="text-xs font-medium text-slate-500">
                            Your Page URL
                          </span>
                          <div className="mt-1 flex items-center">
                            <span className="text-sm font-medium text-blue-700 break-all">
                              https://{subdomainPreview}.testimonials.app
                            </span>
                          </div>
                        </div>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-white"
                                disabled={
                                  !isSubdomainValid || !settings.subdomain
                                }
                                onClick={() =>
                                  copyToClipboard(
                                    `${subdomainPreview}.testimonials.app`,
                                    "subdomain"
                                  )
                                }
                              >
                                {subdomainCopied ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>{subdomainCopied ? "Copied!" : "Copy URL"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="mt-3 flex items-center">
                        <a
                          href={`https://${subdomainPreview}.testimonials.app`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "text-xs flex items-center gap-1 rounded-full px-2 py-1",
                            isSubdomainValid && settings.subdomain
                              ? "text-blue-600 bg-blue-100 hover:bg-blue-200"
                              : "text-slate-400 bg-slate-100 cursor-not-allowed"
                          )}
                          onClick={(e) => {
                            if (!isSubdomainValid || !settings.subdomain)
                              e.preventDefault();
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Open page</span>
                        </a>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <Separator />

            {/* Custom Domain Section */}
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <Globe2 className="w-4 h-4 mr-2 text-indigo-600" />
                  <span>Custom Domain</span>
                  <Badge className="ml-2 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                    Optional
                  </Badge>
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Enable</span>
                  <Switch
                    checked={settings.useCustomDomain || false}
                    onCheckedChange={toggleUseCustomDomain}
                  />
                </div>
              </div>

              <AnimatePresence>
                {settings.useCustomDomain && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="h-12 bg-slate-50 border border-r-0 border-slate-300 px-4 flex items-center rounded-l-md text-sm text-slate-600 whitespace-nowrap font-medium">
                            https://
                          </div>
                          <Input
                            value={settings.customDomain || ""}
                            onChange={(e) =>
                              handleCustomDomainChange(e.target.value)
                            }
                            placeholder="testimonials.yourdomain.com"
                            className="rounded-l-none text-base h-12 border-slate-300"
                          />
                        </div>

                        <AnimatePresence>
                          {settings.useCustomDomain &&
                            !isCustomDomainValid &&
                            settings.customDomain && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-sm text-rose-600"
                              >
                                Please enter a valid domain format
                              </motion.p>
                            )}
                        </AnimatePresence>

                        <div className="text-sm text-slate-500">
                          <p>
                            Create a more branded experience using your own
                            domain.
                          </p>
                          <p className="mt-1">
                            We recommend using a subdomain like
                            <span className="font-medium text-slate-700">
                              testimonials.yourdomain.com
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl p-5 border border-slate-200">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                              <span className="text-xs font-medium text-slate-500">
                                Custom URL
                              </span>
                              <div className="mt-1 flex items-center">
                                <span
                                  className={`text-sm font-medium ${
                                    isCustomDomainValid && settings.customDomain
                                      ? "text-indigo-700"
                                      : "text-slate-400"
                                  } break-all`}
                                >
                                  https://
                                  {settings.customDomain ||
                                    "testimonials.yourdomain.com"}
                                </span>
                              </div>
                            </div>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 bg-white"
                                    disabled={
                                      !isCustomDomainValid ||
                                      !settings.customDomain
                                    }
                                    onClick={() =>
                                      copyToClipboard(
                                        settings.customDomain || "",
                                        "custom"
                                      )
                                    }
                                  >
                                    {customDomainCopied ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <p>
                                    {customDomainCopied
                                      ? "Copied!"
                                      : "Copy URL"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          <div className="mt-3 flex items-center">
                            {getStatusBadge(
                              isCustomDomainValid && !!settings.customDomain
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!settings.useCustomDomain && (
                <motion.div
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl p-5 border border-slate-200"
                >
                  <div className="flex flex-col items-center text-center p-2">
                    <Globe2 className="w-10 h-10 text-indigo-200 mb-3" />
                    <h3 className="text-base font-medium text-slate-700">
                      Use Your Own Domain
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 mb-4 max-w-md">
                      Enhance your brand presence by using your own domain for
                      your testimonial collection page.
                    </p>
                    <Button
                      variant="outline"
                      className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => toggleUseCustomDomain(true)}
                    >
                      Enable Custom Domain
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>

          <CardFooter className="bg-gradient-to-r from-slate-50 to-blue-50 p-5 border-t flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-emerald-100 p-1 text-emerald-600">
                <Lock className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                All domains are secured with SSL
              </span>
            </div>

            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={
                !isSubdomainValid ||
                (settings.useCustomDomain && !isCustomDomainValid)
              }
            >
              <span>Save Settings</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PageDomainSettings;
