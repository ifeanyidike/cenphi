import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WidgetCustomization,
  WidgetProps,
  SpotlightWidget,
  CarouselWidget,
  MinimalCardWidget,
  VideoPlayerWidget,
  // StarRating,
} from "./widget-components";
import { Testimonial } from "@/types/testimonial";
import { TestimonialFormat } from "@/types/setup";

// Types
interface WidgetPreset {
  id: string;
  name: string;
  description: string;
  image?: string;
  customizations: Partial<WidgetCustomization>;
}

interface WidgetTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component: React.FC<WidgetProps>;
  popular: boolean;
  premium: boolean;
  defaultCustomizations: Partial<WidgetCustomization>;
  compatibleWith: Array<"text" | "video" | "audio" | "image">;
  presets: WidgetPreset[];
}

interface BrandGuide {
  primaryColor: string;
  fontFamily: string;
  borderRadius: string;
  darkMode: boolean;
}

interface WidgetStudioProps {
  testimonial: Testimonial;
  onClose: () => void;
  onSave?: (widgetConfig: {
    type: string;
    name: string;
    customizations: WidgetCustomization;
  }) => void;
  isDarkMode?: boolean;
}

interface CustomizationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const EnhancedWidgetStudio: React.FC<WidgetStudioProps> = ({
  testimonial,
  onClose,
  onSave,
  isDarkMode = false,
}) => {
  // Main state
  const [currentStep, setCurrentStep] = useState<
    "select" | "customize" | "code"
  >("select");
  const [selectedWidget, setSelectedWidget] = useState<WidgetTemplate | null>(
    null
  );
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [widgetName, setWidgetName] = useState<string>("");
  const [customizations, setCustomizations] = useState<WidgetCustomization>({
    theme: "premium",
    darkMode: false,
    rounded: "lg",
    showAvatar: true,
    showRating: true,
    showCompany: true,
    animation: "fade",
    position: "center",
    autoRotate: false,
    highlightColor: "#6366f1",
    fontStyle: "modern",
    width: "full",
    border: true,
    shadow: "md",
    textAlign: "left",
  });

  // Preview state
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "mobile" | "tablet"
  >("desktop");
  const [previewDarkMode, setPreviewDarkMode] = useState<boolean>(isDarkMode);
  const [activeCustomizationSection, setActiveCustomizationSection] =
    useState<string>("appearance");

  // Brand guide state
  const [hasBrandGuide, setHasBrandGuide] = useState<boolean>(false);
  const [brandGuide, setBrandGuide] = useState<BrandGuide>({
    primaryColor: "#6366f1",
    fontFamily: "modern",
    borderRadius: "lg",
    darkMode: isDarkMode,
  });

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showFullscreenPreview, setShowFullscreenPreview] =
    useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Widget templates
  const widgetTemplates: WidgetTemplate[] = useMemo(
    () => [
      {
        id: "spotlight",
        type: "spotlight",
        name: "Spotlight Testimonial",
        description:
          "Premium featured testimonial with elegant design elements",
        icon: (
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        ),
        component: SpotlightWidget,
        popular: true,
        premium: true,
        compatibleWith: ["text", "video", "audio", "image"],
        defaultCustomizations: {
          theme: "premium",
          darkMode: false,
          rounded: "xl",
          animation: "fade",
          highlightColor: "#6366f1",
          showAvatar: true,
          showRating: true,
          showCompany: true,
          shadow: "xl",
          border: true,
        },
        presets: [
          {
            id: "premium-spotlight",
            name: "Premium Spotlight",
            description: "Elegant featured testimonial with premium styling",
            image:
              "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "premium",
              darkMode: false,
              rounded: "xl",
              animation: "fade",
              highlightColor: "#8b5cf6",
              shadow: "xl",
              textAlign: "left",
            },
          },
          {
            id: "centered-spotlight",
            name: "Centered Spotlight",
            description: "Clean, centered design with elegant typography",
            image:
              "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "elegant",
              darkMode: false,
              rounded: "xl",
              animation: "zoom",
              highlightColor: "#8b5cf6",
              shadow: "xl",
              textAlign: "center",
              fontStyle: "serif",
            },
          },
          {
            id: "dark-spotlight",
            name: "Dark Mode Spotlight",
            description: "Sleek dark theme with vibrant accent colors",
            image:
              "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "premium",
              darkMode: true,
              rounded: "xl",
              animation: "fade",
              highlightColor: "#818cf8",
              shadow: "xl",
              border: true,
            },
          },
        ],
      },
      {
        id: "carousel",
        type: "carousel",
        name: "Testimonial Carousel",
        description: "Showcase multiple testimonials with elegant transitions",
        icon: (
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        ),
        component: CarouselWidget,
        popular: true,
        premium: true,
        compatibleWith: ["text", "video", "audio", "image"],
        defaultCustomizations: {
          theme: "modern",
          darkMode: false,
          rounded: "lg",
          animation: "slide",
          autoRotate: true,
          highlightColor: "#3b82f6",
        },
        presets: [
          {
            id: "modern-carousel",
            name: "Modern Carousel",
            description: "Clean design with smooth slide transitions",
            image:
              "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "modern",
              darkMode: false,
              rounded: "lg",
              animation: "slide",
              autoRotate: true,
              highlightColor: "#3b82f6",
              shadow: "md",
            },
          },
          {
            id: "elegant-carousel",
            name: "Elegant Carousel",
            description: "Refined design with subtle fade transitions",
            image:
              "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "elegant",
              darkMode: false,
              rounded: "lg",
              animation: "fade",
              autoRotate: true,
              highlightColor: "#8b5cf6",
              fontStyle: "serif",
              textAlign: "center",
            },
          },
          {
            id: "dark-carousel",
            name: "Dark Carousel",
            description: "Sleek dark theme with vibrant accent colors",
            image:
              "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "dark",
              darkMode: true,
              rounded: "xl",
              animation: "slide",
              autoRotate: true,
              highlightColor: "#60a5fa",
              shadow: "xl",
              border: false,
            },
          },
        ],
      },
      {
        id: "minimal-card",
        type: "minimal-card",
        name: "Minimal Card",
        description: "Clean, modern design that fits seamlessly anywhere",
        icon: (
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        ),
        component: MinimalCardWidget,
        popular: false,
        premium: false,
        compatibleWith: ["text", "audio", "image"],
        defaultCustomizations: {
          theme: "modern",
          darkMode: false,
          rounded: "lg",
          animation: "none",
          highlightColor: "#3b82f6",
        },
        presets: [
          {
            id: "clean-card",
            name: "Clean Card",
            description: "Simple, clean design with minimal styling",
            image:
              "https://images.unsplash.com/photo-1576613109753-27804de2cba8?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "minimal",
              darkMode: false,
              rounded: "lg",
              animation: "none",
              highlightColor: "#3b82f6",
              shadow: "sm",
              border: true,
            },
          },
          {
            id: "elegant-card",
            name: "Elegant Card",
            description: "Refined design with elegant typography",
            image:
              "https://images.unsplash.com/photo-1576613109753-27804de2cba8?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "elegant",
              darkMode: false,
              rounded: "lg",
              animation: "fade",
              highlightColor: "#8b5cf6",
              fontStyle: "serif",
              textAlign: "center",
              shadow: "md",
            },
          },
          {
            id: "dark-card",
            name: "Dark Card",
            description: "Sleek dark theme with vibrant accent colors",
            image:
              "https://images.unsplash.com/photo-1576613109753-27804de2cba8?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "dark",
              darkMode: true,
              rounded: "xl",
              animation: "fade",
              highlightColor: "#60a5fa",
              shadow: "lg",
              border: false,
            },
          },
        ],
      },
      {
        id: "video-player",
        type: "video-player",
        name: "Video Player",
        description:
          "Premium player for video testimonials with sleek controls",
        icon: (
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        ),
        component: VideoPlayerWidget,
        popular: true,
        premium: true,
        compatibleWith: ["video"],
        defaultCustomizations: {
          theme: "dark",
          darkMode: true,
          rounded: "lg",
          highlightColor: "#6366f1",
        },
        presets: [
          {
            id: "premium-video",
            name: "Premium Video Player",
            description: "Sleek dark theme with modern controls",
            image:
              "https://images.unsplash.com/photo-1522096823084-2d1aa8411c13?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "dark",
              darkMode: true,
              rounded: "lg",
              highlightColor: "#6366f1",
              shadow: "xl",
              border: false,
            },
          },
          {
            id: "branded-video",
            name: "Branded Video Player",
            description: "Customizable player with brand colors",
            image:
              "https://images.unsplash.com/photo-1522096823084-2d1aa8411c13?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "premium",
              darkMode: true,
              rounded: "lg",
              highlightColor: "#8b5cf6",
              shadow: "xl",
              border: true,
            },
          },
          {
            id: "light-video",
            name: "Light Video Player",
            description: "Clean light theme with elegant controls",
            image:
              "https://images.unsplash.com/photo-1522096823084-2d1aa8411c13?w=500&auto=format&fit=crop&q=60",
            customizations: {
              theme: "modern",
              darkMode: false,
              rounded: "lg",
              highlightColor: "#3b82f6",
              shadow: "lg",
              border: true,
            },
          },
        ],
      },
    ],
    []
  );

  // Filter compatible templates based on testimonial type
  const compatibleTemplates = useMemo(() => {
    return widgetTemplates.filter((template) =>
      template.compatibleWith.includes(testimonial.format as TestimonialFormat)
    );
  }, [widgetTemplates, testimonial.format]);

  // Customization sections
  const customizationSections: CustomizationSection[] = [
    {
      id: "appearance",
      title: "Appearance",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
    },
    {
      id: "content",
      title: "Content",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      ),
    },
    {
      id: "animation",
      title: "Animation",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      id: "brand",
      title: "Brand",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
    },
  ];

  // Effect: Generate default widget name
  useEffect(() => {
    if (selectedWidget) {
      const prefix = selectedWidget.name.split(" ")[0];
      const authorName = testimonial.customer_profile?.name?.split(" ")[0];
      setWidgetName(`${prefix} - ${authorName}'s Testimonial`);
    }
  }, [selectedWidget, testimonial.customer_profile?.name]);

  // Apply brand guide to customizations if selected
  useEffect(() => {
    if (hasBrandGuide) {
      setCustomizations((prev) => ({
        ...prev,
        highlightColor: brandGuide.primaryColor,
        fontStyle: brandGuide.fontFamily as any,
        rounded: brandGuide.borderRadius as any,
        darkMode: brandGuide.darkMode,
      }));
    }
  }, [hasBrandGuide, brandGuide]);

  // Handle widget selection
  const handleSelectWidget = useCallback((widget: WidgetTemplate) => {
    setSelectedWidget(widget);
    setCustomizations((prev) => ({
      ...prev,
      ...widget.defaultCustomizations,
    }));
    setCurrentStep("customize");
  }, []);

  // Handle preset selection
  const handleSelectPreset = useCallback(
    (widget: WidgetTemplate, presetId: string) => {
      setSelectedWidget(widget);
      const preset = widget.presets.find((p) => p.id === presetId);

      if (preset) {
        setSelectedPreset(presetId);
        setCustomizations((prev) => ({
          ...prev,
          ...widget.defaultCustomizations,
          ...preset.customizations,
        }));
      } else {
        setCustomizations((prev) => ({
          ...prev,
          ...widget.defaultCustomizations,
        }));
      }

      setCurrentStep("customize");
    },
    []
  );

  // Handle customization changes
  const handleCustomizationChange = useCallback(
    (key: keyof WidgetCustomization, value: any) => {
      setCustomizations((prev) => ({
        ...prev,
        [key]: value,
      }));

      // Clear selected preset if user makes manual changes
      if (selectedPreset) {
        setSelectedPreset(null);
      }
    },
    [selectedPreset]
  );

  // Handle brand guide toggle
  const handleBrandGuideToggle = useCallback(() => {
    setHasBrandGuide(!hasBrandGuide);
  }, [hasBrandGuide]);

  // Handle brand guide changes
  const handleBrandGuideChange = useCallback(
    (key: keyof BrandGuide, value: any) => {
      setBrandGuide((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  // Handle save widget with simulated loading
  const handleSaveWidget = useCallback(() => {
    if (selectedWidget && onSave) {
      setIsLoading(true);

      // Simulate API call
      setTimeout(() => {
        onSave({
          type: selectedWidget.type,
          name: widgetName,
          customizations,
        });

        setIsLoading(false);
        setShowSuccess(true);

        // Hide success message after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      }, 800);
    } else {
      onClose();
    }
  }, [selectedWidget, widgetName, customizations, onSave, onClose]);

  // Generate embed code
  const generateEmbedCode = useCallback((): string => {
    if (!selectedWidget) return "";

    return `<div 
  class="testimonial-widget"
  data-widget-type="${selectedWidget.type}"
  data-testimonial-id="${testimonial?.id || "testimonial-id"}"
  data-theme="${customizations.theme}"
  data-dark-mode="${customizations.darkMode}"
  data-rounded="${customizations.rounded}"
  data-show-avatar="${customizations.showAvatar}"
  data-show-rating="${customizations.showRating}"
  data-show-company="${customizations.showCompany}"
  data-animation="${customizations.animation}"
  data-position="${customizations.position}"
  data-auto-rotate="${customizations.autoRotate}"
  data-highlight-color="${customizations.highlightColor}"
  data-font-style="${customizations.fontStyle}"
  data-width="${customizations.width}"
  data-border="${customizations.border}"
  data-shadow="${customizations.shadow}"
  data-text-align="${customizations.textAlign}"
>
</div>
<script src="https://cdn.example.com/testimonial-widgets.js"></script>`;
  }, [selectedWidget, testimonial, customizations]);

  //   // Generate React code
  //   const generateReactCode = useCallback((): string => {
  //     if (!selectedWidget) return "";

  //     const componentName = selectedWidget.type
  //       .split("-")
  //       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  //       .join("");

  //     return `import { ${componentName} } from '@example/testimonial-widgets';

  // export default function TestimonialSection() {
  //   return (
  //     <${componentName}
  //       testimonialId="${testimonial?.id || "testimonial-id"}"
  //       theme="${customizations.theme}"
  //       darkMode={${customizations.darkMode}}
  //       rounded="${customizations.rounded}"
  //       showAvatar={${customizations.showAvatar}}
  //       showRating={${customizations.showRating}}
  //       showCompany={${customizations.showCompany}}
  //       animation="${customizations.animation}"
  //       position="${customizations.position}"
  //       autoRotate={${customizations.autoRotate || false}}
  //       highlightColor="${customizations.highlightColor}"
  //       fontStyle="${customizations.fontStyle}"
  //       width="${customizations.width}"
  //       border={${customizations.border}}
  //       shadow="${customizations.shadow}"
  //       textAlign="${customizations.textAlign || "left"}"
  //     />
  //   );
  // }`;
  //   }, [selectedWidget, testimonial, customizations]);

  // Handle copy code to clipboard
  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Animation variants
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const slideUpVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      y: 20,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const slideRightVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      x: 20,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  // Render functions for different steps

  // 1. Select Widget Step
  const renderSelectStep = () => (
    <motion.div
      key="select-step"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeVariants}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2
            className={`text-2xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Choose a Widget for Your{" "}
            {testimonial.format.charAt(0).toUpperCase() +
              testimonial.format.slice(1)}{" "}
            Testimonial
          </h2>
          <p className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            Select a widget type or pre-designed template that best showcases
            your testimonial
          </p>
        </div>

        {/* Widget Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 mb-12">
          {compatibleTemplates.map((widget) => (
            <motion.div
              key={widget.id}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              variants={slideUpVariants}
              className="cursor-pointer bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group"
              onClick={() => handleSelectWidget(widget)}
            >
              <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                  <div className="bg-black/20 backdrop-blur-sm w-full h-full flex items-center justify-center">
                    <div className="p-4 text-center">
                      <div className="mx-auto w-16 h-16 flex items-center justify-center bg-white/20 rounded-full mb-3">
                        {widget.icon}
                      </div>
                      <span className="text-xl font-medium">{widget.name}</span>
                      <p className="text-sm text-white/80 mt-1">
                        {widget.description}
                      </p>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-center">
                    <button className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
                      {testimonial.format.charAt(0).toUpperCase() +
                        testimonial.format.slice(1)}{" "}
                      Compatible
                    </button>

                    <div className="flex gap-2">
                      {widget.premium && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500 text-white">
                          Premium
                        </span>
                      )}

                      {widget.popular && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">
                          Popular
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                  {widget.name}
                </h4>

                <div className="flex flex-wrap gap-2 mb-4">
                  {widget.presets.map((preset, index) => (
                    <button
                      key={preset.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPreset(widget, preset.id);
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        index === 0
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      } hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <button className="w-full flex items-center justify-center gap-2 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Create {widget.name}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Presets Section */}
        <div className="mt-8">
          <h3
            className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Quick Start Templates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {compatibleTemplates.flatMap((widget) =>
              widget.presets.slice(0, 1).map((preset) => (
                <motion.div
                  key={`${widget.id}-${preset.id}`}
                  variants={slideUpVariants}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`p-4 rounded-lg cursor-pointer ${
                    isDarkMode
                      ? "bg-slate-800 hover:bg-slate-750 border border-slate-700"
                      : "bg-white hover:bg-slate-50 border border-slate-200"
                  } shadow-sm hover:shadow-md transition-all duration-300`}
                  onClick={() => handleSelectPreset(widget, preset.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isDarkMode ? "bg-indigo-900/30" : "bg-indigo-50"
                      }`}
                    >
                      {widget.icon}
                    </div>

                    <div>
                      <h4
                        className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      >
                        {preset.name}
                      </h4>
                      <p
                        className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {widget.name}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-sm mb-3 line-clamp-2 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {preset.description}
                  </p>

                  <button className="w-full text-center py-1.5 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                    Use Template
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // 2. Customize Widget Step
  const renderCustomizeStep = () => {
    if (!selectedWidget) return null;

    return (
      <motion.div
        key="customize-step"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={slideRightVariants}
        className="h-full overflow-hidden flex flex-col md:flex-row"
      >
        {/* Sidebar - Customization Panel */}
        <div className="w-full md:w-[320px] lg:w-[380px] h-full overflow-y-auto bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <input
              type="text"
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white text-sm"
              placeholder="Enter widget name"
            />
          </div>

          {/* Customization Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto hide-scrollbar">
            {customizationSections.map((section) => (
              <button
                key={section.id}
                className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 flex-shrink-0 ${
                  activeCustomizationSection === section.id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
                onClick={() => setActiveCustomizationSection(section.id)}
              >
                {section.icon}
                <span>{section.title}</span>
              </button>
            ))}
          </div>

          {/* Active Customization Section */}
          <div className="p-5 space-y-6">
            {/* Presets at the top for quick access */}
            {selectedWidget.presets.length > 0 && (
              <div className="mb-5 pb-5 border-b border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedWidget.presets.map((preset) => (
                    <button
                      key={preset.id}
                      className={`px-3 py-2 rounded-md text-xs font-medium ${
                        selectedPreset === preset.id
                          ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-400 dark:ring-indigo-600"
                          : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600"
                      }`}
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setCustomizations((prev) => ({
                          ...prev,
                          ...selectedWidget.defaultCustomizations,
                          ...preset.customizations,
                        }));
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeCustomizationSection === "appearance" && (
              <div className="space-y-5">
                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={customizations.theme}
                    onChange={(e) =>
                      handleCustomizationChange("theme", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="default">Default</option>
                    <option value="modern">Modern</option>
                    <option value="premium">Premium</option>
                    <option value="minimal">Minimal</option>
                    <option value="elegant">Elegant</option>
                    <option value="vibrant">Vibrant</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Accent Color
                  </label>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {[
                      "#6366f1",
                      "#3b82f6",
                      "#06b6d4",
                      "#10b981",
                      "#f59e0b",
                      "#ef4444",
                    ].map((color) => (
                      <button
                        key={color}
                        className={`w-full aspect-square rounded-full ${customizations.highlightColor === color ? "ring-2 ring-offset-2 ring-slate-500 dark:ring-slate-300" : ""}`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          handleCustomizationChange("highlightColor", color)
                        }
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={customizations.highlightColor}
                      onChange={(e) =>
                        handleCustomizationChange(
                          "highlightColor",
                          e.target.value
                        )
                      }
                      className="w-10 h-10 rounded-md cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={customizations.highlightColor}
                      onChange={(e) =>
                        handleCustomizationChange(
                          "highlightColor",
                          e.target.value
                        )
                      }
                      className="flex-1 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Rounded Corners */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Corners
                  </label>
                  <div className="flex space-x-2">
                    {["none", "sm", "lg", "xl", "2xl"].map((size) => (
                      <button
                        key={size}
                        className={`px-3 py-1.5 text-xs rounded ${
                          customizations.rounded === size
                            ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium"
                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
                        }`}
                        onClick={() =>
                          handleCustomizationChange("rounded", size)
                        }
                      >
                        {size === "none"
                          ? "None"
                          : size === "sm"
                            ? "Small"
                            : size === "lg"
                              ? "Large"
                              : size === "xl"
                                ? "XL"
                                : "XXL"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shadow */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Shadow
                  </label>
                  <div className="flex space-x-2">
                    {["none", "sm", "md", "lg", "xl"].map((size) => (
                      <button
                        key={size}
                        className={`px-3 py-1.5 text-xs rounded ${
                          customizations.shadow === size
                            ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium"
                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
                        }`}
                        onClick={() =>
                          handleCustomizationChange("shadow", size)
                        }
                      >
                        {size === "none"
                          ? "None"
                          : size === "sm"
                            ? "Small"
                            : size === "md"
                              ? "Medium"
                              : size === "lg"
                                ? "Large"
                                : "XL"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Show Border
                  </label>
                  <div
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer"
                    onClick={() =>
                      handleCustomizationChange(
                        "border",
                        !customizations.border
                      )
                    }
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${customizations.border ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </div>
                </div>

                {/* Light/Dark Mode */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Dark Mode
                  </label>
                  <div
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer"
                    onClick={() =>
                      handleCustomizationChange(
                        "darkMode",
                        !customizations.darkMode
                      )
                    }
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${customizations.darkMode ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Content Section */}
            {activeCustomizationSection === "content" && (
              <div className="space-y-5">
                {/* Show/Hide Elements */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Show Avatar
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer"
                      onClick={() =>
                        handleCustomizationChange(
                          "showAvatar",
                          !customizations.showAvatar
                        )
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${customizations.showAvatar ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Show Company
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer"
                      onClick={() =>
                        handleCustomizationChange(
                          "showCompany",
                          !customizations.showCompany
                        )
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${customizations.showCompany ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Show Rating
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer"
                      onClick={() =>
                        handleCustomizationChange(
                          "showRating",
                          !customizations.showRating
                        )
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${customizations.showRating ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Font Style */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Font Style
                  </label>
                  <select
                    value={customizations.fontStyle}
                    onChange={(e) =>
                      handleCustomizationChange("fontStyle", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="modern">Modern (Sans-serif)</option>
                    <option value="serif">Elegant (Serif)</option>
                    <option value="mono">Technical (Mono)</option>
                    <option value="elegant">Elegant Italic</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>

                {/* Text Alignment */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Text Alignment
                  </label>
                  <div className="flex space-x-2">
                    {["left", "center", "right"].map((alignment) => (
                      <button
                        key={alignment}
                        className={`px-3 py-1.5 text-xs rounded flex-1 ${
                          customizations.textAlign === alignment
                            ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium"
                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
                        }`}
                        onClick={() =>
                          handleCustomizationChange("textAlign", alignment)
                        }
                      >
                        {alignment.charAt(0).toUpperCase() + alignment.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Widget Width */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Widget Width
                  </label>
                  <select
                    value={customizations.width}
                    onChange={(e) =>
                      handleCustomizationChange("width", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="full">Full Width</option>
                    <option value="xl">Extra Large</option>
                    <option value="lg">Large</option>
                    <option value="md">Medium</option>
                    <option value="sm">Small</option>
                  </select>
                </div>
              </div>
            )}

            {/* Animation Section */}
            {activeCustomizationSection === "animation" && (
              <div className="space-y-5">
                {/* Animation Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Animation Type
                  </label>
                  <select
                    value={customizations.animation}
                    onChange={(e) =>
                      handleCustomizationChange("animation", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="fade">Fade</option>
                    <option value="slide">Slide</option>
                    <option value="zoom">Zoom</option>
                    <option value="flip">Flip</option>
                    <option value="none">None</option>
                  </select>
                </div>

                {/* Auto-rotate for Carousel */}
                {selectedWidget && selectedWidget.id === "carousel" && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Auto-rotate
                    </label>
                    <div
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer"
                      onClick={() =>
                        handleCustomizationChange(
                          "autoRotate",
                          !customizations.autoRotate
                        )
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${customizations.autoRotate ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </div>
                  </div>
                )}

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Position
                  </label>
                  <select
                    value={customizations.position}
                    onChange={(e) =>
                      handleCustomizationChange("position", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="center">Center</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
              </div>
            )}

            {/* Brand Section */}
            {activeCustomizationSection === "brand" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Brand Guide
                  </h3>
                  <div
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer"
                    onClick={handleBrandGuideToggle}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${hasBrandGuide ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </div>
                </div>

                {hasBrandGuide ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Brand Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={brandGuide.primaryColor}
                          onChange={(e) =>
                            handleBrandGuideChange(
                              "primaryColor",
                              e.target.value
                            )
                          }
                          className="w-10 h-10 rounded-md cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={brandGuide.primaryColor}
                          onChange={(e) =>
                            handleBrandGuideChange(
                              "primaryColor",
                              e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Font Style
                      </label>
                      <select
                        value={brandGuide.fontFamily}
                        onChange={(e) =>
                          handleBrandGuideChange("fontFamily", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="modern">Modern (Sans-serif)</option>
                        <option value="serif">Elegant (Serif)</option>
                        <option value="mono">Technical (Mono)</option>
                        <option value="playful">Playful</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Corner Roundness
                      </label>
                      <select
                        value={brandGuide.borderRadius}
                        onChange={(e) =>
                          handleBrandGuideChange("borderRadius", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="none">No Rounding</option>
                        <option value="sm">Slight Rounding</option>
                        <option value="md">Medium Rounding</option>
                        <option value="lg">Large Rounding</option>
                        <option value="xl">Extra Large Rounding</option>
                        <option value="2xl">Maximum Rounding</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Dark Mode
                      </label>
                      <div
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer"
                        onClick={() =>
                          handleBrandGuideChange(
                            "darkMode",
                            !brandGuide.darkMode
                          )
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${brandGuide.darkMode ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                      Enable Brand Guide to automatically apply your brand
                      colors and styling to this widget.
                    </p>
                    <button
                      onClick={handleBrandGuideToggle}
                      className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Enable Brand Guide
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-full md:flex-1 h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900">
          {/* Preview Controls */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Live Preview
            </h3>

            <div className="flex space-x-2">
              <button
                className={`p-1.5 rounded ${previewMode === "desktop" ? "bg-slate-200 dark:bg-slate-700" : "text-slate-400"}`}
                onClick={() => setPreviewMode("desktop")}
                aria-label="Desktop preview"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </button>

              <button
                className={`p-1.5 rounded ${previewMode === "tablet" ? "bg-slate-200 dark:bg-slate-700" : "text-slate-400"}`}
                onClick={() => setPreviewMode("tablet")}
                aria-label="Tablet preview"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </button>

              <button
                className={`p-1.5 rounded ${previewMode === "mobile" ? "bg-slate-200 dark:bg-slate-700" : "text-slate-400"}`}
                onClick={() => setPreviewMode("mobile")}
                aria-label="Mobile preview"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </button>

              <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>

              <button
                className={`p-1.5 rounded ${previewDarkMode ? "bg-slate-200 dark:bg-slate-700" : "text-slate-400"}`}
                onClick={() => setPreviewDarkMode(!previewDarkMode)}
                aria-label="Toggle dark mode"
              >
                {previewDarkMode ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              <button
                className="p-1.5 rounded text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                onClick={() => setShowFullscreenPreview(true)}
                aria-label="Fullscreen preview"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div
            className={`flex-1 flex items-center justify-center p-8 ${previewDarkMode ? "bg-slate-900" : "bg-slate-50"}`}
          >
            <div
              className={`transition-all duration-300 ${
                previewMode === "mobile"
                  ? "max-w-xs"
                  : previewMode === "tablet"
                    ? "max-w-md"
                    : "max-w-3xl"
              } w-full mx-auto`}
            >
              {selectedWidget && (
                <selectedWidget.component
                  testimonial={testimonial}
                  customizations={{
                    ...customizations,
                    darkMode: previewDarkMode || customizations.darkMode,
                  }}
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between">
            <button
              className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              onClick={() => setCurrentStep("select")}
            >
              Back
            </button>

            <button
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              onClick={() => setCurrentStep("code")}
            >
              Continue
            </button>
          </div>
        </div>

        {/* Fullscreen Preview Modal */}
        <AnimatePresence>
          {showFullscreenPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {widgetName}
                  </h3>
                  <button
                    onClick={() => setShowFullscreenPreview(false)}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div
                  className={`p-10 ${customizations.darkMode || previewDarkMode ? "bg-slate-900" : "bg-white"}`}
                >
                  {selectedWidget && (
                    <selectedWidget.component
                      testimonial={testimonial}
                      customizations={{
                        ...customizations,
                        darkMode: previewDarkMode || customizations.darkMode,
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // 3. Code Step
  const renderCodeStep = () => (
    <motion.div
      key="code-step"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideUpVariants}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2
            className={`text-2xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            Your Widget is Ready!
          </h2>
          <p className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            Preview your widget and get the code to add it to your website.
          </p>
        </div>

        {/* Widget Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {widgetName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready for deployment
              </p>
            </div>

            {selectedWidget && selectedWidget.premium && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                Premium Widget
              </span>
            )}
          </div>

          <div
            className={`p-8 ${customizations.darkMode ? "bg-slate-900" : "bg-white"}`}
          >
            {selectedWidget && (
              <selectedWidget.component
                testimonial={testimonial}
                customizations={customizations}
              />
            )}
          </div>
        </div>

        {/* Implementation Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex -mb-px">
              <button
                className={`px-4 py-3 text-sm font-medium border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400
                   
                `}
              >
                HTML Embed
              </button>

              <button
                className={`px-4 py-3 text-sm font-medium border-b-2
                    border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300
                `}
              >
                React
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                HTML Embed Code
              </h3>
              <button
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  copied
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50"
                }`}
                onClick={() => handleCopyCode(generateEmbedCode())}
              >
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
              <pre className="text-xs p-4 text-slate-800 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {generateEmbedCode()}
              </pre>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Installation Steps
            </h4>
            <ol className="space-y-2 ml-5 list-decimal">
              <li className="text-sm text-slate-700 dark:text-slate-300">
                Copy the code above and paste it into your website where you
                want the widget to appear.
              </li>
              <li className="text-sm text-slate-700 dark:text-slate-300">
                Make sure to include the script tag to load our testimonial
                widget library.
              </li>
              <li className="text-sm text-slate-700 dark:text-slate-300">
                The widget will automatically initialize and display your
                testimonial.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Step indicator component
  const StepIndicator: React.FC = () => {
    const steps = [
      {
        id: "select",
        name: "Select Widget",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
            />
          </svg>
        ),
      },
      {
        id: "customize",
        name: "Customize",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        ),
      },
      {
        id: "code",
        name: "Get Code",
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        ),
      },
    ];

    return (
      <nav className="py-4 px-6 border-b border-slate-200 dark:border-slate-700 hidden sm:block">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center">
            <ol className="flex items-center w-full">
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  className={`flex items-center ${index < steps.length - 1 ? "w-full" : ""}`}
                >
                  <button
                    className="flex flex-col items-center"
                    onClick={() => {
                      // Only allow going back to previous steps
                      const currentIndex = steps.findIndex(
                        (s) => s.id === currentStep
                      );
                      if (index <= currentIndex) {
                        setCurrentStep(step.id as any);
                      }
                    }}
                    disabled={
                      index > steps.findIndex((s) => s.id === currentStep)
                    }
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        step.id === currentStep
                          ? "bg-indigo-600 text-white"
                          : index < steps.findIndex((s) => s.id === currentStep)
                            ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {index < steps.findIndex((s) => s.id === currentStep) ? (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        step.id === currentStep
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {step.name}
                    </span>
                  </button>

                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        index < steps.findIndex((s) => s.id === currentStep)
                          ? "bg-indigo-600 dark:bg-indigo-500"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    ></div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </nav>
    );
  };

  // Main UI
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={`relative w-full max-w-7xl h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden ${
          isDarkMode ? "bg-slate-900" : "bg-white"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-2 mr-3">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm0 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Widget Studio
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create and customize widgets for your testimonials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Progress Steps */}
        <StepIndicator />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentStep === "select" && renderSelectStep()}
            {currentStep === "customize" && renderCustomizeStep()}
            {currentStep === "code" && renderCodeStep()}
          </AnimatePresence>
        </div>

        {/* Footer Actions - Only shown on code step */}
        {currentStep === "code" && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between">
            <button
              className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              onClick={() => setCurrentStep("customize")}
              disabled={isLoading}
            >
              Back to Edit
            </button>

            <div className="flex space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>

              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  isLoading
                    ? "bg-indigo-500 text-white cursor-wait"
                    : showSuccess
                      ? "bg-emerald-500 text-white"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
                onClick={handleSaveWidget}
                disabled={isLoading || showSuccess}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : showSuccess ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Saved!</span>
                  </>
                ) : (
                  "Save Widget"
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EnhancedWidgetStudio;
