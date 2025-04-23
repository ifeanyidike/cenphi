import { useEffect, useState } from "react";

// Breakpoint constants
export const BREAKPOINTS = {
  xs: 0, // Extra small (phones)
  sm: 640, // Small (large phones, small tablets)
  md: 768, // Medium (tablets)
  lg: 1024, // Large (desktops)
  xl: 1280, // Extra large (large desktops)
  xxl: 1536, // Extra extra large (very large screens)
};

// Type for breakpoints
export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to detect the current breakpoint based on window width
 * @returns The current breakpoint ('xs', 'sm', 'md', 'lg', 'xl', 'xxl')
 */
export const useBreakpoint = (): Breakpoint => {
  // Default to 'md' for SSR
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("md");

  useEffect(() => {
    // Function to calculate current breakpoint
    const calculateBreakpoint = (): Breakpoint => {
      const width = window.innerWidth;

      if (width < BREAKPOINTS.sm) return "xs";
      if (width < BREAKPOINTS.md) return "sm";
      if (width < BREAKPOINTS.lg) return "md";
      if (width < BREAKPOINTS.xl) return "lg";
      if (width < BREAKPOINTS.xxl) return "xl";
      return "xxl";
    };

    // Set initial breakpoint
    setBreakpoint(calculateBreakpoint());

    // Add resize listener
    const handleResize = () => {
      setBreakpoint(calculateBreakpoint());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
};

/**
 * Hook to determine if the current breakpoint is at or above the provided breakpoint
 * @param breakpoint The breakpoint to check against
 * @returns True if the current breakpoint is at or above the provided breakpoint
 */
export const useBreakpointUp = (bp: Breakpoint): boolean => {
  const currentBreakpoint = useBreakpoint();

  // Get the numerical values for comparison
  const currentValue = BREAKPOINTS[currentBreakpoint];
  const targetValue = BREAKPOINTS[bp];

  return currentValue >= targetValue;
};

/**
 * Hook to determine if the current breakpoint is at or below the provided breakpoint
 * @param breakpoint The breakpoint to check against
 * @returns True if the current breakpoint is at or below the provided breakpoint
 */
export const useBreakpointDown = (bp: Breakpoint): boolean => {
  const currentBreakpoint = useBreakpoint();

  // Get the numerical values for comparison
  const currentValue = BREAKPOINTS[currentBreakpoint];
  const targetValue = BREAKPOINTS[bp];

  return currentValue <= targetValue;
};

/**
 * Hook to detect if the device is likely a touch device
 * @returns True if the device is likely a touch device
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check for touch capability
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    setIsTouch(isTouchDevice);

    // Add a more reliable detection on first touch
    const handleTouchStart = () => {
      setIsTouch(true);
      // Remove listener after detection
      window.removeEventListener("touchstart", handleTouchStart);
    };

    window.addEventListener("touchstart", handleTouchStart);
    return () => window.removeEventListener("touchstart", handleTouchStart);
  }, []);

  return isTouch;
};

/**
 * Hook to detect device orientation
 * @returns The current orientation ('portrait' or 'landscape')
 */
export const useOrientation = (): "portrait" | "landscape" => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    typeof window !== "undefined" && window.innerWidth > window.innerHeight
      ? "landscape"
      : "portrait"
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? "landscape" : "portrait"
      );
    };

    window.addEventListener("resize", handleResize);

    // Some devices also have specific orientation change event
    if (typeof window.orientation !== "undefined") {
      window.addEventListener("orientationchange", handleResize);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (typeof window.orientation !== "undefined") {
        window.removeEventListener("orientationchange", handleResize);
      }
    };
  }, []);

  return orientation;
};
