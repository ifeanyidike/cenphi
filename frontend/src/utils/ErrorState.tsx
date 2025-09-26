// components/ui/ErrorStates.tsx - Ultra-Premium Error State Components
import {
  ArrowLeft,
  Search,
  Home,
  RefreshCw,
  FileText,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ErrorStateProps {
  type?: "not-found" | "access-denied" | "server-error" | "network-error";
  title?: string;
  description?: string;
  suggestions?: string[];
  showContactSupport?: boolean;
  showRefresh?: boolean;
  customActions?: Array<{
    label: string;
    action: () => void;
    variant?: "default" | "outline" | "ghost";
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  className?: string;
}

// Testimonial Not Found Component
export const TestimonialNotFound = () => {
  const navigate = useNavigate();

  const suggestions = [
    "Check if the testimonial ID in the URL is correct",
    "Verify you have the necessary permissions to view this content",
    "The testimonial may have been archived or removed",
    "Try searching for the testimonial from the dashboard",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 shadow-sm">
      <div className="w-full max-w-2xl">
        {/* Main Error Card */}
        <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Header Section */}
            <div className="relative overflow-hidden">
              {/* Background Pattern */}

              <div className="relative px-12 pt-16 pb-12 text-center">
                {/* Status Indicator */}

                {/* Error Code Badge */}
                <Badge
                  variant="outline"
                  className="mb-6 px-4 py-2 bg-slate-50 text-slate-700 border-slate-200 font-mono text-sm"
                >
                  ERROR 404
                </Badge>

                {/* Primary Message */}
                <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                  Testimonial Not Found
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed max-w-lg mx-auto">
                  We couldn't locate the testimonial you're looking for. It may
                  have been moved, archived, or you may not have access to view
                  this content.
                </p>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-12 pb-12">
              {/* Suggestions */}
              <div className="mb-10">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-slate-600" />
                  Troubleshooting Steps
                </h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-slate-600">
                          {index + 1}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <Button
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                  className="h-14 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                      <Home className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-900">
                        Dashboard
                      </div>
                      <div className="text-xs text-slate-500">Go to home</div>
                    </div>
                  </div>
                </Button>

                {/* <Button
                  onClick={() => navigate("/testimonials")}
                  variant="outline"
                  className="h-14 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                      <Search className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-900">Search</div>
                      <div className="text-xs text-slate-500">
                        Find testimonials
                      </div>
                    </div>
                  </div>
                </Button> */}

                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="h-14 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                      <RefreshCw className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-900">Refresh</div>
                      <div className="text-xs text-slate-500">Try again</div>
                    </div>
                  </div>
                </Button>
              </div>

              {/* Primary Action */}
              <div className="text-center">
                <Button
                  onClick={() => navigate("/dashboard")}
                  size="lg"
                  className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/25 px-8 py-3 text-base"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-12 py-8 bg-slate-50/50 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>Need help? Our support team is available 24/7</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  onClick={() => window.open("/support", "_blank")}
                >
                  Contact Support
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const ErrorState = ({
  type = "not-found",
  title,
  description,
  suggestions = [],
  showContactSupport = true,
  showRefresh = true,
  customActions = [],
  className = "",
}: ErrorStateProps) => {
  const navigate = useNavigate();

  const errorConfigs = {
    "not-found": {
      icon: FileText,
      title: "Content Not Found",
      description:
        "The content you're looking for doesn't exist or has been moved.",
      color: "amber",
      bgGradient: "from-amber-100 to-orange-100",
      borderColor: "border-amber-200",
      shadowColor: "shadow-amber-100/50",
    },
    "access-denied": {
      icon: Shield,
      title: "Access Denied",
      description: "You don't have permission to view this content.",
      color: "red",
      bgGradient: "from-red-100 to-rose-100",
      borderColor: "border-red-200",
      shadowColor: "shadow-red-100/50",
    },
    "server-error": {
      icon: AlertTriangle,
      title: "Server Error",
      description: "Something went wrong on our end. Please try again later.",
      color: "orange",
      bgGradient: "from-orange-100 to-red-100",
      borderColor: "border-orange-200",
      shadowColor: "shadow-orange-100/50",
    },
    "network-error": {
      icon: Zap,
      title: "Connection Error",
      description:
        "Unable to connect to our servers. Check your internet connection.",
      color: "blue",
      bgGradient: "from-blue-100 to-indigo-100",
      borderColor: "border-blue-200",
      shadowColor: "shadow-blue-100/50",
    },
  };

  const config = errorConfigs[type];
  const IconComponent = config.icon;

  return (
    <div
      className={`min-h-screen shadow-sm flex items-center justify-center p-6 ${className}`}
    >
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Header Section */}
            <div className="relative overflow-hidden">
              <div className="relative px-12 pt-16 pb-12 text-center">
                <div
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br ${config.bgGradient} ${config.borderColor} border mb-8 shadow-lg ${config.shadowColor}`}
                >
                  <IconComponent
                    className={`h-10 w-10 text-${config.color}-600`}
                  />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                  {title || config.title}
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed max-w-lg mx-auto">
                  {description || config.description}
                </p>
              </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-12 mb-10">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-slate-600" />
                  What you can do
                </h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-12 pb-12">
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>

                {showRefresh && (
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="border-slate-200 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}

                {customActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.action}
                    variant={action.variant || "outline"}
                    className="border-slate-200 hover:bg-slate-50"
                  >
                    {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Support Footer */}
            {showContactSupport && (
              <div className="px-12 py-8 bg-slate-50/50 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-4">
                    Still having trouble? Our support team is here to help.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-900"
                    onClick={() => window.open("/support", "_blank")}
                  >
                    Contact Support
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ErrorState;
