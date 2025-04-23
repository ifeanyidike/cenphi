import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Sun,
  Moon,
  Layout,
  Palette,
  Layers,
  RotateCcw,
  Sliders,
  ArrowRight,
  CheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Types
import { defaultCustomization } from "../constants";
import { WidgetCustomization } from "@/types/setup";
import { observer } from "mobx-react-lite";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
import { runInAction } from "mobx";

interface AppearanceTabProps {
  onShowPreview: () => void;
}

// Position option type
type PositionOption = "bottom-right" | "bottom-left" | "top-right" | "top-left";

// Theme option type
type ThemeOption = "light" | "dark";

// Style preset type
type StylePreset = "minimal" | "rounded";

// Device type
type DeviceType = "desktop" | "tablet" | "mobile";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Option card animation
const optionCardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  hover: {
    scale: 1.03,
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
  selected: {
    scale: 1.02,
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
};

/**
 * Position selection option component
 */
interface PositionOptionProps {
  position: {
    value: PositionOption;
    label: string;
  };
  isActive: boolean;
  index: number;
  onSelect: (value: PositionOption) => void;
}

const PositionOptionCard: React.FC<PositionOptionProps> = ({
  position,
  isActive,
  index,
  onSelect,
}) => (
  <motion.div
    key={position.value}
    custom={index}
    variants={optionCardVariants}
    initial="hidden"
    animate={isActive ? ["visible", "selected"] : "visible"}
    whileHover={!isActive ? "hover" : undefined}
    whileTap="tap"
    className={cn(
      "group relative overflow-hidden border rounded-xl transition-all",
      isActive
        ? "border-primary/50 bg-primary/5 shadow-md"
        : "border-slate-200 hover:border-primary/30 hover:bg-slate-50/70"
    )}
    onClick={() => onSelect(position.value)}
  >
    <div className="p-4">
      <div className="relative w-full h-36 rounded-lg overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 mb-3 transition-all shadow-sm group-hover:shadow">
        {/* Website frame */}
        <div className="absolute inset-0 border-b-2 border-slate-200 p-1">
          <div className="w-full h-3 flex items-center space-x-1 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
          </div>

          {/* Content placeholders */}
          <div className="space-y-2 px-2">
            <div className="w-1/3 h-2 bg-slate-200 rounded-full"></div>
            <div className="w-2/3 h-2 bg-slate-200 rounded-full"></div>
            <div className="w-1/2 h-2 bg-slate-200 rounded-full"></div>
          </div>
        </div>

        {/* Widget indicator */}
        <div
          className={cn(
            "absolute w-12 h-12 flex items-center justify-center rounded-lg transition-all shadow-md",
            isActive
              ? "bg-primary text-white"
              : "bg-primary/40 text-white group-hover:bg-primary/60"
          )}
          style={{
            top: position.value.includes("top") ? "12px" : "auto",
            bottom: position.value.includes("bottom") ? "12px" : "auto",
            left: position.value.includes("left") ? "12px" : "auto",
            right: position.value.includes("right") ? "12px" : "auto",
          }}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="w-4 h-0.5 bg-current mb-1 rounded-full opacity-80"></div>
            <div className="w-3 h-0.5 bg-current rounded-full opacity-80"></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            isActive
              ? "text-primary"
              : "text-slate-700 group-hover:text-slate-900"
          )}
        >
          {position.label}
        </span>

        {isActive && (
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 font-normal"
          >
            <CheckIcon className="h-3 w-3 mr-1" />
            Selected
          </Badge>
        )}
      </div>
    </div>
  </motion.div>
);

/**
 * Device option component
 */
interface DeviceOptionProps {
  device: {
    type: DeviceType;
    icon: React.ElementType;
    label: string;
    desc: string;
    settingKey?: keyof WidgetCustomization;
    required?: boolean;
  };
  isActive: boolean;
  index: number;
  onToggle: () => void;
}

const DeviceOptionCard: React.FC<DeviceOptionProps> = ({
  device,
  isActive,
  index,
  onToggle,
}) => (
  <motion.div
    custom={index}
    variants={optionCardVariants}
    initial="hidden"
    animate={isActive ? ["visible", "selected"] : "visible"}
    whileHover={!device.required ? "hover" : undefined}
    whileTap={!device.required ? "tap" : undefined}
    className={cn(
      "group relative border rounded-xl p-5 transition-all",
      isActive
        ? "border-primary/50 bg-primary/5"
        : "border-slate-200 bg-slate-50/50",
      !device.required && "cursor-pointer hover:border-primary/30"
    )}
    onClick={!device.required ? onToggle : undefined}
  >
    {device.required ? (
      <Badge className="absolute top-3 right-3 bg-blue-500/10 text-blue-600 border border-blue-200">
        Required
      </Badge>
    ) : (
      <div className="absolute top-3 right-3">
        <Switch
          checked={isActive}
          onCheckedChange={onToggle}
          className={cn("data-[state=checked]:bg-primary")}
        />
      </div>
    )}

    <div className="flex flex-col items-center mt-2">
      <div
        className={cn(
          "w-16 h-16 flex items-center justify-center rounded-full mb-3 transition-all",
          isActive
            ? "bg-primary/10 text-primary"
            : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500"
        )}
      >
        <device.icon className="h-8 w-8" />
      </div>

      <div className="text-center">
        <div
          className={cn(
            "text-sm font-medium mb-1 transition-colors",
            isActive
              ? "text-primary"
              : "text-slate-700 group-hover:text-slate-900"
          )}
        >
          {device.label}
        </div>
        <div className="text-xs text-slate-500">{device.desc}</div>
      </div>
    </div>
  </motion.div>
);

