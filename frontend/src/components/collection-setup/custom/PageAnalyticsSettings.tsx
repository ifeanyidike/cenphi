import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  BarChart4,
  ChartBar,
  ExternalLink,
  Info,
  CheckCircle,
  AlertCircle,
  Share2,
  Activity,
  Webhook,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CollectionSettings } from "@/types/setup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface PageAnalyticsSettingsProps {
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
}

interface AnalyticsIntegration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  popular: boolean;
  inputField?: {
    name: string;
    placeholder: string;
    help: string;
  };
}

const analyticsIntegrations: AnalyticsIntegration[] = [
  {
    id: "google_analytics",
    name: "Google Analytics",
    description: "Track conversions and page metrics",
    icon: BarChart4,
    popular: true,
    inputField: {
      name: "gaTrackingId",
      placeholder: "UA-XXXXXXXXX-X or G-XXXXXXXXXX",
      help: "Enter your Google Analytics tracking ID",
    },
  },
  {
    id: "google_tag_manager",
    name: "Google Tag Manager",
    description: "Manage all tracking through GTM",
    icon: ChartBar,
    popular: true,
    inputField: {
      name: "gtmContainerId",
      placeholder: "GTM-XXXXXXX",
      help: "Enter your GTM container ID",
    },
  },
  {
    id: "facebook_pixel",
    name: "Facebook Pixel",
    description: "Track conversions for Facebook ads",
    icon: Activity,
    popular: true,
    inputField: {
      name: "fbPixelId",
      placeholder: "XXXXXXXXXXXX",
      help: "Enter your Facebook Pixel ID",
    },
  },
  {
    id: "segment",
    name: "Segment",
    description: "Send data to your entire stack",
    icon: Share2,
    popular: false,
    inputField: {
      name: "segmentWriteKey",
      placeholder: "XXXXXXXXXXXXXXXXXXXXXXXX",
      help: "Enter your Segment write key",
    },
  },
  {
    id: "custom_webhook",
    name: "Custom Webhook",
    description: "Send data to your own endpoints",
    icon: Webhook,
    popular: false,
    inputField: {
      name: "webhookUrl",
      placeholder: "https://your-server.com/webhook",
      help: "Enter your webhook URL",
    },
  },
];

// Events that can be tracked
const trackableEvents = [
  {
    id: "page_view",
    name: "Page View",
    description: "When a visitor loads the page",
    defaultEnabled: true,
  },
  {
    id: "form_view",
    name: "Form View",
    description: "When the form becomes visible (scrolled to)",
    defaultEnabled: true,
  },
  {
    id: "form_start",
    name: "Form Start",
    description: "When a user begins filling out the form",
    defaultEnabled: true,
  },
  {
    id: "form_submit",
    name: "Form Submit",
    description: "When a testimonial is successfully submitted",
    defaultEnabled: true,
  },
  {
    id: "form_abandon",
    name: "Form Abandon",
    description: "When a user starts but does not complete the form",
    defaultEnabled: false,
  },
  {
    id: "video_start",
    name: "Video Start",
    description: "When a user starts recording a video",
    defaultEnabled: false,
  },
  {
    id: "audio_start",
    name: "Audio Start",
    description: "When a user starts recording audio",
    defaultEnabled: false,
  },
];

