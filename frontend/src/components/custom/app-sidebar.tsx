import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import CenphiLogo from "./cenphi-logo";
import * as React from "react";
import {
  BarChart2,
  BookOpen,
  Brain,
  Building2,
  Clock,
  Command,
  FileText,
  GalleryVerticalEnd,
  Globe,
  Heart,
  Home,
  MessageSquare,
  Settings2,
  Star,
  Users,
  Video,
  Sparkles,
  Target,
  TrendingUp,
  Share2,
  Zap,
  Shield,
  Mail,
  Brush,
  Layout,
  Megaphone,
  Award,
  Puzzle,
  KeyRound,
  Gift,
  Radar,
  ThumbsUp,
  Radio,
  MessagesSquare,
  Palette,
  Bot,
  Film,
  Box,
  QrCode,
  Workflow,
  Fingerprint,
  ScrollText,
  Lightbulb,
  Tags,
  Trophy,
  Coins,
} from "lucide-react";

const data = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/avatars/john.jpg",
  },
  teams: [
    {
      name: "CENPHI",
      logo: CenphiLogo,
      plan: "",
    },
    {
      name: "Support Team",
      logo: MessageSquare,
      plan: "Business",
    },
    {
      name: "Product Team",
      logo: Command,
      plan: "Pro",
    },
    {
      name: "AI Research",
      logo: Brain,
      plan: "Enterprise",
    },
    {
      name: "Content Studio",
      logo: Brush,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard/overview",
        },
        {
          title: "Performance Metrics",
          url: "/dashboard/performance",
        },
        {
          title: "ROI Calculator",
          url: "/dashboard/roi",
        },
        {
          title: "Team Activity",
          url: "/dashboard/activity",
        },
      ],
    },
    {
      title: "Testimonial Hub",
      url: "/testimonials",
      icon: MessageSquare,
      items: [
        {
          title: "All Reviews",
          url: "/testimonials/all",
        },
        {
          title: "Pending Reviews",
          url: "/testimonials/pending",
        },
        {
          title: "Published",
          url: "/testimonials/published",
        },
        {
          title: "Flagged Content",
          url: "/testimonials/flagged",
        },
        {
          title: "Video Testimonials",
          url: "/testimonials/video",
        },
        {
          title: "Success Stories",
          url: "/testimonials/stories",
        },
        {
          title: "Review Requests",
          url: "/testimonials/requests",
        },
      ],
    },
    {
      title: "AI Studio",
      url: "/ai",
      icon: Brain,
      items: [
        {
          title: "Sentiment Analysis",
          url: "/ai/sentiment",
        },
        {
          title: "Content Enhancement",
          url: "/ai/enhance",
        },
        {
          title: "Response Generator",
          url: "/ai/responses",
        },
        {
          title: "Review Summarizer",
          url: "/ai/summarize",
        },
        {
          title: "Voice Analysis",
          url: "/ai/voice",
        },
        {
          title: "Authenticity Check",
          url: "/ai/authenticity",
        },
        {
          title: "Translation Hub",
          url: "/ai/translate",
        },
      ],
    },
    {
      title: "Content Studio",
      url: "/studio",
      icon: Brush,
      items: [
        {
          title: "Visual Generator",
          url: "/studio/visuals",
        },
        {
          title: "Quote Cards",
          url: "/studio/quotes",
        },
        {
          title: "Video Editor",
          url: "/studio/video",
        },
        {
          title: "Templates",
          url: "/studio/templates",
        },
        {
          title: "Brand Assets",
          url: "/studio/assets",
        },
      ],
    },
    {
      title: "Engagement",
      url: "/engagement",
      icon: Heart,
      items: [
        {
          title: "Social Campaigns",
          url: "/engagement/social",
        },
        {
          title: "Email Sequences",
          url: "/engagement/email",
        },
        {
          title: "Reward System",
          url: "/engagement/rewards",
        },
        {
          title: "Customer Journey",
          url: "/engagement/journey",
        },
        {
          title: "Gamification",
          url: "/engagement/gamify",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart2,
      items: [
        {
          title: "Review Analytics",
          url: "/analytics/reviews",
        },
        {
          title: "Impact Metrics",
          url: "/analytics/impact",
        },
        {
          title: "Competitive Intel",
          url: "/analytics/competitive",
        },
        {
          title: "Sentiment Trends",
          url: "/analytics/trends",
        },
        {
          title: "Conversion Impact",
          url: "/analytics/conversion",
        },
      ],
    },
    {
      title: "Distribution",
      url: "/distribution",
      icon: Share2,
      items: [
        {
          title: "Widget Builder",
          url: "/distribution/widgets",
        },
        {
          title: "Social Auto-Post",
          url: "/distribution/social",
        },
        {
          title: "API Access",
          url: "/distribution/api",
        },
        {
          title: "Embed Codes",
          url: "/distribution/embed",
        },
        {
          title: "QR Campaigns",
          url: "/distribution/qr",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Team & Roles",
          url: "/settings/team",
        },
        {
          title: "Integrations",
          url: "/settings/integrations",
        },
        {
          title: "Automation Rules",
          url: "/settings/automation",
        },
        {
          title: "Security",
          url: "/settings/security",
        },
        {
          title: "Billing",
          url: "/settings/billing",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Review Campaigns",
      url: "/campaigns",
      icon: Megaphone,
    },
    {
      name: "Video Stories",
      url: "/video-stories",
      icon: Film,
    },
    {
      name: "Social Proof",
      url: "/social-proof",
      icon: Trophy,
    },
    {
      name: "Customer Awards",
      url: "/awards",
      icon: Award,
    },
    {
      name: "User Feedback",
      url: "/feedback",
      icon: MessagesSquare,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