/**
 * Theme option component
 */
interface ThemeOptionProps {
  theme: {
    id: ThemeOption;
    icon: React.ElementType;
    label: string;
    bgClass: string;
    textClass: string;
  };
  isActive: boolean;
  index: number;
  onSelect: (value: ThemeOption) => void;
}

const ThemeOptionCard: React.FC<ThemeOptionProps> = ({
  theme,
  isActive,
  index,
  onSelect,
}) => (
  <motion.div
    custom={index}
    variants={optionCardVariants}
    initial="hidden"
    animate={isActive ? ["visible", "selected"] : "visible"}
    whileHover={!isActive ? "hover" : undefined}
    whileTap="tap"
    className={cn(
      "group relative overflow-hidden border rounded-xl transition-all",
      isActive
        ? "border-primary/50 bg-primary/5 shadow-md"
        : "border-slate-200 hover:border-primary/30 hover:bg-slate-50/70"
    )}
    onClick={() => onSelect(theme.id)}
  >
    {isActive && (
      <div className="absolute top-3 right-3 z-10">
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20 font-normal"
        >
          <CheckIcon className="h-3 w-3 mr-1" />
          Selected
        </Badge>
      </div>
    )}

    <div className="p-4">
      <div
        className={cn(
          "relative w-full h-40 rounded-lg overflow-hidden mb-3 shadow-sm",
          theme.bgClass
        )}
      >
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center p-4",
            theme.textClass
          )}
        >
          <theme.icon className="h-10 w-10 mb-3 opacity-80" />
          <div className="text-sm font-medium mb-2">Share Your Experience</div>
          <div className="flex space-x-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={
                  theme.id === "dark" ? "text-yellow-300" : "text-yellow-500"
                }
              >
                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
              </svg>
            ))}
          </div>
          <button
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium",
              theme.id === "dark"
                ? "bg-slate-700 text-white"
                : "bg-primary/90 text-white"
            )}
          >
            Submit Testimonial
          </button>
        </div>
      </div>

      <div className="flex items-center">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center mr-2",
            isActive
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
          )}
        >
          <theme.icon className="h-4 w-4" />
        </div>
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            isActive
              ? "text-primary"
              : "text-slate-700 group-hover:text-slate-900"
          )}
        >
          {theme.label}
        </span>
      </div>
    </div>
  </motion.div>
);

/**
 * Style preset component
 */
interface StylePresetProps {
  style: {
    id: StylePreset;
    name: string;
    desc: string;
    preview: string;
  };
  isActive: boolean;
  index: number;
  onSelect: (value: StylePreset) => void;
}

const StylePresetCard: React.FC<StylePresetProps> = ({
  style,
  isActive,
  index,
  onSelect,
}) => (
  <motion.div
    custom={index}
    variants={optionCardVariants}
    initial="hidden"
    animate={isActive ? ["visible", "selected"] : "visible"}
    whileHover={!isActive ? "hover" : undefined}
    whileTap="tap"
    className={cn(
      "group relative overflow-hidden border rounded-xl transition-all",
      isActive
        ? "border-primary/50 bg-primary/5 shadow-md"
        : "border-slate-200 hover:border-primary/30 hover:bg-slate-50/70"
    )}
    onClick={() => onSelect(style.id)}
  >
    {isActive && (
      <div className="absolute top-3 right-3 z-10">
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20 font-normal"
        >
          <CheckIcon className="h-3 w-3 mr-1" />
          Selected
        </Badge>
      </div>
    )}

    <div className="p-4">
      <div className="mb-4 h-40 rounded-lg overflow-hidden shadow-sm">
        <div
          className={cn(
            "w-full h-full flex items-center justify-center p-4",
            style.preview
          )}
        >
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium mb-3 text-center">
              Share Your Experience
            </div>
            <div className="flex space-x-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-yellow-500"
                >
                  <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                </svg>
              ))}
            </div>
            <div className="h-2 w-20 bg-current opacity-20 rounded-full mx-auto mb-2"></div>
            <div className="h-2 w-16 bg-current opacity-20 rounded-full mx-auto mb-4"></div>
            <div className="bg-primary/90 text-white text-xs font-medium px-3 py-1.5 rounded-md">
              Submit Testimonial
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div
          className={cn(
            "text-sm font-medium transition-colors flex items-center",
            isActive
              ? "text-primary"
              : "text-slate-700 group-hover:text-slate-900"
          )}
        >
          {style.name}
          {style.id === "minimal" && (
            <Badge className="ml-2 text-[10px] bg-blue-100 text-blue-600 border-blue-200">
              Recommended
            </Badge>
          )}
        </div>
        <div className="text-xs text-slate-500">{style.desc}</div>
      </div>
    </div>
  </motion.div>
);

