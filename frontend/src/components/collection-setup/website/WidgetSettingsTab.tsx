import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Palette,
  Sliders,
  Gift,
  Monitor,
  Smartphone,
  Target,
  RefreshCw,
  Sparkles,
  DollarSign,
  Info,
  Crown,
  Heart,
  Star,
  Eye,
  AlertTriangle,
  MessageSquare,
  Tablet,
  CreditCard,
  FileText,
  Video,
  Mic,
  Image,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "antd";
import {
  DisplayRules,
  IncentiveConfig,
  WidgetCustomization,
} from "@/types/setup";

interface WidgetSettingsTabProps {
  customization: WidgetCustomization;
  displayRules: DisplayRules;
  incentives: IncentiveConfig;
  onUpdateCustomization: (updates: Partial<WidgetCustomization>) => void;
  onUpdateDisplayRules: (updates: Partial<DisplayRules>) => void;
  onUpdateIncentives: (updates: Partial<IncentiveConfig>) => void;
  onShowPreview: () => void;
}

const WidgetSettingsTab: React.FC<WidgetSettingsTabProps> = ({
  customization,
  displayRules,
  incentives,
  onUpdateCustomization,
  onUpdateDisplayRules,
  onUpdateIncentives,
  onShowPreview,
}) => {
  const [activeTab, setActiveTab] = useState("appearance");
  const [showIncentiveTip, setShowIncentiveTip] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Widget Settings</h2>
          <p className="text-muted-foreground">
            Customize how your testimonial widget looks, behaves, and rewards
            users
          </p>
        </div>

        <Button onClick={onShowPreview}>
          <Eye className="mr-2 h-4 w-4" />
          Preview Widget
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance" className="flex items-center gap-1">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-1">
            <Sliders className="h-4 w-4" />
            <span>Behavior</span>
          </TabsTrigger>
          <TabsTrigger value="incentives" className="flex items-center gap-1">
            <Gift className="h-4 w-4" />
            <span>Incentives</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>Content</span>
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Visual Customization</CardTitle>
                <CardDescription>
                  Adjust the look and feel of your testimonial widget to match
                  your brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brand Colors */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-slate-500"
                          onClick={() =>
                            onUpdateCustomization({ primaryColor: "#4F46E5" })
                          }
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reset
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <ColorPicker
                        color={customization.primaryColor}
                        onChange={(color) =>
                          onUpdateCustomization({ primaryColor: color })
                        }
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        value={customization.companyName}
                        onChange={(e) =>
                          onUpdateCustomization({ companyName: e.target.value })
                        }
                        placeholder="Your Company Name"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="logo">Company Logo</Label>
                        <Switch
                          id="show-logo"
                          checked={Boolean(customization.logo)}
                          onCheckedChange={(checked) =>
                            onUpdateCustomization({
                              logo: checked
                                ? customization.logo || "placeholder.png"
                                : undefined,
                            })
                          }
                        />
                      </div>

                      {customization.logo && (
                        <div className="p-4 border rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-32 h-16 mx-auto bg-slate-100 rounded-md flex items-center justify-center mb-2">
                              {customization.logo !== "placeholder.png" ? (
                                <img
                                  src={customization.logo}
                                  alt="Company Logo"
                                  className="max-w-full max-h-full p-2"
                                />
                              ) : (
                                <span className="text-slate-400 text-sm">
                                  Logo Preview
                                </span>
                              )}
                            </div>
                            <Button variant="outline" size="sm">
                              Upload Logo
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Widget Appearance */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Widget Position</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "bottom-right",
                          "bottom-left",
                          "top-right",
                          "top-left",
                        ].map((position) => (
                          <Button
                            key={position}
                            variant={
                              customization.position === position
                                ? "default"
                                : "outline"
                            }
                            className="justify-start h-auto py-2"
                            onClick={() =>
                              onUpdateCustomization({
                                position: position as any,
                              })
                            }
                          >
                            <div className="w-10 h-10 border rounded relative mr-2">
                              <div
                                className="absolute w-3 h-3 bg-current rounded-full"
                                style={{
                                  top: position.includes("top")
                                    ? "2px"
                                    : "auto",
                                  bottom: position.includes("bottom")
                                    ? "2px"
                                    : "auto",
                                  left: position.includes("left")
                                    ? "2px"
                                    : "auto",
                                  right: position.includes("right")
                                    ? "2px"
                                    : "auto",
                                }}
                              />
                            </div>
                            <span className="text-sm">
                              {position
                                .split("-")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="widget-title">Widget Title</Label>
                      <Input
                        id="widget-title"
                        value={customization.widgetTitle || ""}
                        onChange={(e) =>
                          onUpdateCustomization({ widgetTitle: e.target.value })
                        }
                        placeholder="Share Your Experience"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="widget-description">
                        Widget Description
                      </Label>
                      <Textarea
                        id="widget-description"
                        value={customization.widgetDescription || ""}
                        onChange={(e) =>
                          onUpdateCustomization({
                            widgetDescription: e.target.value,
                          })
                        }
                        placeholder="We'd love to hear what you think about our product!"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="widget-thank-you">
                        Thank You Message
                      </Label>
                      <Textarea
                        id="widget-thank-you"
                        value={customization.thankYouMessage || ""}
                        onChange={(e) =>
                          onUpdateCustomization({
                            thankYouMessage: e.target.value,
                          })
                        }
                        placeholder="Thank you for sharing your experience with us!"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-4">
                  <Label htmlFor="custom-css">Custom CSS (Optional)</Label>
                  <Textarea
                    id="custom-css"
                    value={customization.customCSS || ""}
                    onChange={(e) =>
                      onUpdateCustomization({ customCSS: e.target.value })
                    }
                    placeholder=".testimonial-widget { /* Custom styles */ }"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    Add custom CSS to fine-tune the widget appearance
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">Reset to Defaults</Button>
                <Button onClick={onShowPreview}>Preview Appearance</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="mt-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Widget Behavior</CardTitle>
                <CardDescription>
                  Control when and how your testimonial widget appears to users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Device Targeting */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Device Targeting</h3>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-slate-500" />
                        <Label
                          htmlFor="desktop-enabled"
                          className="cursor-pointer"
                        >
                          Show on Desktop
                        </Label>
                      </div>
                      <Switch id="desktop-enabled" checked={true} disabled />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tablet className="h-4 w-4 text-slate-500" />
                        <Label
                          htmlFor="tablet-enabled"
                          className="cursor-pointer"
                        >
                          Show on Tablets
                        </Label>
                      </div>
                      <Switch
                        id="tablet-enabled"
                        checked={displayRules.tabletEnabled ?? true}
                        onCheckedChange={(checked) =>
                          onUpdateDisplayRules({ tabletEnabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-slate-500" />
                        <Label
                          htmlFor="mobile-enabled"
                          className="cursor-pointer"
                        >
                          Show on Mobile
                        </Label>
                      </div>
                      <Switch
                        id="mobile-enabled"
                        checked={displayRules.mobileEnabled ?? true}
                        onCheckedChange={(checked) =>
                          onUpdateDisplayRules({ mobileEnabled: checked })
                        }
                      />
                    </div>

                    <Separator className="my-4" />

                    <h3 className="text-lg font-medium">Timing Rules</h3>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="min-time-page">
                          Minimum Time on Page
                        </Label>
                        <span className="text-sm font-medium">
                          {displayRules.minTimeOnPage || 0} seconds
                        </span>
                      </div>
                      <Slider
                        id="min-time-page"
                        min={0}
                        max={60}
                        step={5}
                        value={[displayRules.minTimeOnPage || 0]}
                        onValueChange={([value]) =>
                          onUpdateDisplayRules({ minTimeOnPage: value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Wait until user has been on the page for this duration
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="min-time-site">
                          Minimum Time on Site
                        </Label>
                        <span className="text-sm font-medium">
                          {displayRules.minTimeOnSite || 0} seconds
                        </span>
                      </div>
                      <Slider
                        id="min-time-site"
                        min={0}
                        max={300}
                        step={30}
                        value={[displayRules.minTimeOnSite || 0]}
                        onValueChange={([value]) =>
                          onUpdateDisplayRules({ minTimeOnSite: value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Wait until user has been on your site for this duration
                      </p>
                    </div>
                  </div>

                  {/* Additional Behavior Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Additional Triggers</h3>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-slate-500" />
                        <Label htmlFor="exit-intent" className="cursor-pointer">
                          Show on Exit Intent
                        </Label>
                      </div>
                      <Switch
                        id="exit-intent"
                        checked={displayRules.showOnExit ?? false}
                        onCheckedChange={(checked) =>
                          onUpdateDisplayRules({ showOnExit: checked })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      Trigger when user is about to leave the page
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="scroll-depth">
                          Minimum Scroll Depth
                        </Label>
                        <span className="text-sm font-medium">
                          {displayRules.minScrollDepth || 0}%
                        </span>
                      </div>
                      <Slider
                        id="scroll-depth"
                        min={0}
                        max={100}
                        step={10}
                        value={[displayRules.minScrollDepth || 0]}
                        onValueChange={([value]) =>
                          onUpdateDisplayRules({ minScrollDepth: value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Show after user scrolls to this percentage of the page
                      </p>
                    </div>

                    <Separator className="my-4" />

                    <h3 className="text-lg font-medium">Frequency Control</h3>

                    <div className="space-y-2">
                      <Label htmlFor="max-frequency">Maximum Prompts</Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={String(displayRules.maxPromptFrequency || 1)}
                          onValueChange={(value) =>
                            onUpdateDisplayRules({
                              maxPromptFrequency: Number(value),
                            })
                          }
                        >
                          <SelectTrigger id="max-frequency" className="w-full">
                            <SelectValue placeholder="Select limit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 per session</SelectItem>
                            <SelectItem value="2">2 per session</SelectItem>
                            <SelectItem value="3">3 per session</SelectItem>
                            <SelectItem value="5">5 per session</SelectItem>
                            <SelectItem value="10">10 per session</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum number of testimonial prompts per user session
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mt-6">
                      <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-blue-700">
                            Best Practice
                          </h4>
                          <p className="text-sm text-blue-600 mt-1">
                            For the best user experience, limit testimonial
                            requests to 1-2 per session and ensure they appear
                            at meaningful moments.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Page Targeting</h3>

                  <div className="space-y-2">
                    <Label htmlFor="excluded-pages">
                      Excluded Pages (one per line)
                    </Label>
                    <Textarea
                      id="excluded-pages"
                      value={(displayRules.excludedPages || []).join("\n")}
                      onChange={(e) => {
                        const pages = e.target.value
                          .split("\n")
                          .map((p) => p.trim())
                          .filter(Boolean);
                        onUpdateDisplayRules({ excludedPages: pages });
                      }}
                      placeholder="/checkout/*, /account/*, /login"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pages where testimonial widget should never appear
                      (supports * wildcard)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="included-pages">
                      Included Pages (one per line, leave empty for all)
                    </Label>
                    <Textarea
                      id="included-pages"
                      value={(displayRules.includedPages || []).join("\n")}
                      onChange={(e) => {
                        const pages = e.target.value
                          .split("\n")
                          .map((p) => p.trim())
                          .filter(Boolean);
                        onUpdateDisplayRules({ includedPages: pages });
                      }}
                      placeholder="/product/*, /pricing, /solutions/*"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Only show testimonial widget on these pages (supports *
                      wildcard)
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">Reset to Defaults</Button>
                <Button onClick={onShowPreview}>Test Behavior</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Incentives Tab */}
        <TabsContent value="incentives" className="mt-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Incentive System</CardTitle>
                    <CardDescription>
                      Reward users for sharing their experiences
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Enable Incentives
                    </span>
                    <Switch
                      checked={incentives.enabled}
                      onCheckedChange={(checked) =>
                        onUpdateIncentives({ enabled: checked })
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!incentives.enabled ? (
                  <div
                    className={`p-6 border border-dashed rounded-lg text-center ${
                      showIncentiveTip
                        ? "bg-amber-50 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
                      <Gift
                        className={`h-8 w-8 ${
                          showIncentiveTip ? "text-amber-500" : "text-slate-400"
                        }`}
                      />
                    </div>

                    {showIncentiveTip ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-amber-800">
                          Boost Response Rates with Incentives
                        </h3>
                        <p className="text-amber-700 mb-4">
                          Incentives can increase testimonial submission rates
                          by 3-5x while maintaining quality. Common incentives
                          include discount codes, account credits, or exclusive
                          access to new features.
                        </p>
                        <div className="flex justify-center gap-3">
                          <Button
                            variant="outline"
                            className="border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                            onClick={() => setShowIncentiveTip(false)}
                          >
                            Maybe Later
                          </Button>
                          <Button
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => {
                              onUpdateIncentives({ enabled: true });
                              setShowIncentiveTip(false);
                            }}
                          >
                            Enable Incentives
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-700">
                          Incentives are Disabled
                        </h3>
                        <p className="text-slate-500 mb-4">
                          Enable incentives to reward users for sharing their
                          experiences and increase your testimonial collection
                          rate.
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowIncentiveTip(true)}
                          >
                            Learn More
                          </Button>
                          <Button
                            onClick={() =>
                              onUpdateIncentives({ enabled: true })
                            }
                          >
                            Enable Incentives
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Incentive Configuration */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Incentive Details
                        </h3>

                        <div className="space-y-2">
                          <Label htmlFor="incentive-type">Incentive Type</Label>
                          <Select
                            value={incentives.type}
                            onValueChange={(value) =>
                              onUpdateIncentives({ type: value as any })
                            }
                          >
                            <SelectTrigger id="incentive-type">
                              <SelectValue placeholder="Select incentive type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="discount">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-green-500" />
                                  <span>Discount Code</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="credit">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-blue-500" />
                                  <span>Account Credit</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="feature">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4 text-purple-500" />
                                  <span>Premium Feature Access</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="gift">
                                <div className="flex items-center gap-2">
                                  <Gift className="h-4 w-4 text-red-500" />
                                  <span>Free Gift</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="donation">
                                <div className="flex items-center gap-2">
                                  <Heart className="h-4 w-4 text-pink-500" />
                                  <span>Charity Donation</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="incentive-value">
                            Value Description
                          </Label>
                          <Input
                            id="incentive-value"
                            value={incentives.value}
                            onChange={(e) =>
                              onUpdateIncentives({ value: e.target.value })
                            }
                            placeholder="e.g. 10% off next purchase"
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
                              placeholder="e.g. THANKYOU10"
                            />
                            <p className="text-xs text-muted-foreground">
                              The code users will receive after submitting a
                              testimonial
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="expiry-days">
                            Expiry Period (Days)
                          </Label>
                          <Select
                            value={String(incentives.expiryDays || 30)}
                            onValueChange={(value) =>
                              onUpdateIncentives({ expiryDays: Number(value) })
                            }
                          >
                            <SelectTrigger id="expiry-days">
                              <SelectValue placeholder="Select expiry period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="14">14 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="60">60 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            How long the incentive remains valid after issuance
                          </p>
                        </div>
                      </div>

                      {/* Qualification Rules */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Qualification Rules
                        </h3>

                        <div className="space-y-3">
                          <Label>Eligible Testimonial Types</Label>

                          {[
                            {
                              id: "text",
                              label: "Text Testimonials",
                              icon: <FileText className="h-4 w-4" />,
                            },
                            {
                              id: "video",
                              label: "Video Testimonials",
                              icon: <Video className="h-4 w-4" />,
                            },
                            {
                              id: "audio",
                              label: "Audio Testimonials",
                              icon: <Mic className="h-4 w-4" />,
                            },
                            {
                              id: "image",
                              label: "Photo Testimonials",
                              icon: <Image className="h-4 w-4" />,
                            },
                          ].map((type) => (
                            <div
                              key={type.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`type-${type.id}`}
                                checked={
                                  !incentives.minimumQualification
                                    ?.testimonialType ||
                                  incentives.minimumQualification.testimonialType.includes(
                                    type.id as any
                                  )
                                }
                                onChange={(checked) => {
                                  const currentTypes = incentives
                                    .minimumQualification?.testimonialType || [
                                    "text",
                                    "video",
                                    "audio",
                                    "image",
                                  ];

                                  if (checked) {
                                    // Add to array if not present
                                    if (
                                      !currentTypes.includes(type.id as any)
                                    ) {
                                      onUpdateIncentives({
                                        minimumQualification: {
                                          ...incentives.minimumQualification,
                                          testimonialType: [
                                            ...currentTypes,
                                            type.id as any,
                                          ],
                                        },
                                      });
                                    }
                                  } else {
                                    // Remove from array
                                    onUpdateIncentives({
                                      minimumQualification: {
                                        ...incentives.minimumQualification,
                                        testimonialType: currentTypes.filter(
                                          (t) => t !== type.id
                                        ),
                                      },
                                    });
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`type-${type.id}`}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                              >
                                {type.icon}
                                <span>{type.label}</span>
                              </Label>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="min-rating">Minimum Rating</Label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <Button
                                key={rating}
                                type="button"
                                variant={
                                  (incentives.minimumQualification
                                    ?.minimumRating || 1) >= rating
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
                                      ?.minimumRating || 1) >= rating
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Minimum star rating required to qualify for
                            incentive
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="min-length">
                            Minimum Text Length (Characters)
                          </Label>
                          <Input
                            id="min-length"
                            type="number"
                            min={0}
                            value={
                              incentives.minimumQualification?.minimumLength ||
                              0
                            }
                            onChange={(e) =>
                              onUpdateIncentives({
                                minimumQualification: {
                                  ...incentives.minimumQualification,
                                  minimumLength: Number(e.target.value),
                                },
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Minimum character count for testimonial text
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <Label
                              htmlFor="disqualify-prompt"
                              className="text-sm text-amber-700 cursor-pointer"
                            >
                              Show Qualification Requirements Before Submission
                            </Label>
                          </div>
                          <Switch
                            id="disqualify-prompt"
                            checked={
                              (incentives as any).showQualificationPrompt ??
                              true
                            }
                            // onCheckedChange={(checked) => {
                            //   //   onUpdateIncentives({
                            //   //     showQualificationPrompt: checked,
                            //   //   });
                            // }}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                      <div className="flex gap-3">
                        <Sparkles className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-green-700">
                            Incentive Best Practices
                          </h4>
                          <p className="text-sm text-green-600 mt-1">
                            Incentives work best when they're valuable enough to
                            motivate participation but have reasonable
                            qualification requirements. Consider testing
                            different incentive types to find what resonates
                            with your audience.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">Reset to Defaults</Button>
                <Button onClick={onShowPreview}>Preview Incentives</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Testimonial Content Settings</CardTitle>
                <CardDescription>
                  Configure what content users can submit and how it's displayed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Content Types */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Accepted Content Types
                    </h3>

                    <div className="space-y-2">
                      {[
                        {
                          id: "text",
                          label: "Text Testimonials",
                          icon: MessageSquare,
                          description: "Written reviews and feedback",
                        },
                        {
                          id: "rating",
                          label: "Star Ratings",
                          icon: Star,
                          description: "1-5 star product/service rating",
                        },
                        {
                          id: "video",
                          label: "Video Testimonials",
                          icon: Video,
                          description: "Video reviews (15 sec - 2 min)",
                        },
                        {
                          id: "audio",
                          label: "Audio Testimonials",
                          icon: Mic,
                          description: "Voice testimonials (up to 2 min)",
                        },
                        {
                          id: "image",
                          label: "Photo Uploads",
                          icon: Image,
                          description: "Product or result photos",
                        },
                      ].map((type) => (
                        <div
                          key={type.id}
                          className="flex items-start space-x-2 p-2 hover:bg-slate-50 rounded-md"
                        >
                          <Checkbox
                            id={`content-${type.id}`}
                            checked={
                              (customization as any).contentTypes?.includes(
                                type.id as any
                              ) ?? true
                            }
                            onChange={(checked) => {
                              const currentTypes = (customization as any)
                                .contentTypes || [
                                "text",
                                "rating",
                                "video",
                                "audio",
                                "image",
                              ];

                              if (checked) {
                                if (!currentTypes.includes(type.id as any)) {
                                  //   onUpdateCustomization({
                                  //     contentTypes: [
                                  //       ...currentTypes,
                                  //       type.id as any,
                                  //     ],
                                  //   });
                                }
                              } else {
                                // onUpdateCustomization({
                                //   contentTypes: currentTypes.filter(
                                //     (t) => t !== type.id
                                //   ),
                                // });
                              }
                            }}
                            className="mt-1"
                          />
                          <div>
                            <Label
                              htmlFor={`content-${type.id}`}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <type.icon className="h-4 w-4 text-slate-600" />
                              <span>{type.label}</span>
                            </Label>
                            <p className="text-xs text-slate-500 mt-1 ml-6">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Moderation */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Moderation Settings</h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label
                          htmlFor="moderation-required"
                          className="font-medium"
                        >
                          Require Moderation Before Publishing
                        </Label>
                        <p className="text-xs text-slate-500 mt-1">
                          Review testimonials before they appear on your site
                        </p>
                      </div>
                      <Switch
                        id="moderation-required"
                        checked={
                          (customization as any).requireModeration ?? true
                        }
                        // onCheckedChange={(checked) => {
                        //   //   onUpdateCustomization({ requireModeration: checked });
                        // }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <Label
                          htmlFor="auto-moderation"
                          className="font-medium"
                        >
                          Enable AI Content Moderation
                        </Label>
                        <p className="text-xs text-slate-500 mt-1">
                          Automatically filter spam and inappropriate content
                        </p>
                      </div>
                      <Switch
                        id="auto-moderation"
                        checked={(customization as any).aiModeration ?? true}
                        // onCheckedChange={(checked) =>
                        //   onUpdateCustomization({ aiModeration: checked })
                        // }
                      />
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mt-4">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-blue-700">
                          Our AI moderation system automatically flags
                          potentially inappropriate content while reducing false
                          positives by over 60% compared to keyword filtering.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Form Fields</h3>
                  <p className="text-sm text-slate-500">
                    Configure which fields to collect from users
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        id: "name",
                        label: "Full Name",
                        required: true,
                        locked: true,
                      },
                      {
                        id: "email",
                        label: "Email Address",
                        required: true,
                        locked: true,
                      },
                      { id: "company", label: "Company Name", required: false },
                      { id: "jobTitle", label: "Job Title", required: false },
                      { id: "location", label: "Location", required: false },
                      {
                        id: "purchaseDate",
                        label: "Date of Purchase",
                        required: false,
                      },
                      {
                        id: "productUsed",
                        label: "Product/Service Used",
                        required: false,
                      },
                      {
                        id: "socialMedia",
                        label: "Social Media Handle",
                        required: false,
                      },
                    ].map((field) => (
                      <div
                        key={field.id}
                        className={`flex items-center justify-between p-3 border rounded-md ${
                          field.locked ? "bg-slate-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`field-${field.id}`}
                            checked={
                              (customization as any).fields?.includes(
                                field.id as any
                              ) ?? true
                            }
                            onChange={(checked) => {
                              if (field.locked) return;

                              const currentFields = (customization as any)
                                .fields || [
                                "name",
                                "email",
                                "company",
                                "jobTitle",
                              ];

                              if (checked) {
                                if (!currentFields.includes(field.id as any)) {
                                  //   onUpdateCustomization({
                                  //     fields: [...currentFields, field.id as any],
                                  //   });
                                }
                              } else {
                                // onUpdateCustomization({
                                //   fields: currentFields.filter(
                                //     (f) => f !== field.id
                                //   ),
                                // });
                              }
                            }}
                            disabled={field.locked}
                          />
                          <div>
                            <Label
                              htmlFor={`field-${field.id}`}
                              className={`text-sm font-medium ${
                                field.locked
                                  ? "cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              {field.label}
                            </Label>

                            {field.locked && (
                              <span className="ml-2 text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                Required
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={
                              (field.required ||
                                (customization as any).requiredFields?.includes(
                                  field.id as any
                                )) ??
                              false
                            }
                            onCheckedChange={(checked) => {
                              if (field.locked) return;

                              const currentRequired =
                                (customization as any).requiredFields || [];

                              if (checked) {
                                if (
                                  !currentRequired.includes(field.id as any)
                                ) {
                                  //   onUpdateCustomization({
                                  //     requiredFields: [
                                  //       ...currentRequired,
                                  //       field.id as any,
                                  //     ],
                                  //   });
                                }
                              } else {
                                // onUpdateCustomization({
                                //   requiredFields: currentRequired.filter(
                                //     (f) => f !== field.id
                                //   ),
                                // });
                              }
                            }}
                            disabled={field.locked}
                          />
                          <span className="text-xs text-slate-500">
                            Required
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">Reset to Defaults</Button>
                <Button onClick={onShowPreview}>Preview Form</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default WidgetSettingsTab;
