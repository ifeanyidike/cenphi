import {
  ArrowUpRight,
  Bot,
  Brain,
  CheckCircle,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Grid,
  Heart,
  List,
  MessageSquare,
  Share2,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { useState } from "react";

const SidebarContent = () => {
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'list'
  
  const stats: Record<string, string | number> = {
    totalTestimonials: 154,
    averageRating: 4.8,
    pendingReviews: 3,
    recentActivity: 12,
    conversionRate: "24%",
    totalViews: "2.4K",
  };
  
  const reviews = [
    {
      id: 1,
      name: "John Doe",
      initials: "JD",
      rating: 5,
      timeAgo: "2 days ago",
      content: "The product exceeded all my expectations. The team was incredibly responsive and helpful throughout the entire process.",
      status: "New",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      initials: "SJ",
      rating: 5,
      timeAgo: "3 days ago",
      content: "Simply amazing! I've tried many similar products but this one stands head and shoulders above the rest. The attention to detail is remarkable.",
      status: "Replied",
    },
    {
      id: 3,
      name: "Mike Thompson",
      initials: "MT",
      rating: 4,
      timeAgo: "1 week ago",
      content: "Very satisfied with my purchase. The only minor issue was the delivery time, but the quality of the product more than makes up for it.",
      status: "Verified",
    },
    {
      id: 4,
      name: "Emily Wilson",
      initials: "EW",
      rating: 5,
      timeAgo: "2 weeks ago",
      content: "This is exactly what I needed. The customer support team was incredibly helpful when I had questions about how to use some of the features.",
      status: "Featured",
    },
  ];





  const getBadgeColor = (status: string): string => {
    switch (status) {
      case "New":
        return "text-purple-600 bg-purple-50";
      case "Replied":
        return "text-blue-600 bg-blue-50";
      case "Verified":
        return "text-green-600 bg-green-50";
      case "Featured":
        return "text-amber-600 bg-amber-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="p-4 lg:p-8 overflow-hidden">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
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
            <CardContent className="p-6 lg:p-8">
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
                  {/* View toggle buttons */}
                  <div className="mr-2 flex bg-gray-100 rounded-lg p-1">
                    <button 
                      onClick={() => setViewMode("card")}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        viewMode === "card" 
                          ? "bg-white text-purple-600 shadow-sm" 
                          : "text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        viewMode === "list" 
                          ? "bg-white text-purple-600 shadow-sm" 
                          : "text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
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
              {viewMode === "card" ? (
                // Card View
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-6 border rounded-xl hover:shadow-md transition-all duration-200 bg-white group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 shadow-md">
                            {review.initials}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {review.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {review.timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${getBadgeColor(review.status)} px-3 py-1`}
                        >
                          {review.status}
                        </Badge>
                      </div>
                      <p className="mt-4 text-gray-600 leading-relaxed line-clamp-3">
                        "{review.content}"
                      </p>
                      <div className="mt-4 flex justify-between items-center pt-4 border-t">
                        <div className="flex space-x-4">
                          <button className="text-gray-600 hover:text-purple-600 flex items-center space-x-1 transition-colors">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm font-medium">Reply</span>
                          </button>
                          <button className="text-gray-600 hover:text-purple-600 flex items-center space-x-1 transition-colors">
                            <Share2 className="h-4 w-4" />
                            <span className="text-sm font-medium">Share</span>
                          </button>
                        </div>
                        <button className="text-purple-600 hover:text-purple-700 flex items-center space-x-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-sm">View</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // List View
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
                          {review.initials}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">
                              {review.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className={`${getBadgeColor(review.status)} px-2 py-0.5 text-xs`}
                            >
                              {review.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {review.timeAgo}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            "{review.content}"
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-purple-600">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-purple-600">
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button className="ml-2 p-2 hover:bg-purple-50 rounded-full transition-colors text-purple-600">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold">
                AI Powered Actions
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
                        <p className="text-sm text-gray-500">{metric.label}</p>
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
  );
};

export default SidebarContent;
