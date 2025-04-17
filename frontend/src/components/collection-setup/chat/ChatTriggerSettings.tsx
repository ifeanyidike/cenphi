import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Settings,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  ShoppingCart,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Using original types
import {
  ChatBusinessEventType,
  DelayUnit,
  EnhancedTriggerOption,
  TriggerType,
  UserSegmentType,
} from "@/types/setup";

interface ChatTriggerSettingsProps {
  triggers?: EnhancedTriggerOption<ChatBusinessEventType>[];
  onToggleTrigger: (triggerType: TriggerType) => void;
  onRemoveTrigger: (id: string) => void;
}

// Business event info - simplified for MVP
const businessEvents: Record<
  ChatBusinessEventType,
  {
    icon: React.ReactNode;
    name: string;
    description: string;
    color: string;
  }
> = {
  support_resolved: {
    icon: <CheckCircle className="h-4 w-4" />,
    name: "Support Issue Resolved",
    description: "Trigger when a support issue is marked as resolved",
    color: "emerald",
  },
  chat_completed: {
    icon: <MessageSquare className="h-4 w-4" />,
    name: "Chat Conversation Ended",
    description: "Trigger when a chat conversation is completed",
    color: "blue",
  },
};

// User segment info - simplified for MVP
const userSegments: Record<
  UserSegmentType,
  {
    icon: React.ReactNode;
    name: string;
    description: string;
  }
> = {
  all_users: {
    icon: <MessageSquare className="h-4 w-4" />,
    name: "All Users",
    description: "Target all users who engage in chat",
  },
  new_users: {
    icon: <Plus className="h-4 w-4" />,
    name: "New Users",
    description: "Target first-time chat users",
  },
  returning_users: {
    icon: <CheckCircle className="h-4 w-4" />,
    name: "Returning Users",
    description: "Target users who have used chat before",
  },
  customers: {
    icon: <ShoppingCart className="h-4 w-4" />,
    name: "Customers",
    description: "Target users who have purchased",
  },
};

// Helper function to get event color
const getEventColor = (eventType: ChatBusinessEventType): string => {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return colorMap[businessEvents[eventType].color] || colorMap.blue;
};

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

