import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Code,
  Copy,
  CheckCircle,
  Palette,
  Settings,
  Sparkles,
  Link2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { workspaceHub } from "@/repo/workspace_hub";

interface WidgetConfig {
  primaryColor: string;
  buttonText: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showBranding: boolean;
}

const CaptureWidgetCard: React.FC = () => {
  const [config, setConfig] = useState<WidgetConfig>({
    primaryColor: "#3498db",
    buttonText: "Share Your Story",
    position: "bottom-right",
    showBranding: true,
  });
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateWidgetScript = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3300";
    const workspaceId = workspaceHub.workspace?.id;

    if (!workspaceId) {
      toast({
        title: "Error",
        description: "No workspace found. Please refresh and try again.",
        variant: "destructive",
      });
      return "";
    }

    return `<!-- Cenphi Testimonial Capture Widget -->
<script>
  window.testimonialWidgetConfig = {
    apiBaseUrl: "${baseUrl}",
    workspaceId: "${workspaceId}",
    primaryColor: "${config.primaryColor}",
    buttonText: "${config.buttonText}",
    position: "${config.position}",
    showBranding: ${config.showBranding},
    submitEndpoint: "${baseUrl}/collection/workspaces/${workspaceId}/testimonials/widget"
  };
</script>
<script src="${baseUrl}/cenphi-widget.js"></script>`;
  };

  const copyToClipboard = async () => {
    const script = generateWidgetScript();
    if (!script) return;

    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Widget script copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the script manually",
        variant: "destructive",
      });
    }
  };

  const [showPreview, setShowPreview] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const cleanupWidget = () => {
    // Remove the widget script
    const script = document.getElementById("cenphi-widget-script");
    if (script) {
      document.head.removeChild(script);
    }

    // Remove any widget elements that might have been created
    const widgetContainer = document.querySelector("[data-testimonial-widget]");
    if (widgetContainer) {
      widgetContainer.remove();
    }

    // Remove widget styles
    const widgetStyles = document.getElementById("testimonial-widget-styles");
    if (widgetStyles) {
      widgetStyles.remove();
    }

    // Clear global config
    if ((window as any).testimonialWidgetConfig) {
      delete (window as any).testimonialWidgetConfig;
    }

    // Reset state
    setWidgetLoaded(false);

    console.log("Widget cleaned up");
  };

  const loadActualWidget = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3300";
    const widgetUrl = `http://localhost:3300/cenphi-widget.js`;

    console.log("Attempting to load widget from:", widgetUrl);

    // Set the widget configuration
    (window as any).testimonialWidgetConfig = {
      apiBaseUrl: apiUrl,
      workspaceId: workspaceHub.workspace?.id,
      primaryColor: config.primaryColor,
      buttonText: config.buttonText,
      position: config.position,
      showBranding: config.showBranding,
      submitEndpoint: `${apiUrl}/collection/workspaces/${workspaceHub.workspace?.id}/testimonials/widget`,
    };

    // Check if widget script is already loaded
    const existingScript = document.getElementById("cenphi-widget-script");
    if (existingScript) {
      console.log("Widget script already exists, triggering update");
      setWidgetLoaded(true);

      // Try to trigger widget refresh if function exists
      if ((window as any).refreshTestimonialWidget) {
        (window as any).refreshTestimonialWidget();
      }

      toast({
        title: "Widget Updated",
        description: `Look for the "${config.buttonText}" button in the ${config.position.replace("-", " ")} corner!`,
      });
      return;
    }

    // First, let's check if the widget file exists
    fetch(widgetUrl, { method: "HEAD" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Widget file not found at ${widgetUrl} (Status: ${response.status})`
          );
        }

        console.log("Widget file exists, loading script...");

        // Load the widget script
        const script = document.createElement("script");
        script.id = "cenphi-widget-script";
        script.src = widgetUrl;
        script.crossOrigin = "anonymous";

        script.onload = () => {
          console.log("Widget script loaded successfully");
          // setWidgetLoaded(true);
          // toast({
          //   title: "Widget Loaded",
          //   description: `Look for the "${config.buttonText}" button in the ${config.position.replace("-", " ")} corner!`,
          // });
        };

        script.onerror = (error) => {
          console.error("Script load error:", error);
          document.head.removeChild(script);
          toast({
            title: "Widget Script Error",
            description:
              "The widget script failed to execute. There might be a JavaScript error in the widget code.",
            variant: "destructive",
          });
        };

        document.head.appendChild(script);
      })
      .catch((error) => {
        console.error("Widget file check failed:", error);
        toast({
          title: "Widget File Not Found",
          description: `The widget file is not available at ${widgetUrl}. Please ensure the widget is properly deployed.`,
          variant: "destructive",
        });
      });
  };

  // Update widget config when settings change
  useEffect(() => {
    if (widgetLoaded && (window as any).testimonialWidgetConfig) {
      (window as any).testimonialWidgetConfig = {
        ...(window as any).testimonialWidgetConfig,
        primaryColor: config.primaryColor,
        buttonText: config.buttonText,
        position: config.position,
        showBranding: config.showBranding,
      };

      // If there's a widget update function, call it
      if ((window as any).updateTestimonialWidget) {
        (window as any).updateTestimonialWidget();
      }
    }
  }, [config, widgetLoaded]);

  // Cleanup when preview is hidden
  useEffect(() => {
    if (!showPreview && widgetLoaded) {
      cleanupWidget();
    }
  }, [showPreview, widgetLoaded]);

  // Cleanup when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      if (widgetLoaded) {
        cleanupWidget();
      }
    };
  }, [widgetLoaded]);

  return (
    <div className="bg-white border border-gray-200 rounded-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Capture Widget
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Embed a testimonial collection widget on your website
            </p>
          </div>
          <div className="w-8 h-8 bg-purple-50 rounded border border-purple-200 flex items-center justify-center">
            <Link2Icon className="w-4 h-4 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-900">
                Widget Configuration
              </h4>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) =>
                    setConfig({ ...config, primaryColor: e.target.value })
                  }
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) =>
                    setConfig({ ...config, primaryColor: e.target.value })
                  }
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#3498db"
                />
              </div>
            </div>

            {/* Button Text */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Button Text
              </label>
              <input
                type="text"
                value={config.buttonText}
                onChange={(e) =>
                  setConfig({ ...config, buttonText: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share Your Story"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Position
              </label>
              <select
                value={config.position}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    position: e.target.value as WidgetConfig["position"],
                  })
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>

            {/* Show Branding */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showBranding"
                checked={config.showBranding}
                onChange={(e) =>
                  setConfig({ ...config, showBranding: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showBranding" className="text-xs text-gray-700">
                Show "Powered by Cenphi" branding
              </label>
            </div>
          </div>

          {/* Script Generation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-4 w-4 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-900">
                Installation Code
              </h4>
            </div>

            <div className="relative">
              <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs font-mono text-gray-800 overflow-x-auto max-h-40">
                <code>{generateWidgetScript()}</code>
              </pre>
              <Button
                onClick={copyToClipboard}
                size="sm"
                className="absolute top-2 right-2 text-xs h-6"
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
              <div className="font-medium text-blue-900 mb-1">
                Installation Instructions:
              </div>
              <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                <li>Copy the code above</li>
                <li>
                  Paste it in your website's HTML, before the closing
                  &lt;/body&gt; tag
                </li>
                <li>The widget will appear automatically on your site</li>
                <li>Testimonials collected will appear in your dashboard</li>
              </ol>
            </div>

            {/* Preview */}
            <div className="flex justify-center">
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
                className="text-xs h-7"
              >
                <Sparkles className="h-3 w-3 mr-2" />
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
            </div>
          </div>
        </div>

        {/* Widget Preview */}
        {showPreview && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-900">
                Live Preview
              </h4>
            </div>

            <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-8 min-h-[200px]">
              {/* Simulated widget button */}
              <motion.div
                key={`${config.position}-${config.primaryColor}-${config.buttonText}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`absolute ${
                  config.position === "bottom-right"
                    ? "bottom-4 right-4"
                    : config.position === "bottom-left"
                      ? "bottom-4 left-4"
                      : config.position === "top-right"
                        ? "top-4 right-4"
                        : "top-4 left-4"
                }`}
              >
                <div
                  className="px-4 py-2 rounded-full shadow-lg text-white text-xs font-medium cursor-pointer hover:shadow-xl transition-shadow"
                  style={{ backgroundColor: config.primaryColor }}
                  onClick={loadActualWidget}
                >
                  {config.buttonText}
                </div>
              </motion.div>

              <div className="text-center text-gray-500 text-xs">
                <p>This is how your widget will appear on your website</p>
                <p className="mt-1">
                  Click the "{config.buttonText}" button to load the actual
                  widget and test the full experience
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptureWidgetCard;
