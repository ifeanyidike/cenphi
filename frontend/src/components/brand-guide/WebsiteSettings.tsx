import { FC, useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import {
  Globe,
  Info,
  Smartphone,
  FileText,
  Sliders,
  Layout,
  MessageSquare,
  Star as StarIcon,
  Bell,
  LockIcon,
  ExternalLink,
  Gift,
  CheckCircle2,
} from "lucide-react";

// Type definitions
type WidgetPositionType =
  | "bottom-right"
  | "bottom-left"
  | "bottom-center"
  | "center";
type WidgetTriggerType = "auto" | "button" | "timer";
type WidgetStyleType = "modal" | "sidebar" | "inline";

const WebsiteSettings: FC = () => {
  const store = brandGuideStore;
  const { brandData } = store;

  const [widgetPosition, setWidgetPosition] =
    useState<WidgetPositionType>("bottom-right");
  const [widgetTrigger, setWidgetTrigger] = useState<WidgetTriggerType>("auto");
  const [widgetStyle, setWidgetStyle] = useState<WidgetStyleType>("modal");
  const [comingSoonNotify, setComingSoonNotify] = useState<boolean>(false);

  // Initialize website settings if they don't exist
  useEffect(() => {
    if (!brandData.voice?.channels?.website) {
      store.updateBrandData(["voice", "channels", "website"], {
        requestTemplate:
          "How was your experience with {{brand}}? We'd love to hear your feedback!",
        thankYouTemplate:
          "Thank you for your testimonial! Your feedback helps us continue to provide excellent service to our community.",
        settings: {
          position: "bottom-right",
          trigger: "auto",
          style: "modal",
          delay: 30,
          showOnMobile: true,
        },
      });
    }
  }, [brandData.voice?.channels?.website, store]);

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-400">
              Website Widgets
            </CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Coming soon: Collect testimonials directly on your website
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Left column: Feature preview */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-800 shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  <span className="font-medium">Coming Soon</span>
                </div>
                <Badge className="bg-white text-emerald-700 hover:bg-gray-100">
                  Preview
                </Badge>
              </div>

              <div className="p-6 flex flex-col items-center text-center">
                <LockIcon className="h-16 w-16 text-emerald-500 dark:text-emerald-400 mb-4" />

                <h2 className="text-xl font-semibold mb-2">
                  Website Testimonial Widgets
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  Collect and showcase testimonials directly on your website
                  with beautifully designed, customizable widgets that match
                  your brand.
                </p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Layout className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Multiple Styles
                    </div>
                    <div className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                      Modals, sidebars, and embedded forms
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Sliders className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Fully Customizable
                    </div>
                    <div className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                      Match your brand colors and style
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Smartphone className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Mobile Responsive
                    </div>
                    <div className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                      Looks great on any device
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <StarIcon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Star Ratings
                    </div>
                    <div className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                      Collect visual feedback easily
                    </div>
                  </div>
                </div>

                <div className="space-y-3 w-full">
                  {!comingSoonNotify ? (
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg h-10 shadow-md"
                      onClick={() => setComingSoonNotify(true)}
                    >
                      <Bell className="h-4 w-4" />
                      <span>Notify me when available</span>
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>We'll notify you when this feature launches!</span>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-lg border-2 h-10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Learn more about website widgets</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Configuration options */}
          <div className="space-y-6">
            <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-md">
              <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Configure Your Widget
                </CardTitle>
                <CardDescription>
                  Customize how your testimonial widget will appear
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <span>Widget Style</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="w-60">
                          <p className="text-xs">
                            Choose how your testimonial widget will appear on
                            your website
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>

                  <div className="grid grid-cols-3 gap-3">
                    <div
                      className={`border-2 ${
                        widgetStyle === "modal"
                          ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-800"
                      } 
                        rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-emerald-200 dark:hover:border-emerald-800`}
                      onClick={() => setWidgetStyle("modal")}
                    >
                      <div className="flex justify-center mb-2">
                        <div
                          className={`h-8 w-8 rounded-full ${
                            widgetStyle === "modal"
                              ? "bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          } 
                          flex items-center justify-center`}
                        >
                          <Layout className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-sm font-medium">Modal</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Popup window
                      </div>
                    </div>

                    <div
                      className={`border-2 ${
                        widgetStyle === "sidebar"
                          ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-800"
                      } 
                        rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-emerald-200 dark:hover:border-emerald-800`}
                      onClick={() => setWidgetStyle("sidebar")}
                    >
                      <div className="flex justify-center mb-2">
                        <div
                          className={`h-8 w-8 rounded-full ${
                            widgetStyle === "sidebar"
                              ? "bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          } 
                          flex items-center justify-center`}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-sm font-medium">Sidebar</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Slide-in panel
                      </div>
                    </div>

                    <div
                      className={`border-2 ${
                        widgetStyle === "inline"
                          ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-800"
                      } 
                        rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-emerald-200 dark:hover:border-emerald-800`}
                      onClick={() => setWidgetStyle("inline")}
                    >
                      <div className="flex justify-center mb-2">
                        <div
                          className={`h-8 w-8 rounded-full ${
                            widgetStyle === "inline"
                              ? "bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          } 
                          flex items-center justify-center`}
                        >
                          <FileText className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-sm font-medium">Inline</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Embedded form
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <span>Widget Position</span>
                  </Label>

                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`border-2 ${
                        widgetPosition === "bottom-right"
                          ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-800"
                      } 
                        rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-emerald-200 dark:hover:border-emerald-800`}
                      onClick={() => setWidgetPosition("bottom-right")}
                    >
                      <div className="text-sm font-medium">Bottom Right</div>
                    </div>

                    <div
                      className={`border-2 ${
                        widgetPosition === "bottom-left"
                          ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-800"
                      } 
                        rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-emerald-200 dark:hover:border-emerald-800`}
                      onClick={() => setWidgetPosition("bottom-left")}
                    >
                      <div className="text-sm font-medium">Bottom Left</div>
                    </div>

                    <div
                      className={`border-2 ${
                        widgetPosition === "bottom-center"
                          ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-800"
                      } 
                        rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-emerald-200 dark:hover:border-emerald-800`}
                      onClick={() => setWidgetPosition("bottom-center")}
                    >
                      <div className="text-sm font-medium">Bottom Center</div>
                    </div>

                    <div
                      className={`border-2 ${
                        widgetPosition === "center"
                          ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-800"
                      } 
                        rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-emerald-200 dark:hover:border-emerald-800`}
                      onClick={() => setWidgetPosition("center")}
                    >
                      <div className="text-sm font-medium">Center</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <span>Display Trigger</span>
                  </Label>

                  <div className="grid grid-cols-3 gap-3">
                    <div
                      className={`border-2 ${
                        widgetTrigger === "auto"
                          ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-800"
                      } 
                        rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-emerald-200 dark:hover:border-emerald-800`}
                      onClick={() => setWidgetTrigger("auto")}
                    >
                      <div className="text-sm font-medium">Automatic</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Show on page load
                      </div>
                    </div>

                    <div
                      className={`border-2 ${
                        widgetTrigger === "timer"
                          ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-800"
                      } 
                        rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-emerald-200 dark:hover:border-emerald-800`}
                      onClick={() => setWidgetTrigger("timer")}
                    >
                      <div className="text-sm font-medium">Timed</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Show after delay
                      </div>
                    </div>

                    <div
                      className={`border-2 ${
                        widgetTrigger === "button"
                          ? "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-200 dark:border-gray-800"
                      } 
                        rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-emerald-200 dark:hover:border-emerald-800`}
                      onClick={() => setWidgetTrigger("button")}
                    >
                      <div className="text-sm font-medium">Button</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Show on click
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="show-mobile"
                        className="text-sm font-medium"
                      >
                        Show on Mobile
                      </Label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Display widget on mobile devices
                      </p>
                    </div>
                    <Switch
                      id="show-mobile"
                      checked={true}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-amber-600 dark:text-amber-400">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                      Website Widget Integration
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                      When this feature is released, you'll be able to add a
                      simple code snippet to your website to display your
                      customized testimonial widget.
                    </p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                      The widget will automatically match your brand settings
                      and collect testimonials directly into your dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg h-10 shadow-md"
              disabled={true}
            >
              <LockIcon className="h-4 w-4" />
              <span>Generate Widget Code</span>
              <span className="ml-auto text-xs bg-white/20 py-0.5 px-1.5 rounded">
                Coming Soon
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default observer(WebsiteSettings);
