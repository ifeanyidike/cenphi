import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Calendar,
  Clock,
  CheckCircle,
  FileQuestion,
  Trash2,
  Edit,
  Plus,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BusinessEventType,
  DelayUnit,
  EnhancedTriggerOption,
  TriggerType,
} from "@/types/setup";
import { runInAction } from "mobx";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
import { observer } from "mobx-react-lite";

interface EmailTriggersProps {
  triggers: EnhancedTriggerOption<BusinessEventType>[];
  onTriggerToggle: (triggerType: TriggerType) => void;
  onRemoveTrigger: (id: string) => void;
}
// Business event info
const businessEvents: Record<
  BusinessEventType,
  {
    icon: React.ReactNode;
    name: string;
    description: string;
    color: string;
  }
> = {
  purchase_completed: {
    icon: <ShoppingCart className="h-4 w-4" />,
    name: "Purchase Completed",
    description: "Send after customer completes a purchase",
    color: "green",
  },
  service_completed: {
    icon: <CheckCircle className="h-4 w-4" />,
    name: "Service Completed",
    description: "Send after a service has been delivered",
    color: "purple",
  },
  support_interaction: {
    icon: <FileQuestion className="h-4 w-4" />,
    name: "Support Interaction",
    description: "Send after customer support case is resolved",
    color: "yellow",
  },
};

