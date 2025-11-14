import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./NavMain";
import NavUser from "./NavUser";
import { TeamSwitcher } from "./TeamSwitcher";
import CenphiLogo from "../custom/cenphi-logo";
import * as React from "react";
import {
  Home,
  Sparkles,
  Settings2,
  MessageCircle,
  Share2,
  Wand2,
  BarChart3,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { workspaceHub } from "@/repo/workspace_hub";
import { auth } from "@/config/firebase";
import { observer } from "mobx-react-lite";
import { useLocation } from "react-router-dom";

export const AppSidebar = observer(
  ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
    const [mounted, setMounted] = React.useState(false);
    const location = useLocation();

    // Handle hydration issues
    React.useEffect(() => {
      setMounted(true);
    }, []);

    // Add mobile-specific styles to ensure solid background
    React.useEffect(() => {
      const style = document.createElement("style");
      style.textContent = `
        :root {
          --sidebar-bg: 0 0% 100% !important;
          --sidebar-background: 0 0% 100% !important;
        }
        [data-mobile="true"] {
          background-color: white !important;
          backdrop-filter: none !important;
        }
        .bg-sidebar {
          background-color: white !important;
        }
        [data-radix-dialog-content] {
          background-color: white !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }, []);

    // Get actual user data
    // const member = workspaceHub.memberManager.member;
    const firebaseUser = auth.currentUser;

    const userName = firebaseUser?.displayName || "User";
    const userEmail = firebaseUser?.email || "";
    const userAvatar = firebaseUser?.photoURL || undefined;
    const workspaceName = workspaceHub.workspace?.name || "My Workspace";
    const workspacePlan = workspaceHub.workspace?.plan || "";

    // Get workspace logo from brand_context or use fallback
    const brandContext = workspaceHub.workspace?.brand_context as any;
    const workspaceLogo = brandContext?.logo_url || brandContext?.logoUrl || null;

    // Check active route
    const currentPath = location.pathname;
    const isStudioRoute = currentPath.startsWith("/studio");
    const isDetailRoute = currentPath.startsWith("/detail");

    const data = {
      user: {
        name: userName,
        email: userEmail,
        avatar: userAvatar,
      },
      teams: [
        {
          name: workspaceName,
          logo: workspaceLogo || CenphiLogo, // Use workspace logo if available, otherwise fallback to Cenphi
          plan: workspacePlan,
        },
      ],
      navMain: [
        {
          title: "Testimonials",
          url: "/dashboard",
          icon: Home,
          isActive: currentPath === "/dashboard" || isDetailRoute,
        },
        {
          title: "Studio",
          url: "/studio",
          icon: Wand2,
          isActive: isStudioRoute,
        },
        {
          title: "Content Hub",
          url: "/content-hub",
          icon: Sparkles,
          isActive: currentPath === "/content-hub",
        },
        {
          title: "Analytics",
          url: "/analytics",
          icon: BarChart3,
          isActive: currentPath === "/analytics",
        },
        {
          title: "Scheduling",
          url: "/scheduling",
          icon: Calendar,
          isActive: currentPath === "/scheduling",
        },
        {
          title: "Talk to Data",
          url: "/talk-to-your-data",
          icon: MessageCircle,
          isActive: currentPath === "/talk-to-your-data",
        },
        {
          title: "Collection",
          url: "#",
          icon: Share2,
          isActive:
            currentPath === "/emailpage" || currentPath === "/email/templates",
          items: [
            {
              title: "Share Collection Link",
              url: "/settings",
            },
            {
              title: "Request Templates",
              url: "/settings/",
            },
          ],
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings2,
          isActive:
            currentPath === "/settings" ||
            currentPath === "/brand-guide" ||
            currentPath === "/checkout",
          items: [
            {
              title: "Workspace Settings",
              url: "/settings",
            },
            {
              title: "Brand Guide",
              url: "/brand-guide",
            },
            {
              title: "Billing & Plans",
              url: "/checkout",
            },
          ],
        },
      ],
      projects: [],
    };

    if (!mounted) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Sidebar
          collapsible="icon"
          className="bg-white border-r border-gray-200"
          {...props}
        >
          <SidebarHeader className="px-2 py-3">
            <TeamSwitcher teams={data.teams} />
          </SidebarHeader>
          <SidebarContent className="scrollbar-thin">
            <NavMain items={data.navMain} />
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={data.user} />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
      </motion.div>
    );
  }
);

export default AppSidebar;
