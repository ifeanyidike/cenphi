// src/components/collection-setup/social/AutomatedEngagement.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Calendar,
  Check,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  Hash,
  Heart,
  Info,
  Lightbulb,
  Link2,
  Mail,
  MessageCircle,
  MessageSquare,
  PencilRuler,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings,
  Shield,
  Sparkles,
  ThumbsUp,
  Timer,
  Trash2,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CollectionSettings, SocialSettings } from "@/types/setup";

type OnEngagementChange = <
  F extends keyof NonNullable<SocialSettings["engagement"]>,
>(
  field: F,
  value: NonNullable<SocialSettings["engagement"]>[F]
) => void;

interface EngagementHubProps {
  engagement?: {
    autoLike?: boolean;
    autoReply?: boolean;
    replyTemplates?: string[];
    engagementRules: {
      onlyPositive: boolean;
      minimumFollowers: number;
      excludeCompetitors: boolean;
    };
  };
  permissionMessage?: string;
  sendPermissionAuto?: boolean;
  trackResponseStatus?: boolean;
  autoExpire?: boolean;
  sendFollowUp?: boolean;
  onEngagementChange: OnEngagementChange;

  onSettingsChange: (
    field: keyof CollectionSettings["social"],
    value: any
  ) => void;
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

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

// Default templates if none provided
const defaultTemplates = [
  "Thank you for sharing your experience with us! We appreciate your feedback and are glad to hear you're enjoying our product.",
  "We're thrilled to hear about your positive experience! Would you mind if we featured your testimonial on our website?",
  "Thanks for the kind words! We'd love to include your testimonial in our marketing materials. Would that be okay with you?",
  "Your feedback made our day! Would you be interested in sharing more details about your experience with our product?",
];

const EngagementHub: React.FC<EngagementHubProps> = ({
  engagement = {
    autoLike: true,
    autoReply: true,
    replyTemplates: defaultTemplates,
    engagementRules: {
      onlyPositive: true,
      minimumFollowers: 0,
      excludeCompetitors: true,
    },
  },
  permissionMessage = "Hi! We loved your comment about our product. Would you mind if we featured it as a testimonial on our website?",
  sendPermissionAuto = true,
  trackResponseStatus = true,
  autoExpire = true,
  sendFollowUp = true,
  onEngagementChange,
  onSettingsChange,
  showToast,
}) => {
  // State
  const [activeTemplate, setActiveTemplate] = useState<number | null>(0);
  const [newTemplate, setNewTemplate] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<{
    index: number;
    text: string;
  } | null>(null);
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [editingPermissionMessage, setEditingPermissionMessage] =
    useState(false);
  const [tempPermissionMessage, setTempPermissionMessage] =
    useState(permissionMessage);
  const [autoEngagementEnabled, setAutoEngagementEnabled] = useState(true);
  const [activeEngagementTab, setActiveEngagementTab] =
    useState<string>("auto-replies");
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    slackNotifications: false,
    newTestimonials: true,
    negativeMentions: true,
    competitorMentions: false,
    highPriorityOnly: true,
    emailAddresses: ["user@example.com"],
  });
  const [editingNotificationEmail, setEditingNotificationEmail] =
    useState(false);
  const [newNotificationEmail, setNewNotificationEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [keywordsToMonitor, setKeywordsToMonitor] = useState<string[]>([
    "love",
    "recommend",
    "awesome",
    "great",
  ]);
  const [newKeyword, setNewKeyword] = useState("");
  const [showBulkPermissionDialog, setShowBulkPermissionDialog] =
    useState(false);
  const [showKeywordsDialog, setShowKeywordsDialog] = useState(false);
  const [showAITemplateDialog, setShowAITemplateDialog] = useState(false);

  // Handle adding a template
  const handleAddTemplate = () => {
    if (!newTemplate.trim()) return;

    const updatedTemplates = [
      ...(engagement.replyTemplates || []),
      newTemplate,
    ];
    onEngagementChange("replyTemplates", updatedTemplates);
    setNewTemplate("");

    showToast({
      title: "Template added",
      description: "Your new response template has been added.",
      variant: "default",
    });
  };

  // Handle saving a template
  const handleSaveTemplate = () => {
    if (!editingTemplate || !editingTemplate.text.trim()) return;

    const updatedTemplates = [...(engagement.replyTemplates || [])];
    updatedTemplates[editingTemplate.index] = editingTemplate.text;

    onEngagementChange("replyTemplates", updatedTemplates);
    setEditingTemplate(null);

    showToast({
      title: "Template updated",
      description: "Your response template has been updated.",
      variant: "default",
    });
  };

  // Handle deleting a template
  const handleDeleteTemplate = (index: number) => {
    const updatedTemplates = (engagement.replyTemplates || []).filter(
      (_, i) => i !== index
    );
    onEngagementChange("replyTemplates", updatedTemplates);

    showToast({
      title: "Template removed",
      description: "Your response template has been removed.",
      variant: "default",
    });
  };

  // Handle saving permission message
  const handleSavePermissionMessage = () => {
    onSettingsChange("permissionMessage", tempPermissionMessage);
    setEditingPermissionMessage(false);

    showToast({
      title: "Message updated",
      description: "Your permission request message has been updated.",
      variant: "default",
    });
  };

  // Handle auto engagement toggle
  const handleToggleAutoEngagement = (enabled: boolean) => {
    setAutoEngagementEnabled(enabled);
    onEngagementChange("autoLike", enabled);
    onEngagementChange("autoReply", enabled);
  };

  // Handle adding a notification email
  const handleAddNotificationEmail = () => {
    if (!newNotificationEmail.trim() || !isValidEmail(newNotificationEmail))
      return;

    setNotificationSettings({
      ...notificationSettings,
      emailAddresses: [
        ...notificationSettings.emailAddresses,
        newNotificationEmail,
      ],
    });

    setNewNotificationEmail("");
    setEditingNotificationEmail(false);

    showToast({
      title: "Email added",
      description: `${newNotificationEmail} has been added to notification recipients.`,
      variant: "default",
    });
  };

  // Handle removing a notification email
  const handleRemoveNotificationEmail = (email: string) => {
    setNotificationSettings({
      ...notificationSettings,
      emailAddresses: notificationSettings.emailAddresses.filter(
        (e) => e !== email
      ),
    });
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle adding a keyword to monitor
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;

    if (!keywordsToMonitor.includes(newKeyword.trim())) {
      setKeywordsToMonitor([...keywordsToMonitor, newKeyword.trim()]);
      setNewKeyword("");

      showToast({
        title: "Keyword added",
        description: `"${newKeyword}" has been added to your monitored keywords.`,
        variant: "default",
      });
    }
  };

  // Handle removing a keyword
  const handleRemoveKeyword = (keyword: string) => {
    setKeywordsToMonitor(keywordsToMonitor.filter((k) => k !== keyword));
  };

  // Simulate processing engagement settings
  const handleProcessEngagementSettings = () => {
    setIsProcessing(true);

    // Simulate API call with delay
    setTimeout(() => {
      setIsProcessing(false);

      showToast({
        title: "Settings applied",
        description: "Your engagement settings have been applied successfully.",
        variant: "default",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header with overview */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">
            Engagement Hub
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage automated and manual engagements to maximize testimonial
            collection
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-engagement" className="text-sm">
              Auto Engagement
            </Label>
            <Switch
              id="auto-engagement"
              checked={autoEngagementEnabled}
              onCheckedChange={handleToggleAutoEngagement}
            />
          </div>

          {activeEngagementTab === "auto-replies" && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex gap-2 items-center"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              <Settings className="h-4 w-4" />
              <span>Advanced</span>
              {showAdvancedSettings && (
                <Badge className="ml-1 bg-blue-100 text-blue-700 border-blue-200">
                  On
                </Badge>
              )}
            </Button>
          )}

          <Button
            className="h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex gap-2 items-center"
            onClick={handleProcessEngagementSettings}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Apply Settings</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Engagement Overview Card */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Engagement Stats</h3>
                    <p className="text-xs text-slate-500">Last 30 days</p>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Auto-Replies Sent</span>
                  <span className="font-medium">124</span>
                </div>
                <Progress value={75} className="h-1.5" />

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Permission Requests</span>
                  <span className="font-medium">86</span>
                </div>
                <Progress value={52} className="h-1.5" />

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Approvals</span>
                  <span className="font-medium">62</span>
                </div>
                <Progress value={38} className="h-1.5" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Successful Conversions</h3>
                    <p className="text-xs text-slate-500">
                      Testimonials collected
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">72%</div>
                    <div className="text-xs text-slate-500">
                      Conversion Rate
                    </div>
                  </div>

                  <div className="border-l pl-4 flex-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-slate-500">Sent</div>
                        <div className="text-sm font-medium">86</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Converted</div>
                        <div className="text-sm font-medium">62</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-1 border-blue-200 bg-white text-blue-700 hover:bg-blue-50 flex gap-2 items-center justify-center"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>View Full Analytics</span>
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Quick Actions</h3>
                    <p className="text-xs text-slate-500">Common tasks</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => setShowBulkPermissionDialog(true)}
                    variant="outline"
                    className="justify-start border-slate-200 bg-white hover:bg-slate-50 flex gap-2 items-center"
                  >
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <span>Send Bulk Permission Requests</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start border-slate-200 bg-white hover:bg-slate-50 flex gap-2 items-center"
                  >
                    <Shield className="h-4 w-4 text-indigo-600" />
                    <span>View Pending Approvals</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start border-slate-200 bg-white hover:bg-slate-50 flex gap-2 items-center"
                  >
                    <RefreshCw className="h-4 w-4 text-green-600" />
                    <span>Refresh Engagement Status</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Engagement Tabs */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <Tabs
          value={activeEngagementTab}
          onValueChange={setActiveEngagementTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
            <TabsTrigger
              value="auto-replies"
              className="flex gap-2 items-center"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Auto Replies</span>
            </TabsTrigger>
            <TabsTrigger
              value="permission-requests"
              className="flex gap-2 items-center"
            >
              <UserCheck className="h-4 w-4" />
              <span>Permission Requests</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex gap-2 items-center"
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="manual-outreach"
              className="flex gap-2 items-center"
            >
              <PencilRuler className="h-4 w-4" />
              <span>Manual Outreach</span>
            </TabsTrigger>
          </TabsList>

          {/* Auto Replies Tab */}
          <TabsContent value="auto-replies" className="mt-0 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span>Response Templates</span>
                    </CardTitle>
                    <CardDescription>
                      Create templates for automatic responses to testimonials
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto-reply" className="text-sm">
                      Auto-Reply
                    </Label>
                    <Switch
                      id="auto-reply"
                      checked={engagement.autoReply}
                      onCheckedChange={(checked) =>
                        onEngagementChange("autoReply", checked)
                      }
                      disabled={!autoEngagementEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3 space-y-6">
                <div className="space-y-4">
                  {/* Template list */}
                  <div className="space-y-3">
                    {(engagement.replyTemplates || []).map(
                      (template, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-4 border rounded-lg transition-colors",
                            activeTemplate === index
                              ? "border-blue-400 bg-blue-50"
                              : "hover:bg-slate-50"
                          )}
                        >
                          {editingTemplate &&
                          editingTemplate.index === index ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editingTemplate.text}
                                onChange={(e) =>
                                  setEditingTemplate({
                                    ...editingTemplate,
                                    text: e.target.value,
                                  })
                                }
                                rows={3}
                                placeholder="Enter your response template"
                                className="w-full"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingTemplate(null)}
                                >
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={handleSaveTemplate}>
                                  Save Template
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="text-sm flex-1">{template}</div>
                                <div className="flex items-center gap-1 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      setEditingTemplate({
                                        index,
                                        text: template,
                                      })
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteTemplate(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </div>
                              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setActiveTemplate(index);
                                    showToast({
                                      title: "Template selected",
                                      description:
                                        "This template is now the default response.",
                                      variant: "default",
                                    });
                                  }}
                                >
                                  {activeTemplate === index ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 mr-1" />
                                      <span>Default Template</span>
                                    </>
                                  ) : (
                                    "Set as Default"
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setShowMessagePreview(true);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  <span>Preview</span>
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    )}

                    {/* Add new template */}
                    <div className="space-y-3">
                      <Label htmlFor="new-template">Add New Template</Label>
                      <div className="flex gap-2">
                        <Textarea
                          id="new-template"
                          value={newTemplate}
                          onChange={(e) => setNewTemplate(e.target.value)}
                          rows={2}
                          placeholder="Enter a new response template..."
                          className="flex-1"
                          disabled={!autoEngagementEnabled}
                        />
                        <Button
                          className="self-end"
                          onClick={handleAddTemplate}
                          disabled={
                            !newTemplate.trim() || !autoEngagementEnabled
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Template variables */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Info className="h-4 w-4 text-slate-500" />
                      <span>Template Variables</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {[
                        { key: "{{name}}", description: "Customer's name" },
                        { key: "{{username}}", description: "Social username" },
                        { key: "{{platform}}", description: "Social platform" },
                        {
                          key: "{{company}}",
                          description: "Your company name",
                        },
                        { key: "{{date}}", description: "Current date" },
                        { key: "{{link}}", description: "Permission link" },
                      ].map((variable) => (
                        <div
                          key={variable.key}
                          className="border p-2 rounded bg-slate-50 flex flex-col"
                        >
                          <div className="flex items-center justify-between">
                            <code className="text-xs font-mono text-purple-700">
                              {variable.key}
                            </code>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        variable.key
                                      );
                                      showToast({
                                        title: "Copied",
                                        description: `Variable ${variable.key} copied to clipboard.`,
                                        variant: "default",
                                      });
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                    <span className="sr-only">Copy</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Copy to clipboard</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <span className="text-xs text-slate-500 mt-1">
                            {variable.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "bg-blue-50 border border-blue-100 rounded-lg p-4 transition-opacity",
                      !autoEngagementEnabled && "opacity-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                        <Bot className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1">
                          AI-Powered Response Generation
                        </h4>
                        <p className="text-xs text-blue-700 mb-3">
                          Let AI help create personalized response templates
                          based on your brand voice and goals.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white border-blue-200 text-blue-700"
                          disabled={!autoEngagementEnabled}
                          onClick={() => setShowAITemplateDialog(true)}
                        >
                          <Sparkles className="mr-2 h-3.5 w-3.5" />
                          <span>Generate AI Templates</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset to default templates
                    onEngagementChange("replyTemplates", defaultTemplates);
                    setActiveTemplate(0);

                    showToast({
                      title: "Templates reset",
                      description:
                        "Response templates have been reset to defaults.",
                      variant: "default",
                    });
                  }}
                  className="mr-auto"
                  disabled={!autoEngagementEnabled}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button
                  onClick={() => {
                    showToast({
                      title: "Templates saved",
                      description: "Your response templates have been saved.",
                      variant: "default",
                    });
                  }}
                  disabled={!autoEngagementEnabled}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Templates
                </Button>
              </CardFooter>
            </Card>

            {showAdvancedSettings && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4 text-slate-600" />
                    <span>Engagement Rules</span>
                  </CardTitle>
                  <CardDescription>
                    Configure when and how to engage
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="auto-like"
                        className="text-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <Heart className="h-3.5 w-3.5 text-pink-500" />
                        <span>Auto-Like Testimonials</span>
                      </Label>
                      <Switch
                        id="auto-like"
                        checked={engagement.autoLike}
                        onCheckedChange={(checked) =>
                          onEngagementChange("autoLike", checked)
                        }
                        disabled={!autoEngagementEnabled}
                      />
                    </div>
                    <p className="text-xs text-slate-500 ml-5">
                      Automatically like positive mentions and testimonials
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Engagement Filters</h4>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="only-positive"
                          checked={engagement.engagementRules?.onlyPositive}
                          onCheckedChange={(checked) =>
                            onEngagementChange("engagementRules", {
                              ...engagement.engagementRules,
                              onlyPositive: !!checked,
                            })
                          }
                          disabled={!autoEngagementEnabled}
                        />
                        <Label
                          htmlFor="only-positive"
                          className="text-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                          <span>Only Positive Sentiment</span>
                        </Label>
                      </div>
                      <p className="text-xs text-slate-500 ml-6">
                        Only engage with positive testimonials
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="exclude-competitors"
                          checked={
                            engagement.engagementRules?.excludeCompetitors
                          }
                          onCheckedChange={(checked) =>
                            onEngagementChange("engagementRules", {
                              ...engagement.engagementRules,
                              excludeCompetitors: !!checked,
                            })
                          }
                          disabled={!autoEngagementEnabled}
                        />
                        <Label
                          htmlFor="exclude-competitors"
                          className="text-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <Users className="h-3.5 w-3.5 text-blue-500" />
                          <span>Exclude Competitor Mentions</span>
                        </Label>
                      </div>
                      <p className="text-xs text-slate-500 ml-6">
                        Don't engage with posts mentioning competitors
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="min-followers"
                      className="flex items-center gap-1.5"
                    >
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span>
                        Minimum Followers (
                        {engagement.engagementRules?.minimumFollowers || 0})
                      </span>
                    </Label>
                    <Select
                      value={String(
                        engagement.engagementRules?.minimumFollowers || 0
                      )}
                      onValueChange={(value) =>
                        onEngagementChange("engagementRules", {
                          ...engagement.engagementRules,
                          minimumFollowers: parseInt(value),
                        })
                      }
                      disabled={!autoEngagementEnabled}
                    >
                      <SelectTrigger id="min-followers">
                        <SelectValue placeholder="Select minimum followers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No minimum</SelectItem>
                        <SelectItem value="100">100+ followers</SelectItem>
                        <SelectItem value="500">500+ followers</SelectItem>
                        <SelectItem value="1000">1,000+ followers</SelectItem>
                        <SelectItem value="5000">5,000+ followers</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Only engage with accounts that have at least this many
                      followers
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Engagement Timing</h4>

                    <div className="space-y-2">
                      <Label htmlFor="response-delay">Response Delay</Label>
                      <Select
                        defaultValue="delay-random"
                        disabled={!autoEngagementEnabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select delay" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delay-immediate">
                            Immediate
                          </SelectItem>
                          <SelectItem value="delay-5min">5 minutes</SelectItem>
                          <SelectItem value="delay-30min">
                            30 minutes
                          </SelectItem>
                          <SelectItem value="delay-1hour">1 hour</SelectItem>
                          <SelectItem value="delay-random">
                            Random (5-60 minutes)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        How long to wait before auto-responding to testimonials
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="daily-limit">
                        Daily Engagement Limit
                      </Label>
                      <Select
                        defaultValue="50"
                        disabled={!autoEngagementEnabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select limit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 per day</SelectItem>
                          <SelectItem value="25">25 per day</SelectItem>
                          <SelectItem value="50">50 per day</SelectItem>
                          <SelectItem value="100">100 per day</SelectItem>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Maximum number of auto-engagements per day
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-center">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      showToast({
                        title: "Rules tested",
                        description:
                          "Engagement rules test completed successfully.",
                        variant: "default",
                      });
                    }}
                    disabled={!autoEngagementEnabled}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Test Engagement
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          {/* Permission Requests Tab */}
          <TabsContent value="permission-requests" className="mt-0 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span>Permission Requests</span>
                    </CardTitle>
                    <CardDescription>
                      Configure how to request permission to use testimonials
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="send-permission-auto" className="text-sm">
                      Auto-Send
                    </Label>
                    <Switch
                      id="send-permission-auto"
                      checked={sendPermissionAuto}
                      onCheckedChange={(checked) =>
                        onSettingsChange("sendPermissionAuto", checked)
                      }
                      disabled={!autoEngagementEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="permission-message"
                          className="text-sm font-medium"
                        >
                          Permission Request Message
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setEditingPermissionMessage(true)}
                          disabled={!autoEngagementEnabled}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          <span>Edit</span>
                        </Button>
                      </div>
                      {editingPermissionMessage ? (
                        <div className="space-y-3">
                          <Textarea
                            id="permission-message"
                            value={tempPermissionMessage}
                            onChange={(e) =>
                              setTempPermissionMessage(e.target.value)
                            }
                            rows={4}
                            placeholder="Enter your permission request message"
                            className="w-full"
                            disabled={!autoEngagementEnabled}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPermissionMessage(false);
                                setTempPermissionMessage(permissionMessage);
                              }}
                              disabled={!autoEngagementEnabled}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSavePermissionMessage}
                              disabled={!autoEngagementEnabled}
                            >
                              Save Message
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border rounded-lg text-sm">
                          {permissionMessage}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">
                        Request Method
                      </Label>
                      <Select
                        defaultValue="direct-message"
                        disabled={!autoEngagementEnabled}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct-message">
                            Direct Message
                          </SelectItem>
                          <SelectItem value="comment-reply">
                            Comment Reply
                          </SelectItem>
                          <SelectItem value="both">Both Methods</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="track-response-status"
                          className="text-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <Link2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Track Response Status</span>
                        </Label>
                        <Switch
                          id="track-response-status"
                          checked={trackResponseStatus}
                          onCheckedChange={(checked) =>
                            onSettingsChange("trackResponseStatus", checked)
                          }
                          disabled={!autoEngagementEnabled}
                        />
                      </div>
                      <p className="text-xs text-slate-500 ml-5">
                        Track when users approve or deny permission requests
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="auto-expire"
                          className="text-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <Timer className="h-3.5 w-3.5 text-slate-500" />
                          <span>Auto-Expire Requests</span>
                        </Label>
                        <Switch
                          id="auto-expire"
                          checked={autoExpire}
                          onCheckedChange={(checked) =>
                            onSettingsChange("autoExpire", checked)
                          }
                          disabled={!autoEngagementEnabled}
                        />
                      </div>
                      <p className="text-xs text-slate-500 ml-5">
                        Automatically expire permission requests after 14 days
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="send-follow-up"
                          className="text-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
                          <span>Send Follow-up Message</span>
                        </Label>
                        <Switch
                          id="send-follow-up"
                          checked={sendFollowUp}
                          onCheckedChange={(checked) =>
                            onSettingsChange("sendFollowUp", checked)
                          }
                          disabled={!autoEngagementEnabled}
                        />
                      </div>
                      <p className="text-xs text-slate-500 ml-5">
                        Send one follow-up message after 3 days with no response
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <span>Response Summary</span>
                    </h4>

                    <div className="p-4 bg-slate-50 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium">
                          Last 30 Days Stats
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          73% Approval Rate
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Permission Requests Sent</span>
                            <span className="font-medium">152</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600"
                              style={{ width: "100%" }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Approved</span>
                            <span className="font-medium text-green-600">
                              112
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: "73%" }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Declined</span>
                            <span className="font-medium text-red-600">22</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500"
                              style={{ width: "14%" }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Awaiting Response</span>
                            <span className="font-medium text-amber-600">
                              18
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: "12%" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 mb-1">
                            Permission Request Tips
                          </h4>
                          <ul className="text-xs text-blue-700 space-y-1">
                            <li>
                              • <span className="font-medium">Be specific</span>{" "}
                              - Clearly explain how you'll use their testimonial
                            </li>
                            <li>
                              • <span className="font-medium">Be personal</span>{" "}
                              - Personalize the message with their name
                            </li>
                            <li>
                              •{" "}
                              <span className="font-medium">
                                Be appreciative
                              </span>{" "}
                              - Thank them for their positive feedback
                            </li>
                            <li>
                              • <span className="font-medium">Be clear</span> -
                              Make it easy to approve with a clear
                              call-to-action
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Create a demo permission request
                    showToast({
                      title: "Demo request sent",
                      description:
                        "A demo permission request has been sent to your test account.",
                      variant: "default",
                    });
                  }}
                  className="mr-auto"
                  disabled={!autoEngagementEnabled}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Request
                </Button>
                <Button
                  onClick={() => {
                    showToast({
                      title: "Permission settings saved",
                      description:
                        "Your permission request settings have been saved.",
                      variant: "default",
                    });
                  }}
                  disabled={!autoEngagementEnabled}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Permission Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4 text-indigo-600" />
                      <span>Notification Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Configure alerts for important testimonials and mentions
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-indigo-50 text-indigo-700 border-indigo-200"
                  >
                    Real-time
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        Notification Channels
                      </h4>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="email-notifications"
                            className="text-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <Mail className="h-3.5 w-3.5 text-slate-500" />
                            <span>Email Notifications</span>
                          </Label>
                          <Switch
                            id="email-notifications"
                            checked={notificationSettings.emailNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                emailNotifications: checked,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-slate-500 ml-5">
                          Receive email alerts for important testimonials
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="slack-notifications"
                            className="text-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <svg
                              className="h-3.5 w-3.5 text-slate-500"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                            </svg>
                            <span>Slack Notifications</span>
                          </Label>
                          <Switch
                            id="slack-notifications"
                            checked={notificationSettings.slackNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                slackNotifications: checked,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-slate-500 ml-5">
                          Receive alerts in your Slack workspace
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        Notification Triggers
                      </h4>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="new-testimonials"
                            className="text-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                            <span>New Testimonials</span>
                          </Label>
                          <Switch
                            id="new-testimonials"
                            checked={notificationSettings.newTestimonials}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                newTestimonials: checked,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-slate-500 ml-5">
                          Notify when new testimonials are posted
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="negative-mentions"
                            className="text-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                            <span>Negative Mentions</span>
                          </Label>
                          <Switch
                            id="negative-mentions"
                            checked={notificationSettings.negativeMentions}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                negativeMentions: checked,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-slate-500 ml-5">
                          Urgent alerts for negative mentions of your brand
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="competitor-mentions"
                            className="text-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <Users className="h-3.5 w-3.5 text-blue-500" />
                            <span>Competitor Mentions</span>
                          </Label>
                          <Switch
                            id="competitor-mentions"
                            checked={notificationSettings.competitorMentions}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                competitorMentions: checked,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-slate-500 ml-5">
                          Alerts when your testimonials mention competitors
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="high-priority-only"
                          className="text-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          <span>High Priority Only</span>
                        </Label>
                        <Switch
                          id="high-priority-only"
                          checked={notificationSettings.highPriorityOnly}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              highPriorityOnly: checked,
                            })
                          }
                        />
                      </div>
                      <p className="text-xs text-slate-500 ml-5">
                        Only notify for high priority mentions and testimonials
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">
                          Email Recipients
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setEditingNotificationEmail(true)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add Email
                        </Button>
                      </div>

                      {editingNotificationEmail ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={newNotificationEmail}
                              onChange={(e) =>
                                setNewNotificationEmail(e.target.value)
                              }
                              placeholder="email@example.com"
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddNotificationEmail}
                              disabled={
                                !newNotificationEmail.trim() ||
                                !isValidEmail(newNotificationEmail)
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingNotificationEmail(false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">
                            Enter valid email addresses to receive notifications
                          </p>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-3 bg-slate-50 space-y-2">
                          {notificationSettings.emailAddresses.length > 0 ? (
                            notificationSettings.emailAddresses.map((email) => (
                              <div
                                key={email}
                                className="flex items-center justify-between p-2 bg-white border rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-sm">{email}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                                  onClick={() =>
                                    handleRemoveNotificationEmail(email)
                                  }
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-2 text-sm text-slate-500">
                              No email recipients configured
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4 text-indigo-500" />
                        <span>Keywords to Monitor</span>
                      </h4>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Add important keyword"
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddKeyword}
                            disabled={!newKeyword.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setShowKeywordsDialog(true)}
                          >
                            <Settings className="h-3.5 w-3.5 mr-1" />
                            Manage All
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {keywordsToMonitor.map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="outline"
                              className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 pl-3 pr-2 py-1.5"
                            >
                              {keyword}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1 text-indigo-700 hover:bg-indigo-100 rounded-full"
                                onClick={() => handleRemoveKeyword(keyword)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                          {keywordsToMonitor.length === 0 && (
                            <div className="text-sm text-slate-500 italic">
                              No keywords added
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-indigo-800 mb-1">
                            Monitoring Tips
                          </h4>
                          <ul className="text-xs text-indigo-700 space-y-1">
                            <li>
                              •{" "}
                              <span className="font-medium">
                                Use specific keywords
                              </span>{" "}
                              - Monitor terms unique to your product or brand
                            </li>
                            <li>
                              •{" "}
                              <span className="font-medium">
                                Response time matters
                              </span>{" "}
                              - Quick responses to testimonials increase
                              conversion rates
                            </li>
                            <li>
                              •{" "}
                              <span className="font-medium">
                                Prioritize notifications
                              </span>{" "}
                              - Focus on high-priority alerts to avoid
                              notification fatigue
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset notification settings
                    setNotificationSettings({
                      emailNotifications: true,
                      slackNotifications: false,
                      newTestimonials: true,
                      negativeMentions: true,
                      competitorMentions: false,
                      highPriorityOnly: true,
                      emailAddresses: ["user@example.com"],
                    });

                    showToast({
                      title: "Settings reset",
                      description:
                        "Notification settings have been reset to defaults.",
                      variant: "default",
                    });
                  }}
                  className="mr-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>

                <Button
                  onClick={() => {
                    showToast({
                      title: "Settings saved",
                      description:
                        "Notification settings have been saved successfully.",
                      variant: "default",
                    });
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Manual Outreach Tab */}
          <TabsContent value="manual-outreach" className="mt-0 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PencilRuler className="h-4 w-4 text-purple-600" />
                  <span>Manual Outreach Tools</span>
                </CardTitle>
                <CardDescription>
                  Templates and tools for manually engaging with potential
                  testimonials
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span>Comment Request Template</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            <div className="p-3 bg-slate-50 border rounded-lg text-sm">
                              Hi {`{name}`}, thanks for your positive comment
                              about {`{product}`}! Would you be interested in
                              sharing your experience as a testimonial on our
                              website? We'd love to feature your feedback.
                            </div>
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    "Hi {{name}}, thanks for your positive comment about {{product}}! Would you be interested in sharing your experience as a testimonial on our website? We'd love to feature your feedback."
                                  );

                                  showToast({
                                    title: "Template copied",
                                    description:
                                      "The template has been copied to your clipboard.",
                                    variant: "default",
                                  });
                                }}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Copy Template
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-2">
                        <AccordionTrigger className="text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-green-600" />
                            <span>Email Request Template</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            <div className="p-3 bg-slate-50 border rounded-lg text-sm">
                              Subject: We'd Love to Feature Your Feedback,{" "}
                              {`{name}`}!<br />
                              <br />
                              Hi {`{name}`},<br />
                              <br />I hope this email finds you well. We noticed
                              your recent positive feedback about {`{product}`}{" "}
                              and wanted to reach out personally.
                              <br />
                              <br />
                              Would you be interested in having your comments
                              featured as a testimonial on our website? Your
                              experience would be valuable for others
                              considering our product.
                              <br />
                              <br />
                              Simply reply with "Yes" to give us permission, or
                              click this link: {`{link}`}
                              <br />
                              <br />
                              Thank you for your support!
                              <br />
                              <br />
                              Best regards,
                              <br />
                              {`{company_name}`} Team
                            </div>
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    'Subject: We\'d Love to Feature Your Feedback, {{name}}!\n\nHi {{name}},\n\nI hope this email finds you well. We noticed your recent positive feedback about {{product}} and wanted to reach out personally.\n\nWould you be interested in having your comments featured as a testimonial on our website? Your experience would be valuable for others considering our product.\n\nSimply reply with "Yes" to give us permission, or click this link: {{link}}\n\nThank you for your support!\n\nBest regards,\n{{company_name}} Team'
                                  );

                                  showToast({
                                    title: "Template copied",
                                    description:
                                      "The email template has been copied to your clipboard.",
                                    variant: "default",
                                  });
                                }}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Copy Template
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-3">
                        <AccordionTrigger className="text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-purple-600" />
                            <span>Direct Message Template</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            <div className="p-3 bg-slate-50 border rounded-lg text-sm">
                              Hi {`{name}`}! I'm {`{your_name}`} from{" "}
                              {`{company}`}. I noticed your positive feedback
                              about our {`{product}`} and wanted to personally
                              thank you. Would you be interested in having your
                              comments featured on our website as a testimonial?
                              It would really help others discover our product.
                            </div>
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    "Hi {{name}}! I'm {{your_name}} from {{company}}. I noticed your positive feedback about our {{product}} and wanted to personally thank you. Would you be interested in having your comments featured on our website as a testimonial? It would really help others discover our product."
                                  );

                                  showToast({
                                    title: "Template copied",
                                    description:
                                      "The direct message template has been copied to your clipboard.",
                                    variant: "default",
                                  });
                                }}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Copy Template
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-purple-800 mb-1">
                            Manual Outreach Tips
                          </h4>
                          <ul className="text-xs text-purple-700 space-y-1">
                            <li>
                              • <span className="font-medium">Be personal</span>{" "}
                              - Customize each message with personal details
                            </li>
                            <li>
                              • <span className="font-medium">Be timely</span> -
                              Reach out shortly after a positive interaction
                            </li>
                            <li>
                              •{" "}
                              <span className="font-medium">
                                Be transparent
                              </span>{" "}
                              - Clearly explain how you'll use their testimonial
                            </li>
                            <li>
                              • <span className="font-medium">Be grateful</span>{" "}
                              - Always thank them for their time and feedback
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-600" />
                        <span>Engagement Scheduler</span>
                      </h4>

                      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <CardContent className="p-4 text-center">
                          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <Calendar className="h-6 w-6 text-slate-400" />
                          </div>
                          <h4 className="text-sm font-medium text-slate-700 mb-1">
                            Scheduler Coming Soon
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">
                            Schedule manual outreach campaigns and follow-ups
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              showToast({
                                title: "Feature coming soon",
                                description:
                                  "The engagement scheduler will be available in a future update.",
                                variant: "default",
                              });
                            }}
                          >
                            <Bell className="h-3.5 w-3.5 mr-1.5" />
                            Get Notified When Available
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-slate-600" />
                        <span>External Resources</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="flex-col h-auto py-4 justify-start items-start text-left"
                          onClick={() => window.open("#", "_blank")}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Outreach Guide</span>
                          </div>
                          <p className="text-xs text-slate-500 text-left">
                            Tips and best practices for successful testimonial
                            outreach
                          </p>
                        </Button>

                        <Button
                          variant="outline"
                          className="flex-col h-auto py-4 justify-start items-start text-left"
                          onClick={() => window.open("#", "_blank")}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-4 w-4 text-indigo-600" />
                            <span className="font-medium">
                              Template Library
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 text-left">
                            Access our full library of outreach templates
                          </p>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  className="mr-auto"
                  onClick={() => {
                    window.open("#", "_blank");
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Engagement Tutorials
                </Button>

                <Button
                  onClick={() => {
                    showToast({
                      title: "Templates saved",
                      description: "Your outreach templates have been saved.",
                      variant: "default",
                    });
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Outreach Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Preview Dialog */}
      <Dialog open={showMessagePreview} onOpenChange={setShowMessagePreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Response Preview</DialogTitle>
            <DialogDescription>
              How your automated response will appear to users
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="font-medium text-blue-600">{"{C}"}</span>
              </div>
              <div>
                <div className="flex items-center">
                  <p className="font-medium">Your Company</p>
                  <span className="text-slate-500 text-sm mx-2">•</span>
                  <span className="text-slate-500 text-sm">Just now</span>
                </div>
                <p className="text-sm mt-1">
                  {engagement.replyTemplates && activeTemplate !== null
                    ? engagement.replyTemplates[activeTemplate]
                    : "No template selected"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowMessagePreview(false)}
            >
              Close Preview
            </Button>
            <Button
              onClick={() => {
                setShowMessagePreview(false);
                showToast({
                  title: "Template activated",
                  description:
                    "This template is now set as your default response.",
                  variant: "default",
                });
              }}
            >
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Permission Request Dialog */}
      <Dialog
        open={showBulkPermissionDialog}
        onOpenChange={setShowBulkPermissionDialog}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Bulk Permission Requests</DialogTitle>
            <DialogDescription>
              Send permission requests to multiple users at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="source">Data Source</Label>
              <Select defaultValue="recent-mentions">
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent-mentions">
                    Recent Mentions
                  </SelectItem>
                  <SelectItem value="positive-comments">
                    Positive Comments
                  </SelectItem>
                  <SelectItem value="csv-upload">CSV Upload</SelectItem>
                  <SelectItem value="manual-entry">Manual Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message-template">Message Template</Label>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  <span>Edit</span>
                </Button>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg text-sm">
                {permissionMessage}
              </div>
            </div>

            <div className="border rounded p-3 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Selected Recipients</h4>
                <Badge variant="outline">24 users</Badge>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto mb-2">
                {["user1", "user2", "user3"].map((user) => (
                  <div
                    key={user}
                    className="flex items-center justify-between bg-white p-1.5 rounded border text-sm"
                  >
                    <span>@{user}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="text-xs text-slate-500 text-center py-1">
                  + 21 more recipients
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="schedule" />
              <Label htmlFor="schedule" className="text-sm">
                Schedule for later
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="mr-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filter Recipients
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Send Permission Requests
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adding Keywords Dialog */}
      <Dialog open={showKeywordsDialog} onOpenChange={setShowKeywordsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Monitored Keywords</DialogTitle>
            <DialogDescription>
              Add or remove keywords to monitor for brand mentions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-keywords">Add Multiple Keywords</Label>
              <Textarea
                id="bulk-keywords"
                placeholder="Enter keywords separated by commas"
                className="resize-none"
                rows={4}
              />
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4 text-indigo-500" />
                <span>Current Keywords</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywordsToMonitor.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 pl-3 pr-2 py-1.5"
                  >
                    {keyword}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 text-indigo-700 hover:bg-indigo-100 rounded-full"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-indigo-500 mt-0.5" />
                <p className="text-xs text-indigo-700">
                  Choose specific keywords that are unique to your brand and
                  product. More specific keywords lead to better monitoring
                  results.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="mr-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Keywords
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Template Generator Dialog */}
      <Dialog
        open={showAITemplateDialog}
        onOpenChange={setShowAITemplateDialog}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI Template Generator</DialogTitle>
            <DialogDescription>
              Let AI help create personalized response templates based on your
              brand voice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="brand-description">
                Describe your brand voice
              </Label>
              <Textarea
                id="brand-description"
                placeholder="E.g., Professional but friendly, tech-focused, emphasizes quality and innovation..."
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Template type</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded-lg p-3 bg-blue-50 border-blue-200 flex items-start gap-2">
                  <Checkbox id="thank-you" checked />
                  <Label htmlFor="thank-you" className="text-sm">
                    <span className="font-medium block">Thank You</span>
                    <span className="text-xs text-slate-500">
                      Appreciation for positive feedback
                    </span>
                  </Label>
                </div>
                <div className="border rounded-lg p-3 bg-slate-50 flex items-start gap-2">
                  <Checkbox id="permission" />
                  <Label htmlFor="permission" className="text-sm">
                    <span className="font-medium block">
                      Permission Request
                    </span>
                    <span className="text-xs text-slate-500">
                      Ask to use testimonial
                    </span>
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tone Options</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="justify-start border-blue-200 bg-blue-50 text-blue-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Friendly
                </Button>
                <Button variant="outline" className="justify-start">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Professional
                </Button>
                <Button variant="outline" className="justify-start">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Creative
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-3 bg-blue-50 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">
                  AI Generated Templates
                </h4>
              </div>
              <div className="bg-white border rounded p-3 text-sm">
                <p className="text-slate-700">
                  Templates will appear here after generation...
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="mr-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Templates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default EngagementHub;
