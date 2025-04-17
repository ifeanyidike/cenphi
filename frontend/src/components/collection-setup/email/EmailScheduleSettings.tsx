// src/components/collection-setup/email/EmailScheduleSettings.tsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Sun,
  Moon,
  RefreshCw,
  BarChart,
  Globe,
  CheckCircle,
  ArrowRight,
  Send,
  MailWarning,
  CalendarDays,
  Clock8,
  Zap,
  AlertCircle,
  Wifi,
} from "lucide-react";
import { CollectionSettings, DelayUnit } from "@/types/setup";

interface EmailScheduleSettingsProps {
  schedule?: CollectionSettings["email"]["schedule"];
  onSettingsChange: (field: string, value: any) => void;
}

const EmailScheduleSettings: React.FC<EmailScheduleSettingsProps> = ({
  schedule = {
    followUpEnabled: false,
    followUpDelay: 7,
    followUpDelayUnit: "days",
    maxFollowUps: 2,
    bestTimeToSend: false,
    timezone: "America/New_York",
    avoidWeekends: true,
    scheduling: "immediate",
  },
  onSettingsChange,
}) => {
  // Get timeline steps based on current settings
  const getTimelineSteps = () => {
    const steps = [
      {
        id: "initial",
        title: "Initial Request",
        description: "First testimonial request sent",
        icon: Send,
      },
    ];

    if (schedule.followUpEnabled) {
      // const followUpDelay = `${schedule.followUpDelay} ${schedule.followUpDelayUnit}`;

      for (let i = 1; i <= schedule.maxFollowUps; i++) {
        steps.push({
          id: `followup-${i}`,
          title: `Follow-up #${i}`,
          description: `Sent ${i * schedule.followUpDelay} ${schedule.followUpDelayUnit} after initial request`,
          icon: RefreshCw,
        });
      }
    }

    steps.push({
      id: "completed",
      title: "Collection Complete",
      description: "Testimonial received or max attempts reached",
      icon: CheckCircle,
    });

    return steps;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-1">Follow-up & Scheduling</h3>
        <p className="text-sm text-gray-500">
          Configure automatic follow-ups and optimize email sending times
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follow-up Settings */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Follow-up Emails</h3>
              </div>
              <Switch
                checked={schedule.followUpEnabled}
                onCheckedChange={() =>
                  onSettingsChange("followUpEnabled", !schedule.followUpEnabled)
                }
              />
            </div>

            <p className="text-sm text-gray-500">
              Automatically send follow-up emails if the recipient hasn't
              submitted a testimonial
            </p>

            {schedule.followUpEnabled && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="follow-up-delay">Follow-up Delay</Label>
                  <div className="flex gap-2">
                    <Input
                      id="follow-up-delay"
                      type="number"
                      min={1}
                      value={schedule.followUpDelay}
                      onChange={(e) =>
                        onSettingsChange(
                          "followUpDelay",
                          parseInt(e.target.value || "0")
                        )
                      }
                      className="w-20"
                    />

                    <Select
                      value={schedule.followUpDelayUnit}
                      onValueChange={(value) =>
                        onSettingsChange(
                          "followUpDelayUnit",
                          value as DelayUnit
                        )
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Time to wait before sending the first follow-up
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-follow-ups">Maximum Follow-ups</Label>
                  <div className="flex gap-2">
                    <Input
                      id="max-follow-ups"
                      type="number"
                      min={1}
                      max={5}
                      value={schedule.maxFollowUps}
                      onChange={(e) =>
                        onSettingsChange(
                          "maxFollowUps",
                          parseInt(e.target.value || "0")
                        )
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum number of follow-up emails to send (1-5)
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Follow-up Best Practices</p>
                      <p className="mt-1">
                        We recommend 2-3 follow-ups with decreasing frequency.
                        First follow-up should be 3-7 days after initial request
                        for optimal response rates.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline visualization */}
                <div className="pt-2 pb-1">
                  <h4 className="text-sm font-medium mb-3">
                    Follow-up Timeline
                  </h4>
                  <div className="relative pl-6">
                    {/* Timeline line */}
                    <div className="absolute top-0 bottom-0 left-2.5 w-px bg-gray-200" />

                    {/* Timeline steps */}
                    <div className="space-y-4">
                      {getTimelineSteps().map((step, index) => (
                        <div key={step.id} className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${
                              index === 0
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <step.icon className="h-3 w-3" />
                          </div>
                          <div>
                            <h5 className="text-sm font-medium">
                              {step.title}
                            </h5>
                            <p className="text-xs text-gray-500">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduling Settings */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Sending Schedule</h3>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Optimize when your emails are sent for better open rates
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock8 className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="best-time" className="cursor-pointer">
                    Send at optimal times
                  </Label>
                </div>
                <Switch
                  id="best-time"
                  checked={schedule.bestTimeToSend || false}
                  onCheckedChange={(checked) =>
                    onSettingsChange("bestTimeToSend", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="avoid-weekends" className="cursor-pointer">
                    Avoid weekends
                  </Label>
                </div>
                <Switch
                  id="avoid-weekends"
                  checked={schedule.avoidWeekends || false}
                  onCheckedChange={(checked) =>
                    onSettingsChange("avoidWeekends", checked)
                  }
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={schedule.timezone || "America/New_York"}
                  onValueChange={(value) => onSettingsChange("timezone", value)}
                >
                  <SelectTrigger id="timezone" className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">
                      Eastern Time (ET)
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time (CT)
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time (MT)
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time (PT)
                    </SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    <SelectItem value="Australia/Sydney">
                      Sydney (AEST)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  All times will be relative to this timezone
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="scheduling-type">Scheduling Mode</Label>
                <Select
                  value={schedule.scheduling || "immediate"}
                  onValueChange={(value) =>
                    onSettingsChange("scheduling", value)
                  }
                >
                  <SelectTrigger id="scheduling-type">
                    <SelectValue placeholder="Select scheduling mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span>Immediate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="batched">
                      <div className="flex items-center gap-2">
                        <MailWarning className="h-4 w-4 text-blue-500" />
                        <span>Batched</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="optimal">
                      <div className="flex items-center gap-2">
                        <BarChart className="h-4 w-4 text-green-500" />
                        <span>AI Optimized</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how to time your email sending
                </p>

                {schedule.scheduling === "batched" && (
                  <div className="pt-2">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                      <p className="font-medium">Batched Sending</p>
                      <p className="mt-1">
                        Emails are sent in batches at 8am, 12pm, and 4pm in your
                        selected timezone.
                      </p>
                    </div>
                  </div>
                )}

                {schedule.scheduling === "optimal" && (
                  <div className="pt-2">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-800">
                      <p className="font-medium">AI-Optimized Timing</p>
                      <p className="mt-1">
                        Our AI analyzes each recipient's past engagement
                        patterns to deliver emails at the optimal time for
                        maximum open rates.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sending windows visualization */}
              {schedule.scheduling !== "immediate" && (
                <div className="pt-3">
                  <h4 className="text-xs font-medium mb-2">Sending Windows</h4>
                  <div className="flex items-center h-12 bg-gray-100 rounded-lg relative">
                    <div className="absolute inset-0 flex">
                      <div className="flex-1 flex items-center justify-center border-r border-white/40 text-xs text-gray-500">
                        <Sun className="h-3.5 w-3.5 mr-1 text-amber-500" />
                        <span>Morning</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center border-r border-white/40 text-xs text-gray-500">
                        <Sun className="h-3.5 w-3.5 mr-1 text-orange-500" />
                        <span>Afternoon</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
                        <Moon className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                        <span>Evening</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>12 AM</span>
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>12 AM</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Delivery Stats */}
      <Card className="bg-gray-50 border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              <span>Email Delivery Analytics</span>
            </h3>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-100"
            >
              Last 30 days
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-xs text-gray-500 mb-1">Delivery Rate</p>
              <p className="text-2xl font-semibold">98.7%</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowRight className="h-3 w-3 mr-1 rotate-45" />
                <span>+1.2% from last month</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <p className="text-xs text-gray-500 mb-1">Open Rate</p>
              <p className="text-2xl font-semibold">42.3%</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowRight className="h-3 w-3 mr-1 rotate-45" />
                <span>+3.7% from last month</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <p className="text-xs text-gray-500 mb-1">Click Rate</p>
              <p className="text-2xl font-semibold">18.5%</p>
              <div className="flex items-center text-xs text-amber-600 mt-1">
                <ArrowRight className="h-3 w-3 mr-1 -rotate-45" />
                <span>-0.8% from last month</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <p className="text-xs text-gray-500 mb-1">Testimonial Rate</p>
              <p className="text-2xl font-semibold">9.2%</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowRight className="h-3 w-3 mr-1 rotate-45" />
                <span>+1.4% from last month</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailScheduleSettings;