const ChatTriggerSettings: React.FC<ChatTriggerSettingsProps> = observer(
  ({ triggers = [], onToggleTrigger, onRemoveTrigger }) => {
    const settingsStore = testimonialSettingsStore;
    const [expandedTriggerId, setExpandedTriggerId] = useState<string | null>(
      null
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTrigger, setEditingTrigger] =
      useState<EnhancedTriggerOption<ChatBusinessEventType> | null>(null);
    const [newTrigger, setNewTrigger] = useState<
      Partial<EnhancedTriggerOption<ChatBusinessEventType>>
    >({
      businessEvent: "support_resolved",
      userSegment: ["all_users"],
      delay: "2",
      delayUnit: "minutes",
      frequency: "once",
      priority: "medium",
      enabled: true,
    });

    // Toggle expanded state for a trigger
    const toggleExpanded = (triggerId: string) => {
      setExpandedTriggerId(expandedTriggerId === triggerId ? null : triggerId);
    };

    // Edit a trigger
    const editTrigger = (
      trigger: EnhancedTriggerOption<ChatBusinessEventType>
    ) => {
      setEditingTrigger(trigger);
      setNewTrigger({ ...trigger });
      setDialogOpen(true);
    };

    // Duplicate a trigger
    const duplicateTrigger = (triggerId: string) => {
      const triggerToDuplicate = triggers.find((t) => t.id === triggerId);
      if (triggerToDuplicate) {
        const newTrigger = {
          ...triggerToDuplicate,
          id: generateId(),
          name: `${triggerToDuplicate.name} (Copy)`,
        };
        runInAction(() => {
          settingsStore.addTrigger("chat", newTrigger);
        });
      }
    };

    // Add a new trigger
    const addTrigger = () => {
      setEditingTrigger(null);
      setNewTrigger({
        businessEvent: "support_resolved",
        userSegment: ["all_users"],
        delay: "2",
        delayUnit: "minutes",
        frequency: "once",
        priority: "medium",
        enabled: true,
      });
      setDialogOpen(true);
    };

    // Save trigger (add or update)
    const saveTrigger = () => {
      if (editingTrigger) {
        // Update existing trigger
        runInAction(() => {
          settingsStore.editTrigger("chat", editingTrigger.id, {
            ...editingTrigger,
            ...newTrigger,
            id: editingTrigger.id, // Ensure ID is preserved
          } as EnhancedTriggerOption<ChatBusinessEventType>);
        });
      } else {
        // Add new trigger
        const trigger: EnhancedTriggerOption<ChatBusinessEventType> = {
          id: generateId(),
          name:
            newTrigger.name ||
            businessEvents[newTrigger.businessEvent as ChatBusinessEventType]
              .name,
          description:
            newTrigger.description ||
            businessEvents[newTrigger.businessEvent as ChatBusinessEventType]
              .description,
          enabled: newTrigger.enabled !== false,
          businessEvent: newTrigger.businessEvent!,
          userSegment: newTrigger.userSegment!,
          delay: newTrigger.delay || "0",
          delayUnit: newTrigger.delayUnit!,
          frequency: newTrigger.frequency!,
          priority: newTrigger.priority!,
          type: newTrigger.type!,
        };
        runInAction(() => {
          settingsStore.addTrigger("chat", trigger);
        });
      }
      setDialogOpen(false);
    };

    // Count enabled triggers
    const enabledCount = triggers.filter((trigger) => trigger.enabled).length;

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
              Chat Triggers
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Configure when to request testimonials during chat conversations
            </p>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 py-1.5 px-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-sm"
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-medium">{enabledCount} Active</span>
          </Badge>
        </div>

        {/* Main Content */}
        <Card className="overflow-hidden border-slate-200/75 dark:border-slate-800/75 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <AnimatePresence>
              {triggers.length === 0 ? (
                // Empty state
                <motion.div
                  className="text-center py-16 space-y-5"
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 mx-auto h-24 w-24 rounded-full flex items-center justify-center shadow-inner"
                  >
                    <MessageSquare className="h-10 w-10 text-blue-500" />
                  </motion.div>

                  <motion.h3
                    variants={itemVariants}
                    className="text-xl font-semibold text-slate-800 dark:text-slate-200"
                  >
                    No Chat Triggers Configured
                  </motion.h3>

                  <motion.p
                    variants={itemVariants}
                    className="text-slate-500 dark:text-slate-400 max-w-md mx-auto"
                  >
                    Chat triggers determine when to request testimonials during
                    conversations. Set up your first trigger to start collecting
                    testimonials.
                  </motion.p>

                  <motion.div variants={itemVariants}>
                    <Button
                      size="lg"
                      onClick={addTrigger}
                      className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Trigger
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                // Trigger list
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  {triggers.map((trigger) => (
                    <motion.div
                      key={trigger.id}
                      variants={itemVariants}
                      layoutId={`trigger-${trigger.id}`}
                      className={cn(
                        "group relative rounded-xl overflow-hidden border transition-all duration-300",
                        expandedTriggerId === trigger.id
                          ? "shadow-md"
                          : "hover:shadow-sm",
                        trigger.enabled
                          ? "border-blue-200 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-900/10"
                          : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50"
                      )}
                    >
                      {/* Trigger Card */}
                      <div
                        className="flex items-start p-5 gap-4 cursor-pointer"
                        onClick={() => toggleExpanded(trigger.id)}
                      >
                        {/* Event Icon */}
                        <div
                          className={cn(
                            "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                            trigger.enabled
                              ? "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30"
                              : "bg-slate-100 dark:bg-slate-800"
                          )}
                        >
                          <div className="text-blue-600 dark:text-blue-400">
                            {businessEvents[
                              trigger.businessEvent as ChatBusinessEventType
                            ]?.icon || <Settings className="h-4 w-4" />}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow">
                          <div className="flex flex-col">
                            <h3
                              className={cn(
                                "font-medium transition-colors",
                                trigger.enabled
                                  ? "text-slate-900 dark:text-slate-100"
                                  : "text-slate-500 dark:text-slate-400"
                              )}
                            >
                              {trigger.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 mb-2 line-clamp-1">
                              {trigger.description}
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "flex items-center gap-1.5 py-0.5 px-2",
                                  getEventColor(
                                    trigger.businessEvent as ChatBusinessEventType
                                  )
                                )}
                              >
                                {businessEvents[
                                  trigger.businessEvent as ChatBusinessEventType
                                ]?.icon || <Settings className="h-4 w-4" />}
                                <span>
                                  {businessEvents[
                                    trigger.businessEvent as ChatBusinessEventType
                                  ]?.name || "Custom Event"}
                                </span>
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Switch
                            checked={trigger.enabled}
                            onCheckedChange={() =>
                              onToggleTrigger(trigger.type)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-blue-600"
                          />

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => editTrigger(trigger)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit Trigger</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => duplicateTrigger(trigger.id)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                <span>Duplicate</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={() => onRemoveTrigger(trigger.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Trigger</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expandedTriggerId === trigger.id && (
                        <div className="p-5 pt-0 border-t border-slate-200 dark:border-slate-700">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Trigger Event
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "flex items-center gap-1.5 py-1.5 px-2.5",
                                    getEventColor(
                                      trigger.businessEvent as ChatBusinessEventType
                                    )
                                  )}
                                >
                                  {businessEvents[
                                    trigger.businessEvent as ChatBusinessEventType
                                  ]?.icon || <Settings className="h-4 w-4" />}
                                  <span>
                                    {businessEvents[
                                      trigger.businessEvent as ChatBusinessEventType
                                    ]?.name || "Custom Event"}
                                  </span>
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                User Segment
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {trigger.userSegment.map((segment) => (
                                  <Badge
                                    key={segment}
                                    variant="outline"
                                    className="flex items-center gap-1.5 bg-violet-50 text-violet-800 dark:bg-violet-900/20 dark:text-violet-300 border-violet-200 dark:border-violet-800 py-1"
                                  >
                                    {userSegments[segment]?.icon || (
                                      <MessageSquare className="h-4 w-4" />
                                    )}
                                    <span>
                                      {userSegments[segment]?.name || segment}
                                    </span>
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Timing
                              </div>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1.5 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800 py-1"
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>
                                    {trigger.delay}{" "}
                                    {parseInt(trigger.delay) === 1
                                      ? trigger.delayUnit
                                      : `${trigger.delayUnit}s`}{" "}
                                    after event
                                  </span>
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                editTrigger(trigger);
                              }}
                              className="border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              <Edit className="mr-1.5 h-3.5 w-3.5" />
                              <span>Edit Settings</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Highlight line for enabled triggers */}
                      {trigger.enabled && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600" />
                      )}
                    </motion.div>
                  ))}

                  {/* Add trigger button */}
                  <motion.div variants={itemVariants} className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 dark:border-blue-800 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 gap-2 py-5 transition-all duration-200"
                      onClick={addTrigger}
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Another Trigger</span>
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg sm:rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-950/95">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingTrigger ? "Edit Chat Trigger" : "Add Chat Trigger"}
              </DialogTitle>
              <DialogDescription>
                Configure when to request testimonials during live chat
                interactions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-3">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="trigger-name"
                      className="text-sm font-medium"
                    >
                      Trigger Name
                    </Label>
                    <Input
                      id="trigger-name"
                      placeholder="e.g., Support Resolution Feedback"
                      value={newTrigger.name || ""}
                      onChange={(e) =>
                        setNewTrigger({ ...newTrigger, name: e.target.value })
                      }
                      className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="trigger-description"
                      className="text-sm font-medium"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="trigger-description"
                      placeholder="Request testimonial after successfully resolving a customer's support issue"
                      value={newTrigger.description || ""}
                      rows={2}
                      onChange={(e) =>
                        setNewTrigger({
                          ...newTrigger,
                          description: e.target.value,
                        })
                      }
                      className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="business-event"
                      className="text-sm font-medium"
                    >
                      Trigger Event
                    </Label>
                    <Select
                      value={newTrigger.businessEvent || "support_resolved"}
                      onValueChange={(value) =>
                        setNewTrigger({
                          ...newTrigger,
                          businessEvent: value as ChatBusinessEventType,
                        })
                      }
                    >
                      <SelectTrigger
                        id="business-event"
                        className="w-full bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                      >
                        <SelectValue placeholder="Select a business event" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(businessEvents).map(([key, event]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {event.icon}
                              <span>{event.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="user-segment"
                      className="text-sm font-medium"
                    >
                      User Segment
                    </Label>
                    <Select
                      value={
                        (newTrigger.userSegment as string[])?.[0] || "all_users"
                      }
                      onValueChange={(value) =>
                        setNewTrigger({
                          ...newTrigger,
                          userSegment: [value as UserSegmentType],
                        })
                      }
                    >
                      <SelectTrigger
                        id="user-segment"
                        className="w-full bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                      >
                        <SelectValue placeholder="Select a user segment" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(userSegments).map(([key, segment]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {segment.icon}
                              <span>{segment.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delay" className="text-sm font-medium">
                      Delay
                    </Label>
                    <Input
                      id="delay"
                      type="number"
                      min="0"
                      value={newTrigger.delay || "2"}
                      onChange={(e) =>
                        setNewTrigger({
                          ...newTrigger,
                          delay: e.target.value,
                        })
                      }
                      className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delay-unit" className="text-sm font-medium">
                      Time Unit
                    </Label>
                    <Select
                      value={newTrigger.delayUnit || "minutes"}
                      onValueChange={(value) =>
                        setNewTrigger({
                          ...newTrigger,
                          delayUnit: value as DelayUnit,
                        })
                      }
                    >
                      <SelectTrigger
                        id="delay-unit"
                        className="w-full bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                      >
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seconds">Seconds</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency" className="text-sm font-medium">
                      Frequency
                    </Label>
                    <Select
                      value={newTrigger.frequency || "once"}
                      onValueChange={(value) =>
                        setNewTrigger({
                          ...newTrigger,
                          frequency:
                            value as EnhancedTriggerOption<ChatBusinessEventType>["frequency"],
                        })
                      }
                    >
                      <SelectTrigger
                        id="frequency"
                        className="w-full bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                      >
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="every_time">Every Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Enabled</Label>
                    <Switch
                      checked={newTrigger.enabled !== false}
                      onCheckedChange={(checked) =>
                        setNewTrigger({ ...newTrigger, enabled: checked })
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-slate-200 dark:border-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={saveTrigger}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow transition-all duration-200"
              >
                {editingTrigger ? "Update Trigger" : "Create Trigger"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

export default ChatTriggerSettings;