/**
 * Main AppearanceTab component
 */
const AppearanceTab: React.FC<AppearanceTabProps> = ({ onShowPreview }) => {
  const store = testimonialSettingsStore;
  const { customization } = store.settings.website;
  const [activeTab, setActiveTab] = useState<"layout" | "themes">("layout");
  const { toast } = useToast();

  // Update customization in store
  function onUpdateCustomization(update: Partial<WidgetCustomization>): void {
    runInAction(() => {
      store.updateSettings("website", "customization", {
        ...customization,
        ...update,
      });
    });
  }

  // Reset all customization to defaults
  const handleResetToDefaults = (): void => {
    onUpdateCustomization(defaultCustomization);
    toast({
      title: "Settings Reset",
      description: "All customization settings have been reset to defaults.",
      duration: 3000,
    });
  };

  // Position options data
  const positionOptions: Array<{
    value: PositionOption;
    label: string;
  }> = [
    { value: "bottom-right", label: "Bottom Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "top-right", label: "Top Right" },
    { value: "top-left", label: "Top Left" },
  ];

  // Device options data
  const deviceOptions: Array<{
    type: DeviceType;
    icon: React.ElementType;
    label: string;
    desc: string;
    settingKey?: keyof WidgetCustomization;
    required?: boolean;
  }> = [
    {
      type: "desktop",
      icon: Monitor,
      label: "Desktop",
      desc: "1200px+",
      required: true,
    },
    {
      type: "tablet",
      icon: Tablet,
      label: "Tablet",
      desc: "768px-1199px",
      settingKey: "tabletEnabled",
    },
    {
      type: "mobile",
      icon: Smartphone,
      label: "Mobile",
      desc: "<768px",
      settingKey: "mobileEnabled",
    },
  ];

  // Theme options data
  const themeOptions: Array<{
    id: ThemeOption;
    icon: React.ElementType;
    label: string;
    bgClass: string;
    textClass: string;
  }> = [
    {
      id: "light",
      icon: Sun,
      label: "Light Theme",
      bgClass: "bg-white",
      textClass: "text-slate-800",
    },
    {
      id: "dark",
      icon: Moon,
      label: "Dark Theme",
      bgClass: "bg-slate-800",
      textClass: "text-white",
    },
  ];

  // Style preset options
  const stylePresets: Array<{
    id: StylePreset;
    name: string;
    desc: string;
    preview: string;
  }> = [
    {
      id: "minimal",
      name: "Minimal",
      desc: "Clean, simple design with subtle borders",
      preview: "bg-white border border-slate-200 shadow-sm",
    },
    {
      id: "rounded",
      name: "Rounded",
      desc: "Soft, rounded corners with elegant shadows",
      preview: "bg-white border border-slate-200 shadow-md rounded-xl",
    },
  ];

  // Toggle device settings
  const toggleDevice = (device: {
    type: DeviceType;
    settingKey?: keyof WidgetCustomization;
  }): void => {
    if (!device.settingKey || device.type === "desktop") return;

    const currentValue =
      device.settingKey === "tabletEnabled"
        ? customization?.tabletEnabled !== false
        : customization?.mobileEnabled !== false;

    onUpdateCustomization({
      [device.settingKey]: !currentValue,
    });

    toast({
      title: `${device.type.charAt(0).toUpperCase() + device.type.slice(1)} ${!currentValue ? "Enabled" : "Disabled"}`,
      description: `Widget will ${!currentValue ? "now" : "no longer"} be shown on ${device.type} devices.`,
      duration: 2000,
    });
  };

  // Handle select position
  const handleSelectPosition = (position: PositionOption): void => {
    onUpdateCustomization({ position });
  };

  // Handle select theme
  const handleSelectTheme = (theme: ThemeOption): void => {
    onUpdateCustomization({ theme });
  };

  // Handle select style preset
  const handleSelectStylePreset = (stylePreset: StylePreset): void => {
    onUpdateCustomization({ stylePreset });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between mb-2"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Visual Customization
          </h2>
          <p className="text-sm text-slate-500">
            Design how your testimonial widget looks and where it appears
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetToDefaults}
          className="flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset All</span>
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs
          defaultValue="layout"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "layout" | "themes")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 p-1 mb-4 bg-slate-100/80 rounded-lg">
            <TabsTrigger
              value="layout"
              className={cn(
                "flex items-center gap-1.5 py-2.5 transition-all",
                activeTab === "layout" ? "font-medium" : "text-slate-600"
              )}
            >
              <Layout className="h-4 w-4" />
              <span>Layout & Position</span>
            </TabsTrigger>
            <TabsTrigger
              value="themes"
              className={cn(
                "flex items-center gap-1.5 py-2.5 transition-all",
                activeTab === "themes" ? "font-medium" : "text-slate-600"
              )}
            >
              <Palette className="h-4 w-4" />
              <span>Theme & Style</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Layout & Position Tab */}
            <TabsContent value="layout" className="mt-4 space-y-6">
              <motion.div
                key="layout"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <CardSection
                  title="Widget Position"
                  icon={Layers}
                  description="Select where your testimonial widget will appear on your website"
                  footerContent={
                    <div className="flex items-center justify-between w-full">
                      <p className="text-xs text-slate-500">
                        Tip: Bottom positions tend to have higher engagement
                        rates
                      </p>
                    </div>
                  }
                >
                  <div className="grid grid-cols-2 gap-4">
                    {positionOptions.map((position, i) => (
                      <PositionOptionCard
                        key={position.value}
                        position={position}
                        isActive={customization?.position === position.value}
                        index={i}
                        onSelect={handleSelectPosition}
                      />
                    ))}
                  </div>
                </CardSection>

                <CardSection
                  title="Device Visibility"
                  icon={Sliders}
                  description="Control which devices will display your testimonial widget"
                  footerContent={
                    <div className="flex justify-end">
                      <Button
                        onClick={onShowPreview}
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Preview on Devices</span>
                      </Button>
                    </div>
                  }
                >
                  <div className="grid grid-cols-3 gap-4">
                    {deviceOptions.map((device, i) => {
                      const isActive =
                        device.type === "desktop"
                          ? true
                          : device.settingKey === "tabletEnabled"
                            ? customization?.tabletEnabled !== false
                            : customization?.mobileEnabled !== false;

                      return (
                        <DeviceOptionCard
                          key={device.type}
                          device={device}
                          isActive={isActive}
                          index={i}
                          onToggle={() => toggleDevice(device)}
                        />
                      );
                    })}
                  </div>
                </CardSection>
              </motion.div>
            </TabsContent>

            {/* Themes Tab - Premium UI */}
            <TabsContent value="themes" className="mt-4 space-y-6">
              <motion.div
                key="themes"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <CardSection
                  title="Color Theme"
                  icon={Sun}
                  description="Choose a light or dark theme for your testimonial widget"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {themeOptions.map((theme, i) => (
                      <ThemeOptionCard
                        key={theme.id}
                        theme={theme}
                        isActive={
                          (customization?.theme || "light") === theme.id
                        }
                        index={i}
                        onSelect={handleSelectTheme}
                      />
                    ))}
                  </div>
                </CardSection>

                <CardSection
                  title="Widget Style"
                  icon={Palette}
                  description="Select a visual style for your testimonial widget"
                  footerContent={
                    <div className="flex justify-end">
                      <Button
                        onClick={onShowPreview}
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Preview Theme</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5 opacity-70" />
                      </Button>
                    </div>
                  }
                >
                  <div className="grid grid-cols-2 gap-4">
                    {stylePresets.map((style, i) => (
                      <StylePresetCard
                        key={style.id}
                        style={style}
                        isActive={
                          (customization?.stylePreset || "minimal") === style.id
                        }
                        index={i}
                        onSelect={handleSelectStylePreset}
                      />
                    ))}
                  </div>
                </CardSection>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default observer(AppearanceTab);

// Card section component for better organization
interface CardSectionProps {
  title: string;
  icon: React.ElementType;
  description: string;
  children: React.ReactNode;
  showResetButton?: boolean;
  onReset?: () => void;
  footerContent?: React.ReactNode;
}

const CardSection: React.FC<CardSectionProps> = ({
  title,
  icon: Icon,
  description,
  children,
  showResetButton,
  onReset,
  footerContent,
}) => (
  <motion.div
    variants={itemVariants}
    className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm"
  >
    <div className="flex items-center p-4 bg-gradient-to-r from-slate-50 to-white border-b">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="text-base font-medium text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {showResetButton && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ml-auto text-xs hover:bg-slate-100"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>
      )}
    </div>
    <CardContent className="p-5">{children}</CardContent>
    {footerContent && (
      <CardFooter className="border-t p-4 bg-slate-50/50">
        {footerContent}
      </CardFooter>
    )}
  </motion.div>
);
