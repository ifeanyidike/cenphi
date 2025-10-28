// hooks/useBreadcrumb.ts
import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import {
  Home,
  MessageSquare,
  Sparkles,
  Settings2,
  Mail,
  FileText,
  LucideIcon,
} from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  isActive?: boolean;
}

interface RouteConfig {
  label: string;
  icon?: LucideIcon;
  children?: Record<string, RouteConfig>;
}

// Route configuration based on your current sidebar structure
const routeConfig: Record<string, RouteConfig> = {
  dashboard: {
    label: "Dashboard",
    icon: Home,
  },
  collect: {
    label: "Collect",
    icon: MessageSquare,
    children: {
      video: { label: "Video Testimonials" },
      text: { label: "Text Testimonials" },
    },
  },
  studio: {
    label: "Studio",
    icon: Sparkles,
    children: {
      // Handle query params for tabs and services
      video: { label: "Video Processing" },
      text: { label: "Text Processing" },
      clipping: { label: "Smart Clipping" },
      enhancement: { label: "Content Enhancement" },
      platform_optimizer: { label: "Platform Optimization" },
      narration: { label: "AI Narration" },
    },
  },
  email: {
    label: "Email Campaigns",
    icon: Mail,
    children: {
      templates: { label: "Request Templates" },
      analytics: { label: "Campaign Analytics" },
    },
  },
  emailpage: {
    label: "Email Requests",
    icon: Mail,
  },
  "google-drive": {
    label: "Google Drive Import",
    icon: FileText,
  },
  "brand-guide": {
    label: "Brand Guide",
    icon: Settings2,
  },
  settings: {
    label: "Settings",
    icon: Settings2,
    children: {
      widgets: { label: "Website Widgets" },
      team: { label: "Team & Workspace" },
    },
  },
  checkout: {
    label: "Billing",
    icon: Settings2,
  },
};

export const useBreadcrumb = () => {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const searchParams = new URLSearchParams(location.search);
    const items: BreadcrumbItem[] = [];

    // Always start with Dashboard as home
    items.push({
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
      isActive:
        pathSegments.length === 0 ||
        (pathSegments.length === 1 && pathSegments[0] === "dashboard"),
    });

    if (pathSegments.length === 0) {
      return items;
    }

    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Skip the first dashboard segment since we already added it
      if (segment === "dashboard" && index === 0) {
        return;
      }

      let label = segment;
      let icon: LucideIcon | undefined;

      if (index === 0 || (index === 1 && pathSegments[0] === "dashboard")) {
        // This is a main section
        const mainSection = index === 0 ? segment : pathSegments[1];
        const config = routeConfig[mainSection];

        if (config) {
          label = config.label;
          icon = config.icon;
        }
      } else {
        // This is a sub-section
        const mainSection =
          pathSegments[0] === "dashboard" ? pathSegments[1] : pathSegments[0];
        const subSection = index === 1 ? segment : pathSegments[index];
        const config = routeConfig[mainSection]?.children?.[subSection];

        if (config) {
          label = config.label;
        }
      }

      // Handle dynamic routes (like testimonial IDs)
      if (label === segment && /^\d+$/.test(segment)) {
        // If it's a numeric ID, make it more readable
        const parentSection = pathSegments[index - 1];
        if (parentSection === "collect") {
          label = "Testimonial Details";
        } else {
          label = "Details";
        }
      }

      // Capitalize first letter if it's still the raw segment
      if (label === segment) {
        label =
          segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      }

      items.push({
        label,
        href: currentPath,
        icon,
        isActive: isLast && !searchParams.toString(),
      });
    });

    // Handle query parameters for studio routes
    if (location.pathname === "/studio" && searchParams.toString()) {
      const tab = searchParams.get("tab");
      const service = searchParams.get("service");

      if (tab) {
        const config = routeConfig.studio?.children?.[tab];
        if (config) {
          items.push({
            label: config.label,
            href: `${location.pathname}?tab=${tab}`,
            isActive: true,
          });
        }
      } else if (service) {
        const config = routeConfig.studio?.children?.[service];
        if (config) {
          items.push({
            label: config.label,
            href: `${location.pathname}?service=${service}`,
            isActive: true,
          });
        }
      }
    }

    return items;
  }, [location.pathname, location.search]);

  return {
    breadcrumbs,
    currentPage: breadcrumbs[breadcrumbs.length - 1]?.label || "Page",
    isOnDashboard:
      location.pathname === "/dashboard" || location.pathname === "/",
  };
};
