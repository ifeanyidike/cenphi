import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Gift,
  DollarSign,
  CreditCard,
  Crown,
  Star,
  Info,
  Eye,
  BarChart4,
  Gift as GiftIcon,
  FileText,
  Video,
  Mic,
  Camera,
  Sparkles,
  CheckCircle,
  Calendar,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IncentiveConfig } from "@/types/setup";
import { observer } from "mobx-react-lite";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
import { runInAction } from "mobx";

interface IncentivesTabProps {
  onShowPreview: () => void;
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

// Incentive type icons and info
const incentiveTypes: {
  [key: string]: {
    icon: LucideIcon;
    name: string;
    description: string;
    conversions: string;
    examples: string[];
    setupComplexity: "low" | "medium" | "high";
  };
} = {
  discount: {
    icon: DollarSign,
    name: "Discount Code",
    description: "Offer a discount on future purchases",
    conversions: "70-90%",
    examples: [
      "10% off next order",
      "$15 off your next purchase",
      "Free shipping",
    ],
    setupComplexity: "medium",
  },
  credit: {
    icon: CreditCard,
    name: "Account Credit",
    description: "Add credit to the customer's account",
    conversions: "75-85%",
    examples: [
      "$10 account credit",
      "100 loyalty points",
      "1 month service credit",
    ],
    setupComplexity: "medium",
  },
  gift: {
    icon: GiftIcon,
    name: "Free Gift",
    description: "Send a physical or digital gift",
    conversions: "80-90%",
    examples: ["Free product sample", "Digital resource pack", "Company swag"],
    setupComplexity: "high",
  },
};

// Testimonial formats with icons and info
const testimonialFormats = [
  {
    id: "text",
    name: "Text",
    icon: FileText,
    description: "Written testimonials",
  },
  {
    id: "video",
    name: "Video",
    icon: Video,
    description: "Video testimonials",
  },
  { id: "audio", name: "Audio", icon: Mic, description: "Audio testimonials" },
  {
    id: "image",
    name: "Photo",
    icon: Camera,
    description: "Photo testimonials",
  },
];

// Conversion rate impact component
const ConversionImpactMeter: React.FC<{ impact: number }> = ({ impact }) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Conversion Impact</span>
        <span className="font-medium">{impact}%</span>
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            impact >= 80
              ? "bg-green-500"
              : impact >= 50
                ? "bg-amber-500"
                : "bg-red-500"
          )}
          style={{ width: `${impact}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  );
};

// Incentives help panel
const IncentivesGuide: React.FC = () => (
  <div className="p-5 bg-blue-50 border border-blue-100 rounded-lg">
    <div className="flex items-start gap-3">
      <div>
        <BarChart4 className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-blue-800 mb-1">
          Incentive Strategy Guide
        </h4>
        <p className="text-xs text-blue-700 mb-3">
          Incentives can boost testimonial collection rates by 3-5x. For optimal
          results:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <span className="font-medium">
                Match the incentive value to the testimonial value
              </span>
              <p className="mt-0.5">
                Video testimonials are more valuable than text - offer better
                incentives for them
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <span className="font-medium">
                Set clear qualification requirements
              </span>
              <p className="mt-0.5">
                Clearly communicate what users need to do to receive the
                incentive
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <span className="font-medium">Use limited-time incentives</span>
              <p className="mt-0.5">
                Adding expiration dates creates urgency and increases
                participation
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
);

const IncentivesTab: React.FC<IncentivesTabProps> = ({ onShowPreview }) => {
  const store = testimonialSettingsStore;
  const { incentives } = store.settings.website;

  function onUpdateIncentives(update: Partial<IncentiveConfig>) {
    runInAction(() => {
      store.updateSettings("website", "incentives", {
        ...incentives,
        ...update,
      });
    });
  }

  const [showIncentiveTips, setShowIncentiveTips] = useState(
    !incentives?.enabled
  );

  // Calculate impact score
  const calculateImpactScore = () => {
    let score = 50; // Base score

    // Add points for having incentives enabled
    if (incentives?.enabled) score += 20;

    // Add points based on incentive type effectiveness
    if (incentives?.enabled) {
      if (incentives?.type === "gift") score += 20;
      else if (incentives?.type === "discount") score += 15;
      else if (incentives?.type === "credit") score += 15;
      else if (incentives?.type === "feature") score += 10;
      else score += 5;
    }

    // Add points for quality standards
    if (
      incentives?.minimumQualification?.minimumRating &&
      incentives?.minimumQualification.minimumRating >= 4
    )
      score += 5;
    if (
      incentives?.minimumQualification?.minimumLength &&
      incentives?.minimumQualification.minimumLength >= 50
    )
      score += 5;

    // Cap at 95%
    return Math.min(95, score);
  };

  // Get the selected incentive type info
  // const getIncentiveTypeInfo = () => {
  //   return incentiveTypes[incentives?.type] || incentiveTypes.discount;
  // };

  // Toggle testimonial type in qualification
  const toggleTestimonialType = (type: string) => {
    const currentTypes =
      incentives?.minimumQualification?.testimonialType || [];
    let newTypes;

    if (currentTypes.includes(type as any)) {
      // Remove the type if it exists
      newTypes = currentTypes.filter((t) => t !== type);
    } else {
      // Add the type if it doesn't exist
      newTypes = [...currentTypes, type as any];
    }

    // Ensure there's always at least one type selected
    if (newTypes.length === 0) {
      newTypes = ["text"];
    }

    onUpdateIncentives({
      minimumQualification: {
        ...incentives?.minimumQualification,
        testimonialType: newTypes,
      },
    });
  };

  // Toggle incentive enabled state
  const toggleIncentives = (enabled: boolean) => {
    if (enabled && !incentives?.enabled) {
      // When enabling incentives, set default values if they don't exist
      onUpdateIncentives({
        enabled: true,
        type: incentives?.type || "discount",
        value: incentives?.value || "10% off your next purchase",
        expiryDays: incentives?.expiryDays || 30,
        minimumQualification: incentives?.minimumQualification || {
          testimonialType: ["text", "video", "audio"],
          minimumRating: 4,
          minimumLength: 50,
        },
      });
    } else {
      // Simply toggle the enabled state
      onUpdateIncentives({ enabled });
    }
  };

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
            Incentive System
          </h2>
          <p className="text-sm text-muted-foreground">
            Reward users for sharing their testimonials to increase conversion
            rates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Enable Incentives</span>
          <Switch
            checked={incentives?.enabled}
            onCheckedChange={toggleIncentives}
          />
        </div>
      </div>

      {!incentives?.enabled ? (
        // Incentives disabled state
        <Card>
          <CardContent className="pt-6">
            {showIncentiveTips ? (
              <div className="p-6 border border-amber-200 bg-amber-50 rounded-lg">
                <div className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Gift className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-amber-800">
                      Boost Response Rates with Incentives
                    </h3>
                    <div className="space-y-3">
                      <p className="text-amber-700 text-sm">
                        Companies that offer incentives see{" "}
                        <strong>3-5x higher</strong> testimonial submission
                        rates. Even small rewards can significantly impact
                        participation.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div className="bg-white/60 rounded-lg p-3 border border-amber-200">
                          <h4 className="font-medium text-amber-800 mb-1 text-sm">
                            Popular Incentives
                          </h4>
                          <ul className="text-xs text-amber-700 space-y-1">
                            <li className="flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>10-15% discount on next purchase</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Account credits or points</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Gift className="h-3.5 w-3.5" />
                              <span>Free gift with next order</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Crown className="h-3.5 w-3.5" />
                              <span>Exclusive access to premium features</span>
                            </li>
                          </ul>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 border border-amber-200">
                          <h4 className="font-medium text-amber-800 mb-1 text-sm">
                            Implementation
                          </h4>
                          <ul className="text-xs text-amber-700 space-y-1">
                            <li className="flex items-start gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5 mt-0.5" />
                              <span>
                                Easy to set up with automated reward delivery
                              </span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5 mt-0.5" />
                              <span>
                                Clear qualification requirements ensure quality
                              </span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5 mt-0.5" />
                              <span>
                                ROI typically 300-500% from increased
                                testimonials
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                          onClick={() => setShowIncentiveTips(false)}
                        >
                          Maybe Later
                        </Button>
                        <Button
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                          onClick={() => toggleIncentives(true)}
                        >
                          Enable Incentives
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-700">
                  Incentives are Disabled
                </h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Enable incentives to reward users for sharing their
                  experiences and dramatically increase your testimonial
                  collection rates.
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowIncentiveTips(true)}
                  >
                    Learn More
                  </Button>
                  <Button onClick={() => toggleIncentives(true)}>
                    Enable Incentives
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Incentives enabled state
        <>
          <Card>
            <CardHeader>
              <CardTitle>Incentive Configuration</CardTitle>
              <CardDescription>
                Configure the rewards you'll offer to users who share
                testimonials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Incentive Type Selection */}
                <div className="space-y-4">
                  <Label className="text-base">Incentive Type</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(incentiveTypes).map(([type, info]) => {
                      const selected = incentives.type === type;
                      const Icon = info.icon;
                      return (
                        <div
                          key={type}
                          className={cn(
                            "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                            selected
                              ? "border-blue-200 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          )}
                          onClick={() => {
                            onUpdateIncentives({
                              type: type as IncentiveConfig["type"],
                              enabled: true,
                              // expiryDays: 30,
                              // value: "10%",
                            });
                          }}
                        >
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              selected
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{info.name}</h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  info.conversions.startsWith("8") ||
                                    info.conversions.startsWith("9")
                                    ? "bg-green-50 text-green-700 border-green-100"
                                    : info.conversions.startsWith("7")
                                      ? "bg-blue-50 text-blue-700 border-blue-100"
                                      : "bg-slate-50 text-slate-700 border-slate-100"
                                )}
                              >
                                {info.conversions} conversion
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {info.description}
                            </p>

                            <div className="mt-2 text-xs grid grid-cols-3 gap-1">
                              {info.examples.slice(0, 3).map((example, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "px-2 py-1 rounded-md text-center",
                                    selected
                                      ? "bg-blue-100/50 text-blue-700"
                                      : "bg-slate-100 text-slate-600"
                                  )}
                                >
                                  {example}
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                              <span>Setup:</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  info.setupComplexity === "low"
                                    ? "bg-green-50 text-green-700 border-green-100"
                                    : info.setupComplexity === "medium"
                                      ? "bg-amber-50 text-amber-700 border-amber-100"
                                      : "bg-red-50 text-red-700 border-red-100"
                                )}
                              >
                                {info.setupComplexity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Incentive Details */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base">Incentive Details</Label>

                    <div className="space-y-2">
                      <Label htmlFor="incentive-value">Value Description</Label>
                      <Input
                        id="incentive-value"
                        value={incentives.value}
                        onChange={(e) =>
                          onUpdateIncentives({ value: e.target.value })
                        }
                        placeholder="e.g. 10% off your next purchase"
                      />
                      <p className="text-xs text-muted-foreground">
                        How the incentive will be described to users
                      </p>
                    </div>

                    {incentives.type === "discount" && (
                      <div className="space-y-2">
                        <Label htmlFor="discount-code">Discount Code</Label>
                        <Input
                          id="discount-code"
                          value={incentives.code || ""}
                          onChange={(e) =>
                            onUpdateIncentives({ code: e.target.value })
                          }
                          placeholder="e.g. THANKS10"
                        />
                        <p className="text-xs text-muted-foreground">
                          The code users will receive after submitting a
                          testimonial
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label
                        htmlFor="expiry-days"
                        className="flex items-center justify-between"
                      >
                        <span>Expiry Period</span>
                        <Badge
                          variant="outline"
                          className="font-normal bg-blue-50 text-blue-700 border-blue-100"
                        >
                          Recommended: 30 days
                        </Badge>
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="grid grid-cols-4 gap-2 flex-1">
                          {[7, 14, 30, 90].map((days) => (
                            <Button
                              key={days}
                              type="button"
                              variant={
                                (incentives.expiryDays || 30) === days
                                  ? "default"
                                  : "outline"
                              }
                              className="h-10"
                              onClick={() =>
                                onUpdateIncentives({ expiryDays: days })
                              }
                            >
                              {days}
                            </Button>
                          ))}
                        </div>
                        <span className="text-sm text-slate-500 w-12">
                          days
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        How long the incentive remains valid after issuance
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 mt-2">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-amber-700">
                            <span className="font-medium">
                              Limited-time incentives
                            </span>{" "}
                            create a sense of urgency that can increase
                            submission rates by up to 25%.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ConversionImpactMeter impact={calculateImpactScore()} />
                </div>
              </div>

              <Separator />

              {/* Qualification Rules Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">
                    Qualification Requirements
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-100"
                  >
                    Quality Control
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Testimonial Types */}
                  <div className="space-y-3">
                    <Label>Eligible Testimonial Types</Label>

                    <div className="grid grid-cols-2 gap-2">
                      {testimonialFormats.map((format) => {
                        const isSelected =
                          incentives.minimumQualification?.testimonialType?.includes(
                            format.id as any
                          );
                        return (
                          <div
                            key={format.id}
                            className={cn(
                              "flex items-start p-3 border rounded-lg cursor-pointer transition-all",
                              isSelected
                                ? "border-blue-200 bg-blue-50"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            )}
                            onClick={() => toggleTestimonialType(format.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              className="mr-3 mt-0.5"
                              onCheckedChange={() =>
                                toggleTestimonialType(format.id)
                              }
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <format.icon className="h-4 w-4 text-slate-600" />
                                <span className="font-medium text-sm">
                                  {format.name} Testimonials
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {format.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-xs text-blue-600 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      <span>
                        Video testimonials are 2-3x more valuable than text
                        testimonials. Consider offering better incentives for
                        video submissions.
                      </span>
                    </div>
                  </div>

                  {/* Other Requirements */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Minimum Rating</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            type="button"
                            variant={
                              (incentives.minimumQualification?.minimumRating ||
                                0) >= rating
                                ? "default"
                                : "outline"
                            }
                            className="flex-1 p-0 h-10"
                            onClick={() =>
                              onUpdateIncentives({
                                minimumQualification: {
                                  ...incentives.minimumQualification,
                                  minimumRating: rating,
                                },
                              })
                            }
                          >
                            <Star
                              className="h-5 w-5"
                              fill={
                                (incentives.minimumQualification
                                  ?.minimumRating || 0) >= rating
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum star rating required to qualify for incentive
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="min-length"
                        className="flex items-center justify-between"
                      >
                        <span>Minimum Text Length</span>
                        <Badge
                          variant="outline"
                          className="font-normal bg-blue-50 text-blue-700 border-blue-100"
                        >
                          Recommended: 50+ chars
                        </Badge>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="min-length"
                          type="number"
                          min={0}
                          value={
                            incentives.minimumQualification?.minimumLength || 0
                          }
                          onChange={(e) =>
                            onUpdateIncentives({
                              minimumQualification: {
                                ...incentives.minimumQualification,
                                minimumLength: Number(e.target.value),
                              },
                            })
                          }
                          className="flex-1"
                        />
                        <span className="text-sm text-slate-500 w-24">
                          characters
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum character count for testimonial text to qualify
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <Label
                          htmlFor="show-requirements"
                          className="text-sm cursor-pointer"
                        >
                          Show Requirements Before Submission
                        </Label>
                      </div>
                      <Switch
                        id="show-requirements"
                        checked={incentives.showRequirements !== false}
                        onCheckedChange={(checked) =>
                          onUpdateIncentives({ showRequirements: checked })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      Show users what they need to do to qualify for the
                      incentive
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => onUpdateIncentives({ enabled: false })}
              >
                Disable Incentives
              </Button>
              <Button onClick={onShowPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Incentives
              </Button>
            </CardFooter>
          </Card>

          <IncentivesGuide />
        </>
      )}
    </motion.div>
  );
};

export default observer(IncentivesTab);
