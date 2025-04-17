// src/components/collection-setup/chat/ChatSettings.tsx
import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import {
  Info,
  Zap,
  ExternalLink,
  BarChart,
  Settings,
  Clock,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CollectionSettings, TriggerType } from "@/types/setup";

// Component imports
import ChatPlatformIntegrations from "./ChatPlatformIntegrations";
import ChatTriggerSettings from "./ChatTriggerSettings";
import ChatMessageConfiguration from "./ChatMessageConfiguration";
import ChatPreviewDialog from "./ChatPreviewDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatAnalytics from "./ChatAnalytics";

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

interface ChatSettingsProps {
  settings: CollectionSettings["chat"];
  onFormatToggle: (formatType: "video" | "audio" | "text" | "image") => void;
  onTriggerToggle: (triggerType: TriggerType) => void;
  onRemoveTrigger: (id: string) => void;
  onSettingsChange: (
    field: keyof CollectionSettings["chat"],
    value: any
  ) => void;
  onConnectPlatform: (
    platform: keyof CollectionSettings["chat"]["connectedPlatforms"],
    connected: boolean
  ) => void;
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

const ChatSettings: React.FC<ChatSettingsProps> = ({
  settings,
  onTriggerToggle,
  onRemoveTrigger,
  onSettingsChange,
  onConnectPlatform,
  showToast,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("message-configuration");

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
        className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-start gap-3"
      >
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-blue-900 text-sm">
            Collect testimonials directly through chat interactions
          </h3>
          <p className="text-blue-700/80 text-xs leading-relaxed mt-1">
            Leverage your customer support conversations to collect authentic
            testimonials at key moments. Connect with popular chat platforms and
            configure when and how to request feedback.
          </p>
        </div>
        <div className="ml-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">View chat integration guide</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger
            value="message-configuration"
            className="flex items-center gap-1.5"
          >
            <Mail className="h-4 w-4" />
            <span>Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Triggers</span>
          </TabsTrigger>
          {/* <TabsTrigger value="formats" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>Formats</span>
          </TabsTrigger> */}
          <TabsTrigger
            value="integration"
            className="flex items-center gap-1.5"
          >
            <Settings className="h-4 w-4" />
            <span>Integration</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5">
            <BarChart className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="message-configuration" className="space-y-6 mt-0">
          {/* Message Configuration */}
          <motion.div variants={itemVariants}>
            <ChatMessageConfiguration
              settings={settings}
              timeout={settings.timeout}
              onSettingsChange={onSettingsChange}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-6 mt-0">
          {/* Triggers Section */}
          <motion.div variants={itemVariants}>
            <ChatTriggerSettings
              triggers={settings.triggers}
              onToggleTrigger={onTriggerToggle}
              onRemoveTrigger={onRemoveTrigger}
            />
          </motion.div>
        </TabsContent>

        {/* <TabsContent value="formats" className="space-y-6 mt-0">
          <motion.div variants={itemVariants}>
            <FormatsSection
              method="chat"
              formats={settings.formats}
              onToggleFormat={onFormatToggle}
              onAddFormatClick={onAddFormatClick}
            />
          </motion.div>
        </TabsContent> */}

        <TabsContent value="integration" className="space-y-6 mt-0">
          {/* Platform Integrations */}
          <motion.div variants={itemVariants}>
            <ChatPlatformIntegrations
              connectedPlatforms={settings.connectedPlatforms}
              customIntegration={settings.customIntegration}
              onConnectPlatform={onConnectPlatform}
              onCustomIntegrationChange={(field, value) => {
                onSettingsChange("customIntegration", {
                  ...settings.customIntegration,
                  [field]: value,
                });
              }}
              showToast={showToast}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-0">
          {/* Performance metrics card */}
          <ChatAnalytics />
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <ChatPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        settings={settings}
      />

      <Button
        onClick={() => setShowPreview(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
      >
        <Zap className="h-4 w-4" />
        <span>Chat Experience</span>
      </Button>
    </motion.div>
  );
};

export default observer(ChatSettings);
