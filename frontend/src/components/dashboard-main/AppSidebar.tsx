import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./NavMain";
import { NavProjects } from "./NavProjects";
import NavUser from "./NavUser";
import { TeamSwitcher } from "./TeamSwitcher";
import CenphiLogo from "../custom/cenphi-logo";
import * as React from "react";
import {
  Home,
  MessageSquare,
  Sparkles,
  Settings2,
  Mail,
  Video,
  FileText,
  Zap,
  Command,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { workspaceHub } from "@/repo/workspace_hub";
import { auth } from "@/config/firebase";
import { observer } from "mobx-react-lite";

export const AppSidebar = observer(
  ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
    const [mounted, setMounted] = React.useState(false);

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
    const workspaceName = workspaceHub.workspace?.name || "";
    const workspacePlan = workspaceHub.workspace?.plan || "";

    // const workspacePlan = member?.workspace_plan || "";

    const data = {
      user: {
        name: userName,
        email: userEmail,
        avatar: userAvatar,
      },
      teams: [
        {
          name: workspaceName,
          logo: CenphiLogo,
          plan: workspacePlan,
        },
        {
          name: "Product Team",
          logo: Command,
          plan: "Pro",
        },
      ],
      navMain: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
          isActive: true,
        },
        {
          title: "Collect",
          url: "/collect",
          icon: MessageSquare,
          items: [
            {
              title: "Video Testimonials",
              url: "/collect",
            },
            {
              title: "Text Testimonials",
              url: "/collect",
            },
            {
              title: "Email Requests",
              url: "/settings",
            },
            {
              title: "Google Drive Import",
              url: "/settings",
            },
          ],
        },
        {
          title: "AI Studio",
          url: "/studio",
          icon: Sparkles,
          items: [
            {
              title: "Video Processing",
              url: "/studio?tab=video",
            },
            {
              title: "Text Processing",
              url: "/studio?tab=text",
            },
            {
              title: "Smart Clipping",
              url: "/studio?service=clipping",
            },
            {
              title: "Content Enhancement",
              url: "/studio?service=enhancement",
            },
            {
              title: "Platform Optimization",
              url: "/studio?service=platform_optimizer",
            },
            {
              title: "AI Narration",
              url: "/studio?service=narration",
            },
          ],
        },
        {
          title: "AI-Generated Content",
          url: "/ai-content",
          icon: FileText,
        },
        {
          title: "Social Analytics",
          url: "/social/analytics",
          icon: BarChart3,
        },
        {
          title: "Email Campaigns",
          url: "/email",
          icon: Mail,
          items: [
            {
              title: "Request Templates",
              url: "/email/templates",
            },
            {
              title: "Send Requests",
              url: "/emailpage",
            },
          ],
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings2,
          items: [
            {
              title: "Integrations",
              url: "/settings",
            },
            {
              title: "Brand Guide",
              url: "/brand-guide",
            },
            {
              title: "Billing",
              url: "/checkout",
            },
          ],
        },
      ],
      projects: [
        {
          name: "Video Collection",
          url: "/collect",
          icon: Video,
        },
        {
          name: "Text Collection",
          url: "/collect",
          icon: FileText,
        },
        {
          name: "AI Processing",
          url: "/studio",
          icon: Zap,
        },
        {
          name: "Email Campaigns",
          url: "/settings",
          icon: Mail,
        },
      ],
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
            <NavProjects projects={data.projects} />
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
