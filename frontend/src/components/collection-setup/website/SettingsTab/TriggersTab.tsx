import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import {
  ShoppingCart,
  Headphones,
  Clock,
  Plus,
  Trash,
  CheckCircle,
  LucideIcon,
  Sparkles,
  Users,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import { EnhancedTriggerOption, BusinessEventType } from "@/types/setup";
import { runInAction } from "mobx";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
import { observer } from "mobx-react-lite";

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

// Trigger icons and display info
const businessEventInfo: Record<
  BusinessEventType,
  {
    icon: LucideIcon;
    name: string;
    description: string;
    conversionRate: string;
  }
> = {
  purchase_completed: {
    icon: ShoppingCart,
    name: "Purchase Completed",
    description: "Trigger testimonial request after a purchase is finalized",
    conversionRate: "70-80%",
  },

  service_completed: {
    icon: CheckCircle,
    name: "Service Completed",
    description: "Collect feedback after a service has been delivered",
    conversionRate: "75-85%",
  },
  support_interaction: {
    icon: Headphones,
    name: "Support Interaction",
    description: "Request feedback after a customer support interaction",
    conversionRate: "60-70%",
  },
};

const TriggerCard: React.FC<{
  trigger: EnhancedTriggerOption<BusinessEventType>;
  onEdit: (trigger: EnhancedTriggerOption<BusinessEventType>) => void;
  onDelete: (triggerId: string) => void;
  onToggle: (triggerId: string, enabled: boolean) => void;
}> = ({ trigger, onEdit, onDelete, onToggle }) => {
  const eventInfo = businessEventInfo[trigger.businessEvent];
  const Icon = eventInfo.icon;

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        trigger.enabled
          ? "border-slate-200 bg-white"
          : "border-slate-200 bg-slate-50 opacity-75"
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div
              className={cn(
                "p-2.5 rounded-lg",
                trigger.enabled
                  ? trigger.priority === "high"
                    ? "bg-blue-100 text-blue-600"
                    : trigger.priority === "medium"
                      ? "bg-green-100 text-green-600"
                      : "bg-slate-100 text-slate-600"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3
                  className={cn(
                    "font-medium",
                    trigger.enabled ? "text-slate-900" : "text-slate-500"
                  )}
                >
                  {trigger.name}
                </h3>
                {trigger.priority === "high" && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-100 text-[10px]"
                  >
                    High Impact
                  </Badge>
                )}
              </div>

              <p
                className={cn(
                  "text-sm max-w-md",
                  trigger.enabled ? "text-slate-500" : "text-slate-400"
                )}
              >
                {trigger.description || eventInfo.description}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span
                    className={
                      trigger.enabled ? "text-slate-600" : "text-slate-400"
                    }
                  >
                    {trigger.delay} {trigger.delayUnit}
                  </span>
                </div>

                <span className="text-slate-300">•</span>

                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span
                    className={
                      trigger.enabled ? "text-slate-600" : "text-slate-400"
                    }
                  >
                    {trigger.userSegment.length === 1 &&
                    trigger.userSegment[0] === "all_users"
                      ? "All Users"
                      : `${trigger.userSegment.length} Segments`}
                  </span>
                </div>

                {trigger.enabled && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-100 text-[10px] py-0 px-1.5"
                    >
                      ~{eventInfo.conversionRate} Conversion
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    onClick={() => onEdit(trigger)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Edit Trigger</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                    onClick={() => onDelete(trigger.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Delete Trigger</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="h-8 border-l border-slate-200 mx-0.5"></div>

            <Switch
              checked={trigger.enabled}
              onCheckedChange={(enabled) => onToggle(trigger.id, enabled)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const TriggerDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  trigger: EnhancedTriggerOption<BusinessEventType> | null;
  onSave: (trigger: EnhancedTriggerOption<BusinessEventType>) => void;
  isEditing: boolean;
}> = ({ isOpen, onClose, trigger, onSave, isEditing }) => {
  const [formData, setFormData] = useState<
    EnhancedTriggerOption<BusinessEventType>
  >(
    trigger || {
      id: `trigger-${Date.now()}`,
      name: "",
      enabled: true,
      businessEvent: "purchase_completed",
      userSegment: ["all_users"],
      delay: "3",
      delayUnit: "days",
      frequency: "once",
      priority: "medium",
      type: "custom",
    }
  );

  // Update form when trigger changes
  React.useEffect(() => {
    if (trigger) {
      setFormData(trigger);
    }
  }, [trigger]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Handle form changes
  const handleChange = (
    field: keyof EnhancedTriggerOption<BusinessEventType>,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Render business event selection item

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Trigger" : "Add Trigger"}
            </DialogTitle>
            <DialogDescription>
              Configure when to request testimonials based on business events
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Trigger Name */}
            <div className="space-y-2">
              <Label htmlFor="trigger-name">Trigger Name</Label>
              <Input
                id="trigger-name"
                placeholder="e.g., Post-Purchase Feedback"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            {/* Business Event Selection */}
            <div className="space-y-2">
              <Label htmlFor="business-event">Business Event</Label>
              <Select
                value={formData.businessEvent}
                onValueChange={(value) => handleChange("businessEvent", value)}
              >
                <SelectTrigger id="business-event">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(businessEventInfo).map((event) => (
                    <SelectItem key={event} value={event}>
                      {(businessEventInfo as any)[event].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {businessEventInfo[formData.businessEvent]?.description}
              </p>
            </div>

            {/* Delay Settings */}
            <div className="space-y-2">
              <Label>Delay After Event</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={formData.delay}
                  onChange={(e) => handleChange("delay", e.target.value)}
                  className="w-20"
                />
                <Select
                  value={formData.delayUnit}
                  onValueChange={(value) => handleChange("delayUnit", value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TriggersTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTrigger, setCurrentTrigger] =
    useState<EnhancedTriggerOption<BusinessEventType> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const store = testimonialSettingsStore;
  const { triggers } = store.settings.website;

  function onUpdateTriggers(update: EnhancedTriggerOption<BusinessEventType>) {
    runInAction(() => {
      store.addTrigger("website", update);
    });
  }

  // Handle add/edit trigger
  const handleOpenDialog = (
    trigger?: EnhancedTriggerOption<BusinessEventType>
  ) => {
    if (trigger) {
      setCurrentTrigger(trigger);
      setIsEditing(true);
    } else {
      setCurrentTrigger(null);
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  // Handle save trigger
  const handleSaveTrigger = (
    updatedTrigger: EnhancedTriggerOption<BusinessEventType>
  ) => {
    if (isEditing) {
      runInAction(() => {
        store.editTrigger("website", updatedTrigger.id, updatedTrigger);
      });
    } else {
      onUpdateTriggers(updatedTrigger);
    }
    // if (isEditing) {
    //   // Update existing trigger
    //   const updatedTriggers = triggers.map((t) =>
    //     t.id === updatedTrigger.id ? updatedTrigger : t
    //   );
    //   onUpdateTriggers(updatedTrigger);
    // } else {
    //   // Add new trigger
    //   onUpdateTriggers([...triggers, updatedTrigger]);
    // }
  };

  // Handle delete trigger
  const handleDeleteTrigger = (triggerId: string) => {
    // const updatedTriggers = triggers.filter((t) => t.id !== triggerId);
    // onUpdateTriggers(updatedTriggers);
    runInAction(() => {
      store.removeTrigger("website", triggerId);
    });
  };

  // Handle toggle trigger
  const handleToggleTrigger = (triggerId: string) => {
    // const updatedTriggers = triggers.map((t) =>
    //   t.id === triggerId ? { ...t, enabled } : t
    // );
    // onUpdateTriggers(updatedTriggers);
    runInAction(() => store.toggleTriggerEnabled("website", triggerId));
  };

  // Get active triggers count
  const activeTriggersCount = triggers.filter((t) => t.enabled).length;

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Business Event Triggers
          </h2>
          <p className="text-sm text-muted-foreground">
            Define when to ask for testimonials based on business events and
            user actions
          </p>
        </div>

        <Button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Trigger</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Triggers</CardTitle>
              <CardDescription>
                {activeTriggersCount === 0
                  ? "No active triggers configured"
                  : activeTriggersCount === 1
                    ? "1 active trigger configured"
                    : `${activeTriggersCount} active triggers configured`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-1">
              <div className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Optimal: 2-3 triggers</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {triggers.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-medium text-slate-700 mb-2">
                No Triggers Configured
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Triggers define when to ask for testimonials based on business
                events. We recommend starting with post-purchase and service
                completion triggers.
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Your First Trigger</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {triggers.map((trigger) => (
                <TriggerCard
                  key={trigger.id}
                  trigger={trigger}
                  onEdit={() => handleOpenDialog(trigger)}
                  onDelete={handleDeleteTrigger}
                  onToggle={handleToggleTrigger}
                />
              ))}
            </div>
          )}

          <Separator className="my-6" />
        </CardContent>
      </Card>

      {/* Trigger Dialog */}
      <TriggerDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        trigger={currentTrigger}
        onSave={handleSaveTrigger}
        isEditing={isEditing}
      />
    </motion.div>
  );
};

export default observer(TriggersTab);
