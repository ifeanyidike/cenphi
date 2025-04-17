// src/components/collection-setup/chat/ChatPlatformIntegrations.tsx
import React, { useState } from "react";
import {
  MessageCircle,
  MessagesSquare,
  Headphones,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CollectionSettings } from "@/types/setup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatPlatformIntegrationsProps {
  connectedPlatforms: CollectionSettings["chat"]["connectedPlatforms"];
  customIntegration?: CollectionSettings["chat"]["customIntegration"];
  onConnectPlatform: (
    platform: keyof CollectionSettings["chat"]["connectedPlatforms"],
    connected: boolean
  ) => void;
  onCustomIntegrationChange: (field: string, value: any) => void;
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

// Platform configuration data
const platformConfigs = [
  {
    id: "intercom",
    name: "Intercom",
    description: "Collect testimonials from Intercom conversations",
    icon: <MessageCircle className="h-6 w-6" />,
    color: "#286EFA",
    popular: true,
    docsUrl: "https://developers.intercom.com",
  },
  {
    id: "zendesk",
    name: "Zendesk Chat",
    description: "Integrate with Zendesk Chat (formerly Zopim)",
    icon: <MessagesSquare className="h-6 w-6" />,
    color: "#03363D",
    popular: true,
    docsUrl: "https://developer.zendesk.com/api-reference/",
  },
  {
    id: "crisp",
    name: "Crisp",
    description: "Collect testimonials via Crisp chat",
    icon: <MessageCircle className="h-6 w-6" />,
    color: "#7D42F4",
    popular: false,
    docsUrl: "https://docs.crisp.chat/",
  },
  {
    id: "drift",
    name: "Drift",
    description: "Integrate with Drift conversational platform",
    icon: <MessagesSquare className="h-6 w-6" />,
    color: "#4363EE",
    popular: true,
    docsUrl: "https://devdocs.drift.com/",
  },
  {
    id: "tawk",
    name: "Tawk.to",
    description: "Connect with Tawk.to live chat",
    icon: <MessageCircle className="h-6 w-6" />,
    color: "#03A84E",
    popular: false,
    docsUrl: "https://developer.tawk.to/",
  },
  {
    id: "livechat",
    name: "LiveChat",
    description: "Integration with LiveChat platform",
    icon: <Headphones className="h-6 w-6" />,
    color: "#F68B1F",
    popular: false,
    docsUrl: "https://developers.livechat.com/",
  },
  {
    id: "custom",
    name: "Custom Integration",
    description: "Connect to any other chat platform via API",
    icon: <Settings className="h-6 w-6" />,
    color: "#64748B",
    popular: false,
  },
];

