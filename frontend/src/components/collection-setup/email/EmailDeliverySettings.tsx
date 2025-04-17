import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Calendar,
  CheckCircle,
  RefreshCw,
  Send,
  Save,
  RotateCcw,
  ChevronRight,
  Globe,
  ArrowUpRight,
  Info,
  Zap,
  ChevronDown,
  BarChart4,
  ChevronUp,
} from "lucide-react";
import { DelayUnit, EmailSettings } from "@/types/setup";

interface EmailDeliverySettingsProps {
  schedule?: EmailSettings["schedule"];
  onUpdateSettings: (field: string, value: any) => void;
}

// Timezone options
const timezoneOptions = [
  { value: "auto", label: "Auto-detect from recipient" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

const EmailDeliverySettings: React.FC<EmailDeliverySettingsProps> = ({
  schedule,
  onUpdateSettings,
}) => {
  // Default values if schedule is not provided
  const followUpEnabled = schedule?.followUpEnabled ?? false;
  const followUpDelay = schedule?.followUpDelay ?? 3;
  const followUpDelayUnit = schedule?.followUpDelayUnit ?? "days";
  const maxFollowUps = schedule?.maxFollowUps ?? 2;
  const timezone = schedule?.timezone ?? "auto";
  const avoidWeekends = schedule?.avoidWeekends ?? true;

  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({
    insights: false,
  });

  const toggleCard = (cardName: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardName]: !prev[cardName],
    }));
  };

  const getTimelineSteps = () => {
    const steps = [
      {
        id: "initial",
        title: "Initial Request",
        description: "First testimonial request sent",
        icon: Send,
      },
    ];

    if (followUpEnabled) {
      for (let i = 1; i <= maxFollowUps; i++) {
        steps.push({
          id: `followup-${i}`,
          title: `Follow-up #${i}`,
          description: `Sent ${i * followUpDelay} ${followUpDelayUnit} after initial`,
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

  // Handle toggle for follow-up emails
  const handleFollowUpToggle = (enabled: boolean) => {
    onUpdateSettings("followUpEnabled", enabled);
  };

  // Handle toggle for avoiding weekends
  const handleAvoidWeekendsToggle = (enabled: boolean) => {
    onUpdateSettings("avoidWeekends", enabled);
  };

  return (
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              Email Delivery Settings
            </h2>
            <p className="text-gray-500 max-w-lg">
              Configure when testimonial request emails are delivered to
              maximize response rates and conversion.
            </p>
          </div>
          <div>
            <Button
              size="sm"
              className="bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Follow-Up Settings Card */}
      <Card className="overflow-hidden border border-gray-200 shadow-sm bg-white rounded-lg">
        <CardHeader className="border-b bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <div className="p-1.5 rounded-full bg-gray-100">
                  <RefreshCw className="h-4 w-4 text-gray-600" />
                </div>
                <span>Follow-Up Automation</span>
              </CardTitle>
              <CardDescription className="mt-1 text-gray-500">
                Boost response rates with intelligent follow-ups
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">
                  {followUpEnabled
                    ? "Follow-Ups Enabled"
                    : "Follow-Ups Disabled"}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {followUpEnabled
                    ? `${maxFollowUps} follow-ups configured`
                    : "Enable to increase responses"}
                </div>
              </div>
              <Switch
                checked={followUpEnabled}
                onCheckedChange={handleFollowUpToggle}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!followUpEnabled ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      Increase Your Collection Rate by 60%
                    </h3>
                    <p className="text-gray-600">
                      Follow-up emails are proven to dramatically boost
                      testimonial collection rates. Our data shows that
                      <span className="font-medium text-gray-900 mx-1">
                        71% of testimonials
                      </span>
                      are collected after the initial email.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        +60%
                      </div>
                      <div className="text-sm text-gray-500">
                        Response rate increase
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        3-5x
                      </div>
                      <div className="text-sm text-gray-500">
                        Higher conversion
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        2 min
                      </div>
                      <div className="text-sm text-gray-500">Setup time</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleFollowUpToggle(true)}
                    className="mt-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Enable Follow-Up Automation
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column - Settings (2 columns) */}
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-gray-600" />
                    <span>Follow-Up Configuration</span>
                  </h3>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label
                          htmlFor="follow-up-delay"
                          className="text-gray-700 font-medium"
                        >
                          Wait Period
                        </Label>
                        <div className="relative">
                          <Input
                            id="follow-up-delay"
                            type="number"
                            min="1"
                            value={followUpDelay}
                            onChange={(e) =>
                              onUpdateSettings(
                                "followUpDelay",
                                parseInt(e.target.value) || 3
                              )
                            }
                            className="border-gray-200 pr-10"
                          />
                          <div className="absolute right-3 top-2.5 text-sm text-gray-400 pointer-events-none">
                            #{followUpDelay}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="follow-up-unit"
                          className="text-gray-700 font-medium"
                        >
                          Time Unit
                        </Label>
                        <Select
                          value={followUpDelayUnit}
                          onValueChange={(value) =>
                            onUpdateSettings(
                              "followUpDelayUnit",
                              value as DelayUnit
                            )
                          }
                        >
                          <SelectTrigger
                            id="follow-up-unit"
                            className="border-gray-200"
                          >
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4 pt-3">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="max-follow-ups"
                          className="text-gray-700 font-medium"
                        >
                          Number of Follow-Ups
                        </Label>
                        <span className="text-base font-semibold text-white bg-blue-600 py-1 px-3 rounded-full">
                          {maxFollowUps}
                        </span>
                      </div>
                      <Slider
                        id="max-follow-ups"
                        min={1}
                        max={5}
                        step={1}
                        value={[maxFollowUps]}
                        onValueChange={([value]) =>
                          onUpdateSettings("maxFollowUps", value)
                        }
                        className="py-1"
                      />
                      <div className="flex justify-between mt-3">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <div
                            key={num}
                            className={`flex flex-col items-center transition-colors ${
                              num <= maxFollowUps
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full mb-1.5 ${
                                num <= maxFollowUps
                                  ? "bg-blue-600"
                                  : "bg-gray-300"
                              }`}
                            ></div>
                            <span className="text-xs font-medium">{num}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-600" />
                    <span>Delivery Configuration</span>
                  </h3>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200">
                      <Label
                        htmlFor="avoid-weekends"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <div>
                          <span className="font-medium text-gray-800">
                            Avoid weekend delivery
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Delay sending until Monday if scheduled on weekend
                          </p>
                        </div>
                      </Label>
                      <Switch
                        id="avoid-weekends"
                        checked={avoidWeekends}
                        onCheckedChange={handleAvoidWeekendsToggle}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="timezone"
                        className="text-gray-700 font-medium"
                      >
                        Timezone
                      </Label>
                      <Select
                        value={timezone}
                        onValueChange={(value) =>
                          onUpdateSettings("timezone", value)
                        }
                      >
                        <SelectTrigger
                          id="timezone"
                          className="border-gray-200"
                        >
                          <SelectValue placeholder="Select timezone handling" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezoneOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-2.5 rounded-lg shadow-sm border border-blue-200">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">
                        Pro Tips
                      </h3>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                        For optimal results, configure 2-3 follow-ups spaced 3-5
                        days apart. The first follow-up has the highest
                        engagement rate at 40%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Timeline (3 columns) */}
              <div className="lg:col-span-3">
                <div className="bg-gray-900 rounded-lg p-7 shadow-md">
                  <h3 className="text-base font-medium text-gray-100 flex items-center gap-2 mb-6">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Follow-Up Timeline</span>
                  </h3>

                  <div className="relative pl-7 mt-8">
                    {/* Timeline line */}
                    <div className="absolute top-0 bottom-0 left-3 w-0.5 bg-gray-700 rounded-full"></div>

                    {/* Timeline steps */}
                    <div className="space-y-6">
                      {getTimelineSteps().map((step, index) => (
                        <div key={step.id} className="flex items-start gap-5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                              index === 0
                                ? "bg-blue-600 text-white"
                                : index === getTimelineSteps().length - 1
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-700 text-white"
                            }`}
                          >
                            <step.icon className="h-3 w-3" />
                          </div>
                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex-1">
                            <h5 className="text-sm font-medium text-white">
                              {step.title}
                            </h5>
                            <p className="text-sm text-gray-400 mt-1">
                              {step.description}
                            </p>

                            {index < getTimelineSteps().length - 1 && (
                              <div className="flex justify-end mt-2">
                                <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                  {index === 0 ? (
                                    <>
                                      <span>
                                        Wait {followUpDelay} {followUpDelayUnit}
                                      </span>
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </>
                                  ) : (
                                    index < getTimelineSteps().length - 2 && (
                                      <>
                                        <span>
                                          Wait {followUpDelay}{" "}
                                          {followUpDelayUnit}
                                        </span>
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      </>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Only show the conversion metrics card if follow-ups are enabled */}
      {followUpEnabled && (
        <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
          <CardHeader className="border-b bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <div className="p-1.5 rounded-full bg-gray-100">
                    <BarChart4 className="h-4 w-4 text-gray-600" />
                  </div>
                  <span>Performance Analytics</span>
                </CardTitle>
                <CardDescription className="mt-1 text-gray-500">
                  Projected conversion improvements
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-700"
                onClick={() => toggleCard("insights")}
              >
                {expandedCards.insights ? (
                  <>
                    <span>View Less</span>
                    <ChevronUp className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    <span>View More</span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent
            className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${expandedCards.insights ? "py-8" : "py-6"}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="relative">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    +38%
                  </div>
                  <div className="absolute top-0 right-0 -mr-2 -mt-1">
                    <div className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      Effective
                    </div>
                  </div>
                </div>
                <div className="text-gray-700 font-medium">Response Rate</div>
                <div className="text-xs text-gray-500 mt-1">
                  With your follow-up sequence
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="relative">
                  <div className="flex items-center justify-center mb-2">
                    <div className="text-4xl font-bold text-gray-300 opacity-60">
                      28%
                    </div>
                    <div className="absolute">
                      <div className="text-4xl font-bold text-gray-900">
                        45%
                      </div>
                    </div>
                    <div className="absolute -right-6 -top-1">
                      <div className="bg-green-100 rounded-full px-1.5 py-0.5 text-xs font-semibold text-green-800 flex items-center gap-0.5">
                        <ArrowUpRight className="h-3 w-3" /> 17%
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-gray-700 font-medium">Open Rate</div>
                <div className="text-xs text-gray-500 mt-1">
                  Without vs. with follow-ups
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  2.7x
                </div>
                <div className="text-gray-700 font-medium">
                  Conversion Multiplier
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  From follow-up sequence
                </div>
              </div>
            </div>

            {expandedCards.insights && (
              <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-start gap-5">
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <Info className="h-5 w-5 text-gray-600" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-3">
                      Projected ROI Analysis
                    </h3>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Email Sequence Performance
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">
                                Initial Email
                              </span>
                              <span className="font-medium text-gray-900">
                                28%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: "28%" }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">
                                First Follow-up
                              </span>
                              <span className="font-medium text-gray-900">
                                17%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: "17%" }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">
                                Second Follow-up
                              </span>
                              <span className="font-medium text-gray-900">
                                11%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: "11%" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Testimonial Impact
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Estimated Conversion Lift
                            </span>
                            <span className="font-semibold text-green-600">
                              +38%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Total Testimonials
                            </span>
                            <span className="font-semibold">2.7x more</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Follow-up ROI</span>
                            <span className="font-semibold text-green-600">
                              4.2x
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-sm text-gray-500 text-center">
              Estimates based on industry averages for testimonial collection
              campaigns
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailDeliverySettings;
