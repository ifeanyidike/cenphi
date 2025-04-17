import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import {
  Mail,
  MailCheck,
  AlertCircle,
  Settings,
  Users,
  BarChart,
  Clock,
  FileText,
  Video,
  Mic,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CollectionSettings, TriggerType } from "@/types/setup";

// Component imports
import EmailTemplates from "./EmailTemplates";
import EmailTriggers from "./EmailTriggers";
import EmailDeliverySettings from "./EmailDeliverySettings";
import EmailAnalytics from "./EmailAnalytics";
import EmailAdvancedSettings from "./EmailAdvancedSettings";
// import EmailScheduleSettings from "./EmailScheduleSettings";

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

interface EmailSettingsProps {
  settings: CollectionSettings["email"];
  onFormatToggle: (formatType: "video" | "audio" | "text" | "image") => void;
  onTriggerToggle: (triggerType: TriggerType) => void;
  onRemoveTrigger: (id: string) => void;
  onSettingsChange: (
    field: keyof CollectionSettings["email"],
    value: any
  ) => void;
  onSelectTemplate: (templateId: string) => void;
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

const EmailSettings: React.FC<EmailSettingsProps> = ({
  settings,
  onFormatToggle,
  onTriggerToggle,
  onRemoveTrigger,
  onSettingsChange,
  onSelectTemplate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState("templates");

  // Calculate enabled formats
  const enabledFormats = settings.formats.filter((format) => format.enabled);

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Info Header Card */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-semibold text-blue-900">
                  Email Testimonial Collection
                </h3>
                <p className="text-blue-700 text-sm">
                  Create targeted email campaigns to collect testimonials at key
                  moments in your customer journey. Boost completion rates with
                  perfectly timed follow-ups and engaging email templates.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 border-blue-200 font-normal"
                  >
                    <MailCheck className="mr-1 h-3 w-3" />
                    High Conversion
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 border-blue-200 font-normal"
                  >
                    <Users className="mr-1 h-3 w-3" />
                    Targeted Outreach
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 border-blue-200 font-normal"
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    Automated Follow-ups
                  </Badge>
                </div>
              </div>
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">View best practices guide</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Format Selection Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6">
            {/* <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Testimonial Formats</h3>
              <Button variant="outline" size="sm" onClick={onAddFormatClick}>
                <Paperclip className="mr-2 h-4 w-4" />
                Add Format
              </Button>
            </div> */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {settings.formats.map((format) => {
                const isEnabled = format.enabled;
                let Icon;
                switch (format.type) {
                  case "text":
                    Icon = FileText;
                    break;
                  case "video":
                    Icon = Video;
                    break;
                  case "audio":
                    Icon = Mic;
                    break;
                  case "image":
                    Icon = ImageIcon;
                    break;
                  default:
                    Icon = FileText;
                }

                return (
                  <div
                    key={format.type}
                    className={`border rounded-xl p-4 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      isEnabled
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => onFormatToggle(format.type)}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isEnabled ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${isEnabled ? "text-blue-600" : "text-gray-400"}`}
                      />
                    </div>
                    <h4
                      className={`font-medium text-sm ${isEnabled ? "text-blue-800" : "text-gray-500"}`}
                    >
                      {format.type.charAt(0).toUpperCase() +
                        format.type.slice(1)}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${
                        isEnabled
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {enabledFormats.length === 0 && (
              <div className="mt-4 p-4 border border-amber-200 bg-amber-50 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium">
                    No formats enabled
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    Enable at least one testimonial format to collect via email.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Configuration Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger
              value="templates"
              className="flex items-center gap-1.5"
            >
              <Mail className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="triggers" className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Triggers</span>
            </TabsTrigger>
            {/* <TabsTrigger value="sender" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Sender</span>
            </TabsTrigger> */}
            <TabsTrigger value="delivery" className="flex items-center gap-1.5">
              <Settings className="h-4 w-4" />
              <span>Delivery</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-1.5"
            >
              <BarChart className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-1.5">
              <Settings className="h-4 w-4" />
              <span>Advanced</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6 mt-0">
            <EmailTemplates
              templates={settings.templates}
              activeTemplateId={
                settings.templates.find((t) => t.active)?.id || ""
              }
              onSelectTemplate={onSelectTemplate}
              primaryColor={
                settings.templates.find((t) => t.active)?.design
                  ?.primaryColor || "#4F46E5"
              }
              senderName={settings.senderName}
              // senderEmail={settings.senderEmail}
              formats={enabledFormats.map((f) => f.type)}
              showToast={showToast}
              replyToEmail={settings.replyToEmail}
              senderType={settings.senderType}
              companyLogo={settings.companyLogo}
              signatureTemplate={settings.signatureTemplate}
              signatureText={settings.signatureText}
            />
          </TabsContent>

          <TabsContent value="triggers" className="space-y-6 mt-0">
            <EmailTriggers
              triggers={settings.triggers}
              onTriggerToggle={onTriggerToggle}
              onRemoveTrigger={onRemoveTrigger}
            />
          </TabsContent>

          {/* <TabsContent value="sender" className="space-y-6 mt-0">
            <EmailSenderSettings
              // senderName={settings.senderName}
              // senderEmail={settings.senderEmail}
              // replyToEmail={settings.replyToEmail}
              settings={settings}
              onUpdateSettings={(field, value) =>
                onSettingsChange(
                  field as keyof CollectionSettings["email"],
                  value
                )
              }
            />
          </TabsContent> */}

          <TabsContent value="delivery" className="space-y-6 mt-0">
            <EmailDeliverySettings
              schedule={settings.schedule}
              onUpdateSettings={(field, value) => {
                onSettingsChange("schedule", {
                  ...settings.schedule,
                  [field]: value,
                });
              }}
            />
            {/* <EmailScheduleSettings
              schedule={settings.schedule}
              onSettingsChange={(field, value) => {
                // Update schedule settings
                onSettingsChange("schedule", {
                  ...settings.schedule,
                  [field]: value,
                });
              }}
            /> */}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-0">
            <EmailAnalytics />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-0">
            <EmailAdvancedSettings
              advanced={settings.advanced}
              onSettingsChange={(field, value) => {
                // Update advanced settings
                onSettingsChange("advanced", {
                  ...settings.advanced,
                  [field]: value,
                });
              }}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default observer(EmailSettings);