const ChatPlatformIntegrations: React.FC<ChatPlatformIntegrationsProps> = ({
  connectedPlatforms,
  customIntegration,
  onConnectPlatform,
  onCustomIntegrationChange,
  showToast,
}) => {
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Count connected platforms
  const connectedCount =
    Object.values(connectedPlatforms).filter(Boolean).length;

  // Handle connection click
  const handleConnectClick = (platformId: string) => {
    if (platformId === "custom") {
      setShowCustomDialog(true);
    } else {
      setSelectedPlatform(platformId);
      setShowConnectionDialog(true);
    }
  };

  // Handle actual connection
  const handleConnect = (platformId: string) => {
    const platformKey =
      platformId as keyof CollectionSettings["chat"]["connectedPlatforms"];

    if (platformId !== "custom") {
      // Toggle connection status
      onConnectPlatform(platformKey, !connectedPlatforms[platformKey]);

      // Show toast notification
      showToast({
        title: connectedPlatforms[platformKey]
          ? `Disconnected from ${getPlatformName(platformId)}`
          : `Connected to ${getPlatformName(platformId)}`,
        description: connectedPlatforms[platformKey]
          ? "Platform successfully disconnected."
          : "Platform successfully connected.",
        variant: "default",
      });
    }

    // Close dialog if open
    setShowConnectionDialog(false);
  };

  // Get platform name helper
  const getPlatformName = (platformId: string): string => {
    const platform = platformConfigs.find((p) => p.id === platformId);
    return platform ? platform.name : platformId;
  };

  // Handle copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-800">
                Chat Platform Integrations
              </CardTitle>
              <CardDescription className="text-slate-500 mt-1">
                Connect to chat platforms to collect testimonials from customer
                conversations
              </CardDescription>
            </div>
            <Badge className="bg-slate-100 text-slate-700 border border-slate-200 gap-1.5 px-3 py-1 rounded-full w-fit">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>{connectedCount} Connected</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {platformConfigs.map((platform) => {
              const isConnected =
                platform.id === "custom"
                  ? !!customIntegration?.apiEndpoint
                  : connectedPlatforms[
                      platform.id as keyof typeof connectedPlatforms
                    ];

              return (
                <div
                  key={platform.id}
                  className={cn(
                    "rounded-xl border p-5 transition-all cursor-pointer",
                    isConnected
                      ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/40 shadow-sm"
                      : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  )}
                  onClick={() => handleConnectClick(platform.id)}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                          isConnected ? "bg-primary/20" : "bg-slate-100"
                        )}
                        style={{
                          color: isConnected
                            ? "var(--primary)"
                            : platform.color,
                          backgroundColor: isConnected
                            ? ""
                            : `${platform.color}15`,
                        }}
                      >
                        {platform.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3
                            className={cn(
                              "font-medium text-base truncate",
                              isConnected ? "text-primary" : "text-slate-800"
                            )}
                          >
                            {platform.name}
                          </h3>
                          {platform.popular && (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] ml-2 flex-shrink-0">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {platform.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                      {platform.docsUrl && (
                        <a
                          href={platform.docsUrl}
                          className="text-xs text-slate-400 hover:text-primary flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>API Docs</span>
                        </a>
                      )}

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isConnected ? "text-emerald-600" : "text-slate-400"
                          )}
                        >
                          {isConnected ? "Connected" : "Disconnected"}
                        </span>
                        <Switch
                          checked={isConnected}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(platform.id);
                          }}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Security info */}
          <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              For security, all API keys and credentials are encrypted before
              storage. Ensure your chat integration has the necessary
              permissions to collect testimonials.
            </p>
          </div>
        </CardContent>

        <CardFooter className="border-t bg-slate-50 px-6 py-5 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setShowCustomDialog(true)}
            className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Integration</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Custom Integration Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl border-0 shadow-lg">
          <DialogHeader className="p-6 bg-gradient-to-br from-slate-50 to-white border-b">
            <DialogTitle className="text-xl text-slate-800">
              Custom Chat Integration
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Connect to any chat platform using API or webhook
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-5">
            <div className="space-y-3">
              <Label
                htmlFor="api-endpoint"
                className="text-slate-700 font-medium"
              >
                API Endpoint
              </Label>
              <Input
                id="api-endpoint"
                placeholder="https://api.yourchatapp.com/webhook"
                value={customIntegration?.apiEndpoint || ""}
                onChange={(e) =>
                  onCustomIntegrationChange("apiEndpoint", e.target.value)
                }
                className="border-slate-200 focus-visible:border-primary focus-visible:ring-primary/20"
              />
              <p className="text-xs text-slate-500">
                The URL where your chat platform API is hosted
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="api-key" className="text-slate-700 font-medium">
                API Key or Token
              </Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type="password"
                  placeholder="••••••••••••••••••••••"
                  value={customIntegration?.apiKey || ""}
                  onChange={(e) =>
                    onCustomIntegrationChange("apiKey", e.target.value)
                  }
                  className="flex-1 border-slate-200 focus-visible:border-primary focus-visible:ring-primary/20"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0 border-slate-200"
                        onClick={() => {
                          if (customIntegration?.apiKey) {
                            handleCopy(customIntegration.apiKey);
                          }
                        }}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {copied ? "Copied!" : "Copy to clipboard"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-slate-500">
                Authentication token for your chat platform API
              </p>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="webhook-url"
                className="text-slate-700 font-medium"
              >
                Webhook URL (Optional)
              </Label>
              <Input
                id="webhook-url"
                placeholder="https://your-app.com/api/chat-webhook"
                value={customIntegration?.webhookUrl || ""}
                onChange={(e) =>
                  onCustomIntegrationChange("webhookUrl", e.target.value)
                }
                className="border-slate-200 focus-visible:border-primary focus-visible:ring-primary/20"
              />
              <p className="text-xs text-slate-500">
                URL to receive event notifications from the chat platform
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t">
            <div className="flex items-center gap-2 w-full justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5" />
                <span>Secure encrypted connection</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomDialog(false)}
                  className="border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onConnectPlatform(
                      "custom",
                      !!customIntegration?.apiEndpoint
                    );
                    setShowCustomDialog(false);
                    showToast({
                      title: "Custom integration saved",
                      description:
                        "Your custom chat integration has been configured.",
                      variant: "default",
                    });
                  }}
                >
                  Save Integration
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Platform Connection Dialog */}
      {selectedPlatform && (
        <Dialog
          open={showConnectionDialog}
          onOpenChange={setShowConnectionDialog}
        >
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl border-0 shadow-lg">
            <DialogHeader className="p-6 bg-gradient-to-r from-slate-50 to-white border-b">
              <DialogTitle className="text-xl text-slate-800">
                {connectedPlatforms[
                  selectedPlatform as keyof typeof connectedPlatforms
                ]
                  ? `Manage ${getPlatformName(selectedPlatform)}`
                  : `Connect to ${getPlatformName(selectedPlatform)}`}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                {connectedPlatforms[
                  selectedPlatform as keyof typeof connectedPlatforms
                ]
                  ? "View or modify your connection settings"
                  : "Set up connection to collect testimonials"}
              </DialogDescription>
            </DialogHeader>

            <div className="p-6">
              {!connectedPlatforms[
                selectedPlatform as keyof typeof connectedPlatforms
              ] ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center mb-4">
                    {platformConfigs.find((p) => p.id === selectedPlatform)
                      ?.icon && (
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${platformConfigs.find((p) => p.id === selectedPlatform)?.color}15`,
                          color: platformConfigs.find(
                            (p) => p.id === selectedPlatform
                          )?.color,
                        }}
                      >
                        {
                          platformConfigs.find((p) => p.id === selectedPlatform)
                            ?.icon
                        }
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label
                        htmlFor="api-key"
                        className="text-slate-700 font-medium"
                      >
                        API Key
                      </Label>
                      <Input
                        id="api-key"
                        placeholder="Enter your API key"
                        type="password"
                        className="border-slate-200 focus-visible:border-primary focus-visible:ring-primary/20"
                      />
                      <p className="text-xs text-slate-500">
                        Find this in your {getPlatformName(selectedPlatform)}{" "}
                        developer settings
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-3 pt-4 text-center">
                      <div className="text-sm text-slate-500">
                        Or connect directly with OAuth
                      </div>
                      <Button className="w-full gap-2">
                        Connect with {getPlatformName(selectedPlatform)}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-emerald-800">
                        Connected Successfully
                      </h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        Your {getPlatformName(selectedPlatform)} account is
                        connected and working properly
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-slate-700 font-medium">
                      Connection Details
                    </Label>
                    <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Status:</span>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          Connected on:
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          March 25, 2025
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          Last activity:
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          2 hours ago
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-6 bg-slate-50 border-t">
              <div className="flex items-center justify-between w-full">
                {connectedPlatforms[
                  selectedPlatform as keyof typeof connectedPlatforms
                ] && (
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleConnect(selectedPlatform)}
                  >
                    Disconnect
                  </Button>
                )}

                <div
                  className={
                    connectedPlatforms[
                      selectedPlatform as keyof typeof connectedPlatforms
                    ]
                      ? ""
                      : "w-full flex justify-end"
                  }
                >
                  <Button
                    variant="outline"
                    onClick={() => setShowConnectionDialog(false)}
                    className="mr-2 border-slate-200"
                  >
                    Cancel
                  </Button>

                  {!connectedPlatforms[
                    selectedPlatform as keyof typeof connectedPlatforms
                  ] ? (
                    <Button onClick={() => handleConnect(selectedPlatform)}>
                      Connect
                    </Button>
                  ) : (
                    <Button onClick={() => setShowConnectionDialog(false)}>
                      Done
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ChatPlatformIntegrations;
