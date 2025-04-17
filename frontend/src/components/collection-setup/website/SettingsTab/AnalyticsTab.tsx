import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Activity,
  Link as LinkIcon,
  ExternalLink,
  Check,
  AlertCircle,
  Info,
  Share2,
  Lightbulb,
  CheckCircle,
  Gauge,
  ArrowUpRight,
  Sparkles,
  Settings,
  EyeIcon,
  MousePointerClick,
  CheckSquare,
  Loader2,
  RefreshCcw,
  LucideIcon,
  FileBarChart2,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";

// Types
interface MetricCardData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  averageValue: string;
  benchmarkValue: string;
  trend?: {
    value: string;
    direction: "up" | "down";
    label: string;
  };
  tips: string[];
}

interface IntegrationPlatform {
  id: string;
  name: string;
  description: string;
  icon: string;
  popular: boolean;
  category: "analytics" | "marketing" | "crm" | "custom";
}

interface EventTrackingOption {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  category: "view" | "interaction" | "conversion" | "advanced";
}

interface ConversionMetric {
  id: string;
  label: string;
  value: string;
  previousValue?: string;
  percentChange?: string;
  direction?: "up" | "down";
  percentile?: string;
  color: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: delay * 0.1,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  hover: {
    y: -5,
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: {
      duration: 0.3,
    },
  },
};

