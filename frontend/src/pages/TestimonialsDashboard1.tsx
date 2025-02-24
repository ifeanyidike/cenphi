import React, { useState } from "react";
import {
  Bell,
  Settings,
  Search,
  Star,
  Filter,
  Download,
  Share2,
  ChevronRight,
  MessageSquare,
  Users,
  Archive,
  ArrowUpRight,
  Menu,
  Home,
  LineChart,
  Flag,
  Clock,
  CheckCircle,
  Heart,
  Target,
  Zap,
  BookOpen,
  Grid,
  ChevronDown,
  Brain,
  Sparkles,
  Bot,
  ThumbsUp,
  FileText,
  Video,
  Mail,
  Workflow,
  Image,
  PenTool,
  Gauge,
  BarChartHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MenuSection {
  icon: React.ElementType;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  icon: React.ElementType;
  description?: string;
}

// interface Stat {
//   title: string;
//   value: string | number;
//   icon: React.ElementType;
//   change: string;
//   trend: "up" | "down";
// }

// interface Review {
//   id: number;
//   name: string;
//   initials: string;
//   rating: number;
//   timeAgo: string;
//   content: string;
//   isNew: boolean;
// }
type Menu =
  | "insights"
  | "engagement"
  | "dashboard"
  | "testimonials"
  | "analytics"
  | "campaigns"
  | "aiFeatures"
  | "automation";
const TestimonialsDashboard2 = () => {
  // const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<Menu, boolean>>({
    dashboard: true,
    testimonials: false,
    analytics: false,
    campaigns: false,
    aiFeatures: false,
    automation: false,
    engagement: false,
    insights: false,
  });

  const stats: Record<string, string | number> = {
    totalTestimonials: 154,
    averageRating: 4.8,
    pendingReviews: 3,
    recentActivity: 12,
    conversionRate: "24%",
    totalViews: "2.4K",
  };

  const toggleMenu = (menu: Menu) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const menuItems: Record<string, MenuSection> = {
    dashboard: {
      icon: Home,
      items: [
        { label: "Overview", icon: Grid },
        { label: "Performance", icon: Zap },
        { label: "Goals & KPIs", icon: Target },
      ],
    },
    testimonials: {
      icon: MessageSquare,
      items: [
        { label: "All Reviews", icon: BookOpen },
        { label: "Pending", icon: Clock },
        { label: "Published", icon: CheckCircle },
        { label: "Flagged", icon: Flag },
        { label: "Archived", icon: Archive },
      ],
    },
    aiFeatures: {
      icon: Brain,
      items: [
        {
          label: "Sentiment Analysis",
          icon: ThumbsUp,
          description: "AI-powered emotion detection",
        },
        {
          label: "Review Summarization",
          icon: FileText,
          description: "Auto-generate review highlights",
        },
        {
          label: "Response Generator",
          icon: Bot,
          description: "AI-crafted review responses",
        },
        {
          label: "Content Enhancement",
          icon: Sparkles,
          description: "Improve review clarity",
        },
        // {
        //   label: "Translation Hub",
        //   icon: Language,
        //   description: "Auto-translate reviews",
        // },
      ],
    },
    automation: {
      icon: Workflow,
      items: [
        {
          label: "Smart Workflows",
          icon: Workflow,
          description: "Automated review routing",
        },
        {
          label: "Email Campaigns",
          icon: Mail,
          description: "Automated review requests",
        },
        {
          label: "Video Testimonials",
          icon: Video,
          description: "Automated video processing",
        },
      ],
    },
    insights: {
      icon: BarChartHorizontal,
      items: [
        {
          label: "Competitor Analysis",
          icon: Target,
          description: "Industry benchmarking",
        },
        {
          label: "Trend Detection",
          icon: LineChart,
          description: "AI pattern recognition",
        },
        {
          label: "Performance Prediction",
          icon: Gauge,
          description: "Future metrics forecast",
        },
      ],
    },
    engagement: {
      icon: Heart,
      items: [
        {
          label: "Social Sharing",
          icon: Share2,
          description: "Auto-post to social media",
        },
        {
          label: "Visual Generator",
          icon: Image,
          description: "Create review images",
        },
        {
          label: "Story Creator",
          icon: PenTool,
          description: "Customer success stories",
        },
      ],
    },
  };

  const MenuItem: React.FC<{
    label: string;
    icon: React.ElementType;
    description?: string;
    isSubmenu?: boolean;
  }> = ({ label, icon: Icon, description, isSubmenu = false }) => (
    <button
      className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors ${
        isSubmenu ? "ml-4 text-sm" : ""
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1 text-left">
        <span className="font-medium">{label}</span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-outfit">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="h-6 w-6 text-gray-600" />
      </button>

      {/* Left Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-72 bg-white border-r p-6 overflow-y-auto transition-transform duration-300 z-40
        ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center space-x-3 mb-8">
          <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
            <Star className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            TestiBoard
          </h1>
        </div>

        <nav className="space-y-6">
          {Object.entries(menuItems).map(([key, section]) => (
            <div key={key}>
              <button
                onClick={() => toggleMenu(key as Menu)}
                className="w-full flex items-center justify-between mb-2 text-sm font-semibold text-gray-600 hover:text-purple-600 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <section.icon className="h-4 w-4" />
                  <span className="capitalize">{key}</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedMenus[key as Menu] ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              {expandedMenus[key as Menu] && (
                <div className="space-y-1 mb-4">
                  {section.items.map((item) => (
                    <MenuItem
                      key={item.label}
                      label={item.label}
                      icon={item.icon}
                      description={item.description}
                      isSubmenu
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="pt-6">
            <Card className="bg-gradient-to-br from-purple-500 to-purple-700 border-0 text-white">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Upgrade to Pro</h3>
                <p className="text-sm text-purple-100 mb-4">
                  Get access to advanced AI features and analytics
                </p>
                <button className="w-full bg-white text-purple-600 px-4 py-2.5 rounded-lg font-medium hover:bg-purple-50 transition-colors">
                  Upgrade Now
                </button>
              </CardContent>
            </Card>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72 page-size">
        {/* Top Navigation */}
        <nav className="bg-white border-b px-4 lg:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search testimonials, customers, or collections..."
                  className="w-full pl-12 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4 lg:space-x-6">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-sm font-semibold text-white">CH</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="p-4 lg:p-8 overflow-hidden">
          {/* Stats Overview */}
          <div className="grid grid-flow-col auto-cols-max gap-4 lg:gap-6 mb-8 overflow-x-auto">
            {[
              {
                title: "Total Reviews",
                value: stats.totalTestimonials,
                icon: MessageSquare,
                change: "+12.5%",
                trend: "up",
              },
              {
                title: "Average Rating",
                value: stats.averageRating,
                icon: Star,
                change: "+0.2",
                trend: "up",
              },
              {
                title: "Conversion Rate",
                value: stats.conversionRate,
                icon: ArrowUpRight,
                change: "+2.4%",
                trend: "up",
              },
              {
                title: "Total Views",
                value: stats.totalViews,
                icon: Users,
                change: "+18.2%",
                trend: "up",
              },
            ].map((stat, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <stat.icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        stat.trend === "up"
                          ? "text-green-600 bg-green-50"
                          : "text-red-600 bg-red-50"
                      }`}
                    >
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </h3>
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Reviews and Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-semibold">
                      Your Customers
                    </CardTitle>
                    <div className="flex space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Filter className="h-5 w-5 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Download className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {[1, 2, 3, 4].map((review) => (
                      <div
                        key={review}
                        className="p-8 border rounded-xl hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div className="flex space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                              JD
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                John Doe
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className="h-4 w-4 text-yellow-400 fill-current"
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  2 days ago
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-purple-600 bg-purple-50 px-3 py-1"
                          >
                            New
                          </Badge>
                        </div>
                        <p className="mt-8 text-gray-600 leading-relaxed">
                          "The product exceeded all my expectations. The team
                          was incredibly responsive and helpful throughout the
                          entire process."
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center pt-8 border-t gap-4">
                          <div className="flex flex-wrap gap-4">
                            <button className="text-gray-600 hover:text-purple-600 flex items-center space-x-2 transition-colors">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm font-medium">Reply</span>
                            </button>
                            <button className="text-gray-600 hover:text-purple-600 flex items-center space-x-2 transition-colors">
                              <Share2 className="h-4 w-4" />
                              <span className="text-sm font-medium">Share</span>
                            </button>
                          </div>
                          <button className="text-purple-600 hover:text-purple-700 flex items-center space-x-1 font-medium">
                            <span className="text-sm">View Details</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-6">
                  <CardTitle className="text-lg font-semibold">
                    AI-Powered Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {[
                      {
                        label: "Generate Response",
                        icon: Bot,
                        color: "text-green-600",
                        description: "AI-crafted reply",
                      },
                      {
                        label: "Analyze Sentiment",
                        icon: Brain,
                        color: "text-blue-600",
                        description: "Emotion detection",
                      },
                      {
                        label: "Summarize Reviews",
                        icon: FileText,
                        color: "text-purple-600",
                        description: "Key points extraction",
                      },
                      // {
                      //   label: "Translate Reviews",
                      //   icon: Language,
                      //   color: "text-indigo-600",
                      //   description: "Multi-language support",
                      // },
                    ].map((action) => (
                      <button
                        key={action.label}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        <div className={`${action.color}`}>
                          <action.icon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <span className="font-medium text-gray-700 block">
                            {action.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {action.description}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-6">
                  <CardTitle className="text-lg font-semibold">
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      {
                        label: "AI Response Rate",
                        value: "92%",
                        icon: Zap,
                        trend: "up",
                      },
                      {
                        label: "Sentiment Score",
                        value: "8.9",
                        icon: Heart,
                        trend: "up",
                      },
                      {
                        label: "Translation Accuracy",
                        value: "97%",
                        icon: CheckCircle,
                        trend: "up",
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <metric.icon className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              {metric.label}
                            </p>
                            <p className="font-semibold text-gray-900">
                              {metric.value}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight
                          className={`h-5 w-5 ${
                            metric.trend === "up"
                              ? "text-green-500"
                              : "text-red-500 transform rotate-180"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default TestimonialsDashboard2;
