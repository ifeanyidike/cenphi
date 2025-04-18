// src/components/collection-setup/social/SocialSettings.tsx
import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import {
  Hash,
  AtSign,
  Heart,
  BarChart3,
  Settings2,
  MessageSquare,
  RefreshCw,
  AlignJustify,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CollectionSettings,
  PlatformAccount,
  SocialCampaign,
  SocialPlatformName,
} from "@/types/setup";

// Component imports
import SocialPlatforms from "./SocialPlatforms";
import EngagementHub from "./EngagementHub";
import SocialAnalytics from "./SocialAnalytics";
import TestimonialDiscovery from "./TestimonialDiscovery";
import SocialCampaigns from "./SocialCampaigns";

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

interface SocialSettingsProps {
  settings: CollectionSettings["social"];
  onFormatToggle: (formatType: "video" | "audio" | "text" | "image") => void;
  onAddFormatClick: () => void;
  onSettingsChange: (
    field: keyof CollectionSettings["social"],
    value: any
  ) => void;
  onNestedSettingsChange: <
    U extends keyof CollectionSettings["social"],
    F extends keyof NonNullable<CollectionSettings["social"][U]>,
  >(
    parentField: U,
    field: F,
    value: NonNullable<CollectionSettings["social"][U]>[F]
  ) => void;
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
  onSyncPlatform: (platform: SocialPlatformName) => void;
  onAddCampaign: (campaign: Omit<SocialCampaign, "id" | "collected">) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onUpdateCampaign: (updatedCampaign: SocialCampaign) => void;
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

const SocialSettings: React.FC<SocialSettingsProps> = ({
  settings,
  onSettingsChange,
  onNestedSettingsChange,
  onTogglePlatform,
  onConnectPlatform,
  showToast,
  onDisconnectAccount,
  onSetActiveAccount,
  onSyncPlatform,
  onAddCampaign,
  onDeleteCampaign,
  onUpdateCampaign,
}) => {
  const [activeTab, setActiveTab] = useState<string>("platforms");

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Info Bar */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-xl border border-indigo-200 shadow-sm bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-200/20 to-transparent rounded-full transform translate-x-20 -translate-y-20 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pink-200/20 to-transparent rounded-full transform -translate-x-10 translate-y-10 blur-xl"></div>

        {/* Content */}
        <div className="relative px-6 py-5 flex items-center gap-5 z-10">
          {/* Left icon section with glowing effect */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-md"></div>
            <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-full">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            <h3 className="font-semibold text-indigo-900 text-base tracking-tight">
              Elevate Your Brand with Social Proof
            </h3>
            <p className="text-indigo-700/90 text-sm leading-relaxed mt-1">
              Automatically collect, curate, and showcase testimonials from your
              social media networks. Transform engagement into powerful social
              proof that drives conversions.
            </p>

            {/* Action link */}
            <button
              onClick={() => setActiveTab("platforms")}
              className="mt-2 inline-flex items-center text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors"
            >
              Connect your accounts
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right badge with premium styling */}
          <div className="flex-shrink-0">
            <Badge className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-none shadow-sm">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              <span className="font-medium">High Conversion</span>
            </Badge>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-white border rounded-xl shadow-sm overflow-hidden"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-6 py-3">
            <TabsList className="bg-slate-100/70 p-1 rounded-lg grid grid-cols-3 md:grid-cols-6 gap-1">
              <TabsTrigger
                value="platforms"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
              >
                <AtSign className="h-3.5 w-3.5 mr-1.5" />
                <span>Platforms</span>
              </TabsTrigger>
              <TabsTrigger
                value="campaigns"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
              >
                <Hash className="h-3.5 w-3.5 mr-1.5" />
                <span>Campaigns</span>
              </TabsTrigger>
              <TabsTrigger
                value="discovery"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
              >
                <Heart className="h-3.5 w-3.5 mr-1.5" />
                <span>Discovery</span>
              </TabsTrigger>
              {/* <TabsTrigger
                value="monitoring"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
              >
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                <span>Monitoring</span>
              </TabsTrigger> */}
              <TabsTrigger
                value="engagement"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                <span>Engagement</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="platforms" className="mt-0">
              <SocialPlatforms
                platforms={settings.platforms}
                onTogglePlatform={onTogglePlatform}
                onConnectPlatform={onConnectPlatform}
                onDisconnectAccount={onDisconnectAccount}
                onSetActiveAccount={onSetActiveAccount}
                onSyncPlatform={onSyncPlatform}
                showToast={showToast}
              />
            </TabsContent>

            <TabsContent value="campaigns" className="mt-0">
              {/* <HashtagCampaigns
                campaigns={settings.campaigns}
                platforms={settings.platforms}
                onAddCampaign={onAddCampaign}
                showToast={showToast}
              /> */}

              <SocialCampaigns
                campaigns={settings.campaigns}
                platforms={settings.platforms}
                onAddCampaign={onAddCampaign}
                onDeleteCampaign={onDeleteCampaign}
                onUpdateCampaign={onUpdateCampaign}
                showToast={showToast}
              />
            </TabsContent>

            <TabsContent value="discovery" className="mt-0">
              <TestimonialDiscovery
                settings={settings}
                onSettingsChange={onSettingsChange}
                showToast={showToast}
              />
            </TabsContent>

            {/* <TabsContent value="monitoring" className="mt-0">
              <ContentMonitoring
                monitoring={settings.monitoring}
                filtering={settings.filtering}
                onSettingsChange={(field, value) => {
                  onNestedSettingsChange("monitoring", field, value);
                }}
                onFilteringChange={(field, value) => {
                  onNestedSettingsChange("filtering", field, value);
                }}
                showToast={showToast}
              />
            </TabsContent> */}

            <TabsContent value="engagement" className="mt-0">
              <EngagementHub
                engagement={settings.engagement}
                permissionMessage={settings.permissionMessage}
                sendPermissionAuto={settings.sendPermissionAuto}
                trackResponseStatus={settings.trackResponseStatus}
                autoExpire={settings.autoExpire}
                sendFollowUp={settings.sendFollowUp}
                onEngagementChange={(field, value) => {
                  onNestedSettingsChange("engagement", field, value);
                }}
                onSettingsChange={onSettingsChange}
                showToast={showToast}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <SocialAnalytics showToast={showToast} />
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>

      {/* <SocialContentModeration showToast={() => {}} /> */}

      {/* Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Data</span>
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span>Advanced Settings</span>
          </Button>
          <Button
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() =>
              showToast({
                title: "Settings saved",
                description:
                  "Your social media testimonial settings have been saved.",
                variant: "default",
              })
            }
          >
            <AlignJustify className="h-4 w-4" />
            <span>Save Settings</span>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default observer(SocialSettings);