// Analytics data (separated for easy toggling)
const analyticsData = {
  // Metrics cards data
  metrics: [
    {
      id: "view_rate",
      title: "View Rate",
      description: "Percentage of website visitors who see your widget",
      icon: EyeIcon,
      averageValue: "15-25%",
      benchmarkValue: "22%",
      trend: {
        value: "5%",
        direction: "up",
        label: "vs. last month",
      },
      tips: [
        "Optimize widget position for higher visibility",
        "Adjust display timing for better engagement",
        "Test different trigger events to increase exposure",
      ],
    },
    {
      id: "engagement_rate",
      title: "Engagement Rate",
      description: "Percentage of visitors who interact with your widget",
      icon: MousePointerClick,
      averageValue: "5-10%",
      benchmarkValue: "7%",
      trend: {
        value: "2%",
        direction: "down",
        label: "vs. last month",
      },
      tips: [
        "Use compelling widget text to encourage interaction",
        "Add incentives to boost engagement",
        "Test colorful designs to draw attention",
      ],
    },
    {
      id: "completion_rate",
      title: "Completion Rate",
      description: "Percentage of interactions that result in testimonials",
      icon: CheckSquare,
      averageValue: "30-50%",
      benchmarkValue: "42%",
      trend: {
        value: "8%",
        direction: "up",
        label: "vs. last month",
      },
      tips: [
        "Keep forms simple and quick to complete",
        "Use progress indicators to show completion stages",
        "Offer multiple format options (text, video, audio)",
      ],
    },
    {
      id: "testimonial_quality",
      title: "Testimonial Quality",
      description: "Average quality score of collected testimonials",
      icon: Sparkles,
      averageValue: "3.5-4.2/5",
      benchmarkValue: "3.8/5",
      trend: {
        value: "0.3",
        direction: "up",
        label: "vs. last month",
      },
      tips: [
        "Target the right moments in the customer journey",
        "Use question prompts to guide quality responses",
        "Optimize timing to catch users when they're most satisfied",
      ],
    },
  ] as MetricCardData[],

  // Integration platforms
  integrations: [
    {
      id: "google_analytics",
      name: "Google Analytics",
      description: "Track testimonial widget interactions as events",
      icon: "https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg",
      popular: true,
      category: "analytics",
    },
    {
      id: "google_tag_manager",
      name: "Google Tag Manager",
      description: "Manage all testimonial tracking through GTM",
      icon: "https://www.gstatic.com/analytics-suite/header/suite/v2/ic_tag_manager.svg",
      popular: true,
      category: "analytics",
    },
    {
      id: "segment",
      name: "Segment",
      description: "Connect testimonial data to your entire stack",
      icon: "https://segment.com/favicon.ico",
      popular: false,
      category: "analytics",
    },
    {
      id: "mixpanel",
      name: "Mixpanel",
      description: "Deep dive into testimonial collection funnels",
      icon: "https://cdn.worldvectorlogo.com/logos/mixpanel.svg",
      popular: false,
      category: "analytics",
    },
    {
      id: "amplitude",
      name: "Amplitude",
      description: "Analyze testimonial collection behavior",
      icon: "https://amplitude.com/favicon.ico",
      popular: false,
      category: "analytics",
    },
    {
      id: "facebook_pixel",
      name: "Facebook Pixel",
      description: "Track testimonial interactions for ad targeting",
      icon: "https://static.xx.fbcdn.net/rsrc.php/yo/r/iRmz9lCMBD2.ico",
      popular: true,
      category: "marketing",
    },
    {
      id: "hubspot",
      name: "HubSpot",
      description: "Connect testimonials to customer records",
      icon: "https://www.hubspot.com/hubfs/assets/hubspot.com/style-guide/brand-guidelines/guidelines_the-logo.svg",
      popular: false,
      category: "crm",
    },
    {
      id: "custom",
      name: "Custom Integration",
      description: "Use our webhooks to connect to any platform",
      icon: "/custom-integration.svg",
      popular: false,
      category: "custom",
    },
  ] as IntegrationPlatform[],

  // Event tracking options
  eventTracking: [
    {
      id: "widget_view",
      name: "Widget View",
      description: "When the widget becomes visible to a user",
      defaultEnabled: true,
      category: "view",
    },
    {
      id: "widget_open",
      name: "Widget Open",
      description: "When a user clicks to open the widget",
      defaultEnabled: true,
      category: "interaction",
    },
    {
      id: "form_start",
      name: "Form Start",
      description: "When a user begins filling out the testimonial form",
      defaultEnabled: true,
      category: "interaction",
    },
    {
      id: "form_abandonment",
      name: "Form Abandonment",
      description: "When a user leaves without completing the form",
      defaultEnabled: false,
      category: "advanced",
    },
    {
      id: "submission_complete",
      name: "Submission Complete",
      description: "When a testimonial is successfully submitted",
      defaultEnabled: true,
      category: "conversion",
    },
    {
      id: "media_record_start",
      name: "Media Recording Start",
      description: "When video/audio recording begins",
      defaultEnabled: false,
      category: "advanced",
    },
    {
      id: "incentive_claimed",
      name: "Incentive Claimed",
      description: "When a user claims an incentive reward",
      defaultEnabled: true,
      category: "conversion",
    },
  ] as EventTrackingOption[],

  // Conversion funnel
  conversionMetrics: [
    {
      id: "view_to_engagement",
      label: "View to Engagement",
      value: "28%",
      previousValue: "24%",
      percentChange: "16.7%",
      direction: "up",
      color: "bg-blue-500",
    },
    {
      id: "engagement_to_submission",
      label: "Engagement to Submission",
      value: "42%",
      previousValue: "44%",
      percentChange: "4.5%",
      direction: "down",
      color: "bg-indigo-500",
    },
    {
      id: "overall_conversion",
      label: "Overall Conversion",
      value: "12%",
      previousValue: "9%",
      percentChange: "33.3%",
      direction: "up",
      percentile: "75th",
      color: "bg-violet-500",
    },
  ] as ConversionMetric[],
};

/**
 * Enhanced MetricCard Component
 */
