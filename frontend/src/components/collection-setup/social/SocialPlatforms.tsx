// src/components/collection-setup/social/SocialPlatforms.tsx

import React, { FC, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Link2,
  PlusCircle,
  Check,
  Settings2,
  User,
  UserCheck,
  MessageSquare,
  Loader2,
  Info,
  ExternalLink,
  Trash2,
  AtSign,
  PencilRuler,
  Hash,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  AccountManagementState,
  ConnectingState,
  PlatformAccount,
  PlatformSettingsType,
  SocialPlatform,
  SocialPlatformName,
} from "@/types/setup";
import {
  getMockAccounts,
  platformColors,
  platformDevUrls,
  platformIcons,
  platformNames,
  platformPermissions,
} from "./defaults";
import { observer } from "mobx-react-lite";

// Mail icon component (not in lucide-react import)
const Mail = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
);

export interface ToastConfig {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

export interface SocialPlatformConnectorProps {
  platforms: SocialPlatform[];
  onTogglePlatform: (platform: SocialPlatformName) => void;
  onConnectPlatform: (
    platform: SocialPlatformName,
    connected: boolean,
    account: PlatformAccount
  ) => void;
  onDisconnectAccount: (
    platform: SocialPlatformName,
    accountId: string
  ) => void;
  onSetActiveAccount: (platform: SocialPlatformName, accountId: string) => void;
  showToast: (toast: ToastConfig) => void;
  onSyncPlatform: (platform: SocialPlatformName) => void;
}

// Realistic developers/APIs for each platform

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren",
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

const SocialPlatformConnector: React.FC<SocialPlatformConnectorProps> = ({
  platforms,
  onTogglePlatform,
  onConnectPlatform,
  onDisconnectAccount,
  onSetActiveAccount,
  showToast,
  onSyncPlatform,
}) => {
  // State for syncing in progress
  const [syncingPlatform, setSyncingPlatform] =
    useState<SocialPlatformName | null>(null);

  // State for connection dialog
  const [connecting, setConnecting] = useState<ConnectingState>({
    platform: null,
    step: 1,
    isLoading: false,
    error: null,
    selectedAccount: null,
    selectedPermissions: [],
    customAccount: {
      name: "",
      username: "",
      type: "business",
    },
    isCustomAccount: false,
  });

  // State for account management dialog
  const [accountManagement, setAccountManagement] =
    useState<AccountManagementState>({
      platform: null,
      isOpen: false,
    });

  // State for platform settings dialog
  const [platformSettings, setPlatformSettings] =
    useState<PlatformSettingsType | null>(null);

  // Start connection process
  const handleStartConnect = (platform: SocialPlatformName): void => {
    setConnecting({
      platform,
      step: 1,
      isLoading: false,
      error: null,
      selectedAccount: null,
      selectedPermissions: platformPermissions[platform]
        .filter((p) => p.required)
        .map((p) => p.id),
      customAccount: {
        name: "",
        username: "",
        type: "business",
      },
      isCustomAccount: false,
    });
  };

  // Open account management dialog
  const handleManageAccounts = (platform: SocialPlatformName): void => {
    setAccountManagement({
      platform,
      isOpen: true,
    });
  };

  // Open platform settings
  const handleOpenSettings = (platform: SocialPlatform): void => {
    setPlatformSettings({
      platform,
      contentSources: {
        mentions: true,
        comments: true,
        directMessages: true,
        posts: true,
        hashtags: true,
      },
      frequencyInHours: 6, // Default sync every 6 hours
      syncOnStart: true,
    });
  };

  // Function to save platform settings
  const handleSavePlatformSettings = (): void => {
    if (!platformSettings) return;

    showToast({
      title: "Settings saved",
      description: `Your ${platformNames[platformSettings.platform.name]} settings have been saved.`,
      variant: "default",
    });

    setPlatformSettings(null);
  };

  // Disconnect an account
  const handleDisconnectAccount = (
    platformName: SocialPlatformName,
    accountId: string
  ): void => {
    // setExtendedPlatforms(updatedPlatforms);
    onDisconnectAccount(platformName, accountId);

    showToast({
      title: "Account disconnected",
      description: `Account has been disconnected from ${platformNames[platformName]}.`,
    });
  };

  // Set an account as active
  const handleSetActiveAccount = (
    platformName: SocialPlatformName,
    accountId: string
  ): void => {
    onSetActiveAccount(platformName, accountId);

    showToast({
      title: "Active account changed",
      description: `Active account changed for ${platformNames[platformName]}.`,
    });
  };

  // Sync a platform
  const handleSyncPlatform = (platform: SocialPlatformName): void => {
    setSyncingPlatform(platform);

    // Simulate sync
    setTimeout(() => {
      onSyncPlatform(platform);
      setSyncingPlatform(null);

      showToast({
        title: "Sync complete",
        description: `Your ${platformNames[platform]} account has been synced.`,
      });
    }, 1500);
  };

  // Get active account for a platform
  const getActiveAccount = (
    platform: SocialPlatformName
  ): PlatformAccount | null => {
    const extPlatform = platforms.find((p) => p.name === platform);
    if (!extPlatform || !extPlatform.activeAccountId) return null;

    const activeAccount = extPlatform.accounts.find(
      (account) => account.id === extPlatform.activeAccountId
    );
    return activeAccount || null;
  };

  // Calculate connection statistics
  const connectedPlatformsCount = platforms.filter(
    (p) => p.connected && p.enabled
  ).length;
  const enabledPlatformsCount = platforms.filter((p) => p.enabled).length;
  const connectionRate =
    enabledPlatformsCount > 0
      ? Math.round((connectedPlatformsCount / enabledPlatformsCount) * 100)
      : 0;

  // Component JSX
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Platform Connection Overview Card */}
      <motion.div variants={itemVariants}>
        <Card className="md:col-span-3 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Social Platform Setup
                </CardTitle>
                <CardDescription>
                  Connect your social media accounts to collect testimonials
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "px-2.5 py-1",
                  connectionRate >= 75
                    ? "bg-green-50 text-green-700 border-green-200"
                    : connectionRate >= 50
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                )}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {connectedPlatformsCount} of {enabledPlatformsCount} Connected
              </Badge>
            </div>
          </CardHeader>
          {/* <CardContent className="pb-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Connection Status</span>
                  <span className="font-medium">
                    {connectionRate}% Complete
                  </span>
                </div>
                <Progress value={connectionRate} className="h-2" />
              </div>
            </div>
          </CardContent> */}
          <CardContent className="pb-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Connection Status</span>
                  <span className="font-medium">
                    {connectionRate}% Complete
                  </span>
                </div>
                <Progress
                  value={connectionRate}
                  className="h-2"
                  style={
                    {
                      "--progress-background": "rgb(241, 245, 249)",
                      "--progress-foreground":
                        connectionRate >= 75
                          ? "rgb(34, 197, 94)"
                          : connectionRate >= 50
                            ? "rgb(245, 158, 11)"
                            : "rgb(59, 130, 246)",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 rounded-lg p-4 bg-white/50 border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <span>Platform Benefits</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 ml-6 list-disc">
                    <li>
                      Automatic testimonial collection from your social media
                    </li>
                    <li>Immediate notifications for positive mentions</li>
                    <li>Simplified permission requests for user content</li>
                    <li>
                      Consistent content gathering from all social channels
                    </li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <span>Getting Started</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 ml-6 list-disc">
                    <li>Enable the platforms you want to collect from</li>
                    <li>Connect your accounts with the required permissions</li>
                    <li>Configure your content sources for each platform</li>
                    <li>
                      Set up campaigns in the Campaigns tab for targeted
                      collection
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform Cards Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const Icon = platformIcons[platform.name];
            const colors = platformColors[platform.name];
            const activeAccount = getActiveAccount(platform.name);

            return (
              <Card
                key={platform.name}
                className={cn(
                  "border transition-all duration-300",
                  platform.enabled ? "opacity-100" : "opacity-60",
                  platform.enabled &&
                    platform.connected &&
                    `border-l-4 ${colors.border}`
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-xl",
                          platform.enabled ? colors.bg : "bg-slate-200"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            platform.enabled ? colors.text : "text-slate-500"
                          )}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {platformNames[platform.name]}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {platform.connected && activeAccount
                            ? `@${activeAccount.username}`
                            : "Not connected"}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={platform.enabled}
                      onCheckedChange={() => onTogglePlatform(platform.name)}
                    />
                  </div>
                </CardHeader>

                <CardContent className="pb-3">
                  {platform.enabled ? (
                    platform.connected ? (
                      <div className="space-y-4">
                        {/* Connected platform status */}
                        <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                Connected
                              </div>
                              <div className="text-xs text-slate-500">
                                {platform.lastSyncDate
                                  ? `Last sync: ${getRelativeTimeString(platform.lastSyncDate)}`
                                  : "Not synced yet"}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => handleSyncPlatform(platform.name)}
                            disabled={syncingPlatform === platform.name}
                          >
                            {syncingPlatform === platform.name ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            {syncingPlatform === platform.name
                              ? "Syncing..."
                              : "Sync Now"}
                          </Button>
                        </div>

                        {/* Account info */}
                        {activeAccount && (
                          <div className="p-3 border border-slate-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-medium">
                                Active Account
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-slate-500" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">
                                  {activeAccount.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  @{activeAccount.username}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => handleManageAccounts(platform.name)}
                          >
                            <User className="h-4 w-4 mr-1.5" />
                            Accounts
                            {platform.accounts.length > 0 && (
                              <Badge className="ml-1.5 bg-blue-100 text-blue-700 border-blue-200">
                                {platform.accounts.length}
                              </Badge>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => handleStartConnect(platform.name)}
                          >
                            <PlusCircle className="h-4 w-4 mr-1.5" />
                            Add Account
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => handleOpenSettings(platform)}
                          >
                            <Settings2 className="h-4 w-4 mr-1.5" />
                            Settings
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0">
                        <div
                          className={`${colors.lightBg} border border-dashed rounded-lg p-4 text-center space-y-3`}
                        >
                          <div className="flex items-center justify-center">
                            <div
                              className={`h-12 w-12 rounded-full ${colors.bg} flex items-center justify-center`}
                            >
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium">
                              Connect {platformNames[platform.name]}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 mb-3">
                              Connect your account to automatically collect
                              testimonials
                            </p>

                            <Button
                              className={`bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} ${colors.hoverFrom} ${colors.hoverTo} text-white w-full`}
                              size="sm"
                              onClick={() => handleStartConnect(platform.name)}
                            >
                              <Link2 className="h-4 w-4 mr-1.5" />
                              Connect {platformNames[platform.name]}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center p-6">
                      <p className="text-sm text-slate-500">
                        Enable {platformNames[platform.name]} to collect
                        testimonials
                      </p>
                    </div>
                  )}
                </CardContent>

                {platform.enabled && platform.connected && (
                  <CardFooter className="pt-1 flex justify-between items-center border-t text-xs text-slate-500 py-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <Info className="h-3.5 w-3.5" />
                            <span>Platform Info</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {platform.accounts.length} account(s) connected to{" "}
                            {platformNames[platform.name]}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <a
                      href={platformDevUrls[platform.name]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>API Docs</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Connection Dialog */}
      <Dialog
        open={!!connecting.platform}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setConnecting({
              platform: null,
              step: 1,
              isLoading: false,
              error: null,
              selectedAccount: null,
              selectedPermissions: [],
              customAccount: {
                name: "",
                username: "",
                type: "business",
              },
              isCustomAccount: false,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Platform Account</DialogTitle>
            <DialogDescription>
              Connect your social media account to collect testimonials
            </DialogDescription>
          </DialogHeader>

          {/* {renderConnectionSteps()} */}
          <RenderConnectionSteps
            connecting={connecting}
            setConnecting={setConnecting}
            onConnectPlatform={onConnectPlatform}
            onSyncPlatform={onSyncPlatform}
            platforms={platforms}
            showToast={showToast}
          />
        </DialogContent>
      </Dialog>

      {/* Account Management Dialog */}
      <Dialog
        open={accountManagement.isOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setAccountManagement({
              platform: null,
              isOpen: false,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Accounts</DialogTitle>
            <DialogDescription>
              Add, remove, or change the active account
            </DialogDescription>
          </DialogHeader>

          {/* {renderAccountManagement()} */}
          <RenderAccountManagement
            accountManagement={accountManagement}
            setAccountManagement={setAccountManagement}
            platforms={platforms}
            handleDisconnectAccount={handleDisconnectAccount}
            handleSetActiveAccount={handleSetActiveAccount}
            handleStartConnect={handleStartConnect}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setAccountManagement({
                  platform: null,
                  isOpen: false,
                })
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Platform Settings Dialog */}
      <Dialog
        open={!!platformSettings}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setPlatformSettings(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Platform Settings</DialogTitle>
            <DialogDescription>
              Configure how testimonials are collected from this platform
            </DialogDescription>
          </DialogHeader>

          {/* {renderPlatformSettings()} */}
          <RenderPlatformSettings
            getActiveAccount={getActiveAccount}
            platformSettings={platformSettings}
            setPlatformSettings={setPlatformSettings}
          />

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setPlatformSettings(null)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950"
              onClick={handleSavePlatformSettings}
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Helper function to format relative time
const getRelativeTimeString = (date: Date | null): string => {
  if (!date) return "Never";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default observer(SocialPlatformConnector);

// Render connection steps

type ConnectingStepsProps = {
  connecting: ConnectingState;
  setConnecting: React.Dispatch<React.SetStateAction<ConnectingState>>;
  onConnectPlatform: (
    platform: SocialPlatformName,
    connected: boolean,
    account: PlatformAccount
  ) => void;
  platforms: SocialPlatform[];
  onSyncPlatform: (platform: SocialPlatformName) => void;
  showToast: (toast: ToastConfig) => void;
};
const RenderConnectionSteps: FC<ConnectingStepsProps> = observer(
  ({
    connecting,
    setConnecting,
    platforms,
    onConnectPlatform,
    onSyncPlatform,
    showToast,
  }) => {
    if (!connecting.platform) return null;

    const platform = connecting.platform;
    const colors = platformColors[platform];
    const Icon = platformIcons[platform];
    const permissions = platformPermissions[platform] || [];

    // Common button styles using platform colors
    const primaryButtonClass = `bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} ${colors.hoverFrom} ${colors.hoverTo} text-white`;

    // Select an account during connection
    const handleSelectAccount = (account: PlatformAccount): void => {
      setConnecting((prev) => ({
        ...prev,
        selectedAccount: account,
        isCustomAccount: false,
        error: null,
      }));
    };

    // Update custom account details
    const handleUpdateCustomAccount = (
      field: keyof ConnectingState["customAccount"],
      value: string
    ): void => {
      setConnecting((prev) => ({
        ...prev,
        customAccount: {
          ...prev.customAccount,
          [field]:
            field === "type"
              ? (value as "personal" | "business" | "creator")
              : value,
        },
      }));
    };

    // Function to advance to the next step in the connection process
    const handleNextConnectStep = (): void => {
      if (!connecting.platform) return;

      if (connecting.step === 1) {
        // Validate custom account if that's what they're using
        if (connecting.isCustomAccount) {
          if (
            !connecting.customAccount.name ||
            !connecting.customAccount.username
          ) {
            setConnecting((prev) => ({
              ...prev,
              error: "Please fill in all required fields for your account.",
            }));
            return;
          }
        } else if (!connecting.selectedAccount) {
          // Must select an account before proceeding
          setConnecting((prev) => ({
            ...prev,
            error: "Please select an account to continue or create a new one.",
          }));
          return;
        }

        // Simulate authentication API call to platform
        setConnecting((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        // Simulate brief API call delay then proceed to next step
        setTimeout(() => {
          setConnecting((prev) => ({
            ...prev,
            step: 2,
            isLoading: false,
          }));
        }, 1500);
      } else if (connecting.step === 2) {
        // Final step, complete connection
        setConnecting((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        // Create account object
        let accountToAdd: PlatformAccount;
        if (connecting.isCustomAccount) {
          // Create new account from custom details
          accountToAdd = {
            id: `${connecting.platform}-${Date.now()}`, // Generate unique ID
            name: connecting.customAccount.name,
            username: connecting.customAccount.username,
            type: connecting.customAccount.type,
            followers: 0,
            verified: false,
          };
        } else if (connecting.selectedAccount) {
          accountToAdd = connecting.selectedAccount;
        } else {
          // This shouldn't happen due to validation in step 1
          setConnecting((prev) => ({
            ...prev,
            isLoading: false,
            error: "No account selected. Please go back and select an account.",
          }));
          return;
        }

        // Simulate API call with a high success rate
        setTimeout(() => {
          const platformIndex = platforms.findIndex(
            (p) => p.name === connecting.platform
          );
          if (platformIndex >= 0) {
            // Check if account already exists
            const accountExists = platforms[platformIndex].accounts.some(
              (a) => a.username === accountToAdd.username
            );

            if (accountExists) {
              setConnecting((prev) => ({
                ...prev,
                isLoading: false,
                error: "This account is already connected.",
              }));
              return;
            }

            // Call the parent handler
            onConnectPlatform(connecting.platform!, true, accountToAdd);

            // Update stats
            onSyncPlatform(connecting.platform!);
            showToast({
              title: "Account connected successfully",
              description: `Your ${accountToAdd.name} account has been connected for testimonial collection.`,
              variant: "default",
            });

            // Reset connecting state
            setConnecting({
              platform: null,
              step: 1,
              isLoading: false,
              error: null,
              selectedAccount: null,
              selectedPermissions: [],
              customAccount: {
                name: "",
                username: "",
                type: "business",
              },
              isCustomAccount: false,
            });
          }
        }, 2000);
      }
    };

    // Function to go back to the previous step
    const handlePrevConnectStep = (): void => {
      if (connecting.step > 1) {
        setConnecting((prev) => ({
          ...prev,
          step: prev.step - 1,
          error: null,
        }));
      }
    };

    // Function to toggle a permission during connection
    const handleTogglePermission = (permissionId: string): void => {
      setConnecting((prev) => {
        if (!prev.platform) return prev;

        // Don't allow toggling required permissions
        const platformPerms = platformPermissions[prev.platform];
        const isRequired = platformPerms.find(
          (p) => p.id === permissionId
        )?.required;
        if (isRequired) return prev;

        // Toggle the permission
        const permissions = prev.selectedPermissions || [];
        if (permissions.includes(permissionId)) {
          return {
            ...prev,
            selectedPermissions: permissions.filter(
              (id) => id !== permissionId
            ),
          };
        } else {
          return {
            ...prev,
            selectedPermissions: [...permissions, permissionId],
          };
        }
      });
    };

    return (
      <div className="space-y-6">
        {/* Platform header */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-medium">{platformNames[platform]}</h3>
            <p className="text-sm text-slate-500">
              Connect your account to collect testimonials
            </p>
          </div>
        </div>

        {/* Error message */}
        {connecting.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>{connecting.error}</div>
          </div>
        )}

        {/* Connection steps */}
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 ml-3.5" />

          {/* Step 1: Account Selection */}
          <div
            className={`pl-8 relative pb-8 ${connecting.step !== 1 ? "opacity-60" : ""}`}
          >
            <div
              className={cn(
                "absolute left-0 top-0 rounded-full flex items-center justify-center",
                connecting.step === 1
                  ? `${colors.bg} text-white border-4 border-white shadow-md`
                  : connecting.step > 1
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-500"
              )}
              style={{ width: "28px", height: "28px" }}
            >
              {connecting.step > 1 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">1</span>
              )}
            </div>

            <h4
              className={`text-sm font-medium ${connecting.step === 1 ? "text-slate-900" : "text-slate-500"}`}
            >
              Select or Create Account
            </h4>

            <p className="text-xs text-slate-500 mt-1">
              Choose an existing account or create a new one
            </p>

            {connecting.step === 1 && (
              <div className="mt-4 space-y-4">
                {/* Toggle between existing and new account */}
                <div className="flex space-x-2 mb-4">
                  <Button
                    variant={connecting.isCustomAccount ? "outline" : "default"}
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      setConnecting((prev) => ({
                        ...prev,
                        isCustomAccount: false,
                      }))
                    }
                  >
                    Select Existing Account
                  </Button>
                  <Button
                    variant={
                      !connecting.isCustomAccount ? "outline" : "default"
                    }
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      setConnecting((prev) => ({
                        ...prev,
                        isCustomAccount: true,
                      }))
                    }
                  >
                    Create New Account
                  </Button>
                </div>

                {/* Existing accounts */}
                {!connecting.isCustomAccount && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y">
                    {getMockAccounts(platform).map((account) => (
                      <div
                        key={account.id}
                        className={cn(
                          "p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors",
                          connecting.selectedAccount?.id === account.id &&
                            `${colors.lightBg} border-l-4 ${colors.border}`
                        )}
                        onClick={() => handleSelectAccount(account)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                            <User className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <div className="font-medium text-sm">
                                {account.name}
                              </div>
                              {account.verified && (
                                <Badge className="h-5 px-1 bg-blue-100 text-blue-700 border-blue-200">
                                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                  <span className="text-xs">Verified</span>
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              @{account.username} · {account.type} ·{" "}
                              {account.followers?.toLocaleString()} followers
                            </div>
                          </div>
                        </div>

                        {connecting.selectedAccount?.id === account.id ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAccount(account);
                            }}
                          >
                            Select
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom account form */}
                {connecting.isCustomAccount && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="space-y-2">
                      <Label htmlFor="account-name">Account Name</Label>
                      <Input
                        id="account-name"
                        placeholder="My Business Page"
                        value={connecting.customAccount.name}
                        onChange={(e) =>
                          handleUpdateCustomAccount("name", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-username">Username</Label>
                      <Input
                        id="account-username"
                        placeholder="mybusiness"
                        value={connecting.customAccount.username}
                        onChange={(e) =>
                          handleUpdateCustomAccount("username", e.target.value)
                        }
                      />
                      <p className="text-xs text-slate-500">
                        Enter without @ symbol
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-type">Account Type</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={
                            connecting.customAccount.type === "personal"
                              ? "default"
                              : "outline"
                          }
                          className="text-xs h-8"
                          onClick={() =>
                            handleUpdateCustomAccount("type", "personal")
                          }
                        >
                          Personal
                        </Button>
                        <Button
                          type="button"
                          variant={
                            connecting.customAccount.type === "business"
                              ? "default"
                              : "outline"
                          }
                          className="text-xs h-8"
                          onClick={() =>
                            handleUpdateCustomAccount("type", "business")
                          }
                        >
                          Business
                        </Button>
                        <Button
                          type="button"
                          variant={
                            connecting.customAccount.type === "creator"
                              ? "default"
                              : "outline"
                          }
                          className="text-xs h-8"
                          onClick={() =>
                            handleUpdateCustomAccount("type", "creator")
                          }
                        >
                          Creator
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    className={primaryButtonClass}
                    onClick={handleNextConnectStep}
                    disabled={
                      connecting.isLoading ||
                      (!connecting.selectedAccount &&
                        !connecting.isCustomAccount)
                    }
                  >
                    {connecting.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Continue</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Configure Permissions */}
          <div
            className={`pl-8 relative pb-2 ${connecting.step !== 2 ? "opacity-60" : ""}`}
          >
            <div
              className={cn(
                "absolute left-0 top-0 rounded-full flex items-center justify-center",
                connecting.step === 2
                  ? `${colors.bg} text-white border-4 border-white shadow-md`
                  : connecting.step > 2
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-500"
              )}
              style={{ width: "28px", height: "28px" }}
            >
              {connecting.step > 2 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">2</span>
              )}
            </div>

            <h4
              className={`text-sm font-medium ${connecting.step === 2 ? "text-slate-900" : "text-slate-500"}`}
            >
              Review Permissions
            </h4>

            <p className="text-xs text-slate-500 mt-1">
              Required permissions are needed for testimonial collection
            </p>

            {connecting.step === 2 && (
              <div className="mt-4 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium mb-3">
                    Platform Permissions
                  </h5>
                  <div className="space-y-3">
                    {permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className={cn(
                          "p-3 border rounded-md bg-white",
                          permission.required ? "border-green-200" : ""
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <permission.icon
                              className={cn(
                                "h-4 w-4",
                                permission.required
                                  ? "text-green-600"
                                  : "text-slate-500"
                              )}
                            />
                            <span className="font-medium text-sm">
                              {permission.name}
                            </span>
                            {permission.required && (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                Required
                              </Badge>
                            )}
                          </div>
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={connecting.selectedPermissions?.includes(
                              permission.id
                            )}
                            onCheckedChange={() =>
                              handleTogglePermission(permission.id)
                            }
                            disabled={permission.required}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 ml-6">
                          {permission.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-xs text-slate-500 flex items-start gap-2">
                    <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>
                      You can modify non-required permissions, but some features
                      may be limited. Required permissions are essential for
                      testimonial collection.
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevConnectStep}>
                    Back
                  </Button>
                  <Button
                    className={primaryButtonClass}
                    onClick={handleNextConnectStep}
                    disabled={connecting.isLoading}
                  >
                    {connecting.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className="mr-2 h-4 w-4" />
                        Complete Connection
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-slate-500 text-center">
                  By connecting, you agree to the{" "}
                  <a
                    href={platformDevUrls[platform]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {platformNames[platform]} API Terms of Service
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// Render account management dialog

type RenderAccountManagementProps = {
  accountManagement: AccountManagementState;
  setAccountManagement: React.Dispatch<
    React.SetStateAction<AccountManagementState>
  >;
  platforms: SocialPlatform[];
  handleStartConnect: (platformName: SocialPlatformName) => void;
  handleSetActiveAccount: (
    platformName: SocialPlatformName,
    accountId: string
  ) => void;
  handleDisconnectAccount: (
    platformName: SocialPlatformName,
    accountId: string
  ) => void;
};
const RenderAccountManagement: FC<RenderAccountManagementProps> = observer(
  ({
    accountManagement,
    setAccountManagement,
    platforms,
    handleStartConnect,
    handleSetActiveAccount,
    handleDisconnectAccount,
  }): React.ReactNode => {
    if (!accountManagement.platform) return null;

    const platformName = accountManagement.platform;
    const colors = platformColors[platformName];
    const Icon = platformIcons[platformName];
    const platform = platforms.find((p) => p.name === platformName);

    if (!platform) return null;

    return (
      <div className="space-y-6">
        {/* Platform header */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-medium">
              {platformNames[platformName]}
            </h3>
            <p className="text-sm text-slate-500">Manage connected accounts</p>
          </div>
        </div>

        {/* Connected accounts */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-slate-700">
              Connected Accounts
            </h4>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setAccountManagement({ platform: null, isOpen: false });
                handleStartConnect(platformName);
              }}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              Add Account
            </Button>
          </div>

          {platform.accounts.length === 0 ? (
            <div className="p-4 text-center border rounded-lg border-dashed text-slate-500 text-sm">
              No accounts connected yet
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y">
              {platform.accounts.map((account) => (
                <div
                  key={account.id}
                  className={cn(
                    "p-3 flex items-center justify-between",
                    platform.activeAccountId === account.id &&
                      `${colors.lightBg} border-l-4 ${colors.border}`
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="font-medium text-sm">
                          {account.name}
                        </div>
                        {account.verified && (
                          <Badge className="h-5 px-1 bg-blue-100 text-blue-700 border-blue-200">
                            <CheckCircle2 className="h-3 w-3 mr-0.5" />
                            <span className="text-xs">Verified</span>
                          </Badge>
                        )}
                        {platform.activeAccountId === account.id && (
                          <Badge className="h-5 px-1 bg-green-100 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-0.5" />
                            <span className="text-xs">Active</span>
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        @{account.username} · {account.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {platform.activeAccountId !== account.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() =>
                          handleSetActiveAccount(platformName, account.id)
                        }
                      >
                        <UserCheck className="h-4 w-4 mr-1.5" />
                        Set as Active
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() =>
                        handleDisconnectAccount(platformName, account.id)
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

// Render platform settings dialog content

type RenderPlatformSettingsProps = {
  platformSettings: PlatformSettingsType | null;
  setPlatformSettings: React.Dispatch<
    React.SetStateAction<PlatformSettingsType | null>
  >;
  getActiveAccount: (
    platformName: SocialPlatformName
  ) => PlatformAccount | null;
};
const RenderPlatformSettings: FC<RenderPlatformSettingsProps> = observer(
  ({
    platformSettings,
    setPlatformSettings,
    getActiveAccount,
  }): React.ReactNode => {
    if (!platformSettings) return null;

    const platform = platformSettings.platform;
    const colors = platformColors[platform.name];
    const Icon = platformIcons[platform.name];
    const activeAccount = getActiveAccount(platform.name);

    return (
      <div className="space-y-6">
        {/* Platform header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium">{platformNames[platform.name]}</h3>
              <p className="text-sm text-slate-500">
                {activeAccount
                  ? `@${activeAccount.username}`
                  : "No active account"}
              </p>
            </div>
          </div>

          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Connected
          </Badge>
        </div>

        {/* Settings tabs */}
        <Tabs defaultValue="sources">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sources">Content Sources</TabsTrigger>
            <TabsTrigger value="sync">Sync Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-4 pt-4">
            <p className="text-sm text-slate-500">
              Select which types of content to collect testimonials from
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mentions"
                  checked={platformSettings.contentSources.mentions}
                  onCheckedChange={(checked) =>
                    setPlatformSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            contentSources: {
                              ...prev.contentSources,
                              mentions: !!checked,
                            },
                          }
                        : null
                    )
                  }
                />
                <Label
                  htmlFor="mentions"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <AtSign className="h-4 w-4 text-blue-500" />
                  <span>Mentions</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comments"
                  checked={platformSettings.contentSources.comments}
                  onCheckedChange={(checked) =>
                    setPlatformSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            contentSources: {
                              ...prev.contentSources,
                              comments: !!checked,
                            },
                          }
                        : null
                    )
                  }
                />
                <Label
                  htmlFor="comments"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  <span>Comments</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="directMessages"
                  checked={platformSettings.contentSources.directMessages}
                  onCheckedChange={(checked) =>
                    setPlatformSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            contentSources: {
                              ...prev.contentSources,
                              directMessages: !!checked,
                            },
                          }
                        : null
                    )
                  }
                />
                <Label
                  htmlFor="directMessages"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Mail className="h-4 w-4 text-purple-500" />
                  <span>Direct Messages</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="posts"
                  checked={platformSettings.contentSources.posts}
                  onCheckedChange={(checked) =>
                    setPlatformSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            contentSources: {
                              ...prev.contentSources,
                              posts: !!checked,
                            },
                          }
                        : null
                    )
                  }
                />
                <Label
                  htmlFor="posts"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <PencilRuler className="h-4 w-4 text-emerald-500" />
                  <span>Posts</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hashtags"
                  checked={platformSettings.contentSources.hashtags}
                  onCheckedChange={(checked) =>
                    setPlatformSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            contentSources: {
                              ...prev.contentSources,
                              hashtags: !!checked,
                            },
                          }
                        : null
                    )
                  }
                />
                <Label
                  htmlFor="hashtags"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Hash className="h-4 w-4 text-orange-500" />
                  <span>Hashtags</span>
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4 pt-4">
            <p className="text-sm text-slate-500">
              Configure how often to sync content from this platform
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={
                    platformSettings.frequencyInHours === 1
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    setPlatformSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            frequencyInHours: 1,
                          }
                        : null
                    )
                  }
                >
                  Every hour
                </Button>
                <Button
                  variant={
                    platformSettings.frequencyInHours === 6
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    setPlatformSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            frequencyInHours: 6,
                          }
                        : null
                    )
                  }
                >
                  Every 6 hours
                </Button>
                <Button
                  variant={
                    platformSettings.frequencyInHours === 12
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    setPlatformSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            frequencyInHours: 12,
                          }
                        : null
                    )
                  }
                >
                  Every 12 hours
                </Button>
                <Button
                  variant={
                    platformSettings.frequencyInHours === 24
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    setPlatformSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            frequencyInHours: 24,
                          }
                        : null
                    )
                  }
                >
                  Once a day
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sync-on-start"
                  checked={platformSettings.syncOnStart}
                  onCheckedChange={(checked) =>
                    setPlatformSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            syncOnStart: !!checked,
                          }
                        : null
                    )
                  }
                />
                <Label
                  htmlFor="sync-on-start"
                  className="text-sm cursor-pointer"
                >
                  Sync when application starts
                </Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);