const PageAnalyticsSettings: React.FC<PageAnalyticsSettingsProps> = ({
  settings,
  onNestedSettingsChange,
}) => {
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Get active integrations from settings
  const getActiveIntegrations = () => {
    return settings.analytics?.enabledIntegrations || [];
  };

  // Get tracked events from settings
  const getTrackedEvents = () => {
    return (
      settings.analytics?.trackedEvents ||
      trackableEvents.filter((e) => e.defaultEnabled).map((e) => e.id)
    );
  };

  // Toggle an integration
  const toggleIntegration = (integrationId: string) => {
    const current = getActiveIntegrations();
    let updated;

    if (current.includes(integrationId)) {
      updated = current.filter((id: any) => id !== integrationId);
    } else {
      updated = [...current, integrationId];
    }

    onNestedSettingsChange("analytics", "enabledIntegrations", updated);
  };

  // Toggle event tracking
  const toggleEventTracking = (eventId: string) => {
    const current = getTrackedEvents();
    let updated;

    if (current.includes(eventId)) {
      updated = current.filter((id: any) => id !== eventId);
    } else {
      updated = [...current, eventId];
    }

    onNestedSettingsChange("analytics", "trackedEvents", updated);
  };

  // Update integration settings
  const updateIntegrationSetting = (settingName: string, value: string) => {
    onNestedSettingsChange("analytics", settingName, value);
  };

  // Test webhook
  const testWebhook = () => {
    setIsTestingWebhook(true);

    // Simulate webhook test
    setTimeout(() => {
      setIsTestingWebhook(false);
      alert("Webhook test successful! A test event was sent to your endpoint.");
    }, 2000);
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Analytics & Tracking
          </h2>
          <p className="text-sm text-muted-foreground">
            Track conversions and user behavior on your testimonial page
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Integrations</CardTitle>
          <CardDescription>
            Connect your page with third-party analytics platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsIntegrations.map((integration) => {
              const isActive = getActiveIntegrations().includes(integration.id);
              return (
                <div
                  key={integration.id}
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "hover:border-slate-300 hover:bg-slate-50"
                  )}
                  onClick={() => toggleIntegration(integration.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <integration.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">
                          {integration.name}
                        </h3>
                        <Switch
                          checked={isActive}
                          className="data-[state=checked]:bg-primary"
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() =>
                            toggleIntegration(integration.id)
                          }
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {integration.description}
                      </p>
                      {integration.popular && (
                        <Badge className="text-[10px] bg-green-100 text-green-800 hover:bg-green-100">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Integration Configuration */}
          {getActiveIntegrations().length > 0 && (
            <div className="space-y-4 mt-4">
              <Separator />
              <h3 className="text-base font-medium">
                Integration Configuration
              </h3>

              {getActiveIntegrations().map((integrationId: any) => {
                const integration = analyticsIntegrations.find(
                  (i) => i.id === integrationId
                );
                if (!integration || !integration.inputField) return null;

                const fieldName = integration.inputField.name;
                const fieldValue = settings.analytics?.[fieldName] || "";

                return (
                  <div
                    key={integrationId}
                    className="p-4 border rounded-lg bg-slate-50 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <integration.icon className="h-5 w-5 text-slate-600" />
                      <h4 className="font-medium">
                        {integration.name} Configuration
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={fieldName}>
                        {integration.inputField.help}
                      </Label>
                      <Input
                        id={fieldName}
                        placeholder={integration.inputField.placeholder}
                        value={fieldValue}
                        onChange={(e) =>
                          updateIntegrationSetting(fieldName, e.target.value)
                        }
                      />
                    </div>

                    {integrationId === "custom_webhook" && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={testWebhook}
                          disabled={isTestingWebhook || !fieldValue}
                        >
                          {isTestingWebhook ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <Activity className="h-4 w-4 mr-2" />
                              Test Webhook
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {getActiveIntegrations().length === 0 && (
            <div className="text-center p-6 border border-dashed rounded-lg bg-slate-50">
              <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-slate-700">
                No Analytics Connected
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Connect with your analytics platforms to track conversions and
                measure the performance of your testimonial collection page.
              </p>
              <Button
                onClick={() => toggleIntegration("google_analytics")}
                className="bg-primary text-white"
              >
                Connect Google Analytics
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4 bg-slate-50">
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-slate-600">
                Analytics help you measure conversion rates and optimize your
                page
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() =>
                window.open("https://example.com/analytics-guide", "_blank")
              }
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="text-xs">Learn More</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Tracking</CardTitle>
          <CardDescription>
            Configure which events are tracked on your testimonial page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trackableEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{event.name}</h3>
                    {event.defaultEnabled && (
                      <Badge className="text-[10px] bg-blue-100 text-blue-800 hover:bg-blue-100">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{event.description}</p>
                </div>
                <Switch
                  checked={getTrackedEvents().includes(event.id)}
                  onCheckedChange={() => toggleEventTracking(event.id)}
                />
              </div>
            ))}
          </div>

          {/* Data privacy alert */}
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 text-sm font-medium">
              Data Privacy Considerations
            </AlertTitle>
            <AlertDescription className="text-amber-700 text-xs">
              Ensure your analytics implementation complies with privacy
              regulations like GDPR and CCPA. Always disclose data collection in
              your privacy policy.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-cookie-banner" className="text-sm">
                Show Cookie Consent Banner
              </Label>
              <Switch
                id="show-cookie-banner"
                checked={settings.analytics?.showCookieBanner || false}
                onCheckedChange={(checked) =>
                  onNestedSettingsChange(
                    "analytics",
                    "showCookieBanner",
                    checked
                  )
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Display a cookie consent banner for GDPR compliance (required in
              EU)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-utm" className="text-sm">
                UTM Parameter Tracking
              </Label>
              <Switch
                id="enable-utm"
                checked={settings.analytics?.trackUtmParameters || false}
                onCheckedChange={(checked) =>
                  onNestedSettingsChange(
                    "analytics",
                    "trackUtmParameters",
                    checked
                  )
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Capture UTM parameters to track marketing campaign effectiveness
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Goals</CardTitle>
          <CardDescription>
            Define what counts as a conversion for your testimonial page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border rounded-lg bg-slate-50 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Primary Conversion Goal
              </h3>
              <p className="text-xs text-slate-600">
                The main action you want visitors to complete
              </p>

              <div className="mt-3 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">
                      Testimonial Submission
                    </h4>
                    <p className="text-xs text-slate-500">
                      When a visitor successfully submits a testimonial
                    </p>
                  </div>
                </div>

                <Input
                  placeholder="Goal value (optional)"
                  type="number"
                  className="text-sm"
                  value={settings.analytics?.conversionValue || ""}
                  onChange={(e) =>
                    onNestedSettingsChange(
                      "analytics",
                      "conversionValue",
                      e.target.value
                    )
                  }
                />
                <p className="text-xs text-slate-500">
                  Optional: Assign a monetary value to each submission (e.g.,
                  $50)
                </p>
              </div>
            </div>

            <div className="p-5 border rounded-lg bg-blue-50 border-blue-100 space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2 text-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                Conversion Tracking Tips
              </h3>

              <div className="mt-3 space-y-3 text-blue-700">
                <p className="text-xs">
                  <span className="font-medium block mb-1">
                    Use specific event tracking
                  </span>
                  Configure your analytics to track the "form_submit" event as a
                  conversion
                </p>

                <p className="text-xs">
                  <span className="font-medium block mb-1">
                    Set up funnel visualization
                  </span>
                  Create a funnel from page view → form view → submission to
                  identify drop-off points
                </p>

                <p className="text-xs">
                  <span className="font-medium block mb-1">
                    A/B test your page
                  </span>
                  Experiment with different layouts and copy to optimize
                  conversion rates
                </p>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() =>
                      window.open(
                        "https://example.com/conversion-guide",
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    <span>View Conversion Guide</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-full md:col-span-1">
              <h3 className="text-base font-medium mb-2">Conversion Rate</h3>
              <p className="text-sm text-slate-600">
                Track and improve your testimonial conversion rate for better
                results
              </p>
            </div>

            <div className="col-span-full md:col-span-2 bg-white p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm text-slate-500">
                    Average Conversion Rate
                  </span>
                  <h4 className="text-2xl font-semibold text-slate-800">
                    4.2%
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    +0.8% vs. last month
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">
                          Industry average conversion rate is 2-5% for
                          testimonial pages. A higher rate indicates an
                          effective page design.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: "42%" }}
                />
              </div>

              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-slate-500">0%</span>
                <span className="text-xs text-slate-500">10%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PageAnalyticsSettings;