const EmailTriggers: React.FC<EmailTriggersProps> = ({
  triggers,
  onTriggerToggle,
  onRemoveTrigger,
}) => {
  const settingStore = testimonialSettingsStore;
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);
  const [editingTriggerId, setEditingTriggerId] = useState<string | null>(null);
  const [newTrigger, setNewTrigger] = useState<
    Partial<EnhancedTriggerOption<BusinessEventType>>
  >({
    id: "",
    type: "purchase",
    businessEvent: "purchase_completed",
    delay: "3",
    delayUnit: "days",
    enabled: true,
    frequency: "once",
  });

  // Helper to get background color based on business event
  const getEventBgColor = (event: BusinessEventType | string) => {
    const eventKey = event as BusinessEventType;
    const colorMap: Record<string, string> = {
      green: "bg-emerald-100 text-emerald-800 border-emerald-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      yellow: "bg-amber-100 text-amber-800 border-amber-200",
    };

    return businessEvents[eventKey]
      ? colorMap[businessEvents[eventKey].color]
      : "bg-slate-100 text-slate-800 border-slate-200";
  };

  // const handleEditTrigger = (
  //   trigger: EnhancedTriggerOption<BusinessEventType>
  // ) => {
  //   setEditingTrigger(trigger);
  //   setNewTrigger({
  //     ...trigger,
  //   });
  //   // onAddTrigger();

  //   setShowTriggerDialog(true);
  // };

  // Handle saving trigger

  // Handle opening edit dialog for a trigger
  const handleEditTrigger = (
    trigger: EnhancedTriggerOption<BusinessEventType>
  ) => {
    setEditingTriggerId(trigger.id);
    setNewTrigger({ ...trigger });
    setShowTriggerDialog(true);
  };

  // Handle creating a new trigger
  const handleAddNewTrigger = () => {
    setEditingTriggerId(null);
    setNewTrigger({
      id: "",
      businessEvent: "purchase_completed",
      delay: "3",
      delayUnit: "days",
      enabled: true,
      frequency: "once",
    });
    setShowTriggerDialog(true);
  };

  const handleSaveTrigger = () => {
    runInAction(() => {
      if (editingTriggerId) {
        // Use the values from newTrigger to update the editingTrigger
        settingStore.editTrigger("email", editingTriggerId, {
          ...newTrigger,
        } as EnhancedTriggerOption<BusinessEventType>);
      } else {
        settingStore.addTrigger("email", {
          id: crypto.randomUUID() as string,
          ...newTrigger,
        } as EnhancedTriggerOption<BusinessEventType>);
      }
    });

    setShowTriggerDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with add trigger button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Triggers</h2>
          <p className="text-gray-500 mt-1">
            Define when to request testimonials from your customers
          </p>
        </div>
        <Button
          onClick={handleAddNewTrigger}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Trigger
        </Button>
      </div>

      {/* Trigger List */}
      <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {triggers.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-30"></div>
                <div className="relative bg-gradient-to-tr from-blue-100 to-indigo-100 h-20 w-20 rounded-full flex items-center justify-center">
                  <Bell className="h-10 w-10 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No Email Triggers Set Up
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Email triggers determine when testimonial requests are sent to
                your customers. Add your first trigger to start collecting
                powerful testimonials.
              </p>
              <Button
                onClick={handleAddNewTrigger}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-md shadow-md"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create Your First Trigger
              </Button>
            </div>
          ) : (
            <div>
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="font-medium text-gray-700">Active Triggers</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {triggers.map((trigger) => {
                  const businessEvent =
                    trigger.businessEvent as BusinessEventType;
                  const eventInfo = businessEvents[businessEvent];

                  return (
                    <div
                      key={trigger.id}
                      className={cn(
                        "p-6 transition-all",
                        trigger.enabled ? "bg-white" : "bg-gray-50"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "rounded-full p-3 flex-shrink-0",
                            trigger.enabled
                              ? getEventBgColor(businessEvent).split(" ")[0]
                              : "bg-gray-100"
                          )}
                        >
                          {eventInfo?.icon || (
                            <Calendar className="h-5 w-5 text-gray-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {trigger.name ||
                                eventInfo?.name ||
                                "Testimonial Request"}
                            </h3>
                            <Switch
                              checked={trigger.enabled}
                              onCheckedChange={() =>
                                onTriggerToggle(trigger.type)
                              }
                              // onCheckedChange={() => {
                              //   runInAction(() =>
                              //     settingStore.toggleTriggerEnabled(
                              //       "email",
                              //       trigger.type
                              //     )
                              //   );
                              // }}
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>

                          <p className="text-gray-600 mb-4">
                            {trigger.description ||
                              eventInfo?.description ||
                              "Request testimonials from your customers"}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={getEventBgColor(businessEvent)}
                            >
                              {eventInfo?.icon}
                              <span className="ml-1">{eventInfo?.name}</span>
                            </Badge>

                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800 border-blue-200"
                            >
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {trigger.delay} {trigger.delayUnit}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300"
                            onClick={() => handleEditTrigger(trigger)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-500 border-gray-200 hover:text-red-600 hover:border-red-100"
                            onClick={() => onRemoveTrigger(trigger.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Trigger Dialog */}
      <Dialog open={showTriggerDialog} onOpenChange={setShowTriggerDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingTriggerId ? "Edit Email Trigger" : "Add Email Trigger"}
            </DialogTitle>
            <DialogDescription>
              Configure when to send testimonial request emails to your
              customers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label
                htmlFor="trigger-name"
                className="text-gray-700 font-medium"
              >
                Trigger Name
              </Label>
              <Input
                id="trigger-name"
                placeholder="Post-Purchase Email"
                value={newTrigger.name || ""}
                onChange={(e) =>
                  setNewTrigger({ ...newTrigger, name: e.target.value })
                }
                className="mt-1.5"
              />
            </div>

            <Separator />

            {/* Event and Timing */}
            <div className="space-y-4">
              <h3 className="text-base font-medium text-gray-900">
                When to send
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="business-event" className="text-gray-700">
                    After which event?
                  </Label>
                  <Select
                    value={newTrigger.businessEvent || "purchase_completed"}
                    onValueChange={(value) =>
                      setNewTrigger({
                        ...newTrigger,
                        businessEvent: value as BusinessEventType,
                      })
                    }
                  >
                    <SelectTrigger id="business-event">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="delay" className="text-gray-700">
                      Wait for
                    </Label>
                    <Input
                      id="delay"
                      type="number"
                      min="0"
                      value={newTrigger.delay || "3"}
                      onChange={(e) =>
                        setNewTrigger({
                          ...newTrigger,
                          delay: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="delay-unit" className="text-gray-700">
                      Time unit
                    </Label>
                    <Select
                      value={newTrigger.delayUnit || "days"}
                      onValueChange={(value) =>
                        setNewTrigger({
                          ...newTrigger,
                          delayUnit: value as DelayUnit,
                        })
                      }
                    >
                      <SelectTrigger id="delay-unit">
                        <SelectValue placeholder="Select unit" />
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
            </div>

            <Separator />

            <div className="pt-2 flex items-center justify-between">
              <Label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <span>Enable this trigger</span>
                <Switch
                  checked={newTrigger.enabled !== false}
                  onCheckedChange={(checked) =>
                    setNewTrigger({ ...newTrigger, enabled: checked })
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </Label>
              <div className="text-sm text-gray-500">
                {newTrigger.enabled !== false
                  ? "Active and ready to send"
                  : "Disabled - won't send emails"}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowTriggerDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTrigger}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {editingTriggerId ? "Update Trigger" : "Create Trigger"}{" "}
              <Sparkles className="ml-1.5 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default observer(EmailTriggers);