interface MetricCardProps {
  metric: MetricCardData;
  index: number;
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  index,
  isLoading,
}) => {
  const Icon = metric.icon;

  if (isLoading) {
    return (
      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-24" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="border rounded-xl overflow-hidden bg-white shadow-sm"
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-sm font-medium text-slate-800">{metric.title}</h3>
        </div>

        <div className="space-y-3">
          <div className="text-2xl font-bold text-slate-900">
            {metric.averageValue}
          </div>

          <div className="flex justify-between items-center">
            {metric.trend && (
              <div className="flex items-center gap-1.5">
                <Badge
                  className={cn(
                    "text-xs font-medium",
                    metric.trend.direction === "up"
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                  )}
                >
                  {metric.trend.direction === "up" ? "↑" : "↓"}{" "}
                  {metric.trend.value}
                </Badge>
                <span className="text-xs text-slate-500">
                  {metric.trend.label}
                </span>
              </div>
            )}

            <div className="text-right">
              <div className="text-xs text-slate-500">Benchmark</div>
              <div className="text-sm font-medium text-slate-600">
                {metric.benchmarkValue}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <div className="px-5 py-3 bg-slate-50 border-t text-xs font-medium text-primary flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100 transition-colors">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Optimization Tips</span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="center">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">
                How to improve {metric.title.toLowerCase()}
              </h4>
            </div>

            <ul className="space-y-2">
              {metric.tips.map((tip, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
};

/**
 * Enhanced Integration Card Component
 */
interface IntegrationCardProps {
  platform: IntegrationPlatform;
  isActive: boolean;
  onToggle: () => void;
  index: number;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  platform,
  isActive,
  onToggle,
  index,
}) => {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={cn(
        "border rounded-xl p-4 cursor-pointer transition-all bg-white shadow-sm",
        isActive ? "border-primary/30 bg-primary/5" : "hover:border-slate-300"
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center border shadow-sm">
          {platform.icon.startsWith("http") ? (
            <img
              src={platform.icon}
              alt={platform.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <FileBarChart2 className="h-5 w-5 text-slate-600" />
          )}
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-800">
              {platform.name}
            </h3>
            <Switch
              checked={isActive}
              className="data-[state=checked]:bg-primary"
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={onToggle}
            />
          </div>
          <p className="text-xs text-slate-500">{platform.description}</p>
          <div className="flex items-center gap-2 mt-1">
            {platform.popular && (
              <Badge className="text-[10px] py-0 bg-green-100 text-green-800 hover:bg-green-100">
                Popular
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-[10px] py-0 border-slate-200 text-slate-600"
            >
              {platform.category === "analytics"
                ? "Analytics"
                : platform.category === "marketing"
                  ? "Marketing"
                  : platform.category === "crm"
                    ? "CRM"
                    : "Custom"}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Event Tracking Option Component
 */
interface EventTrackingItemProps {
  event: EventTrackingOption;
  isActive: boolean;
  onToggle: () => void;
  index: number;
}

const EventTrackingItem: React.FC<EventTrackingItemProps> = ({
  event,
  isActive,
  onToggle,
  index,
}) => {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex items-center justify-between p-4 border rounded-xl transition-all",
        isActive
          ? "bg-primary/5 border-primary/30"
          : "bg-white hover:bg-slate-50 hover:border-slate-300"
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-800">{event.name}</h3>
          {event.defaultEnabled && (
            <Badge className="text-[10px] py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">
              Recommended
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] py-0 border-slate-200",
              event.category === "view"
                ? "text-blue-600"
                : event.category === "interaction"
                  ? "text-indigo-600"
                  : event.category === "conversion"
                    ? "text-green-600"
                    : "text-purple-600"
            )}
          >
            {event.category === "view"
              ? "View"
              : event.category === "interaction"
                ? "Interaction"
                : event.category === "conversion"
                  ? "Conversion"
                  : "Advanced"}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">{event.description}</p>
      </div>
      <Switch
        checked={isActive}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
    </motion.div>
  );
};

/**
 * Conversion Metrics Component
 */
interface ConversionMetricsProps {
  metrics: ConversionMetric[];
  isLoading?: boolean;
}

const ConversionMetricsDisplay: React.FC<ConversionMetricsProps> = ({
  metrics,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate total width for the funnel
  const totalWidth = 100;
  let runningWidth = 0;

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-sm font-medium text-slate-800 mb-4">
          Testimonial Conversion Funnel
        </h3>
        <div className="relative h-14 flex items-center mb-8">
          {metrics.map((metric, index) => {
            const isLast = index === metrics.length - 1;
            const width = isLast
              ? totalWidth - runningWidth
              : parseInt(metric.value);
            // const currentWidth = runningWidth;
            runningWidth += width;

            return (
              <div
                key={metric.id}
                className={cn(
                  "h-full flex items-center justify-center text-white text-xs font-medium px-3 transition-all duration-500",
                  metric.color,
                  index === 0 ? "rounded-l-lg" : "",
                  isLast ? "rounded-r-lg" : ""
                )}
                style={{ width: `${width}%` }}
              >
                {metric.value}
              </div>
            );
          })}

          {/* Labels below the funnel */}
          {metrics.map((metric, index) => {
            const isLast = index === metrics.length - 1;
            const width = isLast
              ? totalWidth - runningWidth + parseInt(metric.value)
              : parseInt(metric.value);
            const currentPos = metrics
              .slice(0, index)
              .reduce((acc, m) => acc + parseInt(m.value), 0);

            return (
              <div
                key={`label-${metric.id}`}
                className="absolute -bottom-6 text-xs text-slate-500 transform -translate-x-1/2"
                style={{ left: `${currentPos + width / 2}%` }}
              >
                {metric.label.split(" ").map((word, i) => (
                  <div key={i} className="text-center">
                    {word}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {metrics.map((metric) => (
            <div
              key={`card-${metric.id}`}
              className="bg-white rounded-xl p-4 border shadow-sm"
            >
              <div className="text-xs text-slate-500 mb-1">{metric.label}</div>
              <div className="text-xl font-bold text-slate-900 mb-2">
                {metric.value}
              </div>
              {metric.percentChange && (
                <div className="flex items-center gap-1.5">
                  <Badge
                    className={cn(
                      "text-xs font-medium",
                      metric.direction === "up"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {metric.direction === "up" ? "↑" : "↓"}{" "}
                    {metric.percentChange}
                  </Badge>
                  <span className="text-xs text-slate-500">vs. last month</span>
                </div>
              )}
              {metric.percentile && (
                <Badge className="mt-2 bg-blue-100 text-blue-700">
                  {metric.percentile} percentile
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty State Component
 */
interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ElementType;
  actionLabel: string;
  onAction: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center justify-center p-10 border border-dashed rounded-xl bg-slate-50/50 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </motion.div>
  );
};

/**
 * Section Header Component
 */
interface SectionHeaderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  actions?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon: Icon,
  actions,
}) => {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {actions}
    </div>
  );
};

/**
 * Main Analytics Tab Component
 */
const AnalyticsTab: React.FC = observer(() => {
  const store = testimonialSettingsStore;
  const { customization } = store.settings.website;
  const [activeTab, setActiveTab] = useState<
    "overview" | "integrations" | "events"
  >("overview");
  const [showData, setShowData] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get active integrations from store
  const activeIntegrations = customization?.analyticsIntegrations || [];
  const trackingEvents = customization?.trackingEvents || [];
  const gaTrackingId = customization?.gaTrackingId || "";
  const fbPixelId = customization?.fbPixelId || "";

  // Toggle integration
  const toggleIntegration = (integrationId: string): void => {
    const newIntegrations = activeIntegrations.includes(integrationId)
      ? activeIntegrations.filter((id) => id !== integrationId)
      : [...activeIntegrations, integrationId];

    runInAction(() => {
      store.updateNestedSettings(
        "website",
        "customization",
        "analyticsIntegrations",
        newIntegrations
      );
    });
  };

  // Toggle tracking event
  const toggleTrackingEvent = (eventId: string): void => {
    const newEvents = trackingEvents.includes(eventId)
      ? trackingEvents.filter((id) => id !== eventId)
      : [...trackingEvents, eventId];

    runInAction(() => {
      store.updateNestedSettings(
        "website",
        "customization",
        "trackingEvents",
        newEvents
      );
    });
  };

  // Handle tracking ID changes
  const handleGaTrackingIdChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    runInAction(() => {
      store.updateNestedSettings(
        "website",
        "customization",
        "gaTrackingId",
        e.target.value
      );
    });
  };

  const handleFbPixelIdChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    runInAction(() => {
      store.updateNestedSettings(
        "website",
        "customization",
        "fbPixelId",
        e.target.value
      );
    });
  };

  // Toggle data display (for demo purposes)
  const toggleDataDisplay = (): void => {
    setIsLoading(true);
    setTimeout(() => {
      setShowData(!showData);
      setIsLoading(false);
    }, 1000);
  };

  // Mock loading data
  const handleRefreshData = (): void => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Analytics & Tracking
          </h2>
          <p className="text-base text-slate-500">
            Monitor performance and integrate with your analytics platforms
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={handleRefreshData}
                  className="h-9 gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  <span>Refresh</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Refresh analytics data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Settings className="h-4 w-4 mr-1.5" />
                <span>Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Data Display</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleDataDisplay}>
                {showData ? "Show Empty States" : "Show Analytics Data"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefreshData}>
                Refresh Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "overview" | "integrations" | "events")
          }
          className="w-full"
        >
          <TabsList className="bg-slate-100/80 p-1 rounded-lg">
            <TabsTrigger
              value="overview"
              className={cn(
                "flex items-center gap-1.5 rounded-md",
                activeTab === "overview" ? "font-medium" : "text-slate-600"
              )}
            >
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className={cn(
                "flex items-center gap-1.5 rounded-md",
                activeTab === "integrations" ? "font-medium" : "text-slate-600"
              )}
            >
              <LinkIcon className="h-4 w-4" />
              <span>Integrations</span>
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className={cn(
                "flex items-center gap-1.5 rounded-md",
                activeTab === "events" ? "font-medium" : "text-slate-600"
              )}
            >
              <Share2 className="h-4 w-4" />
              <span>Events</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-8">
              <motion.div
                key="overview"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Performance Dashboard */}
                <SectionHeader
                  title="Performance Dashboard"
                  description="Monitor key metrics and optimize your testimonial collection"
                  icon={Gauge}
                  actions={
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      <span>Full Dashboard</span>
                    </Button>
                  }
                />

                {showData ? (
                  <>
                    {/* Conversion Metrics */}
                    <ConversionMetricsDisplay
                      metrics={analyticsData.conversionMetrics}
                      isLoading={isLoading}
                    />

                    {/* Metrics Cards */}
                    <motion.div
                      variants={containerVariants}
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
                    >
                      {analyticsData.metrics.map((metric, index) => (
                        <MetricCard
                          key={metric.id}
                          metric={metric}
                          index={index}
                          isLoading={isLoading}
                        />
                      ))}
                    </motion.div>
                  </>
                ) : (
                  <EmptyState
                    title="No Analytics Data Available"
                    description="Start collecting testimonials to see performance metrics. Connect your analytics platforms to track conversions."
                    icon={Activity}
                    actionLabel="Set Up Analytics Integrations"
                    onAction={() => setActiveTab("integrations")}
                  />
                )}
              </motion.div>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="mt-6 space-y-8">
              <motion.div
                key="integrations"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <SectionHeader
                  title="Analytics Integrations"
                  description="Connect your testimonial widget with third-party analytics platforms"
                  icon={LinkIcon}
                />

                <div className="space-y-8">
                  {/* Integrations Grid */}
                  <motion.div
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    {analyticsData.integrations.map((platform, index) => (
                      <IntegrationCard
                        key={platform.id}
                        platform={platform}
                        isActive={activeIntegrations.includes(platform.id)}
                        onToggle={() => toggleIntegration(platform.id)}
                        index={index}
                      />
                    ))}
                  </motion.div>

                  {/* Integration Configuration */}
                  <AnimatePresence>
                    {activeIntegrations.includes("google_analytics") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 border rounded-xl bg-white shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center border shadow-sm">
                              <img
                                src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg"
                                alt="Google Analytics"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <h3 className="text-base font-medium text-slate-900">
                              Google Analytics Configuration
                            </h3>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="ga-tracking-id">
                                Tracking ID
                              </Label>
                              <Input
                                id="ga-tracking-id"
                                placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX"
                                value={gaTrackingId}
                                onChange={handleGaTrackingIdChange}
                                className="max-w-md"
                              />
                              <p className="text-xs text-slate-500">
                                Enter your Google Analytics tracking ID
                                (supports both Universal Analytics and GA4)
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeIntegrations.includes("facebook_pixel") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 border rounded-xl bg-white shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center border shadow-sm">
                              <img
                                src="https://static.xx.fbcdn.net/rsrc.php/yo/r/iRmz9lCMBD2.ico"
                                alt="Facebook Pixel"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <h3 className="text-base font-medium text-slate-900">
                              Facebook Pixel Configuration
                            </h3>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="fb-pixel-id">Pixel ID</Label>
                              <Input
                                id="fb-pixel-id"
                                placeholder="XXXXXXXXXXXX"
                                value={fbPixelId}
                                onChange={handleFbPixelIdChange}
                                className="max-w-md"
                              />
                              <p className="text-xs text-slate-500">
                                Enter your Facebook Pixel ID to track
                                testimonial interactions
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeIntegrations.includes("custom") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 border rounded-xl bg-white shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center border shadow-sm">
                              <FileBarChart2 className="h-5 w-5 text-slate-600" />
                            </div>
                            <h3 className="text-base font-medium text-slate-900">
                              Webhook Configuration
                            </h3>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="webhook-url">Webhook URL</Label>
                              <Input
                                id="webhook-url"
                                placeholder="https://your-server.com/webhook"
                                value={customization?.webhookUrl || ""}
                                onChange={(e) => {
                                  runInAction(() => {
                                    store.updateNestedSettings(
                                      "website",
                                      "customization",
                                      "webhookUrl",
                                      e.target.value
                                    );
                                  });
                                }}
                                className="max-w-md"
                              />
                              <p className="text-xs text-slate-500">
                                We'll send POST requests to this URL when
                                testimonial events occur
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="webhook-secret">
                                Webhook Secret
                              </Label>
                              <Input
                                id="webhook-secret"
                                placeholder="whsec_xxxxxxxx"
                                value={customization?.webhookSecret || ""}
                                onChange={(e) => {
                                  runInAction(() => {
                                    store.updateNestedSettings(
                                      "website",
                                      "customization",
                                      "webhookSecret",
                                      e.target.value
                                    );
                                  });
                                }}
                                className="max-w-md"
                              />
                              <p className="text-xs text-slate-500">
                                Used to verify webhook requests are coming from
                                us
                              </p>
                            </div>

                            <div className="pt-2">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                <span>View Webhook Documentation</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Best Practices Alert */}
                  {activeIntegrations.length > 0 && (
                    <motion.div
                      variants={itemVariants}
                      className="p-5 bg-blue-50 border border-blue-100 rounded-xl"
                    >
                      <div className="flex gap-3">
                        <Info className="h-6 w-6 text-blue-500 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-blue-800">
                            Analytics Best Practices
                          </h4>
                          <p className="text-sm text-blue-700">
                            For the most accurate data, we recommend
                            implementing at least one analytics integration.
                            This allows you to track the full testimonial
                            collection funnel and optimize for higher conversion
                            rates.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="mt-6 space-y-8">
              <motion.div
                key="events"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <SectionHeader
                  title="Event Tracking"
                  description="Configure which events are tracked and sent to your analytics platforms"
                  icon={Share2}
                />

                <div className="space-y-6">
                  {/* Events Grid */}
                  <motion.div
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {analyticsData.eventTracking.map((event, index) => (
                      <EventTrackingItem
                        key={event.id}
                        event={event}
                        isActive={trackingEvents.includes(event.id)}
                        onToggle={() => toggleTrackingEvent(event.id)}
                        index={index}
                      />
                    ))}
                  </motion.div>

                  {/* Data Privacy Alert */}
                  <motion.div
                    variants={itemVariants}
                    className="p-5 border-l-4 border-amber-400 bg-amber-50 rounded-r-xl rounded-bl-xl"
                  >
                    <div className="flex gap-3">
                      <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-amber-800">
                          Data Privacy Considerations
                        </h4>
                        <p className="text-sm text-amber-700">
                          Ensure your analytics implementation complies with
                          privacy regulations like GDPR and CCPA. Always
                          disclose data collection in your privacy policy and
                          consider adding a cookie consent banner.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Save Button */}
                  <motion.div
                    variants={itemVariants}
                    className="flex justify-end mt-4"
                  >
                    <Button className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <span>Save Event Settings</span>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  );
});

export default AnalyticsTab;
