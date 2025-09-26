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
              url: "/collect/video",
            },
            {
              title: "Text Testimonials",
              url: "/collect/text",
            },
            {
              title: "Email Requests",
              url: "/emailpage",
            },
            {
              title: "Google Drive Import",
              url: "/google-drive",
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
            {
              title: "Campaign Analytics",
              url: "/email/analytics",
            },
          ],
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings2,
          items: [
            {
              title: "Brand Guide",
              url: "/brand-guide",
            },
            {
              title: "Website Widgets",
              url: "/settings/widgets",
            },
            {
              title: "Team & Workspace",
              url: "/settings/team",
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
          url: "/collect/video",
          icon: Video,
        },
        {
          name: "Text Collection",
          url: "/collect/text",
          icon: FileText,
        },
        {
          name: "AI Processing",
          url: "/studio",
          icon: Zap,
        },
        {
          name: "Email Campaigns",
          url: "/emailpage",
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
          className="backdrop-blur-lg bg-sidebar-bg/95 border-r border-sidebar-border/30"
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
