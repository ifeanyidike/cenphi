import {
  MessageSquareText,
  BarChart3,
  Award,
  Users,
  FileText,
  Share2,
  BookOpen,
  Play,
  Calendar,
  HelpCircle,
  Zap,
  Globe,
} from "lucide-react";
import { MegaMenuSection } from "./types";
export const featuresMenuData: MegaMenuSection[] = [
  {
    title: "Testimonial Management",
    items: [
      {
        icon: (
          <MessageSquareText className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
        ),
        title: "Smart Collection",
        description: "AI-driven forms & automated collection tools",
        path: "/features/collection",
        isNew: true,
      },
      {
        icon: (
          <FileText className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
        ),
        title: "Curation Suite",
        description: "Organize & manage your testimonial library",
        path: "/features/curation",
      },
      {
        icon: (
          <Award className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
        ),
        title: "AI Enhancement Pro",
        description: "Intelligently improve testimonial quality & impact",
        path: "/features/enhancement",
        isPro: true,
        isHot: true,
      },
    ],
  },
  {
    title: "Analytics & Insights",
    items: [
      {
        icon: (
          <BarChart3 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
        ),
        title: "Performance Metrics",
        description: "Track impact & conversion analytics",
        path: "/features/metrics",
      },
      {
        icon: (
          <Users className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
        ),
        title: "Sentiment Analysis",
        description: "AI-powered customer sentiment tracking",
        path: "/features/sentiment",
        isPro: true,
      },
      {
        icon: (
          <Share2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
        ),
        title: "Omnichannel Distribution",
        description: "Multi-channel publishing & automation tools",
        path: "/features/distribution",
        isBeta: true,
      },
    ],
  },
];

// Resources mega menu data with enhanced options
export const resourcesMenuData: MegaMenuSection[] = [
  {
    title: "Learn & Grow",
    items: [
      {
        icon: (
          <BookOpen className="h-6 w-6 text-amber-500 dark:text-amber-400" />
        ),
        title: "Knowledge Base",
        description: "Guides & best practices for testimonials",
        path: "/resources/knowledge-base",
      },
      {
        icon: <Play className="h-6 w-6 text-amber-500 dark:text-amber-400" />,
        title: "Expert Tutorials",
        description: "Step-by-step visual masterclasses",
        path: "/resources/tutorials",
        isNew: true,
      },
      {
        icon: (
          <Calendar className="h-6 w-6 text-amber-500 dark:text-amber-400" />
        ),
        title: "Live Webinars",
        description: "Interactive expert sessions & workshops",
        path: "/resources/webinars",
        isPro: true,
      },
    ],
  },
  {
    title: "Support & Community",
    items: [
      {
        icon: (
          <HelpCircle className="h-6 w-6 text-purple-500 dark:text-purple-400" />
        ),
        title: "Help Center",
        description: "Find answers to common questions",
        path: "/resources/help",
      },
      {
        icon: (
          <Users className="h-6 w-6 text-purple-500 dark:text-purple-400" />
        ),
        title: "Community Forum",
        description: "Connect with other Cenphi users",
        path: "/resources/community",
      },
      {
        icon: (
          <MessageSquareText className="h-6 w-6 text-purple-500 dark:text-purple-400" />
        ),
        title: "Feature Lab",
        description: "Vote on & suggest new innovations",
        path: "/resources/feature-request",
        isBeta: true,
      },
    ],
  },
];

// Solution cards with enhanced content
export const solutionCards = [
  {
    title: "E-Commerce",
    description: "Boost conversions by 47% with authentic customer reviews",
    icon: <Globe className="h-6 w-6 text-blue-500 dark:text-blue-400" />,
    path: "/solutions/ecommerce",
    stats: "2.5x higher engagement",
    color: "blue",
  },
  {
    title: "SaaS",
    description: "Build trust & reduce churn with strategic user stories",
    icon: <Zap className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />,
    path: "/solutions/saas",
    stats: "37% lower churn rate",
    color: "emerald",
  },
  {
    title: "Agencies",
    description: "Showcase client success stories that win new business",
    icon: <Award className="h-6 w-6 text-amber-500 dark:text-amber-400" />,
    path: "/solutions/agencies",
    stats: "52% higher close rate",
    color: "amber",
  },
  {
    title: "Enterprise",
    description: "Scale testimonial management across global teams",
    icon: (
      <BarChart3 className="h-6 w-6 text-purple-500 dark:text-purple-400" />
    ),
    path: "/solutions/enterprise",
    stats: "3.2x ROI improvement",
    color: "purple",
    isNew: true,
  },
];

export const notifications = [
  {
    id: 1,
    message: "New testimonial received from Acme Inc.",
    time: "2 minutes ago",
    isUnread: true,
    avatar: null,
    type: "testimonial",
  },
  {
    id: 2,
    message: "Weekly analytics report is ready to view",
    time: "1 hour ago",
    isUnread: true,
    avatar: null,
    type: "report",
  },
  {
    id: 3,
    message: "3 testimonials pending approval",
    time: "3 hours ago",
    isUnread: false,
    avatar: null,
    type: "approval",
  },
  {
    id: 4,
    message: "Your AI enhancement quota has been refreshed",
    time: "Yesterday",
    isUnread: false,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    type: "quota",
  },
  {
    id: 5,
    message: "Thomas added you to the project 'Enterprise Campaign'",
    time: "2 days ago",
    isUnread: false,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    type: "project",
  },
];

// Motion variants
export const navVariants = {
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  hidden: {
    opacity: 0,
    y: -5,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

export const megaMenuVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    clipPath: "inset(0% 0% 100% 0%)",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
      clipPath: { duration: 0.4 },
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: {
      duration: 0.4,
      ease: [0, 0, 0.2, 1],
      clipPath: { duration: 0.5 },
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
};

export const menuItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};
