// src/components/capture-widget/hooks/useThemeVariables.ts
import { useEffect, useMemo } from "react";
import { adjustColor, hexToRgba } from "../utils/formatting";
import { useTestimonial } from "../contexts/TestimonialContext";

// Convert hex color to RGB components for CSS variables
const hexToRgb = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};

export const useThemeVariables = () => {
  const { state } = useTestimonial();
  const { config } = state;

  // Compute theme variables based on config
  const themeVariables = useMemo(() => {
    // Generate variants of the primary color
    const primaryLight = adjustColor(config.primaryColor, 20);
    const primaryDark = adjustColor(config.primaryColor, -20);
    const secondaryLight = adjustColor(config.secondaryColor, 20);
    const secondaryDark = adjustColor(config.secondaryColor, -20);

    // Set CSS variables for light/dark mode
    const lightModeVars = {
      bgPrimary: "#ffffff",
      bgSecondary: "#F9FAFB",
      bgTertiary: "#F3F4F6",
      textPrimary: "#1F2937",
      textSecondary: "#4B5563",
      textTertiary: "#6B7280",
      borderColor: "#E5E7EB",
      borderColorHover: "#D1D5DB",
      shadowColor: "rgba(0, 0, 0, 0.1)",
      modalBg: "#ffffff",
      cardBg: "#F9FAFB",
    };

    const darkModeVars = {
      bgPrimary: "#111827",
      bgSecondary: "#1F2937",
      bgTertiary: "#374151",
      textPrimary: "#F9FAFB",
      textSecondary: "#E5E7EB",
      textTertiary: "#D1D5DB",
      borderColor: "#374151",
      borderColorHover: "#4B5563",
      shadowColor: "rgba(0, 0, 0, 0.3)",
      modalBg: "#1F2937",
      cardBg: "#111827",
    };

    // Choose the appropriate theme
    const themeVars = config.darkMode ? darkModeVars : lightModeVars;

    // Determine border radius based on config
    let borderRadius = "16px";
    let buttonBorderRadius = "9999px";

    if (config.roundedCorners === "sharp") {
      borderRadius = "8px";
      buttonBorderRadius = "8px";
    } else if (config.roundedCorners === "pill") {
      borderRadius = "24px";
      buttonBorderRadius = "9999px";
    }

    return {
      primaryColor: config.primaryColor,
      primaryLight,
      primaryDark,
      secondaryColor: config.secondaryColor,
      secondaryLight,
      secondaryDark,
      primaryRgb: hexToRgb(config.primaryColor),
      secondaryRgb: hexToRgb(config.secondaryColor),
      ...themeVars,
      borderRadius,
      buttonBorderRadius,
    };
  }, [config]);

  // Apply theme variables to CSS
  useEffect(() => {
    const root = document.documentElement;

    // Set CSS variables
    root.style.setProperty("--tw-primary", themeVariables.primaryColor);
    root.style.setProperty("--tw-primary-light", themeVariables.primaryLight);
    root.style.setProperty("--tw-primary-dark", themeVariables.primaryDark);
    root.style.setProperty("--tw-secondary", themeVariables.secondaryColor);
    root.style.setProperty(
      "--tw-secondary-light",
      themeVariables.secondaryLight
    );
    root.style.setProperty("--tw-secondary-dark", themeVariables.secondaryDark);
    root.style.setProperty("--tw-primary-rgb", themeVariables.primaryRgb);
    root.style.setProperty("--tw-secondary-rgb", themeVariables.secondaryRgb);

    // Theme colors
    root.style.setProperty("--tw-bg-primary", themeVariables.bgPrimary);
    root.style.setProperty("--tw-bg-secondary", themeVariables.bgSecondary);
    root.style.setProperty("--tw-bg-tertiary", themeVariables.bgTertiary);
    root.style.setProperty("--tw-text-primary", themeVariables.textPrimary);
    root.style.setProperty("--tw-text-secondary", themeVariables.textSecondary);
    root.style.setProperty("--tw-text-tertiary", themeVariables.textTertiary);
    root.style.setProperty("--tw-border-color", themeVariables.borderColor);
    root.style.setProperty(
      "--tw-border-hover",
      themeVariables.borderColorHover
    );
    root.style.setProperty("--tw-shadow-color", themeVariables.shadowColor);
    root.style.setProperty("--tw-modal-bg", themeVariables.modalBg);
    root.style.setProperty("--tw-card-bg", themeVariables.cardBg);

    // Sizing and shape
    root.style.setProperty("--tw-border-radius", themeVariables.borderRadius);
    root.style.setProperty(
      "--tw-button-radius",
      themeVariables.buttonBorderRadius
    );
    root.style.setProperty("--tw-dialog-scale", config.dialogScale.toString());

    // Brand mode specific styles
    if (config.brandMode === "minimal") {
      // Minimal mode
      root.style.setProperty("--tw-header-bottom-opacity", "0");
      root.style.setProperty("--tw-header-text-shadow", "none");
      root.style.setProperty("--tw-header-color", themeVariables.textPrimary);
      root.style.setProperty(
        "--tw-btn-primary-color",
        themeVariables.primaryColor
      );
      root.style.setProperty(
        "--tw-segment-active-color",
        themeVariables.primaryColor
      );
      root.style.setProperty(
        "--tw-close-bg",
        hexToRgba(themeVariables.primaryColor, 0.15)
      );
      root.style.setProperty(
        "--tw-close-hover-bg",
        hexToRgba(themeVariables.primaryColor, 0.25)
      );
      root.style.setProperty("--tw-close-color", themeVariables.primaryColor);
    } else {
      // Gradient or solid mode
      root.style.setProperty("--tw-header-bottom-opacity", "1");
      root.style.setProperty(
        "--tw-header-text-shadow",
        "0 2px 4px rgba(0, 0, 0, 0.1)"
      );
      root.style.setProperty("--tw-header-color", "white");
      root.style.setProperty("--tw-btn-primary-color", "white");
      root.style.setProperty("--tw-segment-active-color", "white");
      root.style.setProperty("--tw-close-bg", "rgba(255, 255, 255, 0.15)");
      root.style.setProperty(
        "--tw-close-hover-bg",
        "rgba(255, 255, 255, 0.25)"
      );
      root.style.setProperty("--tw-close-color", "white");
    }
  }, [themeVariables, config]);

  // Function to get background style based on the brand mode
  const getBrandBackground = () => {
    if (config.brandMode === "solid") {
      return { backgroundColor: themeVariables.primaryColor };
    } else if (config.brandMode === "minimal") {
      return {
        backgroundColor: themeVariables.bgSecondary,
        color: themeVariables.primaryColor,
        border: `2px solid ${themeVariables.primaryColor}`,
      };
    } else {
      // Default: gradient
      return {
        background: `linear-gradient(135deg, ${themeVariables.primaryColor}, ${themeVariables.secondaryColor})`,
      };
    }
  };

  return {
    themeVariables,
    getBrandBackground,
  };
};
